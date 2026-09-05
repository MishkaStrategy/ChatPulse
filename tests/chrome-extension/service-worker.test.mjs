import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('../../chrome-extension/', import.meta.url).pathname.replace(/\/$/, '');
const model = await import(pathToFileURL(`${root}/lib/model-v2.js`).href);

function makeSnapshot(overrides = {}) {
  return {
    title: 'Mock chat',
    url: 'https://chatgpt.com/c/mock',
    latestRole: 'assistant',
    latestFingerprint: 'answer-1',
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
    contentScriptVersion: '0.5.4',
    ...overrides
  };
}

function createHarness() {
  const runtimeListeners = [];
  const installedListeners = [];
  const startupListeners = [];
  const alarmListeners = [];
  const updatedListeners = new Set();
  const removedListeners = new Set();
  const data = {};
  const tabs = new Map();
  const alarms = new Map();
  const metrics = { reloads: 0, injections: 0, sends: 0, inspections: 0, alarmCreates: 0, alarmCreatesByName: {}, creates: 0, windowFocuses: 0 };
  let sendHandler = async (_tabId, message) => {
    if (message.type === 'CHATPULSE_INSPECT') {
      metrics.inspections += 1;
      return { ok: true, snapshot: makeSnapshot() };
    }
    if (message.type === 'CHATPULSE_SEND') {
      metrics.sends += 1;
      return { ok: true, outcome: 'confirmed' };
    }
    return { ok: true };
  };

  let githubFetchHandler = async () => ({
  ok: true,
  status: 200,
  headers: { get() { return null; } },
  async json() {
    return { workflow_runs: [{ id: 9001, created_at: '2026-09-05T00:00:00.000Z', status: 'completed' }] };
  }
});

  function clone(value) {
    return value === undefined ? undefined : structuredClone(value);
  }

  globalThis.fetch = (...args) => githubFetchHandler(...args);

  globalThis.chrome = {
    runtime: {
      onInstalled: { addListener(fn) { installedListeners.push(fn); } },
      onStartup: { addListener(fn) { startupListeners.push(fn); } },
      onMessage: { addListener(fn) { runtimeListeners.push(fn); } },
      async sendMessage() { return undefined; },
      lastError: null
    },
    permissions: {
  async contains({ origins } = {}) {
    return Array.isArray(origins) && origins.includes('https://api.github.com/*');
  }
},
    alarms: {
      onAlarm: { addListener(fn) { alarmListeners.push(fn); } },
      async get(name) { return clone(alarms.get(name)); },
      async clear(name) { return alarms.delete(name); },
      async create(name, info) {
        metrics.alarmCreates += 1;
        metrics.alarmCreatesByName[name] = (metrics.alarmCreatesByName[name] || 0) + 1;
        alarms.set(name, {
          name,
          scheduledTime: Date.now() + Number(info.delayInMinutes || 0) * 60_000,
          periodInMinutes: info.periodInMinutes
        });
      }
    },
    storage: {
      local: {
        async get(key) {
          if (typeof key === 'string') return { [key]: clone(data[key]) };
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
    scripting: {
      async executeScript() { metrics.injections += 1; return []; }
    },
    windows: { async update(_id, patch) { if (patch?.focused) metrics.windowFocuses += 1; return { id: _id, focused: true }; } },
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
      async query(queryInfo = {}) {
        let values = [...tabs.values()];
        if (queryInfo.active !== undefined) values = values.filter((tab) => tab.active === queryInfo.active);
        if (queryInfo.lastFocusedWindow === true) values = values.filter((tab) => tab.windowId === 1);
        if (queryInfo.currentWindow === true) values = values.filter((tab) => tab.windowId === 1);
        if (queryInfo.url) {
          const patterns = Array.isArray(queryInfo.url) ? queryInfo.url : [queryInfo.url];
          values = values.filter((tab) => patterns.some((pattern) => {
            const prefix = String(pattern).replace(/\*$/, '');
            return String(tab.url || '').startsWith(prefix);
          }));
        }
        return values.map(clone);
      },
      async create(props) {
        metrics.creates += 1;
        const id = Math.max(0, ...tabs.keys()) + 1;
        const tab = { id, windowId: 1, lastAccessed: Date.now(), status: 'complete', active: props.active === true, discarded: false, frozen: false, autoDiscardable: true, url: props.url };
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
        metrics.reloads += 1;
        const tab = tabs.get(id);
        if (!tab) throw new Error(`No tab ${id}`);
        tab.status = 'loading';
        tab.discarded = false;
        tab.frozen = false;
        queueMicrotask(() => {
          tab.status = 'complete';
          for (const fn of [...updatedListeners]) fn(id, { status: 'complete' }, clone(tab));
        });
      },
      async sendMessage(id, message) { return sendHandler(id, message); }
    }
  };

  return {
    data,
    tabs,
    alarms,
    metrics,
    runtimeListeners,
    installedListeners,
    setSendHandler(fn) { sendHandler = fn; },
  setGithubFetchHandler(fn) { githubFetchHandler = fn; },
  fireAlarm(name) {
    for (const listener of alarmListeners) listener({ name });
  },
    async invoke(message) {
      assert.equal(runtimeListeners.length, 1, 'service worker runtime listener');
      return await new Promise((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (!settled) reject(new Error('runtime response timeout'));
        }, 30000);
        timeout.unref?.();
        const sendResponse = (value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve(value);
        };
        try {
          const keepAlive = runtimeListeners[0](message, {}, sendResponse);
          assert.equal(keepAlive, true);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });
    }
  };
}

const harness = createHarness();
const swUrl = `${pathToFileURL(`${root}/background/service-worker-v2.js`).href}?test=${Date.now()}`;
await import(swUrl);
assert.equal(harness.runtimeListeners.length, 1);

function installState(chatOverrides = {}, stateOverrides = {}, tabOverrides = {}) {
  const chat = {
    ...model.createChat({ title: 'Mock chat', url: 'https://chatgpt.com/c/mock', tabId: 1, now: new Date().toISOString() }),
    lastObservedSessionId: 'session-1',
    lastObservedFingerprint: 'answer-1',
    ...chatOverrides
  };
  harness.data.chatpulseState = {
    ...model.defaultState(),
    enabled: false,
    sessionId: 'session-1',
    chats: [chat],
    ...stateOverrides
  };
  harness.tabs.clear();
  harness.tabs.set(1, {
    id: 1,
    windowId: 1,
    lastAccessed: Date.now(),
    url: 'https://chatgpt.com/c/mock',
    status: 'complete',
    active: false,
    discarded: false,
    frozen: false,
    autoDiscardable: true,
    ...tabOverrides
  });
}

// 1. Periodic freshness reload is recorded.
installState({
  lastCommandedFingerprint: 'answer-1',
  lastHardRefreshAt: '2000-01-01T00:00:00.000Z'
});
harness.metrics.reloads = 0;
harness.setSendHandler(async (_id, message) => {
  if (message.type === 'CHATPULSE_INSPECT') { harness.metrics.inspections += 1; return { ok: true, snapshot: makeSnapshot() }; }
  if (message.type === 'CHATPULSE_SEND') { harness.metrics.sends += 1; return { ok: true, outcome: 'confirmed' }; }
});
let result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.reloads, 1);
assert.equal(result.state.chats[0].lastRecoveryReason, 'periodic-freshness');
assert.equal(result.state.chats[0].staleRecoveries, 1);
assert.equal(result.state.chats[0].lastCommandedFingerprint, 'answer-1');

// 2. Discarded tab reloads before inspection and becomes protected from auto discard.
installState({ lastCommandedFingerprint: 'answer-1' }, {}, { discarded: true });
harness.metrics.reloads = 0;
result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.reloads, 1);
assert.equal(result.state.chats[0].lastRecoveryReason, 'discarded-tab');
assert.equal(harness.tabs.get(1).autoDiscardable, false);

// 3. Active unresponsive tab is never reloaded automatically.
installState({}, {}, { active: true });
harness.metrics.reloads = 0;
harness.metrics.injections = 0;
harness.setSendHandler(async () => { throw new Error('Receiving end does not exist'); });
result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.reloads, 0);
assert.ok(result.state.chats[0].lastError.includes('Активная вкладка не ответила'), result.state.chats[0].lastError);
assert.ok(harness.metrics.injections >= 1);

// 4. Stable answer is dispatched once; next check is blocked by fingerprint.
installState({ lastCommandedFingerprint: null, lastHardRefreshAt: new Date().toISOString() });
harness.metrics.reloads = 0;
harness.metrics.sends = 0;
harness.setSendHandler(async (_id, message) => {
  if (message.type === 'CHATPULSE_INSPECT') { harness.metrics.inspections += 1; return { ok: true, snapshot: makeSnapshot() }; }
  if (message.type === 'CHATPULSE_SEND') { harness.metrics.sends += 1; return { ok: true, outcome: 'confirmed' }; }
});
result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.sends, 1);
assert.equal(result.state.chats[0].lastCommandedFingerprint, 'answer-1');
assert.equal(result.state.chats[0].lastDispatchOutcome, 'confirmed');
result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.sends, 1, 'duplicate command must not be sent');

// 5. Submitted-unconfirmed also locks the fingerprint at-most-once.
installState({ lastCommandedFingerprint: null, lastHardRefreshAt: new Date().toISOString() });
harness.metrics.sends = 0;
harness.setSendHandler(async (_id, message) => {
  if (message.type === 'CHATPULSE_INSPECT') return { ok: true, snapshot: makeSnapshot() };
  if (message.type === 'CHATPULSE_SEND') { harness.metrics.sends += 1; return { ok: true, outcome: 'submitted-unconfirmed' }; }
});
result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(result.ok, true, result.error);
assert.equal(result.state.chats[0].lastCommandedFingerprint, 'answer-1');
assert.equal(result.state.chats[0].lastDispatchOutcome, 'submitted-unconfirmed');
result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(harness.metrics.sends, 1);

// 6. Adding from the options page selects the most recently used ChatGPT tab.
harness.data.chatpulseState = { ...model.defaultState(), enabled: false, sessionId: 'session-add', chats: [] };
harness.tabs.clear();
harness.tabs.set(10, { id: 10, windowId: 1, lastAccessed: 300, url: 'chrome-extension://id/options/options.html', status: 'complete', active: true, discarded: false, frozen: false, autoDiscardable: true });
harness.tabs.set(2, { id: 2, windowId: 1, lastAccessed: 100, url: 'https://chatgpt.com/c/older', status: 'complete', active: false, discarded: false, frozen: false, autoDiscardable: true });
harness.tabs.set(3, { id: 3, windowId: 2, lastAccessed: 200, url: 'https://chatgpt.com/c/newer', status: 'complete', active: true, discarded: false, frozen: false, autoDiscardable: true });
harness.setSendHandler(async (id, message) => {
  if (message.type === 'CHATPULSE_INSPECT') return { ok: true, snapshot: makeSnapshot({ title: id === 3 ? 'Newest chat' : 'Older chat', url: harness.tabs.get(id).url }) };
  return { ok: true };
});
result = await harness.invoke({ type: 'ADD_CURRENT_CHAT' });
assert.equal(result.ok, true, result.error);
assert.equal(result.state.chats.length, 1);
assert.equal(result.state.chats[0].tabId, 3);
assert.equal(result.state.chats[0].url, 'https://chatgpt.com/c/newer');
assert.equal(result.state.chats[0].title, 'Newest chat');

// 7. Opening a tracked chat activates the existing tab instead of creating a duplicate.
installState({}, {}, { id: 1, windowId: 4, active: false });
harness.metrics.creates = 0;
harness.metrics.windowFocuses = 0;
result = await harness.invoke({ type: 'OPEN_CHAT', chatId: harness.data.chatpulseState.chats[0].id });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.creates, 0);
assert.equal(harness.tabs.get(1).active, true);
assert.equal(harness.metrics.windowFocuses, 1);

// 8. Stop phrase disables only the matching chat and never dispatches to it.
const now = new Date().toISOString();
const stoppedChat = {
  ...model.createChat({ title: 'Stop chat', url: 'https://chatgpt.com/c/stop', tabId: 1, now }),
  lastObservedSessionId: 'session-stop',
  lastObservedFingerprint: 'answer-stop',
  lastHardRefreshAt: now
};
const continuingChat = {
  ...model.createChat({ title: 'Continue chat', url: 'https://chatgpt.com/c/continue', tabId: 2, now }),
  lastObservedSessionId: 'session-stop',
  lastObservedFingerprint: 'answer-continue',
  lastHardRefreshAt: now
};
harness.data.chatpulseState = {
  ...model.defaultState(),
  enabled: false,
  sessionId: 'session-stop',
  stopPhrase: 'ГОТОВО',
  chats: [stoppedChat, continuingChat]
};
harness.tabs.clear();
harness.tabs.set(1, { id: 1, windowId: 1, lastAccessed: Date.now(), url: 'https://chatgpt.com/c/stop', status: 'complete', active: false, discarded: false, frozen: false, autoDiscardable: true });
harness.tabs.set(2, { id: 2, windowId: 1, lastAccessed: Date.now(), url: 'https://chatgpt.com/c/continue', status: 'complete', active: false, discarded: false, frozen: false, autoDiscardable: true });
harness.metrics.sends = 0;
harness.setSendHandler(async (id, message) => {
  if (message.type === 'CHATPULSE_INSPECT') {
    return {
      ok: true,
      snapshot: makeSnapshot({
        url: harness.tabs.get(id).url,
        latestFingerprint: id === 1 ? 'answer-stop' : 'answer-continue',
        stopPhraseMatched: id === 1
      })
    };
  }
  if (message.type === 'CHATPULSE_SEND') {
    harness.metrics.sends += 1;
    assert.equal(id, 2, 'matching chat must never receive continuation');
    return { ok: true, outcome: 'confirmed' };
  }
  return { ok: true };
});
result = await harness.invoke({ type: 'CHECK_NOW' });
assert.equal(result.ok, true, result.error);
assert.equal(result.state.chats[0].enabled, false);
assert.equal(result.state.chats[0].lastStopReason, 'stop-phrase');
assert.ok(result.state.chats[0].lastStoppedAt);
assert.equal(result.state.chats[1].enabled, true);
assert.equal(harness.metrics.sends, 1, 'only non-matching chat may continue');

// 9. Simultaneous ordinary and GitHub alarms are serialized instead of dropping the second trigger.
installState({
  lastCommandedFingerprint: 'answer-1',
  lastHardRefreshAt: new Date().toISOString(),
  profile: {
    ...model.defaultChatProfile(),
    intervalMinutes: 10,
    githubWatchEnabled: true,
    githubWatchOnly: false,
    githubRepository: 'MishkaStrategy/ChatPulse',
    githubIdleMinutes: 30
  }
}, { enabled: true, intervalMinutes: 10 });
harness.setSendHandler(async (_id, message) => {
  if (message.type === 'CHATPULSE_INSPECT') return { ok: true, snapshot: makeSnapshot() };
  if (message.type === 'CHATPULSE_SEND') return { ok: true, outcome: 'confirmed' };
  return { ok: true };
});
let githubFetches = 0;
harness.setGithubFetchHandler(async () => {
  githubFetches += 1;
  return {
    ok: true,
    status: 200,
    headers: { get() { return null; } },
    async json() {
      return { workflow_runs: [{ id: 9001, created_at: '2026-09-05T00:00:00.000Z', status: 'completed' }] };
    }
  };
});
harness.fireAlarm('chatpulse-monitor');
harness.fireAlarm('chatpulse-github-actions-watchdog');
const collisionDeadline = Date.now() + 5_000;
while (!harness.data.chatpulseState?.chats?.[0]?.githubLastCheckedAt && Date.now() < collisionDeadline) {
  await new Promise((resolve) => setTimeout(resolve, 10));
}
assert.equal(githubFetches, 1, 'queued GitHub alarm must execute after the ordinary alarm');
assert.equal(harness.data.chatpulseState.chats[0].githubLastRunId, '9001');
assert.ok(harness.data.chatpulseState.chats[0].githubLastCheckedAt, 'GitHub observation must persist after collision');

// 10. Scheduler configuration is idempotent: ordinary and GitHub alarms keep their original schedule.
installState({
  profile: {
    ...model.defaultChatProfile(),
    githubWatchEnabled: true,
    githubWatchOnly: false,
    githubRepository: 'MishkaStrategy/ChatPulse',
    githubIdleMinutes: 30
  }
}, { enabled: true, intervalMinutes: 5 });
harness.alarms.clear();
harness.metrics.alarmCreatesByName = {};
result = await harness.invoke({ type: 'UPDATE_SETTINGS', patch: { intervalMinutes: 5 } });
assert.equal(result.ok, true, result.error);
const normalAlarmScheduledTime = harness.alarms.get('chatpulse-monitor')?.scheduledTime;
const githubAlarmScheduledTime = harness.alarms.get('chatpulse-github-actions-watchdog')?.scheduledTime;
assert.ok(normalAlarmScheduledTime);
assert.ok(githubAlarmScheduledTime);
result = await harness.invoke({ type: 'UPDATE_SETTINGS', patch: { intervalMinutes: 5 } });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.alarmCreatesByName['chatpulse-monitor'], 1, 'unchanged ordinary alarm must not be recreated');
assert.equal(harness.metrics.alarmCreatesByName['chatpulse-github-actions-watchdog'], 1, 'unchanged GitHub alarm must not be recreated');
assert.equal(harness.alarms.get('chatpulse-monitor').scheduledTime, normalAlarmScheduledTime);
assert.equal(harness.alarms.get('chatpulse-github-actions-watchdog').scheduledTime, githubAlarmScheduledTime);

// 11. A GitHub-only chat schedules only the independent Actions watchdog.
installState({
  profile: {
    ...model.defaultChatProfile(),
    githubWatchEnabled: true,
    githubWatchOnly: true,
    githubRepository: 'MishkaStrategy/ChatPulse',
    githubIdleMinutes: 30
  }
}, { enabled: true, intervalMinutes: 5 });
harness.alarms.clear();
harness.metrics.alarmCreatesByName = {};
result = await harness.invoke({ type: 'UPDATE_SETTINGS', patch: { intervalMinutes: 5 } });
assert.equal(result.ok, true, result.error);
assert.equal(harness.alarms.has('chatpulse-monitor'), false, 'GitHub-only chat must not schedule ordinary interval alarm');
assert.equal(harness.alarms.get('chatpulse-github-actions-watchdog')?.periodInMinutes, 10);
assert.equal(result.state.nextCheckAt, null);

console.log(JSON.stringify({
  periodic_recovery: 'PASS',
  discarded_recovery: 'PASS',
  active_tab_protection: 'PASS',
  confirmed_at_most_once: 'PASS',
  unconfirmed_at_most_once: 'PASS',
  add_from_options: 'PASS',
  open_without_duplicate: 'PASS',
  stop_phrase_single_chat: 'PASS',
  independent_alarm_lifecycle: 'PASS',
  github_only_scheduler: 'PASS',
  simultaneous_alarm_serialization: 'PASS',
  reload_count_last_scenario: harness.metrics.reloads,
  tests: 'PASS'
}, null, 2));