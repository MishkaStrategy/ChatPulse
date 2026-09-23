import { clampInterval, normalizeChatURL } from "./model-v2.js";

export const PULSE2_SCHEMA_VERSION = 2;
export const PULSE2_DEFAULT_COMMAND = "go";
export const PULSE2_DEFAULT_MESSAGES_PER_CYCLE = 5;
export const PULSE2_DEFAULT_MAX_CYCLES = 3;
export const PULSE2_CAPTURE_DELAY_MS = 2 * 60_000;
export const PULSE2_CAPTURE_RETRY_MS = 30_000;
export const PULSE2_MONITOR_RECHECK_MS = 30_000;
export const PULSE2_MONITOR_ERROR_RETRY_MS = 5 * 60_000;
export const PULSE2_MAX_CAPTURE_ATTEMPTS = 10;
export const PULSE2_MAX_MESSAGES_PER_CYCLE = 1_000;
export const PULSE2_MAX_CYCLES = 1_000;
export const PULSE2_MAX_ROUTES = 20;
export const PULSE2_HISTORY_LIMIT = 100;

const ROUTE_PHASES = new Set([
  "idle",
  "monitoring",
  "rotating",
  "capture-wait",
  "completed",
  "stopped",
  "error"
]);
const GLOBAL_PHASES = new Set(["idle", "running", "completed", "stopped", "error"]);
const TERMINAL_ROUTE_PHASES = new Set(["completed", "stopped", "error"]);

export function createPulse2SessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `pulse2-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPulse2RouteId() {
  if (globalThis.crypto?.randomUUID) return `route-${globalThis.crypto.randomUUID()}`;
  return `route-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizePulse2ProjectURL(rawValue) {
  try {
    const url = new URL(String(rawValue || ""));
    const host = url.hostname.toLowerCase();
    if (host !== "chatgpt.com" && host !== "chat.openai.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const hasConversation = parts.some((part, index) => part === "c" && Boolean(parts[index + 1]));
    if (hasConversation) return null;
    const hasProjectSignal = parts.some((part) => /^g-p-[a-z0-9_-]+$/i.test(part))
      || parts.some((part) => /^projects?$/i.test(part));
    if (!hasProjectSignal) return null;
    const pathname = `/${parts.join("/")}`.replace(/\/$/, "") || "/";
    return `https://chatgpt.com${pathname}`;
  } catch {
    return null;
  }
}

export function defaultPulse2Route(index = 0) {
  return {
    id: createPulse2RouteId(),
    name: `Проект ${index + 1}`,
    projectUrl: "",
    currentChatUrl: "",
    phase: "idle",
    initializingChat: false,
    cycleNumber: 1,
    completedCycles: 0,
    cycleContinuationCount: 0,
    totalContinuationCount: 0,
    rotationPending: false,
    tabId: null,
    checkInProgress: false,
    lastObservedFingerprint: null,
    lastObservedAt: null,
    lastCommandedFingerprint: null,
    lastCommandAt: null,
    lastDispatchOutcome: null,
    lastCheckAt: null,
    lastPageVisibility: null,
    nextCheckAt: null,
    rotationStartedAt: null,
    rotationDispatchAt: null,
    captureDueAt: null,
    captureAttempts: 0,
    lastCreatedChatAt: null,
    lastError: null,
    stopReason: null,
    history: []
  };
}

export function defaultPulse2State() {
  return {
    schemaVersion: PULSE2_SCHEMA_VERSION,
    enabled: false,
    phase: "idle",
    commandText: PULSE2_DEFAULT_COMMAND,
    startMessage: "",
    intervalMinutes: 5,
    messagesPerCycle: PULSE2_DEFAULT_MESSAGES_PER_CYCLE,
    maxCycles: PULSE2_DEFAULT_MAX_CYCLES,
    sessionId: createPulse2SessionId(),
    controlRevision: 0,
    lastError: null,
    routes: [defaultPulse2Route(0)]
  };
}

export function normalizePulse2State(raw) {
  const fallback = defaultPulse2State();
  const sourceRoutes = Array.isArray(raw?.routes)
    ? raw.routes
    : legacyRouteArray(raw);
  const seen = new Set();
  let routes = sourceRoutes.slice(0, PULSE2_MAX_ROUTES).map((route, index) => {
    const normalized = normalizePulse2Route(route, index);
    let id = normalized.id;
    while (seen.has(id)) id = createPulse2RouteId();
    seen.add(id);
    return { ...normalized, id };
  });
  if (!routes.length) routes = [defaultPulse2Route(0)];

  const requestedEnabled = raw?.enabled === true;
  const canRun = routes.every((route) => Boolean(route.projectUrl));
  const enabled = requestedEnabled && canRun && routes.some((route) => !isPulse2RouteTerminal(route));
  const requestedPhase = GLOBAL_PHASES.has(raw?.phase) ? raw.phase : fallback.phase;
  const phase = enabled ? "running" : normalizeGlobalInactivePhase(requestedPhase, routes);

  return {
    schemaVersion: PULSE2_SCHEMA_VERSION,
    enabled,
    phase,
    commandText: normalizeText(raw?.commandText, PULSE2_DEFAULT_COMMAND),
    startMessage: normalizeOptionalText(raw?.startMessage),
    intervalMinutes: clampInterval(raw?.intervalMinutes ?? fallback.intervalMinutes),
    messagesPerCycle: positiveInteger(
      raw?.messagesPerCycle,
      PULSE2_MAX_MESSAGES_PER_CYCLE,
      PULSE2_DEFAULT_MESSAGES_PER_CYCLE
    ),
    maxCycles: positiveInteger(raw?.maxCycles, PULSE2_MAX_CYCLES, PULSE2_DEFAULT_MAX_CYCLES),
    sessionId: typeof raw?.sessionId === "string" && raw.sessionId ? raw.sessionId : fallback.sessionId,
    controlRevision: nonNegativeInteger(raw?.controlRevision, Number.MAX_SAFE_INTEGER),
    lastError: stringOrNull(raw?.lastError),
    routes
  };
}

export function applyPulse2SettingsPatch(state, patch = {}) {
  const current = normalizePulse2State(state);
  if (current.enabled) throw new Error("Остановите Pulse 2.0 перед изменением его настроек.");
  const next = { ...current };

  if (Object.hasOwn(patch, "commandText")) next.commandText = normalizeText(patch.commandText, PULSE2_DEFAULT_COMMAND);
  if (Object.hasOwn(patch, "startMessage")) next.startMessage = normalizeOptionalText(patch.startMessage);
  if (Object.hasOwn(patch, "intervalMinutes")) next.intervalMinutes = clampInterval(patch.intervalMinutes);
  if (Object.hasOwn(patch, "messagesPerCycle")) {
    next.messagesPerCycle = positiveInteger(
      patch.messagesPerCycle,
      PULSE2_MAX_MESSAGES_PER_CYCLE,
      PULSE2_DEFAULT_MESSAGES_PER_CYCLE
    );
  }
  if (Object.hasOwn(patch, "maxCycles")) {
    next.maxCycles = positiveInteger(patch.maxCycles, PULSE2_MAX_CYCLES, PULSE2_DEFAULT_MAX_CYCLES);
  }
  if (Object.hasOwn(patch, "routes")) next.routes = normalizeSettingsRoutes(current, patch.routes);
  return normalizePulse2State(next);
}

export function startPulse2State(state, { tabIds = {}, at = new Date().toISOString() } = {}) {
  const current = normalizePulse2State(state);
  if (!current.routes.length) throw new Error("Добавьте хотя бы один проект ChatGPT.");
  for (const route of current.routes) {
    if (!route.projectUrl) throw new Error(`Укажите ссылку проекта для «${route.name}».`);
  }
  assertUniqueCurrentChats(current.routes);

  const routes = current.routes.map((route) => {
    const hasChat = Boolean(route.currentChatUrl);
    return normalizePulse2Route({
      ...route,
      phase: hasChat ? "monitoring" : "rotating",
      initializingChat: !hasChat,
      cycleNumber: 1,
      completedCycles: 0,
      cycleContinuationCount: 0,
      totalContinuationCount: 0,
      rotationPending: false,
      tabId: Number.isInteger(tabIds[route.id]) ? tabIds[route.id] : null,
      checkInProgress: false,
      lastObservedFingerprint: null,
      lastObservedAt: null,
      lastCommandedFingerprint: null,
      lastCommandAt: null,
      lastDispatchOutcome: null,
      lastCheckAt: null,
      lastPageVisibility: null,
      nextCheckAt: hasChat ? at : null,
      rotationStartedAt: !hasChat ? at : null,
      rotationDispatchAt: null,
      captureDueAt: null,
      captureAttempts: 0,
      lastCreatedChatAt: null,
      lastError: null,
      stopReason: null,
      history: hasChat ? [{ cycle: 1, url: route.currentChatUrl, createdAt: at, source: "initial", title: "" }] : []
    }, 0);
  });

  return normalizePulse2State({
    ...current,
    enabled: true,
    phase: "running",
    sessionId: createPulse2SessionId(),
    controlRevision: current.controlRevision + 1,
    lastError: null,
    routes
  });
}

export function stopPulse2State(state, reason = "manual", at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const terminalPhase = reason === "completed" ? "completed" : reason === "error" ? "error" : "stopped";
  return normalizePulse2State({
    ...current,
    enabled: false,
    phase: terminalPhase,
    controlRevision: current.controlRevision + 1,
    routes: current.routes.map((route) => isPulse2RouteTerminal(route) ? route : {
      ...route,
      phase: terminalPhase,
      checkInProgress: false,
      nextCheckAt: null,
      captureDueAt: null,
      stopReason: String(reason || "manual"),
      lastCheckAt: route.lastCheckAt || at
    })
  });
}

export function observePulse2Snapshot(state, routeId, snapshot, now = Date.now()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  const checkedAt = new Date(now).toISOString();
  let nextRoute = {
    ...route,
    lastCheckAt: checkedAt,
    lastPageVisibility: normalizePageVisibility(snapshot?.visibilityState),
    lastError: null
  };
  if (!current.enabled || route.phase !== "monitoring") return routeDecision(current, nextRoute, "inactive");
  if (!snapshot?.pageReady) {
    return routeDecision(current, {
      ...nextRoute,
      nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_RECHECK_MS)
    }, "page-not-ready");
  }
  if (!snapshot?.authenticated) {
    return routeDecision(current, {
      ...nextRoute,
      lastError: "В профиле Chrome не выполнен вход в ChatGPT.",
      nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_ERROR_RETRY_MS)
    }, "not-authenticated");
  }
  if (snapshot?.errorDetected) {
    return routeDecision(current, {
      ...nextRoute,
      lastError: "Страница ChatGPT сообщает об ошибке.",
      nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_ERROR_RETRY_MS)
    }, "page-error");
  }
  if (snapshot?.isGenerating) {
    return routeDecision(current, {
      ...nextRoute,
      nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_RECHECK_MS)
    }, "generating");
  }

  const fingerprint = stringOrNull(snapshot?.latestFingerprint);
  if (!fingerprint) {
    return routeDecision(current, {
      ...nextRoute,
      nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_RECHECK_MS)
    }, "no-messages");
  }
  const latestRole = String(snapshot?.latestRole || "unknown");
  const readyWithoutAssistant = latestRole === "user"
    && snapshot?.readyForNewInput === true;
  if (latestRole !== "assistant" && !readyWithoutAssistant) {
    if (route.lastObservedFingerprint !== fingerprint) {
      nextRoute = { ...nextRoute, lastObservedFingerprint: fingerprint, lastObservedAt: checkedAt };
    }
    return routeDecision(current, {
      ...nextRoute,
      nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_RECHECK_MS)
    }, "waiting-for-assistant", fingerprint);
  }

  if (readyWithoutAssistant) {
    if (route.lastObservedFingerprint !== fingerprint) {
      nextRoute = {
        ...nextRoute,
        lastObservedFingerprint: fingerprint,
        lastObservedAt: checkedAt,
        nextCheckAt: addMinutes(now, current.intervalMinutes)
      };
      return routeDecision(current, nextRoute, "input-ready-observed", fingerprint);
    }

    if (route.lastCommandedFingerprint === fingerprint) {
      if (route.lastDispatchOutcome === "submitted-unconfirmed") {
        nextRoute = {
          ...nextRoute,
          nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_ERROR_RETRY_MS)
        };
      }
      return routeDecision(current, nextRoute, "already-dispatched", fingerprint);
    }

    const observedAt = Date.parse(String(route.lastObservedAt || ""));
    const thresholdMs = current.intervalMinutes * 60_000;
    if (!Number.isFinite(observedAt) || now - observedAt < thresholdMs) {
      nextRoute = {
        ...nextRoute,
        nextCheckAt: addMinutes(Number.isFinite(observedAt) ? observedAt : now, current.intervalMinutes)
      };
      return routeDecision(current, nextRoute, "waiting-delay", fingerprint);
    }

    if (route.rotationPending) {
      return routeDecision(current, { ...nextRoute, nextCheckAt: null }, "rotate", fingerprint);
    }
    return routeDecision(current, { ...nextRoute, nextCheckAt: null }, "send-auto-response", fingerprint);
  }

  if (route.lastObservedFingerprint !== fingerprint) {
    if (route.lastDispatchOutcome === "submitted-unconfirmed"
      && route.lastCommandedFingerprint
      && route.lastCommandedFingerprint !== fingerprint) {
      nextRoute = creditPulse2Continuation(nextRoute, current, "confirmed-by-response");
    }
    nextRoute = {
      ...nextRoute,
      lastObservedFingerprint: fingerprint,
      lastObservedAt: checkedAt,
      nextCheckAt: addMinutes(now, current.intervalMinutes)
    };
    return routeDecision(current, nextRoute, "response-changed", fingerprint);
  }

  if (route.lastCommandedFingerprint === fingerprint) {
    if (route.lastDispatchOutcome === "submitted-unconfirmed") {
      nextRoute = {
        ...nextRoute,
        nextCheckAt: addMilliseconds(now, PULSE2_MONITOR_ERROR_RETRY_MS)
      };
    }
    return routeDecision(current, nextRoute, "already-dispatched", fingerprint);
  }

  const observedAt = Date.parse(String(route.lastObservedAt || ""));
  const thresholdMs = current.intervalMinutes * 60_000;
  if (!Number.isFinite(observedAt) || now - observedAt < thresholdMs) {
    nextRoute = {
      ...nextRoute,
      nextCheckAt: addMinutes(Number.isFinite(observedAt) ? observedAt : now, current.intervalMinutes)
    };
    return routeDecision(current, nextRoute, "waiting-delay", fingerprint);
  }

  if (route.rotationPending) {
    return routeDecision(current, { ...nextRoute, nextCheckAt: null }, "rotate", fingerprint);
  }
  return routeDecision(current, { ...nextRoute, nextCheckAt: null }, "send-auto-response", fingerprint);
}

export function recordPulse2Dispatch(state, routeId, fingerprint, outcome, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  const normalizedOutcome = outcome === "confirmed" ? "confirmed" : "submitted-unconfirmed";
  const credited = normalizedOutcome === "confirmed"
    ? creditPulse2Continuation(route, current, normalizedOutcome)
    : route;
  return replaceRoute(current, routeId, {
    ...credited,
    lastCommandedFingerprint: String(fingerprint || "") || route.lastCommandedFingerprint,
    lastCommandAt: at,
    lastDispatchOutcome: normalizedOutcome,
    nextCheckAt: addMilliseconds(
      Date.parse(at),
      normalizedOutcome === "confirmed" ? PULSE2_MONITOR_RECHECK_MS : PULSE2_MONITOR_ERROR_RETRY_MS
    ),
    lastError: normalizedOutcome === "confirmed"
      ? null
      : "Отправка нажата, но DOM не подтвердил сообщение. Счётчик не увеличен; повтор для этого ответа заблокирован до появления нового ответа."
  });
}

function creditPulse2Continuation(route, state, outcome) {
  const cycleContinuationCount = route.cycleContinuationCount + 1;
  return {
    ...route,
    cycleContinuationCount,
    totalContinuationCount: route.totalContinuationCount + 1,
    rotationPending: cycleContinuationCount >= state.messagesPerCycle,
    lastDispatchOutcome: outcome,
    lastError: null
  };
}

export function beginPulse2Rotation(state, routeId, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  if (!current.enabled || isPulse2RouteTerminal(route)) return current;
  return replaceRoute(current, routeId, {
    ...route,
    phase: "rotating",
    initializingChat: false,
    checkInProgress: false,
    completedCycles: Math.max(route.completedCycles, route.cycleNumber),
    rotationStartedAt: at,
    rotationDispatchAt: null,
    nextCheckAt: null,
    captureDueAt: null,
    captureAttempts: 0,
    lastError: null
  });
}

export function markPulse2RotationDispatch(state, routeId, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  return replaceRoute(current, routeId, {
    ...route,
    rotationDispatchAt: at,
    lastError: null
  });
}

export function markPulse2CaptureWait(state, routeId, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  const atMs = Date.parse(at);
  const safeAt = Number.isFinite(atMs) ? atMs : Date.now();
  return replaceRoute(current, routeId, {
    ...route,
    phase: "capture-wait",
    checkInProgress: false,
    captureDueAt: new Date(safeAt + PULSE2_CAPTURE_DELAY_MS).toISOString(),
    captureAttempts: 0,
    lastError: null
  });
}

export function retryPulse2Capture(state, routeId, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  const attempts = route.captureAttempts + 1;
  const atMs = Date.parse(at);
  const safeAt = Number.isFinite(atMs) ? atMs : Date.now();
  return replaceRoute(current, routeId, {
    ...route,
    captureAttempts: attempts,
    captureDueAt: new Date(safeAt + PULSE2_CAPTURE_RETRY_MS).toISOString(),
    lastError: `Новая ссылка чата ещё не появилась (${attempts}/${PULSE2_MAX_CAPTURE_ATTEMPTS}).`
  });
}

export function capturePulse2Chat(state, routeId, url, {
  title = "",
  visibilityState = null,
  at = new Date().toISOString()
} = {}) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  const normalizedURL = normalizeChatURL(url);
  if (!normalizedURL) throw new Error("Новая вкладка ещё не получила постоянную ссылку /c/…");
  if (route.currentChatUrl && normalizedURL === route.currentChatUrl) throw new Error("Адрес нового чата совпадает с предыдущим.");
  assertChatNotUsedByOtherRoute(current.routes, routeId, normalizedURL);

  const isInitial = route.initializingChat === true;
  if (!isInitial && route.cycleNumber >= current.maxCycles) throw new Error("Нельзя создать цикл сверх заданного лимита.");
  const cycleNumber = isInitial ? 1 : route.cycleNumber + 1;
  const source = isInitial ? "project-initial" : "project";
  const nextRoute = {
    ...route,
    phase: "monitoring",
    initializingChat: false,
    currentChatUrl: normalizedURL,
    cycleNumber,
    cycleContinuationCount: 0,
    rotationPending: false,
    lastObservedFingerprint: null,
    lastObservedAt: null,
    lastCommandedFingerprint: null,
    lastCommandAt: null,
    lastDispatchOutcome: null,
    lastCheckAt: null,
    lastPageVisibility: normalizePageVisibility(visibilityState) || route.lastPageVisibility,
    nextCheckAt: addMilliseconds(Date.parse(at), PULSE2_MONITOR_RECHECK_MS),
    rotationStartedAt: null,
    rotationDispatchAt: null,
    captureDueAt: null,
    captureAttempts: 0,
    lastCreatedChatAt: at,
    lastError: null,
    history: [...route.history, {
      cycle: cycleNumber,
      url: normalizedURL,
      createdAt: at,
      source,
      title: normalizeOptionalText(title).slice(0, 200)
    }].slice(-PULSE2_HISTORY_LIMIT)
  };
  return replaceRoute(current, routeId, nextRoute);
}

export function completePulse2Route(state, routeId, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  const next = replaceRoute(current, routeId, {
    ...route,
    phase: "completed",
    checkInProgress: false,
    completedCycles: Math.max(route.completedCycles, route.cycleNumber),
    rotationPending: false,
    nextCheckAt: null,
    captureDueAt: null,
    lastError: null,
    stopReason: "completed",
    lastCheckAt: route.lastCheckAt || at
  });
  return settlePulse2Global(next);
}

export function failPulse2Route(state, routeId, error, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const route = requireRoute(current, routeId);
  const message = error instanceof Error ? error.message : String(error || "Неизвестная ошибка Pulse 2.0");
  const next = replaceRoute({ ...current, lastError: `${route.name}: ${message}` }, routeId, {
    ...route,
    phase: "error",
    checkInProgress: false,
    nextCheckAt: null,
    captureDueAt: null,
    lastError: message,
    stopReason: "error",
    lastCheckAt: route.lastCheckAt || at
  });
  return settlePulse2Global(next);
}

export function effectivePulse2StartMessage(state) {
  const current = normalizePulse2State(state);
  return current.startMessage || current.commandText || PULSE2_DEFAULT_COMMAND;
}

export function isPulse2RouteTerminal(route) {
  return TERMINAL_ROUTE_PHASES.has(route?.phase);
}

export function getPulse2Route(state, routeId) {
  const current = normalizePulse2State(state);
  return current.routes.find((route) => route.id === routeId) || null;
}

export function replacePulse2Route(state, routeId, nextRoute) {
  return replaceRoute(normalizePulse2State(state), routeId, nextRoute);
}

export function settlePulse2Global(state) {
  const current = normalizePulse2State(state);
  if (!current.enabled) return current;
  if (current.routes.some((route) => !isPulse2RouteTerminal(route))) return current;
  const hasError = current.routes.some((route) => route.phase === "error");
  return normalizePulse2State({ ...current, enabled: false, phase: hasError ? "error" : "completed" });
}

function normalizePulse2Route(raw, index) {
  const fallback = defaultPulse2Route(index);
  const currentChatUrl = normalizeChatURL(raw?.currentChatUrl) || "";
  const projectUrl = normalizePulse2ProjectURL(raw?.projectUrl) || "";
  const phase = ROUTE_PHASES.has(raw?.phase) ? raw.phase : fallback.phase;
  return {
    id: normalizeRouteId(raw?.id) || fallback.id,
    name: normalizeRouteName(raw?.name, index),
    projectUrl,
    currentChatUrl,
    phase,
    initializingChat: raw?.initializingChat === true,
    cycleNumber: positiveInteger(raw?.cycleNumber, PULSE2_MAX_CYCLES, 1),
    completedCycles: nonNegativeInteger(raw?.completedCycles, PULSE2_MAX_CYCLES),
    cycleContinuationCount: nonNegativeInteger(raw?.cycleContinuationCount, PULSE2_MAX_MESSAGES_PER_CYCLE),
    totalContinuationCount: nonNegativeInteger(
      raw?.totalContinuationCount,
      PULSE2_MAX_MESSAGES_PER_CYCLE * PULSE2_MAX_CYCLES
    ),
    rotationPending: raw?.rotationPending === true,
    tabId: Number.isInteger(raw?.tabId) ? raw.tabId : null,
    checkInProgress: raw?.checkInProgress === true,
    lastObservedFingerprint: stringOrNull(raw?.lastObservedFingerprint),
    lastObservedAt: timestampOrNull(raw?.lastObservedAt),
    lastCommandedFingerprint: stringOrNull(raw?.lastCommandedFingerprint),
    lastCommandAt: timestampOrNull(raw?.lastCommandAt),
    lastDispatchOutcome: stringOrNull(raw?.lastDispatchOutcome),
    lastCheckAt: timestampOrNull(raw?.lastCheckAt),
    lastPageVisibility: normalizePageVisibility(raw?.lastPageVisibility),
    nextCheckAt: timestampOrNull(raw?.nextCheckAt),
    rotationStartedAt: timestampOrNull(raw?.rotationStartedAt),
    rotationDispatchAt: timestampOrNull(raw?.rotationDispatchAt),
    captureDueAt: timestampOrNull(raw?.captureDueAt),
    captureAttempts: nonNegativeInteger(raw?.captureAttempts, PULSE2_MAX_CAPTURE_ATTEMPTS),
    lastCreatedChatAt: timestampOrNull(raw?.lastCreatedChatAt),
    lastError: stringOrNull(raw?.lastError),
    stopReason: stringOrNull(raw?.stopReason),
    history: normalizeHistory(raw?.history)
  };
}

function legacyRouteArray(raw) {
  if (!raw || typeof raw !== "object") return [defaultPulse2Route(0)];
  const hasLegacy = Object.hasOwn(raw, "projectUrl") || Object.hasOwn(raw, "currentChatUrl");
  if (!hasLegacy) return [defaultPulse2Route(0)];
  return [{
    id: "route-legacy-1",
    name: "Проект 1",
    projectUrl: raw.projectUrl,
    currentChatUrl: raw.currentChatUrl,
    phase: raw.phase,
    initializingChat: false,
    cycleNumber: raw.cycleNumber,
    completedCycles: raw.completedCycles,
    cycleContinuationCount: raw.cycleContinuationCount,
    totalContinuationCount: raw.totalContinuationCount,
    rotationPending: raw.rotationPending,
    tabId: raw.tabId,
    checkInProgress: raw.checkInProgress,
    lastObservedFingerprint: raw.lastObservedFingerprint,
    lastObservedAt: raw.lastObservedAt,
    lastCommandedFingerprint: raw.lastCommandedFingerprint,
    lastCommandAt: raw.lastCommandAt,
    lastDispatchOutcome: raw.lastDispatchOutcome,
    lastCheckAt: raw.lastCheckAt,
    nextCheckAt: raw.nextCheckAt,
    rotationStartedAt: raw.rotationStartedAt,
    captureDueAt: raw.captureDueAt,
    captureAttempts: raw.captureAttempts,
    lastCreatedChatAt: raw.lastCreatedChatAt,
    lastError: raw.lastError,
    stopReason: raw.stopReason,
    history: raw.history
  }];
}

function normalizeSettingsRoutes(current, rawRoutes) {
  if (!Array.isArray(rawRoutes) || rawRoutes.length < 1) throw new Error("Добавьте хотя бы один проект ChatGPT.");
  if (rawRoutes.length > PULSE2_MAX_ROUTES) throw new Error(`Pulse 2.0 поддерживает до ${PULSE2_MAX_ROUTES} проектов.`);
  const existing = new Map(current.routes.map((route) => [route.id, route]));
  const seenIds = new Set();
  const routes = rawRoutes.map((rawRoute, index) => {
    let id = normalizeRouteId(rawRoute?.id) || createPulse2RouteId();
    while (seenIds.has(id)) id = createPulse2RouteId();
    seenIds.add(id);
    const projectUrl = normalizePulse2ProjectURL(rawRoute?.projectUrl);
    if (!projectUrl) throw new Error(`Укажите корректную ссылку проекта для «${normalizeRouteName(rawRoute?.name, index)}».`);
    const rawChat = String(rawRoute?.currentChatUrl || "").trim();
    const currentChatUrl = rawChat ? normalizeChatURL(rawChat) : "";
    if (rawChat && !currentChatUrl) throw new Error(`Текущий чат «${normalizeRouteName(rawRoute?.name, index)}» должен быть ссылкой /c/… или оставаться пустым.`);
    const base = existing.get(id) || defaultPulse2Route(index);
    return normalizePulse2Route({
      ...base,
      id,
      name: normalizeRouteName(rawRoute?.name, index),
      projectUrl,
      currentChatUrl
    }, index);
  });
  assertUniqueCurrentChats(routes);
  return routes;
}

function assertUniqueCurrentChats(routes) {
  const seen = new Set();
  for (const route of routes) {
    if (!route.currentChatUrl) continue;
    if (seen.has(route.currentChatUrl)) throw new Error("Один и тот же текущий чат нельзя назначить двум маршрутам Pulse 2.0.");
    seen.add(route.currentChatUrl);
  }
}

function assertChatNotUsedByOtherRoute(routes, routeId, chatUrl) {
  if (routes.some((route) => route.id !== routeId && route.currentChatUrl === chatUrl)) {
    throw new Error("Новый чат уже используется другим маршрутом Pulse 2.0.");
  }
}

function routeDecision(state, route, name, fingerprint = null) {
  return { state: replaceRoute(state, route.id, route), decision: name, fingerprint, routeId: route.id };
}

function replaceRoute(state, routeId, nextRoute) {
  const index = state.routes.findIndex((route) => route.id === routeId);
  if (index < 0) throw new Error("Маршрут Pulse 2.0 не найден.");
  const routes = state.routes.slice();
  routes[index] = normalizePulse2Route(nextRoute, index);
  return normalizePulse2State({ ...state, routes });
}

function requireRoute(state, routeId) {
  const route = state.routes.find((candidate) => candidate.id === routeId);
  if (!route) throw new Error("Маршрут Pulse 2.0 не найден.");
  return route;
}

function normalizeGlobalInactivePhase(phase, routes) {
  if (["completed", "stopped", "error"].includes(phase)) return phase;
  if (routes.length && routes.every((route) => route.phase === "completed")) return "completed";
  if (routes.some((route) => route.phase === "error")) return "error";
  return "idle";
}

function normalizeRouteId(value) {
  const id = typeof value === "string" ? value.trim() : "";
  return id && id.length <= 128 ? id : "";
}

function normalizeRouteName(value, index) {
  const name = typeof value === "string" ? value.trim() : "";
  return (name || `Проект ${index + 1}`).slice(0, 120);
}

function normalizeText(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, 4_000);
}

function normalizeOptionalText(value) {
  return typeof value === "string" ? value.trim().slice(0, 4_000) : "";
}

function positiveInteger(value, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const integer = Math.trunc(parsed);
  if (integer < 1) return fallback;
  return Math.min(integer, max);
}

function nonNegativeInteger(value, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(Math.trunc(parsed), max);
}

function stringOrNull(value) {
  return typeof value === "string" && value ? value : null;
}

function timestampOrNull(value) {
  if (typeof value !== "string" || !value) return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
}

function normalizePageVisibility(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["visible", "hidden", "prerender"].includes(normalized) ? normalized : null;
}

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const url = normalizeChatURL(entry?.url);
    if (!url) return null;
    const source = ["initial", "project", "project-initial"].includes(entry?.source) ? entry.source : "initial";
    return {
      cycle: positiveInteger(entry?.cycle, PULSE2_MAX_CYCLES, 1),
      url,
      createdAt: timestampOrNull(entry?.createdAt) || new Date(0).toISOString(),
      source,
      title: normalizeOptionalText(entry?.title).slice(0, 200)
    };
  }).filter(Boolean).slice(-PULSE2_HISTORY_LIMIT);
}

function addMinutes(timestampMs, minutes) {
  const base = Number.isFinite(timestampMs) ? timestampMs : Date.now();
  return new Date(base + clampInterval(minutes) * 60_000).toISOString();
}

function addMilliseconds(timestampMs, milliseconds) {
  const base = Number.isFinite(timestampMs) ? timestampMs : Date.now();
  return new Date(base + Number(milliseconds)).toISOString();
}
