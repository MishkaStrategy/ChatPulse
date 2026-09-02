import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";

const root = new URL("../../chrome-extension/", import.meta.url).pathname.replace(/\/$/, "");
const model = await import(pathToFileURL(`${root}/lib/model-v2.js`).href);

function snapshot(overrides = {}) {
  return {
    title: "Task chat",
    url: "https://chatgpt.com/c/task",
    latestRole: "assistant",
    latestFingerprint: "answer-1",
    stopPhraseMatched: false,
    isGenerating: false,
    generationAgeMs: 0,
    errorDetected: false,
    pageReady: true,
    authenticated: true,
    messageCount: 1,
    hasComposer: true,
    hasDraft: false,
    observedAt: new Date().toISOString(),
    contentScriptVersion: "0.6.0",
    ...overrides
  };
}

function createHarness() {
  const runtimeListeners = [];
  const updatedListeners = new Set();
  const removedListeners = new Set();
  const data = {};
  const tabs = new Map();
  const sentCommands = [];
  let inspectSnapshot = snapshot();

  const clone = (value) => value === undefined ? undefined : structuredClone(value);

  globalThis.chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },
      onMessage: { addListener(fn) { runtimeListeners.push(fn); } },
      async sendMessage() { return undefined; },
      lastError: null
    },
    permissions: {
      async contains() { return false; },
      async request() { return false; }
    },
    alarms: {
      onAlarm: { addListener() {} },
      async clear() { return true; },
      async create() {}
    },
    storage: {
      local: {
        async get(key) {
          if (typeof key === "string") return { [key]: clone(data[key]) };
          return clone(data);
        },
        async set(patch) { Object.assign(data, clone(patch)); }
      }
    },
    action: {
      async setBadgeText() {},
      async setBadgeBackgroundColor() {},
      async setTitle() {}
    },
    scripting: { async executeScript() { return []; } },
    windows: { async update(id) { return { id, focused: true }; } },
    tabs: {
      onUpdated: {
        addListener(fn) { updatedListeners.add(fn); },
        removeListener(fn) { updatedListeners.delete(fn); }
      },
      onRemoved: {
        addListener(fn) { removedListeners.add(fn); },
        removeListener(fn) { removedListeners.delete(fn); }
      },
      async get(id) {
        const tab = tabs.get(id);
        if (!tab) throw new Error(`No tab ${id}`);
        return clone(tab);
      },
      async query(query = {}) {
        let values = [...tabs.values()];
        if (query.active !== undefined) values = values.filter((tab) => tab.active === query.active);
        if (query.url) {
          const patterns = Array.isArray(query.url) ? query.url : [query.url];
          values = values.filter((tab) => patterns.some((pattern) => String(tab.url).startsWith(String(pattern).replace(/\*$/, ""))));
        }
        return values.map(clone);
      },
      async create(props) {
        const id = Math.max(0, ...tabs.keys()) + 1;
        const tab = {
          id,
          windowId: 1,
          lastAccessed: Date.now(),
          status: "complete",
          active: props.active === true,
          discarded: false,
          frozen: false,
          autoDiscardable: true,
          url: props.url
        };
        tabs.set(id, tab);
        return clone(tab);
      },
      async update(id, patch) {
        const tab = tabs.get(id);
        if (!tab) throw new Error(`No tab ${id}`);
        Object.assign(tab, patch);
        return clone(tab);
      },
      async reload(id) {
        const tab = tabs.get(id);
        if (!tab) throw new Error(`No tab ${id}`);
        tab.status = "loading";
        queueMicrotask(() => {
          tab.status = "complete";
          for (const fn of updatedListeners) fn(id, { status: "complete" }, clone(tab));
        });
      },
      async sendMessage(_id, message) {
        if (message.type === "CHATPULSE_INSPECT") {
          return { ok: true, snapshot: clone(inspectSnapshot) };
        }
        if (message.type === "CHATPULSE_SEND") {
          sentCommands.push(message.command);
          return { ok: true, outcome: "confirmed" };
        }
        return { ok: true };
      }
    }
  };

  return {
    data,
    tabs,
    sentCommands,
    runtimeListeners,
    setSnapshot(value) { inspectSnapshot = snapshot(value); },
    resetCommands() { sentCommands.length = 0; },
    install({ profile = {}, chat = {}, state = {} } = {}) {
      const now = new Date().toISOString();
      const baseChat = {
        ...model.createChat({ title: "Task chat", url: "https://chatgpt.com/c/task", tabId: 1, now }),
        profile: model.normalizeChatProfile(profile),
        lastObservedSessionId: "session-task",
        lastObservedFingerprint: "answer-1",
        lastHardRefreshAt: now,
        ...chat
      };
      data.chatpulseState = {
        ...model.defaultState(),
        enabled: false,
        sessionId: "session-task",
        chats: [baseChat],
        ...state
      };
      tabs.clear();
      tabs.set(1, {
        id: 1,
        windowId: 1,
        lastAccessed: Date.now(),
        url: "https://chatgpt.com/c/task",
        status: "complete",
        active: false,
        discarded: false,
        frozen: false,
        autoDiscardable: true
      });
      inspectSnapshot = snapshot();
      sentCommands.length = 0;
      return baseChat.id;
    },
    async invoke(message) {
      assert.equal(runtimeListeners.length, 1);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("runtime response timeout")), 30_000);
        timer.unref?.();
        const sendResponse = (value) => {
          clearTimeout(timer);
          resolve(value);
        };
        try {
          assert.equal(runtimeListeners[0](message, {}, sendResponse), true);
        } catch (error) {
          clearTimeout(timer);
          reject(error);
        }
      });
    }
  };
}

const harness = createHarness();
await import(`${pathToFileURL(`${root}/background/service-worker-v2.js`).href}?task-test=${Date.now()}`);
assert.equal(harness.runtimeListeners.length, 1);

test("UPDATE_CHAT_PROFILE persists overrides and advances controlRevision", async () => {
  const chatId = harness.install();
  const response = await harness.invoke({
    type: "UPDATE_CHAT_PROFILE",
    chatId,
    profile: {
      commandText: "персональная команда",
      intervalMinutes: 2,
      stopPhrase: "ГОТОВО",
      maxContinuations: 4,
      maxRuntimeMinutes: 60,
      telegramNotify: false
    }
  });
  assert.equal(response.ok, true, response.error);
  const chat = response.state.chats[0];
  assert.equal(chat.controlRevision, 1);
  assert.equal(chat.profile.commandText, "персональная команда");
  assert.equal(chat.profile.intervalMinutes, 2);
  assert.equal(chat.profile.stopPhrase, "ГОТОВО");
  assert.equal(chat.profile.maxContinuations, 4);
  assert.equal(chat.profile.maxRuntimeMinutes, 60);
  assert.equal(chat.profile.telegramNotify, false);
});

test("per-chat command is the command actually dispatched", async () => {
  harness.install({ profile: { commandText: "команда профиля" } });
  const response = await harness.invoke({ type: "CHECK_NOW" });
  assert.equal(response.ok, true, response.error);
  assert.deepEqual(harness.sentCommands, ["команда профиля"]);
});

test("maxContinuations=1 produces exactly one send then stops only that chat", async () => {
  harness.install({ profile: { maxContinuations: 1 } });
  let response = await harness.invoke({ type: "CHECK_NOW" });
  assert.equal(response.ok, true, response.error);
  assert.equal(harness.sentCommands.length, 1);
  assert.equal(response.state.chats[0].continuationCount, 1);
  assert.equal(response.state.chats[0].enabled, false);
  assert.equal(response.state.chats[0].lastStopReason, "continuation-limit");

  response = await harness.invoke({ type: "CHECK_NOW" });
  assert.equal(response.ok, true, response.error);
  assert.equal(harness.sentCommands.length, 1, "limit must prevent N+1 send");
});

test("START_TASK rejects an unguarded infinite task", async () => {
  const chatId = harness.install();
  const response = await harness.invoke({ type: "START_TASK", chatId });
  assert.equal(response.ok, false);
  assert.match(response.error, /стоп-фразу|лимит продолжений|лимит времени/i);
  assert.equal(harness.sentCommands.length, 0);
});

test("EXPORT_CONFIG and IMPORT_CONFIG stay configuration-only through runtime messages", async () => {
  const oldChatId = harness.install({
    profile: {
      commandText: "переносимая команда",
      maxContinuations: 5,
      telegramNotify: false
    },
    chat: {
      continuationCount: 3,
      lastObservedFingerprint: "runtime-fingerprint",
      lastCommandedFingerprint: "dispatch-fingerprint",
      lastObservedSessionId: "runtime-session"
    },
    state: {
      logs: [{ id: "runtime-log", at: new Date().toISOString(), level: "info", message: "runtime-only" }]
    }
  });
  harness.data.chatpulseTelegramConfig = {
    enabled: true,
    chatId: "123456789",
    botToken: "123456789:abcdefghijklmnopqrstuvwxyz"
  };

  const exported = await harness.invoke({ type: "EXPORT_CONFIG" });
  assert.equal(exported.ok, true, exported.error);
  const serialized = JSON.stringify(exported.config);
  for (const forbidden of ["botToken", "runtime-fingerprint", "dispatch-fingerprint", "runtime-session", "runtime-only", "tabId"]) {
    assert.equal(serialized.includes(forbidden), false, `export leaked ${forbidden}`);
  }

  const imported = await harness.invoke({ type: "IMPORT_CONFIG", config: exported.config });
  assert.equal(imported.ok, true, imported.error);
  assert.equal(imported.state.enabled, false);
  assert.equal(imported.state.chats[0].continuationCount, 0);
  assert.equal(imported.state.chats[0].lastObservedFingerprint, null);
  assert.equal(imported.state.chats[0].profile.maxContinuations, 5);
  assert.equal(imported.state.chats[0].profile.telegramNotify, false);
  assert.notEqual(imported.state.chats[0].id, oldChatId);
  assert.equal(harness.data.chatpulseTelegramConfig.botToken, "123456789:abcdefghijklmnopqrstuvwxyz", "import must not overwrite local Telegram credentials");
});
