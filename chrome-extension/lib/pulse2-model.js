import { clampInterval, normalizeChatURL } from "./model-v2.js";

export const PULSE2_SCHEMA_VERSION = 1;
export const PULSE2_DEFAULT_COMMAND = "go";
export const PULSE2_DEFAULT_MESSAGES_PER_CYCLE = 5;
export const PULSE2_DEFAULT_MAX_CYCLES = 3;
export const PULSE2_CAPTURE_DELAY_MS = 2 * 60_000;
export const PULSE2_CAPTURE_RETRY_MS = 30_000;
export const PULSE2_MAX_CAPTURE_ATTEMPTS = 10;
export const PULSE2_MAX_MESSAGES_PER_CYCLE = 1_000;
export const PULSE2_MAX_CYCLES = 1_000;
export const PULSE2_HISTORY_LIMIT = 100;

const PHASES = new Set([
  "idle",
  "monitoring",
  "rotating",
  "capture-wait",
  "completed",
  "stopped",
  "error"
]);

export function createPulse2SessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `pulse2-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export function defaultPulse2State() {
  return {
    schemaVersion: PULSE2_SCHEMA_VERSION,
    enabled: false,
    checkInProgress: false,
    phase: "idle",
    currentChatUrl: "",
    projectUrl: "",
    commandText: PULSE2_DEFAULT_COMMAND,
    startMessage: "",
    intervalMinutes: 5,
    messagesPerCycle: PULSE2_DEFAULT_MESSAGES_PER_CYCLE,
    maxCycles: PULSE2_DEFAULT_MAX_CYCLES,
    cycleNumber: 1,
    completedCycles: 0,
    cycleContinuationCount: 0,
    totalContinuationCount: 0,
    rotationPending: false,
    sessionId: createPulse2SessionId(),
    controlRevision: 0,
    tabId: null,
    lastObservedFingerprint: null,
    lastObservedAt: null,
    lastCommandedFingerprint: null,
    lastCommandAt: null,
    lastDispatchOutcome: null,
    lastCheckAt: null,
    nextCheckAt: null,
    rotationStartedAt: null,
    captureDueAt: null,
    captureAttempts: 0,
    lastCreatedChatAt: null,
    lastError: null,
    stopReason: null,
    history: []
  };
}

export function normalizePulse2State(raw) {
  const fallback = defaultPulse2State();
  const currentChatUrl = normalizeChatURL(raw?.currentChatUrl) || "";
  const projectUrl = normalizePulse2ProjectURL(raw?.projectUrl) || "";
  const phase = PHASES.has(raw?.phase) ? raw.phase : fallback.phase;
  const enabled = raw?.enabled === true && Boolean(currentChatUrl) && Boolean(projectUrl);
  return {
    schemaVersion: PULSE2_SCHEMA_VERSION,
    enabled,
    checkInProgress: enabled && raw?.checkInProgress === true,
    phase: enabled ? phase : normalizeInactivePhase(phase),
    currentChatUrl,
    projectUrl,
    commandText: normalizeText(raw?.commandText, PULSE2_DEFAULT_COMMAND),
    startMessage: normalizeOptionalText(raw?.startMessage),
    intervalMinutes: clampInterval(raw?.intervalMinutes ?? fallback.intervalMinutes),
    messagesPerCycle: positiveInteger(
      raw?.messagesPerCycle,
      PULSE2_MAX_MESSAGES_PER_CYCLE,
      PULSE2_DEFAULT_MESSAGES_PER_CYCLE
    ),
    maxCycles: positiveInteger(raw?.maxCycles, PULSE2_MAX_CYCLES, PULSE2_DEFAULT_MAX_CYCLES),
    cycleNumber: positiveInteger(raw?.cycleNumber, PULSE2_MAX_CYCLES, 1),
    completedCycles: nonNegativeInteger(raw?.completedCycles, PULSE2_MAX_CYCLES),
    cycleContinuationCount: nonNegativeInteger(raw?.cycleContinuationCount, PULSE2_MAX_MESSAGES_PER_CYCLE),
    totalContinuationCount: nonNegativeInteger(
      raw?.totalContinuationCount,
      PULSE2_MAX_MESSAGES_PER_CYCLE * PULSE2_MAX_CYCLES
    ),
    rotationPending: enabled && raw?.rotationPending === true,
    sessionId: typeof raw?.sessionId === "string" && raw.sessionId
      ? raw.sessionId
      : fallback.sessionId,
    controlRevision: nonNegativeInteger(raw?.controlRevision, Number.MAX_SAFE_INTEGER),
    tabId: Number.isInteger(raw?.tabId) ? raw.tabId : null,
    lastObservedFingerprint: stringOrNull(raw?.lastObservedFingerprint),
    lastObservedAt: timestampOrNull(raw?.lastObservedAt),
    lastCommandedFingerprint: stringOrNull(raw?.lastCommandedFingerprint),
    lastCommandAt: timestampOrNull(raw?.lastCommandAt),
    lastDispatchOutcome: stringOrNull(raw?.lastDispatchOutcome),
    lastCheckAt: timestampOrNull(raw?.lastCheckAt),
    nextCheckAt: timestampOrNull(raw?.nextCheckAt),
    rotationStartedAt: timestampOrNull(raw?.rotationStartedAt),
    captureDueAt: timestampOrNull(raw?.captureDueAt),
    captureAttempts: nonNegativeInteger(raw?.captureAttempts, PULSE2_MAX_CAPTURE_ATTEMPTS),
    lastCreatedChatAt: timestampOrNull(raw?.lastCreatedChatAt),
    lastError: stringOrNull(raw?.lastError),
    stopReason: stringOrNull(raw?.stopReason),
    history: normalizeHistory(raw?.history)
  };
}

export function applyPulse2SettingsPatch(state, patch = {}) {
  const current = normalizePulse2State(state);
  if (current.enabled) {
    throw new Error("Остановите Pulse 2.0 перед изменением его настроек.");
  }
  const next = { ...current };
  if (Object.hasOwn(patch, "currentChatUrl")) {
    const normalized = normalizeChatURL(patch.currentChatUrl);
    if (!normalized) throw new Error("Укажите ссылку на конкретный чат ChatGPT вида /c/…");
    next.currentChatUrl = normalized;
  }
  if (Object.hasOwn(patch, "projectUrl")) {
    const normalized = normalizePulse2ProjectURL(patch.projectUrl);
    if (!normalized) throw new Error("Укажите ссылку на проект ChatGPT, а не на отдельный чат.");
    next.projectUrl = normalized;
  }
  if (Object.hasOwn(patch, "commandText")) {
    next.commandText = normalizeText(patch.commandText, PULSE2_DEFAULT_COMMAND);
  }
  if (Object.hasOwn(patch, "startMessage")) {
    next.startMessage = normalizeOptionalText(patch.startMessage);
  }
  if (Object.hasOwn(patch, "intervalMinutes")) {
    next.intervalMinutes = clampInterval(patch.intervalMinutes);
  }
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
  return normalizePulse2State(next);
}

export function startPulse2State(state, { tabId = null, at = new Date().toISOString() } = {}) {
  const current = normalizePulse2State(state);
  if (!current.currentChatUrl) throw new Error("Добавьте ссылку на исходный чат ChatGPT.");
  if (!current.projectUrl) throw new Error("Добавьте ссылку на проект ChatGPT.");
  const next = {
    ...current,
    enabled: true,
    checkInProgress: false,
    phase: "monitoring",
    cycleNumber: 1,
    completedCycles: 0,
    cycleContinuationCount: 0,
    totalContinuationCount: 0,
    rotationPending: false,
    sessionId: createPulse2SessionId(),
    controlRevision: current.controlRevision + 1,
    tabId: Number.isInteger(tabId) ? tabId : null,
    lastObservedFingerprint: null,
    lastObservedAt: null,
    lastCommandedFingerprint: null,
    lastCommandAt: null,
    lastDispatchOutcome: null,
    lastCheckAt: null,
    nextCheckAt: at,
    rotationStartedAt: null,
    captureDueAt: null,
    captureAttempts: 0,
    lastCreatedChatAt: null,
    lastError: null,
    stopReason: null,
    history: [{ cycle: 1, url: current.currentChatUrl, createdAt: at, source: "initial" }]
  };
  return normalizePulse2State(next);
}

export function stopPulse2State(state, reason = "manual", at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  return normalizePulse2State({
    ...current,
    enabled: false,
    checkInProgress: false,
    phase: reason === "completed" ? "completed" : reason === "error" ? "error" : "stopped",
    controlRevision: current.controlRevision + 1,
    nextCheckAt: null,
    captureDueAt: null,
    stopReason: String(reason || "manual"),
    lastCheckAt: current.lastCheckAt || at
  });
}

export function observePulse2Snapshot(state, snapshot, now = Date.now()) {
  const current = normalizePulse2State(state);
  const checkedAt = new Date(now).toISOString();
  let next = { ...current, lastCheckAt: checkedAt, lastError: null };
  if (!current.enabled || current.phase !== "monitoring") {
    return { state: next, decision: "inactive", fingerprint: null };
  }
  if (!snapshot?.pageReady) return decision(next, "page-not-ready");
  if (!snapshot?.authenticated) {
    return decision({ ...next, lastError: "В профиле Chrome не выполнен вход в ChatGPT." }, "not-authenticated");
  }
  if (snapshot?.errorDetected) {
    return decision({ ...next, lastError: "Страница ChatGPT сообщает об ошибке." }, "page-error");
  }
  if (snapshot?.isGenerating) return decision(next, "generating");

  const fingerprint = stringOrNull(snapshot?.latestFingerprint);
  if (!fingerprint) return decision(next, "no-messages");
  const latestRole = String(snapshot?.latestRole || "unknown");
  if (latestRole !== "assistant") {
    if (current.lastObservedFingerprint !== fingerprint) {
      next = {
        ...next,
        lastObservedFingerprint: fingerprint,
        lastObservedAt: checkedAt
      };
    }
    return { state: next, decision: "waiting-for-assistant", fingerprint };
  }

  if (current.lastObservedFingerprint !== fingerprint) {
    next = {
      ...next,
      lastObservedFingerprint: fingerprint,
      lastObservedAt: checkedAt,
      nextCheckAt: addMinutes(now, current.intervalMinutes)
    };
    return { state: next, decision: "response-changed", fingerprint };
  }

  if (current.lastCommandedFingerprint === fingerprint) {
    return { state: next, decision: "already-dispatched", fingerprint };
  }

  const observedAt = Date.parse(String(current.lastObservedAt || ""));
  const thresholdMs = current.intervalMinutes * 60_000;
  if (!Number.isFinite(observedAt) || now - observedAt < thresholdMs) {
    next = { ...next, nextCheckAt: addMinutes(Number.isFinite(observedAt) ? observedAt : now, current.intervalMinutes) };
    return { state: next, decision: "waiting-delay", fingerprint };
  }

  if (current.rotationPending) {
    return { state: { ...next, nextCheckAt: null }, decision: "rotate", fingerprint };
  }
  return { state: { ...next, nextCheckAt: null }, decision: "send-auto-response", fingerprint };
}

export function recordPulse2Dispatch(
  state,
  fingerprint,
  outcome,
  at = new Date().toISOString()
) {
  const current = normalizePulse2State(state);
  const cycleContinuationCount = current.cycleContinuationCount + 1;
  return normalizePulse2State({
    ...current,
    cycleContinuationCount,
    totalContinuationCount: current.totalContinuationCount + 1,
    rotationPending: cycleContinuationCount >= current.messagesPerCycle,
    lastCommandedFingerprint: String(fingerprint || "") || current.lastCommandedFingerprint,
    lastCommandAt: at,
    lastDispatchOutcome: String(outcome || "submitted-unconfirmed"),
    nextCheckAt: addMinutes(Date.parse(at), current.intervalMinutes),
    lastError: outcome === "confirmed" ? null : "Отправка нажата, но DOM не подтвердил сообщение. Повтор для этого ответа заблокирован."
  });
}

export function beginPulse2Rotation(state, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  if (!current.enabled) return current;
  return normalizePulse2State({
    ...current,
    phase: "rotating",
    checkInProgress: false,
    completedCycles: Math.max(current.completedCycles, current.cycleNumber),
    rotationStartedAt: at,
    nextCheckAt: null,
    captureDueAt: null,
    captureAttempts: 0,
    lastError: null
  });
}

export function markPulse2CaptureWait(state, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const atMs = Date.parse(at);
  const safeAt = Number.isFinite(atMs) ? atMs : Date.now();
  return normalizePulse2State({
    ...current,
    phase: "capture-wait",
    checkInProgress: false,
    captureDueAt: new Date(safeAt + PULSE2_CAPTURE_DELAY_MS).toISOString(),
    captureAttempts: 0,
    lastError: null
  });
}

export function retryPulse2Capture(state, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  const attempts = current.captureAttempts + 1;
  const atMs = Date.parse(at);
  const safeAt = Number.isFinite(atMs) ? atMs : Date.now();
  return normalizePulse2State({
    ...current,
    captureAttempts: attempts,
    captureDueAt: new Date(safeAt + PULSE2_CAPTURE_RETRY_MS).toISOString(),
    lastError: `Новая ссылка чата ещё не появилась (${attempts}/${PULSE2_MAX_CAPTURE_ATTEMPTS}).`
  });
}

export function capturePulse2Chat(
  state,
  url,
  { title = "", at = new Date().toISOString() } = {}
) {
  const current = normalizePulse2State(state);
  const normalizedURL = normalizeChatURL(url);
  if (!normalizedURL) throw new Error("Новая вкладка ещё не получила постоянную ссылку /c/…");
  if (normalizedURL === current.currentChatUrl) {
    throw new Error("Адрес нового чата совпадает с предыдущим.");
  }
  if (current.cycleNumber >= current.maxCycles) {
    throw new Error("Нельзя создать цикл сверх заданного лимита.");
  }
  const cycleNumber = current.cycleNumber + 1;
  return normalizePulse2State({
    ...current,
    phase: "monitoring",
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
    nextCheckAt: addMinutes(Date.parse(at), current.intervalMinutes),
    rotationStartedAt: null,
    captureDueAt: null,
    captureAttempts: 0,
    lastCreatedChatAt: at,
    lastError: null,
    history: [...current.history, {
      cycle: cycleNumber,
      url: normalizedURL,
      createdAt: at,
      source: "project",
      title: normalizeOptionalText(title).slice(0, 200)
    }].slice(-PULSE2_HISTORY_LIMIT)
  });
}

export function completePulse2State(state, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  return stopPulse2State({
    ...current,
    completedCycles: Math.max(current.completedCycles, current.cycleNumber),
    rotationPending: false,
    lastError: null
  }, "completed", at);
}

export function failPulse2State(state, error, at = new Date().toISOString()) {
  const current = normalizePulse2State(state);
  return stopPulse2State({
    ...current,
    lastError: error instanceof Error ? error.message : String(error || "Неизвестная ошибка Pulse 2.0")
  }, "error", at);
}

export function effectivePulse2StartMessage(state) {
  const current = normalizePulse2State(state);
  return current.startMessage || current.commandText || PULSE2_DEFAULT_COMMAND;
}

function normalizeInactivePhase(phase) {
  return ["completed", "stopped", "error"].includes(phase) ? phase : "idle";
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

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const url = normalizeChatURL(entry?.url);
    if (!url) return null;
    return {
      cycle: positiveInteger(entry?.cycle, PULSE2_MAX_CYCLES, 1),
      url,
      createdAt: timestampOrNull(entry?.createdAt) || new Date(0).toISOString(),
      source: entry?.source === "project" ? "project" : "initial",
      title: normalizeOptionalText(entry?.title).slice(0, 200)
    };
  }).filter(Boolean).slice(-PULSE2_HISTORY_LIMIT);
}

function decision(state, name) {
  return { state, decision: name, fingerprint: null };
}

function addMinutes(timestampMs, minutes) {
  const base = Number.isFinite(timestampMs) ? timestampMs : Date.now();
  return new Date(base + clampInterval(minutes) * 60_000).toISOString();
}
