import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_COMMAND,
  MAX_STOP_PHRASE_LENGTH,
  createChat,
  decide,
  defaultState,
  mergeRuntimeState,
  normalizeChatURL,
  normalizeState,
  normalizeStopPhrase,
  recordDispatch
} from "../../chrome-extension/lib/model-v2.js";

const snapshot = (overrides = {}) => ({
  title: "Тестовый чат",
  url: "https://chatgpt.com/c/example",
  latestRole: "assistant",
  latestFingerprint: "answer-1",
  stopPhraseMatched: false,
  isGenerating: false,
  errorDetected: false,
  pageReady: true,
  authenticated: true,
  ...overrides
});

test("точная команда по умолчанию сохранена", () => {
  assert.equal(DEFAULT_COMMAND, "продолжай и не останавливайся до технического лимита");
  assert.equal(defaultState().commandText, DEFAULT_COMMAND);
  assert.equal(defaultState().stopPhrase, "");
});

test("стоп-фраза обрезается безопасно и пустое значение отключает правило", () => {
  assert.equal(normalizeStopPhrase("  готово  "), "готово");
  assert.equal(normalizeStopPhrase(null), "");
  assert.equal(normalizeStopPhrase("x".repeat(MAX_STOP_PHRASE_LENGTH + 20)).length, MAX_STOP_PHRASE_LENGTH);
});

test("URL конкретного чата нормализуется без query и fragment", () => {
  assert.equal(
    normalizeChatURL("https://chatgpt.com/c/example?model=gpt-5#bottom"),
    "https://chatgpt.com/c/example"
  );
  assert.equal(
    normalizeChatURL("https://chat.openai.com/g/g-demo/c/abcd?temporary-chat=true"),
    "https://chatgpt.com/g/g-demo/c/abcd"
  );
  assert.equal(normalizeChatURL("https://chatgpt.com/"), null);
  assert.equal(normalizeChatURL("https://example.com/c/abcd"), null);
});

test("первая проверка новой сессии только фиксирует baseline", () => {
  const chat = createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" });
  const result = decide(chat, snapshot(), "session-1");
  assert.equal(result.decision, "baseline-recorded");
  assert.equal(result.chat.lastObservedFingerprint, "answer-1");
  assert.equal(result.chat.lastObservedSessionId, "session-1");
});

test("новый ответ не получает команду немедленно", () => {
  const chat = {
    ...createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" }),
    lastObservedSessionId: "session-1",
    lastObservedFingerprint: "answer-1",
    lastCommandedFingerprint: "answer-1"
  };
  const result = decide(chat, snapshot({ latestFingerprint: "answer-2" }), "session-1");
  assert.equal(result.decision, "response-changed");
  assert.equal(result.chat.lastObservedFingerprint, "answer-2");
});

test("стабильный завершённый ответ ассистента готов к продолжению", () => {
  const chat = {
    ...createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" }),
    lastObservedSessionId: "session-1",
    lastObservedFingerprint: "answer-2",
    lastCommandedFingerprint: "answer-1"
  };
  const result = decide(chat, snapshot({ latestFingerprint: "answer-2" }), "session-1");
  assert.equal(result.decision, "send-continuation");
  assert.equal(result.fingerprint, "answer-2");
});

test("совпавшая стоп-фраза отключает только совпавший чат до отправки", () => {
  const matching = {
    ...createChat({ title: "Совпавший", url: "https://chatgpt.com/c/matching" }),
    lastObservedSessionId: "session-1",
    lastObservedFingerprint: "answer-1"
  };
  const other = {
    ...createChat({ title: "Другой", url: "https://chatgpt.com/c/other" }),
    lastObservedSessionId: "session-1",
    lastObservedFingerprint: "answer-1"
  };
  const stopped = decide(matching, snapshot({ stopPhraseMatched: true }), "session-1");
  const untouched = decide(other, snapshot({ stopPhraseMatched: false }), "session-1");

  assert.equal(stopped.decision, "stop-phrase-matched");
  assert.equal(stopped.chat.enabled, false);
  assert.equal(stopped.chat.lastStopReason, "stop-phrase");
  assert.ok(stopped.chat.lastStoppedAt);
  assert.equal(stopped.chat.lastObservedFingerprint, "answer-1");
  assert.equal(untouched.chat.enabled, true);
  assert.equal(untouched.decision, "send-continuation");
});

test("стоп-фраза не применяется к пользовательскому сообщению или активной генерации", () => {
  const chat = {
    ...createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" }),
    lastObservedSessionId: "session-1",
    lastObservedFingerprint: "answer-1"
  };
  assert.equal(
    decide(chat, snapshot({ latestRole: "user", stopPhraseMatched: true }), "session-1").decision,
    "waiting-for-assistant"
  );
  assert.equal(
    decide(chat, snapshot({ isGenerating: true, stopPhraseMatched: true }), "session-1").decision,
    "generating"
  );
});

test("один ответ никогда не получает команду дважды", () => {
  const chat = {
    ...createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" }),
    lastObservedSessionId: "session-1",
    lastObservedFingerprint: "answer-2",
    lastCommandedFingerprint: "answer-2"
  };
  const result = decide(chat, snapshot({ latestFingerprint: "answer-2" }), "session-1");
  assert.equal(result.decision, "already-continued");
});

test("генерация, пользовательское сообщение и отсутствие входа блокируют отправку", () => {
  const chat = {
    ...createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" }),
    lastObservedSessionId: "session-1",
    lastObservedFingerprint: "answer-1"
  };
  assert.equal(decide(chat, snapshot({ isGenerating: true }), "session-1").decision, "generating");
  assert.equal(decide(chat, snapshot({ latestRole: "user" }), "session-1").decision, "waiting-for-assistant");
  assert.equal(decide(chat, snapshot({ authenticated: false }), "session-1").decision, "not-authenticated");
});

test("неподтверждённый клик всё равно фиксирует at-most-once", () => {
  const chat = createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" });
  const dispatched = recordDispatch(chat, "answer-2", "submitted-unconfirmed");
  assert.equal(dispatched.lastCommandedFingerprint, "answer-2");
  assert.equal(dispatched.lastDispatchOutcome, "submitted-unconfirmed");
  assert.ok(dispatched.lastCommandAt);
});

test("runtime merge сохраняет свежие пользовательские настройки", () => {
  const original = createChat({ title: "Старое имя", url: "https://chatgpt.com/c/example" });
  const observed = {
    ...defaultState(),
    lastCheckAt: "2026-07-22T10:00:00.000Z",
    chats: [{
      ...original,
      lastObservedFingerprint: "answer-2",
      lastObservedSessionId: "session-1",
      lastCommandedFingerprint: "answer-1"
    }]
  };
  const latest = {
    ...defaultState(),
    intervalMinutes: 15,
    commandText: "новая команда",
    stopPhrase: "СТОП",
    chats: [{ ...original, title: "Новое имя", enabled: false }]
  };

  const merged = mergeRuntimeState(observed, latest);
  assert.equal(merged.intervalMinutes, 15);
  assert.equal(merged.commandText, "новая команда");
  assert.equal(merged.stopPhrase, "СТОП");
  assert.equal(merged.chats[0].title, "Новое имя");
  assert.equal(merged.chats[0].enabled, false);
  assert.equal(merged.chats[0].lastObservedFingerprint, "answer-2");
});

test("stop-phrase runtime merge не отменяет более свежий ручной re-enable", () => {
  const original = createChat({ title: "Ядро", url: "https://chatgpt.com/c/example" });
  const observed = {
    ...defaultState(),
    chats: [{
      ...original,
      enabled: false,
      controlRevision: 0,
      lastStopReason: "stop-phrase",
      lastStoppedAt: "2026-09-02T01:00:00.000Z"
    }]
  };
  const latest = {
    ...defaultState(),
    chats: [{
      ...original,
      enabled: true,
      controlRevision: 1,
      lastStopReason: null,
      lastStoppedAt: null,
      lastObservedSessionId: null
    }]
  };
  const merged = mergeRuntimeState(observed, latest);
  assert.equal(merged.chats[0].enabled, true);
  assert.equal(merged.chats[0].lastStopReason, null);
  assert.equal(merged.chats[0].controlRevision, 1);
});

test("повреждённое состояние безопасно нормализуется", () => {
  const state = normalizeState({
    enabled: "yes",
    intervalMinutes: -100,
    commandText: "",
    stopPhrase: " x ".repeat(400),
    theme: "unknown",
    chats: [{ title: "bad", url: "https://example.com/c/nope" }]
  });
  assert.equal(state.enabled, false);
  assert.equal(state.intervalMinutes, 0.5);
  assert.equal(state.commandText, DEFAULT_COMMAND);
  assert.ok(state.stopPhrase.length <= MAX_STOP_PHRASE_LENGTH);
  assert.equal(state.theme, "macos");
  assert.deepEqual(state.chats, []);
});
