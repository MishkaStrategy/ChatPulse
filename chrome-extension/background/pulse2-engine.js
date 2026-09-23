import { normalizeChatURL } from "../lib/model-v2.js";
import {
  PULSE2_CAPTURE_RETRY_MS,
  PULSE2_MAX_CAPTURE_ATTEMPTS,
  PULSE2_MONITOR_ERROR_RETRY_MS,
  applyPulse2SettingsPatch,
  beginPulse2Rotation,
  capturePulse2Chat,
  completePulse2Route,
  defaultPulse2State,
  effectivePulse2StartMessage,
  failPulse2Route,
  getPulse2Route,
  isPulse2RouteTerminal,
  markPulse2CaptureWait,
  normalizePulse2ProjectURL,
  normalizePulse2State,
  observePulse2Snapshot,
  recordPulse2Dispatch,
  replacePulse2Route,
  retryPulse2Capture,
  settlePulse2Global,
  startPulse2State,
  stopPulse2State
} from "../lib/pulse2-model.js";

export const PULSE2_PORT_NAME = "chatpulse-pulse2";
export const PULSE2_ALARM_NAME = "chatpulse-pulse2-monitor";
export const PULSE2_CAPTURE_ALARM_NAME = "chatpulse-pulse2-capture";
export const PULSE2_ROTATION_ALARM_NAME = "chatpulse-pulse2-rotation";

const STORAGE_KEY = "chatpulse2State";
const PULSE1_STORAGE_KEY = "chatpulseState";
const TAB_LOAD_TIMEOUT_MS = 45_000;
const CONTENT_TIMEOUT_MS = 6_000;
const PROJECT_PREPARE_TIMEOUT_MS = 15_000;
const START_MESSAGE_TIMEOUT_MS = 20_000;
const PROJECT_SETTLE_MS = 1_000;
const CHAT_MONITOR_SETTLE_MS = 1_000;
const CHAT_HYDRATION_TIMEOUT_MS = 8_000;
const CHAT_HYDRATION_RETRY_MS = 500;
const MONITOR_ALARM_PERIOD_MINUTES = 0.5;
const ROTATION_RECOVERY_PERIOD_MINUTES = 0.5;

const ports = new Set();
let engineQueue = Promise.resolve();

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
  if (alarm.name === PULSE2_ALARM_NAME) void enqueueEngineOperation(() => performPulse2Sweep("alarm"));
  if (alarm.name === PULSE2_CAPTURE_ALARM_NAME) void enqueueEngineOperation(() => performPulse2CaptureSweep());
  if (alarm.name === PULSE2_ROTATION_ALARM_NAME) void enqueueEngineOperation(() => performPulse2RotationSweep());
});

chrome.runtime.onInstalled.addListener(() => {
  void enqueueEngineOperation(() => resumePulse2());
});

chrome.runtime.onStartup.addListener(() => {
  void enqueueEngineOperation(() => resumePulse2());
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[PULSE1_STORAGE_KEY]) return;
  void enqueueEngineOperation(() => stopPulse2RoutesOnPulse1Collision());
});

async function handlePortRequest(port, message) {
  const requestId = message?.requestId;
  if (!requestId) return;
  try {
    const result = message?.type === "GET_STATE"
      ? { state: await loadPulse2State() }
      : await enqueueEngineOperation(() => handlePulse2Action(message?.type, message || {}));
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
    case "UPDATE_SETTINGS": {
      const current = await loadPulse2State();
      const next = applyPulse2SettingsPatch(current, message.patch || {});
      await persistPulse2State(next);
      return { state: next };
    }

    case "GET_ACTIVE_CHAT_URL": {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const url = normalizeChatURL(tab?.url);
      if (!url) throw new Error("Откройте конкретный чат ChatGPT и повторите.");
      return { state: await loadPulse2State(), url };
    }

    case "USE_CURRENT_CHAT": {
      let state = await loadPulse2State();
      if (state.enabled) throw new Error("Остановите Pulse 2.0 перед сменой исходного чата.");
      const route = requireRoute(state, message.routeId);
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const url = normalizeChatURL(tab?.url);
      if (!url) throw new Error("Откройте конкретный чат ChatGPT и повторите.");
      state = applyPulse2SettingsPatch(state, {
        routes: state.routes.map((item) => item.id === route.id ? { ...item, currentChatUrl: url } : item)
      });
      await persistPulse2State(state);
      return { state };
    }

    case "START": {
      const state = await startPulse2();
      queueFollowUpWork(state);
      return { state };
    }

    case "STOP":
      return { state: await stopPulse2("manual") };

    case "CHECK_NOW": {
      const state = await performPulse2Sweep("manual", message.routeId || null);
      return { state };
    }

    case "OPEN_CURRENT_CHAT":
      return { state: await openPulse2CurrentChat(message.routeId) };

    default:
      throw new Error("Неизвестная команда Pulse 2.0.");
  }
}

async function resumePulse2() {
  let state = await loadPulse2State();
  state = normalizePulse2State({
    ...state,
    routes: state.routes.map((route) => ({ ...route, checkInProgress: false }))
  });
  state = settlePulse2Global(state);
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  if (state.enabled) queueFollowUpWork(state);
  return state;
}

async function startPulse2() {
  let state = await loadPulse2State();
  if (state.enabled) return state;
  await assertNoPulse1Collisions(state.routes.map((route) => route.currentChatUrl).filter(Boolean));

  const tabIds = {};
  const createdTabIds = [];
  try {
    for (const route of state.routes) {
      if (!route.projectUrl) throw new Error(`Укажите ссылку проекта для «${route.name}».`);
      const targetUrl = route.currentChatUrl || route.projectUrl;
      let tab = await reusablePulse2RouteTab(route, targetUrl);
      if (!tab?.id) {
        tab = await chrome.tabs.create({
          url: targetUrl,
          active: !route.currentChatUrl,
          pinned: false
        });
        if (!Number.isInteger(tab?.id)) throw new Error(`Chrome не вернул вкладку для «${route.name}».`);
        createdTabIds.push(tab.id);
      } else if (!route.currentChatUrl) {
        tab = await activatePulse2ManagedTab(tab.id);
      }
      tabIds[route.id] = tab.id;
      await protectManagedTab(tab.id);
    }
    state = startPulse2State(state, { tabIds });
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
    return state;
  } catch (error) {
    for (const tabId of createdTabIds) {
      try { await chrome.tabs.remove(tabId); } catch { /* best effort cleanup */ }
    }
    throw error;
  }
}

async function stopPulse2(reason) {
  let state = await loadPulse2State();
  state = stopPulse2State(state, reason);
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  return state;
}

function queueFollowUpWork(state) {
  if (!state?.enabled) return;
  const hasMonitoring = state.routes.some((route) => route.phase === "monitoring");
  const rotatingIds = state.routes.filter((route) => route.phase === "rotating").map((route) => route.id);
  if (hasMonitoring) void enqueueEngineOperation(() => performPulse2Sweep("start"));
  for (const routeId of rotatingIds) {
    void enqueueEngineOperation(() => performPulse2Rotation(routeId));
  }
}

async function performPulse2Sweep(source, onlyRouteId = null) {
  let state = await loadPulse2State();
  if (!state.enabled) return state;
  const routeIds = state.routes
    .filter((route) => route.phase === "monitoring" && (!onlyRouteId || route.id === onlyRouteId))
    .filter((route) => {
      if (source !== "alarm") return true;
      const nextAt = Date.parse(String(route.nextCheckAt || ""));
      return !Number.isFinite(nextAt) || nextAt <= Date.now() + 1_000;
    })
    .map((route) => route.id);

  for (const routeId of routeIds) {
    await performPulse2RouteCheck(routeId);
  }
  state = await loadPulse2State();
  state = settlePulse2Global(state);
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  return state;
}

async function performPulse2RouteCheck(routeId) {
  let state = await loadPulse2State();
  let route = getPulse2Route(state, routeId);
  if (!state.enabled || !route || route.phase !== "monitoring") return;
  const expectedSessionId = state.sessionId;
  const expectedRevision = state.controlRevision;
  let previousFocus = null;
  let managedTabId = null;
  let keepManagedTabActive = false;

  route = { ...route, checkInProgress: true, lastError: null };
  state = replacePulse2Route(state, routeId, route);
  await persistPulse2State(state);

  try {
    let tab = await ensurePulse2ChatTab(state, routeId);
    managedTabId = tab.id;
    previousFocus = await capturePulse2PreviousFocus(tab.id);
    tab = await activatePulse2ManagedTab(tab.id);

    state = await loadPulse2State();
    route = requireRoute(state, routeId);
    if (tab.id !== route.tabId) {
      state = replacePulse2Route(state, routeId, { ...route, tabId: tab.id });
      await persistPulse2State(state);
    }

    await protectManagedTab(tab.id);
    await waitForTabComplete(tab.id, TAB_LOAD_TIMEOUT_MS, route.currentChatUrl);
    await delay(CHAT_MONITOR_SETTLE_MS);
    let snapshot = await inspectPulse2TabAfterHydration(tab.id);
    state = await loadPulse2State();
    assertPulse2ExecutionStillCurrent(state, routeId, { expectedSessionId, expectedRevision, phase: "monitoring" });
    let observation = observePulse2Snapshot(state, routeId, snapshot);
    state = observation.state;
    await persistPulse2State(state);

    if (["send-auto-response", "rotate"].includes(observation.decision)) {
      state = await loadPulse2State();
      route = assertPulse2ExecutionStillCurrent(state, routeId, { expectedSessionId, expectedRevision, phase: "monitoring" });
      tab = await ensurePulse2ChatTab(state, routeId);
      managedTabId = tab.id;
      tab = await activatePulse2ManagedTab(tab.id);
      await waitForTabComplete(tab.id, TAB_LOAD_TIMEOUT_MS, route.currentChatUrl);
      await delay(CHAT_MONITOR_SETTLE_MS);
      snapshot = await inspectPulse2TabAfterHydration(tab.id);
      observation = observePulse2Snapshot(state, routeId, snapshot);
      state = observation.state;
      await persistPulse2State(state);
    }

    if (observation.decision === "send-auto-response") {
      state = await loadPulse2State();
      route = assertPulse2ExecutionStillCurrent(state, routeId, { expectedSessionId, expectedRevision, phase: "monitoring" });
      await assertNoPulse1Collision(route.currentChatUrl);
      const response = await sendToContent(route.tabId, {
        type: "CHATPULSE_SEND",
        command: state.commandText
      }, { attempts: 2, timeoutMs: START_MESSAGE_TIMEOUT_MS });
      if (!response?.ok) throw new Error(response?.error || "Автоответ Pulse 2.0 не отправлен.");
      const outcome = response.outcome === "confirmed" ? "confirmed" : "submitted-unconfirmed";
      state = recordPulse2Dispatch(state, routeId, observation.fingerprint, outcome);
      await persistPulse2State(state);
    } else if (observation.decision === "rotate") {
      state = await loadPulse2State();
      route = assertPulse2ExecutionStillCurrent(state, routeId, { expectedSessionId, expectedRevision, phase: "monitoring" });
      if (route.cycleNumber >= state.maxCycles) {
        state = completePulse2Route(state, routeId);
        state = await configurePulse2Alarms(state);
        await persistPulse2State(state);
        return;
      }
      keepManagedTabActive = true;
      state = beginPulse2Rotation(state, routeId);
      state = await configurePulse2Alarms(state);
      await persistPulse2State(state);
      await performPulse2Rotation(routeId);
      return;
    }
  } catch (error) {
    const latest = await loadPulse2State();
    const latestRoute = getPulse2Route(latest, routeId);
    if (latest.enabled && latestRoute && latest.sessionId === expectedSessionId && latest.controlRevision === expectedRevision) {
      state = replacePulse2Route(latest, routeId, {
        ...latestRoute,
        lastError: error instanceof Error ? error.message : String(error),
        lastCheckAt: new Date().toISOString(),
        nextCheckAt: new Date(Date.now() + PULSE2_MONITOR_ERROR_RETRY_MS).toISOString()
      });
      await persistPulse2State(state);
    }
  } finally {
    const latest = await loadPulse2State();
    const latestRoute = getPulse2Route(latest, routeId);
    if (latestRoute?.checkInProgress && latest.sessionId === expectedSessionId) {
      state = replacePulse2Route(latest, routeId, { ...latestRoute, checkInProgress: false });
      state = await configurePulse2Alarms(state);
      await persistPulse2State(state);
    }
    if (!keepManagedTabActive && Number.isInteger(managedTabId)) {
      await restorePulse2PreviousFocus(previousFocus, managedTabId);
    }
  }
}

async function performPulse2RotationSweep() {
  let state = await loadPulse2State();
  if (!state.enabled) return state;
  const routeIds = state.routes
    .filter((route) => route.phase === "rotating")
    .map((route) => route.id);

  for (const routeId of routeIds) {
    await performPulse2Rotation(routeId);
  }

  state = await loadPulse2State();
  state = settlePulse2Global(state);
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  return state;
}

async function performPulse2Rotation(routeId) {
  let state = await loadPulse2State();
  let route = getPulse2Route(state, routeId);
  if (!state.enabled || !route || route.phase !== "rotating") return;
  const expectedSessionId = state.sessionId;
  const expectedRevision = state.controlRevision;

  route = {
    ...route,
    lastCheckAt: new Date().toISOString(),
    lastError: null
  };
  state = replacePulse2Route(state, routeId, route);
  await persistPulse2State(state);

  try {
    let tab = null;
    if (Number.isInteger(route.tabId)) {
      try { tab = await chrome.tabs.get(route.tabId); } catch { tab = null; }
    }

    if (tab?.id) {
      tab = await activatePulse2ManagedTab(tab.id);
      if (await recoverPulse2RotationAfterDispatch(state, routeId, tab, {
        expectedSessionId,
        expectedRevision
      })) {
        return;
      }
    }

    if (!tab?.id) {
      tab = await chrome.tabs.create({ url: route.projectUrl, active: true, pinned: false });
      if (!Number.isInteger(tab?.id)) throw new Error(`Не удалось создать вкладку проекта «${route.name}».`);
      state = replacePulse2Route(state, routeId, { ...route, tabId: tab.id });
      await persistPulse2State(state);
    } else if (normalizePulse2ProjectURL(tab.url) !== route.projectUrl) {
      tab = await chrome.tabs.update(tab.id, { url: route.projectUrl, active: true });
    } else {
      tab = await chrome.tabs.update(tab.id, { active: true });
    }

    tab = await activatePulse2ManagedTab(tab.id);
    await protectManagedTab(tab.id);
    await waitForTabComplete(tab.id, TAB_LOAD_TIMEOUT_MS, route.projectUrl);
    await delay(PROJECT_SETTLE_MS);

    const prepared = await sendToContent(tab.id, {
      type: "PULSE2_PREPARE_PROJECT_CHAT",
      projectUrl: route.projectUrl
    }, { attempts: 2, timeoutMs: PROJECT_PREPARE_TIMEOUT_MS });
    if (!prepared?.ok || prepared.ready !== true) {
      throw new Error(prepared?.error || "В проекте ChatGPT не найдено поле нового чата.");
    }

    state = await loadPulse2State();
    route = assertPulse2ExecutionStillCurrent(state, routeId, { expectedSessionId, expectedRevision, phase: "rotating" });
    const response = await sendToContent(tab.id, {
      type: "CHATPULSE_SEND",
      command: effectivePulse2StartMessage(state)
    }, { attempts: 2, timeoutMs: START_MESSAGE_TIMEOUT_MS });
    if (!response?.ok) throw new Error(response?.error || "Стартовое сообщение нового чата не отправлено.");

    state = markPulse2CaptureWait(state, routeId);
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  } catch (error) {
    const latest = await loadPulse2State();
    if (latest.sessionId !== expectedSessionId || latest.controlRevision !== expectedRevision || !getPulse2Route(latest, routeId)) return;
    state = failPulse2Route(latest, routeId, error);
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  }
}

async function recoverPulse2RotationAfterDispatch(state, routeId, tab, expected) {
  const route = assertPulse2ExecutionStillCurrent(state, routeId, {
    ...expected,
    phase: "rotating"
  });
  const concreteChatUrl = normalizeChatURL(tab?.url);
  if (!concreteChatUrl
    || concreteChatUrl === route.currentChatUrl
    || !pulse2ChatBelongsToProject(concreteChatUrl, route.projectUrl)) {
    return false;
  }

  let next = markPulse2CaptureWait(state, routeId);
  next = replacePulse2Route(next, routeId, {
    ...requireRoute(next, routeId),
    lastError: null
  });
  next = await configurePulse2Alarms(next);
  await persistPulse2State(next);
  return true;
}

async function performPulse2CaptureSweep() {
  let state = await loadPulse2State();
  if (!state.enabled) return state;
  const now = Date.now();
  const routeIds = state.routes.filter((route) => {
    if (route.phase !== "capture-wait") return false;
    const dueAt = Date.parse(String(route.captureDueAt || ""));
    return !Number.isFinite(dueAt) || dueAt <= now + 500;
  }).map((route) => route.id);

  for (const routeId of routeIds) await performPulse2Capture(routeId);
  state = await loadPulse2State();
  state = settlePulse2Global(state);
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  return state;
}

async function performPulse2Capture(routeId) {
  let state = await loadPulse2State();
  let route = getPulse2Route(state, routeId);
  if (!state.enabled || !route || route.phase !== "capture-wait") return;
  try {
    if (!Number.isInteger(route.tabId)) throw new Error("Вкладка нового чата потеряна до захвата URL.");
    const tab = await chrome.tabs.get(route.tabId);
    const normalizedURL = normalizeChatURL(tab.url);
    const changed = Boolean(normalizedURL) && (!route.currentChatUrl || normalizedURL !== route.currentChatUrl);
    let snapshot = null;
    if (changed) snapshot = await inspectPulse2TabAfterHydration(tab.id);
    if (changed && snapshot?.authenticated && snapshot?.messageCount > 0) {
      await assertNoPulse1Collision(normalizedURL);
      state = capturePulse2Chat(state, routeId, normalizedURL, {
        title: snapshot.title || "",
        at: new Date().toISOString()
      });
      state = await configurePulse2Alarms(state);
      await persistPulse2State(state);
      return;
    }

    route = requireRoute(state, routeId);
    if (route.captureAttempts + 1 >= PULSE2_MAX_CAPTURE_ATTEMPTS) {
      throw new Error("Не удалось получить постоянную ссылку нового чата после двухминутной задержки и повторных проверок.");
    }
    state = retryPulse2Capture(state, routeId);
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  } catch (error) {
    state = await loadPulse2State();
    route = getPulse2Route(state, routeId);
    if (!route) return;
    if (route.captureAttempts + 1 < PULSE2_MAX_CAPTURE_ATTEMPTS && /content script|не ответ/i.test(String(error?.message || error))) {
      state = retryPulse2Capture(state, routeId);
    } else {
      state = failPulse2Route(state, routeId, error);
    }
    state = await configurePulse2Alarms(state);
    await persistPulse2State(state);
  }
}

async function openPulse2CurrentChat(routeId) {
  let state = await loadPulse2State();
  let route = requireRoute(state, routeId);
  if (!route.currentChatUrl) throw new Error("Этот маршрут ещё не получил постоянную ссылку текущего чата.");
  if (state.enabled && route.phase !== "monitoring") {
    throw new Error("Дождитесь завершения создания нового чата перед открытием текущего чата.");
  }
  let tab = null;
  if (Number.isInteger(route.tabId)) {
    try { tab = await chrome.tabs.get(route.tabId); } catch { tab = null; }
  }
  if (!tab?.id || normalizeChatURL(tab.url) !== route.currentChatUrl) {
    tab = await chrome.tabs.create({ url: route.currentChatUrl, active: true });
  } else {
    tab = await chrome.tabs.update(tab.id, { active: true });
  }
  if (Number.isInteger(tab?.windowId)) {
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch { /* optional */ }
  }
  if (Number.isInteger(tab?.id)) await protectManagedTab(tab.id);
  route = { ...route, tabId: tab?.id ?? route.tabId };
  state = replacePulse2Route(state, routeId, route);
  await persistPulse2State(state);
  return state;
}

async function stopPulse2RoutesOnPulse1Collision() {
  let state = await loadPulse2State();
  if (!state.enabled) return state;
  for (const route of state.routes) {
    if (!route.currentChatUrl || isPulse2RouteTerminal(route)) continue;
    try {
      await assertNoPulse1Collision(route.currentChatUrl);
    } catch (error) {
      state = failPulse2Route(state, route.id, error);
    }
  }
  state = await configurePulse2Alarms(state);
  await persistPulse2State(state);
  return state;
}

async function assertNoPulse1Collisions(chatUrls) {
  for (const url of chatUrls) await assertNoPulse1Collision(url);
}

async function assertNoPulse1Collision(chatUrl) {
  const normalized = normalizeChatURL(chatUrl);
  if (!normalized) return;
  const stored = await chrome.storage.local.get(PULSE1_STORAGE_KEY);
  const pulse1 = stored[PULSE1_STORAGE_KEY];
  if (pulse1?.enabled === true && Array.isArray(pulse1?.chats)) {
    const conflict = pulse1.chats.some((chat) => chat?.enabled !== false && normalizeChatURL(chat?.url) === normalized);
    if (conflict) throw new Error("Этот чат сейчас активен в Pulse 1.0. Отключите его там или выберите другой чат.");
  }
}

function assertPulse2ExecutionStillCurrent(state, routeId, expected) {
  if (!state.enabled) throw new Error("Pulse 2.0 был остановлен во время операции.");
  if (expected.expectedSessionId && state.sessionId !== expected.expectedSessionId) throw new Error("Сессия Pulse 2.0 изменилась.");
  if (Number.isInteger(expected.expectedRevision) && state.controlRevision !== expected.expectedRevision) {
    throw new Error("Настройки Pulse 2.0 изменились во время операции.");
  }
  const route = requireRoute(state, routeId);
  if (expected.phase && route.phase !== expected.phase) throw new Error(`Фаза маршрута «${route.name}» изменилась во время операции.`);
  return route;
}

function pulse2ChatBelongsToProject(chatUrl, projectUrl) {
  const chat = safePulse2URL(chatUrl);
  const project = safePulse2URL(projectUrl);
  if (!chat || !project) return false;
  const chatKey = pulse2ProjectKey(chat.pathname);
  const projectKey = pulse2ProjectKey(project.pathname);
  return Boolean(chatKey && projectKey && chatKey === projectKey);
}

function pulse2ProjectKey(pathname) {
  const parts = String(pathname || "").split("/").filter(Boolean);
  const explicit = parts.find((part) => /^g-p-[a-z0-9_-]+$/i.test(part));
  if (explicit) return explicit.toLowerCase();
  const projectIndex = parts.findIndex((part) => /^projects?$/i.test(part));
  return projectIndex >= 0 && parts[projectIndex + 1]
    ? parts[projectIndex + 1].toLowerCase()
    : null;
}

function safePulse2URL(value) {
  try {
    return new URL(String(value || ""));
  } catch {
    return null;
  }
}

async function reusablePulse2RouteTab(route, targetUrl) {
  if (!Number.isInteger(route?.tabId)) return null;
  try {
    const tab = await chrome.tabs.get(route.tabId);
    const matches = route.currentChatUrl
      ? normalizeChatURL(tab?.url) === normalizeChatURL(targetUrl)
      : normalizePulse2ProjectURL(tab?.url) === normalizePulse2ProjectURL(targetUrl);
    return matches ? tab : null;
  } catch {
    return null;
  }
}

async function ensurePulse2ChatTab(state, routeId) {
  const route = requireRoute(state, routeId);
  if (!route.currentChatUrl) throw new Error(`Маршрут «${route.name}» ещё не имеет текущего чата.`);
  if (Number.isInteger(route.tabId)) {
    try {
      const tab = await chrome.tabs.get(route.tabId);
      if (normalizeChatURL(tab.url) === route.currentChatUrl) {
        await protectManagedTab(tab.id);
        return tab;
      }
    } catch { /* closed by user */ }
  }
  const tab = await chrome.tabs.create({ url: route.currentChatUrl, active: false, pinned: false });
  if (!Number.isInteger(tab?.id)) throw new Error(`Не удалось создать автономную вкладку для «${route.name}».`);
  await protectManagedTab(tab.id);
  return tab;
}

async function inspectPulse2Tab(tabId) {
  const response = await sendToContent(tabId, { type: "CHATPULSE_INSPECT" }, {
    attempts: 2,
    timeoutMs: CONTENT_TIMEOUT_MS
  });
  if (!response?.ok || !response.snapshot) throw new Error(response?.error || "Не удалось прочитать состояние страницы ChatGPT.");
  return response.snapshot;
}

async function inspectPulse2TabAfterHydration(tabId) {
  const startedAt = Date.now();
  let lastSnapshot = null;
  let lastError = null;
  while (Date.now() - startedAt < CHAT_HYDRATION_TIMEOUT_MS) {
    try {
      lastSnapshot = await inspectPulse2Tab(tabId);
      lastError = null;
      if (lastSnapshot?.authenticated || lastSnapshot?.errorDetected) return lastSnapshot;
    } catch (error) {
      lastError = error;
    }
    await delay(CHAT_HYDRATION_RETRY_MS);
  }
  if (lastSnapshot) return lastSnapshot;
  if (lastError) throw lastError;
  throw new Error("Страница ChatGPT не завершила гидратацию интерфейса.");
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
        } catch { /* retry below */ }
      }
    }
    await delay(300);
  }
  throw new Error(`Не удалось связаться со страницей ChatGPT: ${lastError?.message || "content script недоступен"}`);
}

async function capturePulse2PreviousFocus(managedTabId) {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!Number.isInteger(activeTab?.id) || activeTab.id === managedTabId) return null;
    return {
      tabId: activeTab.id,
      windowId: Number.isInteger(activeTab.windowId) ? activeTab.windowId : null
    };
  } catch {
    return null;
  }
}

async function restorePulse2PreviousFocus(previousFocus, managedTabId) {
  if (!Number.isInteger(previousFocus?.tabId)) return;
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (activeTab?.id !== managedTabId) return;
    const previousTab = await chrome.tabs.get(previousFocus.tabId);
    await chrome.tabs.update(previousTab.id, { active: true });
    if (Number.isInteger(previousTab.windowId)) {
      try { await chrome.windows.update(previousTab.windowId, { focused: true }); } catch { /* best effort restore */ }
    }
  } catch {
    /* user may have closed or moved the previous tab */
  }
}

async function activatePulse2ManagedTab(tabId) {
  const tab = await chrome.tabs.update(tabId, { active: true });
  if (Number.isInteger(tab?.windowId)) {
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch { /* tab activation is the required fallback */ }
  }
  return tab;
}

async function protectManagedTab(tabId) {
  try { await chrome.tabs.update(tabId, { autoDiscardable: false }); } catch { /* recover later */ }
}

async function waitForTabComplete(tabId, timeoutMs, expectedUrl = null) {
  const current = await chrome.tabs.get(tabId);
  if (pulse2TabReadyForTarget(current, expectedUrl)) return current;
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => finish(new Error("Вкладка ChatGPT не загрузила ожидаемый адрес за 45 секунд.")), timeoutMs);
    const onUpdated = async (updatedTabId, changeInfo, updatedTab) => {
      if (updatedTabId !== tabId) return;
      const candidate = changeInfo.status === "complete" ? updatedTab : await chrome.tabs.get(tabId).catch(() => null);
      if (pulse2TabReadyForTarget(candidate, expectedUrl)) finish(null, candidate);
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

    // Close the gap between the pre-listener read and listener registration.
    void chrome.tabs.get(tabId).then((tab) => {
      if (pulse2TabReadyForTarget(tab, expectedUrl)) finish(null, tab);
    }).catch(() => {
      finish(new Error("Автономная вкладка Pulse 2.0 была закрыта во время операции."));
    });
  });
}

function pulse2TabReadyForTarget(tab, expectedUrl) {
  if (!tab || tab.status !== "complete" || tab.discarded === true) return false;
  if (!expectedUrl) return true;
  const expectedChat = normalizeChatURL(expectedUrl);
  if (expectedChat) return normalizeChatURL(tab.url) === expectedChat;
  const expectedProject = normalizePulse2ProjectURL(expectedUrl);
  if (expectedProject) return normalizePulse2ProjectURL(tab.url) === expectedProject;
  return String(tab.url || "") === String(expectedUrl || "");
}

async function configurePulse2Alarms(state) {
  let current = normalizePulse2State(state);
  if (!current.enabled) {
    await clearAlarm(PULSE2_ALARM_NAME);
    await clearAlarm(PULSE2_CAPTURE_ALARM_NAME);
    await clearAlarm(PULSE2_ROTATION_ALARM_NAME);
    return current;
  }

  const hasMonitoring = current.routes.some((route) => route.phase === "monitoring");
  if (hasMonitoring) {
    const existing = await chrome.alarms.get(PULSE2_ALARM_NAME);
    if (!existing || Number(existing.periodInMinutes) !== MONITOR_ALARM_PERIOD_MINUTES) {
      if (existing) await chrome.alarms.clear(PULSE2_ALARM_NAME);
      await chrome.alarms.create(PULSE2_ALARM_NAME, {
        delayInMinutes: MONITOR_ALARM_PERIOD_MINUTES,
        periodInMinutes: MONITOR_ALARM_PERIOD_MINUTES
      });
    }
  } else {
    await clearAlarm(PULSE2_ALARM_NAME);
  }

  const hasRotating = current.routes.some((route) => route.phase === "rotating");
  if (hasRotating) {
    const existing = await chrome.alarms.get(PULSE2_ROTATION_ALARM_NAME);
    if (!existing || Number(existing.periodInMinutes) !== ROTATION_RECOVERY_PERIOD_MINUTES) {
      if (existing) await chrome.alarms.clear(PULSE2_ROTATION_ALARM_NAME);
      await chrome.alarms.create(PULSE2_ROTATION_ALARM_NAME, {
        delayInMinutes: ROTATION_RECOVERY_PERIOD_MINUTES,
        periodInMinutes: ROTATION_RECOVERY_PERIOD_MINUTES
      });
    }
  } else {
    await clearAlarm(PULSE2_ROTATION_ALARM_NAME);
  }

  const dueTimes = current.routes
    .filter((route) => route.phase === "capture-wait")
    .map((route) => Date.parse(String(route.captureDueAt || "")))
    .filter(Number.isFinite);
  if (dueTimes.length) {
    const when = Math.max(Date.now() + 1_000, Math.min(...dueTimes));
    await clearAlarm(PULSE2_CAPTURE_ALARM_NAME);
    await chrome.alarms.create(PULSE2_CAPTURE_ALARM_NAME, { when });
  } else {
    await clearAlarm(PULSE2_CAPTURE_ALARM_NAME);
  }
  return current;
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

function requireRoute(state, routeId) {
  const route = getPulse2Route(state, routeId);
  if (!route) throw new Error("Маршрут Pulse 2.0 не найден.");
  return route;
}

function enqueueEngineOperation(work) {
  const next = engineQueue.catch(() => {}).then(work);
  engineQueue = next.catch(() => {});
  return next;
}

function broadcastState(state) {
  for (const port of [...ports]) safePost(port, { kind: "state", state });
}

function safePost(port, message) {
  try { port.postMessage(message); } catch { ports.delete(port); }
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timeout); resolve(value); },
      (error) => { clearTimeout(timeout); reject(error); }
    );
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
