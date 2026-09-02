import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCompletion,
  applyPortableConfig,
  completionGuardReason,
  createChat,
  createPortableConfig,
  defaultState,
  effectiveChatProfile,
  hasCompletionGuard,
  isChatDue,
  mergeRuntimeState,
  normalizeState,
  recordDispatch,
  scheduleNextChatCheck,
  startChatRun
} from "../../chrome-extension/lib/model-v2.js";

test("schema v3 state migrates to schema v5 with inheriting safe chat profile and watchdog off", () => {
  const state = normalizeState({
    schemaVersion: 3,
    intervalMinutes: 5,
    commandText: "продолжай",
    stopPhrase: "ГОТОВО",
    chats: [{ title: "Legacy", url: "https://chatgpt.com/c/legacy", enabled: true }]
  });
  assert.equal(state.schemaVersion, 5);
  assert.equal(state.chats[0].profile.commandText, null);
  assert.equal(state.chats[0].profile.intervalMinutes, null);
  assert.equal(state.chats[0].profile.stopPhrase, null);
  assert.equal(state.chats[0].profile.telegramNotify, true);
  assert.equal(state.chats[0].profile.githubWatchEnabled, false);
  assert.equal(state.chats[0].profile.githubRepository, null);
  assert.equal(state.chats[0].profile.githubIdleMinutes, 30);
  assert.equal(state.chats[0].continuationCount, 0);
  assert.equal(state.chats[0].taskActive, false);
});

test("per-chat profile inherits globals and can explicitly disable global stop phrase", () => {
  const state = {
    ...defaultState(),
    commandText: "глобальная команда",
    intervalMinutes: 5,
    stopPhrase: "ГОТОВО"
  };
  const inherited = createChat({ title: "A", url: "https://chatgpt.com/c/a" });
  assert.deepEqual(effectiveChatProfile(state, inherited), {
    commandText: "глобальная команда",
    intervalMinutes: 5,
    stopPhrase: "ГОТОВО",
    maxContinuations: 0,
    maxRuntimeMinutes: 0,
    telegramNotify: true,
    githubWatchEnabled: false,
    githubRepository: null,
    githubIdleMinutes: 30
  });

  const overridden = {
    ...inherited,
    profile: {
      commandText: "персональная команда",
      intervalMinutes: 2,
      stopPhrase: "",
      maxContinuations: 7,
      maxRuntimeMinutes: 90,
      telegramNotify: false
    }
  };
  assert.deepEqual(effectiveChatProfile(state, overridden), {
    commandText: "персональная команда",
    intervalMinutes: 2,
    stopPhrase: "",
    maxContinuations: 7,
    maxRuntimeMinutes: 90,
    telegramNotify: false,
    githubWatchEnabled: false,
    githubRepository: null,
    githubIdleMinutes: 30
  });
});

test("continuation limit allows exactly N dispatches and never requires N+1", () => {
  let chat = startChatRun(createChat({ title: "A", url: "https://chatgpt.com/c/a" }), {
    at: "2026-09-02T05:00:00.000Z"
  });
  const profile = { stopPhrase: "", maxContinuations: 2, maxRuntimeMinutes: 0 };

  assert.equal(completionGuardReason(chat, profile, Date.parse("2026-09-02T05:01:00.000Z")), null);
  chat = recordDispatch(chat, "answer-1", "confirmed", "2026-09-02T05:01:00.000Z");
  assert.equal(chat.continuationCount, 1);
  assert.equal(completionGuardReason(chat, profile, Date.parse("2026-09-02T05:02:00.000Z")), null);

  chat = recordDispatch(chat, "answer-2", "submitted-unconfirmed", "2026-09-02T05:02:00.000Z");
  assert.equal(chat.continuationCount, 2);
  assert.equal(completionGuardReason(chat, profile, Date.parse("2026-09-02T05:02:00.000Z")), "continuation-limit");
  chat = applyCompletion(chat, "continuation-limit", "2026-09-02T05:02:00.000Z");
  assert.equal(chat.enabled, false);
  assert.equal(chat.lastStopReason, "continuation-limit");
});

test("runtime limit is evaluated before another continuation", () => {
  const chat = {
    ...createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    runStartedAt: "2026-09-02T05:00:00.000Z"
  };
  const profile = { stopPhrase: "", maxContinuations: 0, maxRuntimeMinutes: 30 };
  assert.equal(completionGuardReason(chat, profile, Date.parse("2026-09-02T05:29:59.000Z")), null);
  assert.equal(completionGuardReason(chat, profile, Date.parse("2026-09-02T05:30:00.000Z")), "runtime-limit");
});

test("task mode requires a completion guard and starts from a fresh baseline", () => {
  assert.equal(hasCompletionGuard({ stopPhrase: "", maxContinuations: 0, maxRuntimeMinutes: 0 }), false);
  assert.equal(hasCompletionGuard({ stopPhrase: "ГОТОВО", maxContinuations: 0, maxRuntimeMinutes: 0 }), true);

  const old = {
    ...createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    controlRevision: 4,
    continuationCount: 19,
    lastObservedSessionId: "old-session",
    lastStopReason: "continuation-limit"
  };
  const task = startChatRun(old, { task: true, at: "2026-09-02T05:00:00.000Z" });
  assert.equal(task.controlRevision, 5);
  assert.equal(task.taskActive, true);
  assert.equal(task.continuationCount, 0);
  assert.equal(task.lastObservedSessionId, null);
  assert.equal(task.lastStopReason, null);
  assert.equal(task.runStartedAt, "2026-09-02T05:00:00.000Z");
});

test("per-chat scheduling skips only until its own next eligible time", () => {
  const chat = createChat({ title: "A", url: "https://chatgpt.com/c/a" });
  const scheduled = scheduleNextChatCheck(chat, 2, Date.parse("2026-09-02T05:00:00.000Z"));
  assert.equal(scheduled.nextEligibleAt, "2026-09-02T05:02:00.000Z");
  assert.equal(isChatDue(scheduled, Date.parse("2026-09-02T05:01:59.000Z")), false);
  assert.equal(isChatDue(scheduled, Date.parse("2026-09-02T05:02:00.000Z")), true);
});

test("portable export contains configuration only and import regenerates runtime identity", () => {
  const chat = {
    ...createChat({ title: "A", url: "https://chatgpt.com/c/a", tabId: 42 }),
    profile: {
      commandText: "делай дальше",
      intervalMinutes: 2,
      stopPhrase: "ГОТОВО",
      maxContinuations: 10,
      maxRuntimeMinutes: 120,
      telegramNotify: false
    },
    continuationCount: 8,
    taskActive: true,
    lastObservedFingerprint: "secret-runtime-fingerprint",
    lastCommandedFingerprint: "secret-dispatch-fingerprint",
    lastObservedSessionId: "runtime-session"
  };
  const state = {
    ...defaultState(),
    enabled: true,
    logs: [{ id: "log", at: "2026-09-02T05:00:00.000Z", level: "info", message: "runtime log" }],
    chats: [chat]
  };

  const portable = createPortableConfig(state, "2026-09-02T05:10:00.000Z");
  const serialized = JSON.stringify(portable);
  for (const forbidden of [
    "botToken",
    "tabId",
    "lastObservedFingerprint",
    "lastCommandedFingerprint",
    "lastObservedSessionId",
    "runtime log"
  ]) {
    assert.equal(serialized.includes(forbidden), false, `portable config leaked ${forbidden}`);
  }
  assert.equal(portable.credentialsIncluded, false);
  assert.equal(portable.runtimeStateIncluded, false);

  const imported = applyPortableConfig(portable, "2026-09-02T05:20:00.000Z");
  assert.equal(imported.enabled, false);
  assert.equal(imported.logs.length, 0);
  assert.equal(imported.chats.length, 1);
  assert.notEqual(imported.chats[0].id, chat.id);
  assert.equal(imported.chats[0].tabId, null);
  assert.equal(imported.chats[0].continuationCount, 0);
  assert.equal(imported.chats[0].taskActive, false);
  assert.equal(imported.chats[0].lastObservedFingerprint, null);
  assert.equal(imported.chats[0].profile.maxContinuations, 10);
  assert.equal(imported.chats[0].profile.telegramNotify, false);
});

test("stale runtime state cannot cross a newer profile/control revision", () => {
  const base = createChat({ title: "A", url: "https://chatgpt.com/c/a" });
  const observed = {
    ...defaultState(),
    chats: [{
      ...base,
      controlRevision: 1,
      continuationCount: 9,
      lastObservedSessionId: "stale-session",
      enabled: false,
      lastStopReason: "continuation-limit"
    }]
  };
  const latest = {
    ...defaultState(),
    chats: [{
      ...base,
      controlRevision: 2,
      continuationCount: 0,
      lastObservedSessionId: null,
      enabled: true,
      profile: { ...base.profile, maxContinuations: 20 }
    }]
  };
  const merged = mergeRuntimeState(observed, latest);
  assert.equal(merged.chats[0].controlRevision, 2);
  assert.equal(merged.chats[0].enabled, true);
  assert.equal(merged.chats[0].continuationCount, 0);
  assert.equal(merged.chats[0].lastObservedSessionId, null);
  assert.equal(merged.chats[0].profile.maxContinuations, 20);
});
