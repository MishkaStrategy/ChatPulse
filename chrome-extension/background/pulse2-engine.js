import { normalizeChatURL } from "../lib/model-v2.js";
import {
  PULSE2_CAPTURE_RETRY_MS,
  PULSE2_MAX_CAPTURE_ATTEMPTS,
  applyPulse2SettingsPatch,
  beginPulse2Rotation,
  capturePulse2Chat,
  completePulse2State,
  defaultPulse2State,
  effectivePulse2StartMessage,
  failPulse2State,
  markPulse2CaptureWait,
  normalizePulse2State,
  observePulse2Snapshot,
  recordPulse2Dispatch,
  retryPulse2Capture,
  startPulse2State,
  stopPulse2State
} from "../lib/pulse2-model.js";

export const PULSE2_PORT_NAME = "chatpulse-pulse2";
export const PULSE2_ALARM_NAME = "chatpulse-pulse2-monitor";
export const PULSE2_CAPTURE_ALARM_NAME = "chatpulse-pulse2-capture";

const STORAGE_KEY = "chatpulse2State";
const PULSE1_STORAGE_KEY = "chatpulseState";
const CHATGPT_PATTERNS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];
const TAB_LOAD_TIMEOUT_MS = 45_000;
const CONTENT_TIMEOUT_MS = 6_000;
const PROJECT_PREPARE_TIMEOUT_MS = 15_000;
const START_MESSAGE_TIMEOUT_MS = 20_000;
const PROJECT_SETTLE_MS = 1_000;

const ports = new Set();
let activePulse2Check = null;
let activePulse2Rotation = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port?.name !== PULSE2_PORT_NAME) return;
  ports.add(port);
  port.onDisconnect.addListener(() => ports.delete(port));
  port.onMessage.addListener((message) => {
    void handlePortRequest(port, message);
  });
  void loadPulse2State().then((state) => safePost(port, { kind: "state", state }));
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === PULSE2_ALARM_NAME) void queuePulse2Check("alarm");
  if (alarm.name === PULSE2_CAPTURE_ALARM_NAME) void handlePulse2CaptureAlarm();
});

chrome.runtime.onInstalled.addListener(() => {
  void resumePulse2();
});

chrome.runtime.onStartup.addListener(() => {
  void resumePulse2();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[PULSE1_STORAGE_KEY]) return;
  void stopPulse2OnPulse1Collision();
});

async function handlePortRequest(port, message) {
  const requestId = message?.requestId;
  if (!requestId) return;
  try {
    const result = await handlePulse2Action(message?.type, message || {});
    safePost(port, { kind: "response", requestId, ok: true, ...result });
  } catch (error) {
    safePost(port, {
      kind: "response",
      requestId,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handlePulse2Action(type, message) {
  switch (type) {
    case "GET_STATE":
      return { state: await loadPulse2State() };

    case "UPDATE_SETTINGS": {
      const current = await loadPulse2State();
      const next = applyPulse2SettingsPatch(current, message.patch || {});
      await persistPulse2State(next);
      return { state: next };
    }

    case "USE_CURRENT_CHAT": {
      let state = await loadPulse2State();
      if (state.enabled) throw new Error("Остановите Pulse 2.0 перед сменой исходного чата.");
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const url = normalizeChatURL(tab?.url);
      if (!url) throw new Error("Откройте конкретный чат ChatGPT и повторите.");
      state = applyPulse2SettingsPatch(state, { currentChatUrl: url });
      await persistPulse2State(state);
      return { state };
    }

    case "START":
      return { state: await startPulse2() };

    case "STOP":
      return { state: await stopPulse2("manual") };

    case "CHECK_NOW":
      await queuePulse2Check("manual");
      return { state: await loadPulse2State() };

    case "OPEN_CURRENT_CHAT":
      return { state: await openPulse2CurrentChat() };

    default:
      throw new Error("Неизвестная команда Pulse 2.0.");
  }
}

async function resumePulse2() {
  let state = await loadPulse2State();
  state = { ...state, checkInProgress: false };
  if (!state.enabled) {
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
    return;
  }
  if (state.phase === "rotating") {
    await persistPulse2State(state);
    void queuePulse2Rotation();
    return;
  }
  if (!["monitoring", "capture-wait"].includes(state.phase)) {
    state = failPulse2State(state, `Невозможно восстановить фазу ${state.phase}.`);
  }
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
}

async function startPulse2() {
  let state = await loadPulse2State();
  if (state.enabled) return state;
  await assertNoPulse1Collision(state.currentChatUrl);

  const tab = await chrome.tabs.create({
    url: state.currentChatUrl,
    active: false,
    pinned: false
  });
  if (!Number.isInteger(tab?.id)) throw new Error("Chrome не вернул идентификатор вкладки Pulse 2.0.");
  await protectManagedTab(tab.id);

  state = startPulse2State(state, { tabId: tab.id });
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  void queuePulse2Check("start");
  return state;
}

async function stopPulse2(reason) {
  let state = await loadPulse2State();
  state = stopPulse2State(state, reason);
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  return state;
}

function queuePulse2Check(source) {
  const previous = activePulse2Check;
  const queued = (previous ? previous.catch(() => {}) : Promise.resolve())
    .then(() => performPulse2Check(source));
  let tracked = null;
  tracked = queued.finally(() => {
    if (activePulse2Check === tracked) activePulse2Check = null;
  });
  activePulse2Check = tracked;
  return tracked;
}

async function performPulse2Check(source) {
  let state = await loadPulse2State();
  if (!state.enabled || state.phase !== "monitoring") return;
  if (source !== "manual") {
    const nextAt = Date.parse(String(state.nextCheckAt || ""));
    if (Number.isFinite(nextAt) && nextAt > Date.now() + 1_000) return;
  }

  const expectedSessionId = state.sessionId;
  const expectedRevision = state.controlRevision;
  state = { ...state, checkInProgress: true, lastError: null };
  await persistPulse2State(state);

  try {
    let tab = await ensurePulse2ChatTab(state);
    if (tab.id !== state.tabId) {
      state = { ...state, tabId: tab.id };
      await persistPulse2State(state);
    }
    await waitForTabComplete(tab.id, TAB_LOAD_TIMEOUT_MS);
    let snapshot = await inspectPulse2Tab(tab.id);
    let observation = observePulse2Snapshot(state, snapshot);
    state = observation.state;
    await persistPulse2State(state);

    if (observation.decision === "send-auto-response" || observation.decision === "rotate") {
      const live = await loadPulse2State();
      assertPulse2ExecutionStillCurrent(live, {
        sessionId: expectedSessionId,
        controlRevision: expectedRevision,
        currentChatUrl: state.currentChatUrl
      });
      tab = await ensurePulse2ChatTab(live);
      snapshot = await inspectPulse2Tab(tab.id);
      observation = observePulse2Snapshot(live, snapshot);
      state = observation.state;
      await persistPulse2State(state);
    }

    if (observation.decision === "send-auto-response") {
      await assertNoPulse1Collision(state.currentChatUrl);
      const response = await sendToContent(state.tabId, {
        type: "CHATPULSE_SEND",
        command: state.commandText
      }, { attempts: 2, timeoutMs: START_MESSAGE_TIMEOUT_MS });
      if (!response?.ok) throw new Error(response?.error || "Автоответ Pulse 2.0 не отправлен.");
      const outcome = response.outcome === "confirmed" ? "confirmed" : "submitted-unconfirmed";
      state = recordPulse2Dispatch(state, observation.fingerprint, outcome);
      await persistPulse2State(state);
    } else if (observation.decision === "rotate") {
      if (state.cycleNumber >= state.maxCycles) {
        state = completePulse2State(state);
        state = await configurePulse2Alarms(state);
        await persistPulse2State(state);
        return;
      }
      state = beginPulse2Rotation(state);
      state = await configurePulse2Alarms(state);
      await persistPulse2State(state);
      await queuePulse2Rotation();
      return;
    }
  } catch (error) {
    const latest = await loadPulse2State();
    if (latest.sessionId === expectedSessionId && latest.controlRevision === expectedRevision && latest.enabled) {
      state = {
        ...latest,
        lastError: error instanceof Error ? error.message : String(error),
        lastCheckAt: new Date().toISOString()
      };
      await persistPulse2State(state);
    }
  } finally {
    const latest = await loadPulse2State();
    if (latest.sessionId === expectedSessionId && latest.checkInProgress) {
      const finished = await configurePulse2Alarms({ ...latest, checkInProgress: false });
      await persistPulse2State(finished);
    }
  }
}

function queuePulse2Rotation() {
  const previous = activePulse2Rotation;
  const queued = (previous ? previous.catch(() => {}) : Promise.resolve())
    .then(() => performPulse2Rotation());
  let tracked = null;
  tracked = queued.finally(() => {
    if (activePulse2Rotation === tracked) activePulse2Rotation = null;
  });
  activePulse2Rotation = tracked;
  return tracked;
}

async function performPulse2Rotation() {
  let state = await loadPulse2State();
  if (!state.enabled || state.phase !== "rotating") return;
  const expectedSessionId = state.sessionId;
  const expectedRevision = state.controlRevision;

  try {
    let tab = null;
    if (Number.isInteger(state.tabId)) {
      try {
        tab = await chrome.tabs.get(state.tabId);
      } catch {
        tab = null;
      }
    }
    if (!tab?.id) {
      tab = await chrome.tabs.create({ url: state.projectUrl, active: false, pinned: false });
      if (!Number.isInteger(tab?.id)) throw new Error("Не удалось создать вкладку проекта для Pulse 2.0.");
      state = { ...state, tabId: tab.id };
      await persistPulse2State(state);
    } else {
      tab = await chrome.tabs.update(tab.id, { url: state.projectUrl, active: false });
    }

    await protectManagedTab(tab.id);
    await waitForTabComplete(tab.id, TAB_LOAD_TIMEOUT_MS);
    await delay(PROJECT_SETTLE_MS);

    const prepared = await sendToContent(tab.id, {
      type: "PULSE2_PREPARE_PROJECT_CHAT",
      projectUrl: state.projectUrl
    }, { attempts: 2, timeoutMs: PROJECT_PREPARE_TIMEOUT_MS });
    if (!prepared?.ok || prepared.ready !== true) {
      throw new Error(prepared?.error || "В проекте ChatGPT не найдено поле нового чата.");
    }

    const live = await loadPulse2State();
    assertPulse2ExecutionStillCurrent(live, {
      sessionId: expectedSessionId,
      controlRevision: expectedRevision,
      phase: "rotating"
    });

    const response = await sendToContent(tab.id, {
      type: "CHATPULSE_SEND",
      command: effectivePulse2StartMessage(live)
    }, { attempts: 2, timeoutMs: START_MESSAGE_TIMEOUT_MS });
    if (!response?.ok) throw new Error(response?.error || "Стартовое сообщение нового чата не отправлено.");

    state = markPulse2CaptureWait({ ...live, tabId: tab.id });
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  } catch (error) {
    const latest = await loadPulse2State();
    if (latest.sessionId !== expectedSessionId || latest.controlRevision !== expectedRevision) return;
    state = failPulse2State(latest, error);
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  }
}

async function handlePulse2CaptureAlarm() {
  let state = await loadPulse2State();
  if (!state.enabled || state.phase !== "capture-wait") return;

  const dueAt = Date.parse(String(state.captureDueAt || ""));
  if (Number.isFinite(dueAt) && dueAt > Date.now() + 500) {
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
    return;
  }

  try {
    if (!Number.isInteger(state.tabId)) throw new Error("Вкладка нового чата потеряна до захвата URL.");
    const tab = await chrome.tabs.get(state.tabId);
    const normalizedURL = normalizeChatURL(tab.url);
    let snapshot = null;
    if (normalizedURL && normalizedURL !== state.currentChatUrl) {
      snapshot = await inspectPulse2Tab(tab.id);
    }
    if (normalizedURL && normalizedURL !== state.currentChatUrl && snapshot?.authenticated && snapshot?.messageCount > 0) {
      await assertNoPulse1Collision(normalizedURL);
      state = capturePulse2Chat(state, normalizedURL, {
        title: snapshot.title || "",
        at: new Date().toISOString()
      });
      state = await configurePulse2Alarms(state);
      await persistPulse2State(state);
      return;
    }

    if (state.captureAttempts + 1 >= PULSE2_MAX_CAPTURE_ATTEMPTS) {
      throw new Error("Не удалось получить постоянную ссылку нового чата после двухминутной задержки и повторных проверок.");
    }
    state = retryPulse2Capture(state);
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  } catch (error) {
    if (state.captureAttempts + 1 < PULSE2_MAX_CAPTURE_ATTEMPTS && /content script|не ответ/i.test(String(error?.message || error))) {
      state = retryPulse2Capture(state);
      state = await configurePulse2Alarms(state);
      await persistPulse2State(state);
      return;
    }
    state = failPulse2State(state, error);
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  }
}

async function openPulse2CurrentChat() {
  let state = await loadPulse2State();
  let tab = null;
  if (Number.isInteger(state.tabId)) {
    try {
      tab = await chrome.tabs.get(state.tabId);
    } catch {
      tab = null;
    }
  }
  if (!tab?.id || normalizeChatURL(tab.url) !== state.currentChatUrl) {
    tab = await chrome.tabs.create({ url: state.currentChatUrl, active: true });
  } else {
    tab = await chrome.tabs.update(tab.id, { active: true });
  }
  if (Number.isInteger(tab?.windowId)) {
    try {
      await chrome.windows.update(tab.windowId, { focused: true });
    } catch {
      // Фокус окна — необязательное улучшение.
    }
  }
  state = { ...state, tabId: tab?.id ?? state.tabId };
  await persistPulse2State(state);
  return state;
}

async function stopPulse2OnPulse1Collision() {
  const state = await loadPulse2State();
  if (!state.enabled || !state.currentChatUrl) return;
  try {
    await assertNoPulse1Collision(state.currentChatUrl);
  } catch (error) {
    let failed = failPulse2State(state, error);
    failed = await configurePulse2Alarms(failed);
    await persistPulse2State(failed);
  }
}

async function assertNoPulse1Collision(chatUrl) {
  const normalized = normalizeChatURL(chatUrl);
  if (!normalized) return;
  const stored = await chrome.storage.local.get(PULSE1_STORAGE_KEY);
  const pulse1 = stored[PULSE1_STORAGE_KEY];
  if (pulse1?.enabled === true && Array.isArray(pulse1?.chats)) {
    const conflict = pulse1.chats.some((chat) => chat?.enabled !== false && normalizeChatURL(chat?.url) === normalized);
    if (conflict) {
      throw new Error("Этот чат сейчас активен в Pulse 1.0. Отключите его там или выберите другой исходный чат, чтобы два автономных engine не управляли одной вкладкой.");
    }
  }
}

function assertPulse2ExecutionStillCurrent(state, expected) {
  if (!state.enabled) throw new Error("Pulse 2.0 был остановлен во время операции.");
  if (expected.sessionId && state.sessionId !== expected.sessionId) throw new Error("Сессия Pulse 2.0 изменилась.");
  if (Number.isInteger(expected.controlRevision) && state.controlRevision !== expected.controlRevision) {
    throw new Error("Настройки Pulse 2.0 изменились во время операции.");
  }
  if (expected.currentChatUrl && state.currentChatUrl !== expected.currentChatUrl) {
    throw new Error("Текущий чат Pulse 2.0 изменился во время операции.");
  }
  if (expected.phase && state.phase !== expected.phase) throw new Error("Фаза Pulse 2.0 изменилась во время операции.");
}

async function ensurePulse2ChatTab(state) {
  if (Number.isInteger(state.tabId)) {
    try {
      const tab = await chrome.tabs.get(state.tabId);
      if (normalizeChatURL(tab.url) === state.currentChatUrl) {
        await protectManagedTab(tab.id);
        return tab;
      }
    } catch {
      // Вкладка могла быть закрыта пользователем.
    }
  }
  const tab = await chrome.tabs.create({ url: state.currentChatUrl, active: false, pinned: false });
  if (!Number.isInteger(tab?.id)) throw new Error("Не удалось создать автономную вкладку Pulse 2.0.");
  await protectManagedTab(tab.id);
  return tab;
}

async function inspectPulse2Tab(tabId) {
  const response = await sendToContent(tabId, { type: "CHATPULSE_INSPECT" }, {
    attempts: 2,
    timeoutMs: CONTENT_TIMEOUT_MS
  });
  if (!response?.ok || !response.snapshot) {
    throw new Error(response?.error || "Не удалось прочитать состояние страницы ChatGPT.");
  }
  return response.snapshot;
}

async function sendToContent(tabId, message, { attempts = 2, timeoutMs = CONTENT_TIMEOUT_MS } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await withTimeout(
        chrome.tabs.sendMessage(tabId, message),
        timeoutMs,
        "content script Pulse 2.0 не ответил вовремя"
      );
      if (response) return response;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content/content-script.js", "content/pulse2-content.js"]
          });
        } catch {
          // Повтор ниже вернёт исходную ошибку понятным текстом.
        }
      }
    }
    await delay(300);
  }
  throw new Error(`Не удалось связаться со страницей ChatGPT: ${lastError?.message || "content script недоступен"}`);
}

async function protectManagedTab(tabId) {
  try {
    await chrome.tabs.update(tabId, { autoDiscardable: false });
  } catch {
    // Pulse 2.0 всё равно сможет восстановить вкладку на следующей проверке.
  }
}

async function waitForTabComplete(tabId, timeoutMs) {
  const current = await chrome.tabs.get(tabId);
  if (current.status === "complete" && current.discarded !== true) return current;
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => finish(new Error("Вкладка ChatGPT не загрузилась за 45 секунд.")), timeoutMs);
    const onUpdated = (updatedTabId, changeInfo, updatedTab) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") finish(null, updatedTab);
    };
    const onRemoved = (removedTabId) => {
      if (removedTabId === tabId) finish(new Error("Автономная вкладка Pulse 2.0 была закрыта во время операции."));
    };
    function finish(error, tab) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      error ? reject(error) : resolve(tab);
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
  });
}

async function configurePulse2Alarms(state) {
  const current = normalizePulse2State(state);
  if (!current.enabled) {
    await clearAlarm(PULSE2_ALARM_NAME);
    await clearAlarm(PULSE2_CAPTURE_ALARM_NAME);
    return { ...current, nextCheckAt: null, captureDueAt: null };
  }

  if (current.phase === "monitoring") {
    await clearAlarm(PULSE2_CAPTURE_ALARM_NAME);
    const existing = await chrome.alarms.get(PULSE2_ALARM_NAME);
    if (!existing || Number(existing.periodInMinutes) !== Number(current.intervalMinutes)) {
      if (existing) await chrome.alarms.clear(PULSE2_ALARM_NAME);
      await chrome.alarms.create(PULSE2_ALARM_NAME, {
        delayInMinutes: current.intervalMinutes,
        periodInMinutes: current.intervalMinutes
      });
    }
    const alarm = await chrome.alarms.get(PULSE2_ALARM_NAME);
    const scheduled = Number(alarm?.scheduledTime);
    return {
      ...current,
      nextCheckAt: Number.isFinite(scheduled) ? new Date(scheduled).toISOString() : current.nextCheckAt
    };
  }

  await clearAlarm(PULSE2_ALARM_NAME);
  if (current.phase === "capture-wait") {
    const dueAt = Date.parse(String(current.captureDueAt || ""));
    const when = Number.isFinite(dueAt) ? Math.max(Date.now() + 1_000, dueAt) : Date.now() + PULSE2_CAPTURE_RETRY_MS;
    await clearAlarm(PULSE2_CAPTURE_ALARM_NAME);
    await chrome.alarms.create(PULSE2_CAPTURE_ALARM_NAME, { when });
    return { ...current, captureDueAt: new Date(when).toISOString(), nextCheckAt: null };
  }

  await clearAlarm(PULSE2_CAPTURE_ALARM_NAME);
  return { ...current, nextCheckAt: null };
}

async function clearAlarm(name) {
  const existing = await chrome.alarms.get(name);
  if (existing) await chrome.alarms.clear(name);
}

async function loadPulse2State() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return normalizePulse2State(stored[STORAGE_KEY] || defaultPulse2State());
}

async function persistPulse2State(state) {
  const normalized = normalizePulse2State(state);
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
  broadcastState(normalized);
  return normalized;
}

function broadcastState(state) {
  for (const port of [...ports]) safePost(port, { kind: "state", state });
}

function safePost(port, message) {
  try {
    port.postMessage(message);
  } catch {
    ports.delete(port);
  }
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
