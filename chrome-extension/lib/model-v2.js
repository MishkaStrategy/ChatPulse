export const DEFAULT_COMMAND = "продолжай и не останавливайся до технического лимита";
export const MAX_STOP_PHRASE_LENGTH = 500;
export const MIN_INTERVAL_MINUTES = 0.5;
export const MAX_INTERVAL_MINUTES = 1_440;
export const MAX_LOG_ENTRIES = 300;
export const MAX_CHAT_COUNT = 100;
export const MAX_CONTINUATIONS = 10_000;
export const MAX_RUNTIME_MINUTES = 10_080;
export const MIN_REFRESH_INTERVAL_MS = 5 * 60_000;
export const MAX_REFRESH_INTERVAL_MS = 15 * 60_000;
export const STUCK_GENERATION_MS = 20 * 60_000;
export const PORTABLE_CONFIG_FORMAT = "chatpulse-config";
export const PORTABLE_CONFIG_VERSION = 1;

export function createSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clampInterval(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(Math.max(parsed, MIN_INTERVAL_MINUTES), MAX_INTERVAL_MINUTES);
}

export function refreshIntervalMs(intervalMinutes) {
  const requested = clampInterval(intervalMinutes) * 3 * 60_000;
  return Math.min(MAX_REFRESH_INTERVAL_MS, Math.max(MIN_REFRESH_INTERVAL_MS, requested));
}

export function normalizeChatURL(rawValue) {
  try {
    const url = new URL(rawValue);
    const host = url.hostname.toLowerCase();
    if (host !== "chatgpt.com" && host !== "chat.openai.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const conversationIndex = parts.findIndex((part, index) => part === "c" && parts[index + 1]);
    if (conversationIndex < 0) return null;
    return `https://chatgpt.com/${parts.slice(0, conversationIndex + 2).join("/")}`;
  } catch {
    return null;
  }
}

export function defaultChatProfile() {
  return {
    commandText: null,
    intervalMinutes: null,
    stopPhrase: null,
    maxContinuations: 0,
    maxRuntimeMinutes: 0,
    telegramNotify: true
  };
}

export function normalizeChatProfile(raw) {
  const fallback = defaultChatProfile();
  const commandText = typeof raw?.commandText === "string" && raw.commandText.trim()
    ? raw.commandText.trim().slice(0, 4_000)
    : null;
  const intervalMinutes = raw?.intervalMinutes === null || raw?.intervalMinutes === undefined
    ? null
    : clampInterval(raw.intervalMinutes);
  let stopPhrase = null;
  if (raw && Object.hasOwn(raw, "stopPhrase")) {
    stopPhrase = raw.stopPhrase === null ? null : normalizeStopPhrase(raw.stopPhrase);
  }
  return {
    commandText,
    intervalMinutes,
    stopPhrase,
    maxContinuations: boundedInteger(raw?.maxContinuations, MAX_CONTINUATIONS),
    maxRuntimeMinutes: boundedInteger(raw?.maxRuntimeMinutes, MAX_RUNTIME_MINUTES),
    telegramNotify: raw?.telegramNotify !== false && fallback.telegramNotify
  };
}

export function effectiveChatProfile(state, chat) {
  const profile = normalizeChatProfile(chat?.profile);
  return {
    commandText: profile.commandText || state.commandText || DEFAULT_COMMAND,
    intervalMinutes: profile.intervalMinutes === null
      ? clampInterval(state.intervalMinutes)
      : profile.intervalMinutes,
    stopPhrase: profile.stopPhrase === null
      ? normalizeStopPhrase(state.stopPhrase)
      : normalizeStopPhrase(profile.stopPhrase),
    maxContinuations: profile.maxContinuations,
    maxRuntimeMinutes: profile.maxRuntimeMinutes,
    telegramNotify: profile.telegramNotify
  };
}

export function hasCompletionGuard(profile) {
  return Boolean(normalizeStopPhrase(profile?.stopPhrase))
    || boundedInteger(profile?.maxContinuations, MAX_CONTINUATIONS) > 0
    || boundedInteger(profile?.maxRuntimeMinutes, MAX_RUNTIME_MINUTES) > 0;
}

export function createChat({ title, url, tabId = null, now = new Date().toISOString() }) {
  const normalizedURL = normalizeChatURL(url);
  if (!normalizedURL) throw new Error("Открыта не страница конкретного чата ChatGPT.");
  return {
    id: createSessionId(),
    title: String(title || "Чат ChatGPT").trim() || "Чат ChatGPT",
    url: normalizedURL,
    enabled: true,
    controlRevision: 0,
    profile: defaultChatProfile(),
    runStartedAt: null,
    continuationCount: 0,
    taskActive: false,
    taskStartedAt: null,
    taskCompletedAt: null,
    taskCompletionReason: null,
    lastDecision: null,
    nextEligibleAt: null,
    lastTelegramErrorKey: null,
    tabId: Number.isInteger(tabId) ? tabId : null,
    lastObservedFingerprint: null,
    lastCommandedFingerprint: null,
    lastObservedAt: null,
    lastCommandAt: null,
    lastDispatchOutcome: null,
    lastObservedSessionId: null,
    lastSnapshotAt: null,
    lastHardRefreshAt: now,
    lastRecoveryAt: null,
    lastRecoveryReason: null,
    staleRecoveries: 0,
    lastStoppedAt: null,
    lastStopReason: null,
    lastError: null
  };
}

export function normalizeChat(raw) {
  const normalizedURL = normalizeChatURL(raw?.url);
  if (!normalizedURL) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createSessionId(),
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Чат ChatGPT",
    url: normalizedURL,
    enabled: raw.enabled !== false,
    controlRevision: nonNegativeInteger(raw.controlRevision),
    profile: normalizeChatProfile(raw.profile),
    runStartedAt: stringOrNull(raw.runStartedAt),
    continuationCount: nonNegativeInteger(raw.continuationCount),
    taskActive: raw.taskActive === true,
    taskStartedAt: stringOrNull(raw.taskStartedAt),
    taskCompletedAt: stringOrNull(raw.taskCompletedAt),
    taskCompletionReason: stringOrNull(raw.taskCompletionReason),
    lastDecision: stringOrNull(raw.lastDecision),
    nextEligibleAt: stringOrNull(raw.nextEligibleAt),
    lastTelegramErrorKey: stringOrNull(raw.lastTelegramErrorKey),
    tabId: Number.isInteger(raw.tabId) ? raw.tabId : null,
    lastObservedFingerprint: stringOrNull(raw.lastObservedFingerprint),
    lastCommandedFingerprint: stringOrNull(raw.lastCommandedFingerprint),
    lastObservedAt: stringOrNull(raw.lastObservedAt),
    lastCommandAt: stringOrNull(raw.lastCommandAt),
    lastDispatchOutcome: stringOrNull(raw.lastDispatchOutcome),
    lastObservedSessionId: stringOrNull(raw.lastObservedSessionId),
    lastSnapshotAt: stringOrNull(raw.lastSnapshotAt),
    lastHardRefreshAt: stringOrNull(raw.lastHardRefreshAt),
    lastRecoveryAt: stringOrNull(raw.lastRecoveryAt),
    lastRecoveryReason: stringOrNull(raw.lastRecoveryReason),
    staleRecoveries: nonNegativeInteger(raw.staleRecoveries),
    lastStoppedAt: stringOrNull(raw.lastStoppedAt),
    lastStopReason: stringOrNull(raw.lastStopReason),
    lastError: stringOrNull(raw.lastError)
  };
}

export function defaultState() {
  return {
    schemaVersion: 4,
    enabled: false,
    checkInProgress: false,
    intervalMinutes: 5,
    commandText: DEFAULT_COMMAND,
    stopPhrase: "",
    theme: "macos",
    sessionId: createSessionId(),
    lastCheckAt: null,
    nextCheckAt: null,
    chats: [],
    logs: []
  };
}

export function normalizeState(raw) {
  const fallback = defaultState();
  return {
    schemaVersion: 4,
    enabled: raw?.enabled === true,
    checkInProgress: raw?.checkInProgress === true,
    intervalMinutes: clampInterval(raw?.intervalMinutes ?? fallback.intervalMinutes),
    commandText: typeof raw?.commandText === "string" && raw.commandText.trim()
      ? raw.commandText.trim()
      : DEFAULT_COMMAND,
    stopPhrase: normalizeStopPhrase(raw?.stopPhrase),
    theme: raw?.theme === "preview" ? "preview" : "macos",
    sessionId: typeof raw?.sessionId === "string" && raw.sessionId ? raw.sessionId : fallback.sessionId,
    lastCheckAt: stringOrNull(raw?.lastCheckAt),
    nextCheckAt: stringOrNull(raw?.nextCheckAt),
    chats: Array.isArray(raw?.chats)
      ? raw.chats.map(normalizeChat).filter(Boolean).slice(0, MAX_CHAT_COUNT)
      : [],
    logs: Array.isArray(raw?.logs)
      ? raw.logs.filter(isValidLog).slice(-MAX_LOG_ENTRIES)
      : []
  };
}

export function appendLog(state, level, message, details = null) {
  return {
    ...state,
    logs: [...state.logs, {
      id: createSessionId(),
      at: new Date().toISOString(),
      level,
      message: String(message),
      details: details ? String(details) : null
    }].slice(-MAX_LOG_ENTRIES)
  };
}

export function decide(chat, snapshot, sessionId) {
  const now = new Date().toISOString();
  const observedAt = stringOrNull(snapshot?.observedAt) || now;
  const updated = {
    ...chat,
    lastObservedAt: now,
    lastSnapshotAt: observedAt,
    lastError: null
  };
  if (!chat.enabled) return decisionResult(updated, "disabled");
  if (!snapshot?.pageReady) return decisionResult(updated, "page-not-ready");
  if (!snapshot?.authenticated) return decisionResult(updated, "not-authenticated");
  if (snapshot.errorDetected) return decisionResult(updated, "page-error");
  if (snapshot.isGenerating) return decisionResult(updated, "generating");

  const fingerprint = stringOrNull(snapshot.latestFingerprint);
  if (snapshot.stopPhraseMatched === true && snapshot.latestRole === "assistant") {
    return decisionResult({
      ...updated,
      enabled: false,
      taskActive: false,
      taskCompletedAt: chat.taskActive ? now : chat.taskCompletedAt,
      taskCompletionReason: chat.taskActive ? "stop-phrase" : chat.taskCompletionReason,
      nextEligibleAt: null,
      lastObservedFingerprint: fingerprint || chat.lastObservedFingerprint,
      lastStoppedAt: now,
      lastStopReason: "stop-phrase"
    }, "stop-phrase-matched");
  }
  if (!fingerprint) return decisionResult(updated, "no-messages");
  if (chat.lastObservedSessionId !== sessionId) {
    return decisionResult({
      ...updated,
      lastObservedSessionId: sessionId,
      lastObservedFingerprint: fingerprint
    }, "baseline-recorded");
  }
  if (chat.lastObservedFingerprint !== fingerprint) {
    return decisionResult({ ...updated, lastObservedFingerprint: fingerprint }, "response-changed");
  }
  if (snapshot.latestRole !== "assistant") {
    return decisionResult(updated, "waiting-for-assistant");
  }
  if (chat.lastCommandedFingerprint === fingerprint) {
    return decisionResult(updated, "already-continued");
  }
  return {
    chat: { ...updated, lastDecision: "send-continuation" },
    decision: "send-continuation",
    fingerprint
  };
}

export function prepareChatRun(chat, at = new Date().toISOString()) {
  if (!chat.enabled || chat.runStartedAt) return chat;
  return { ...chat, runStartedAt: at };
}

export function startChatRun(chat, { task = false, at = new Date().toISOString() } = {}) {
  return {
    ...chat,
    enabled: true,
    controlRevision: nonNegativeInteger(chat.controlRevision) + 1,
    runStartedAt: at,
    continuationCount: 0,
    taskActive: task,
    taskStartedAt: task ? at : null,
    taskCompletedAt: null,
    taskCompletionReason: null,
    lastDecision: task ? "task-started" : "enabled",
    nextEligibleAt: null,
    lastObservedSessionId: null,
    lastStoppedAt: null,
    lastStopReason: null,
    lastError: null,
    lastTelegramErrorKey: null
  };
}

export function stopChatRun(chat, reason = "manual", at = new Date().toISOString()) {
  return {
    ...chat,
    enabled: false,
    controlRevision: nonNegativeInteger(chat.controlRevision) + 1,
    taskActive: false,
    taskCompletedAt: chat.taskActive ? at : chat.taskCompletedAt,
    taskCompletionReason: chat.taskActive ? String(reason) : chat.taskCompletionReason,
    nextEligibleAt: null,
    lastStoppedAt: at,
    lastStopReason: String(reason),
    lastDecision: `stopped-${String(reason)}`
  };
}

export function completionGuardReason(chat, profile, now = Date.now()) {
  const maxContinuations = boundedInteger(profile?.maxContinuations, MAX_CONTINUATIONS);
  if (maxContinuations > 0 && nonNegativeInteger(chat?.continuationCount) >= maxContinuations) {
    return "continuation-limit";
  }
  const maxRuntimeMinutes = boundedInteger(profile?.maxRuntimeMinutes, MAX_RUNTIME_MINUTES);
  if (maxRuntimeMinutes > 0 && chat?.runStartedAt) {
    const startedAt = Date.parse(chat.runStartedAt);
    if (Number.isFinite(startedAt) && now - startedAt >= maxRuntimeMinutes * 60_000) {
      return "runtime-limit";
    }
  }
  return null;
}

export function applyCompletion(chat, reason, at = new Date().toISOString()) {
  const wasTask = chat.taskActive === true;
  return {
    ...chat,
    enabled: false,
    taskActive: false,
    taskCompletedAt: wasTask ? at : chat.taskCompletedAt,
    taskCompletionReason: wasTask ? String(reason) : chat.taskCompletionReason,
    nextEligibleAt: null,
    lastStoppedAt: at,
    lastStopReason: String(reason),
    lastDecision: `stopped-${String(reason)}`
  };
}

export function isChatDue(chat, now = Date.now()) {
  if (!chat?.enabled) return false;
  const next = Date.parse(String(chat.nextEligibleAt || ""));
  return !Number.isFinite(next) || next <= now;
}

export function scheduleNextChatCheck(chat, intervalMinutes, now = Date.now()) {
  if (!chat.enabled) return { ...chat, nextEligibleAt: null };
  return {
    ...chat,
    nextEligibleAt: new Date(now + clampInterval(intervalMinutes) * 60_000).toISOString()
  };
}

export function planTabRecovery({ tab, snapshot, chat, intervalMinutes, now = Date.now() }) {
  if (!tab || !Number.isInteger(tab.id)) return { refresh: true, reason: "missing-tab" };
  if (tab.discarded === true) return { refresh: true, reason: "discarded-tab" };
  if (tab.frozen === true) return { refresh: true, reason: "frozen-tab" };

  if (tab.active === true) return { refresh: false, reason: null };
  if (!snapshot) return { refresh: true, reason: "content-unreachable" };

  const hasDraft = snapshot.hasDraft === true;
  if (hasDraft) return { refresh: false, reason: null };
  if (snapshot.errorDetected) return { refresh: true, reason: "page-error" };

  const generationAgeMs = finiteNonNegative(snapshot.generationAgeMs);
  if (snapshot.isGenerating && generationAgeMs >= STUCK_GENERATION_MS) {
    return { refresh: true, reason: "stuck-generation" };
  }
  if (snapshot.isGenerating) return { refresh: false, reason: null };

  const lastRefreshMs = timestampOrZero(chat?.lastHardRefreshAt);
  const elapsedMs = Math.max(0, now - lastRefreshMs);
  if (elapsedMs >= refreshIntervalMs(intervalMinutes)) {
    return { refresh: true, reason: "periodic-freshness" };
  }
  return { refresh: false, reason: null };
}

export function recordRecovery(chat, reason, at = new Date().toISOString()) {
  return {
    ...chat,
    lastHardRefreshAt: at,
    lastRecoveryAt: at,
    lastRecoveryReason: String(reason || "unknown"),
    staleRecoveries: nonNegativeInteger(chat?.staleRecoveries) + 1,
    lastError: null
  };
}

export function recordDispatch(chat, fingerprint, outcome, at = new Date().toISOString()) {
  return {
    ...chat,
    continuationCount: nonNegativeInteger(chat.continuationCount) + 1,
    lastCommandedFingerprint: fingerprint,
    lastCommandAt: at,
    lastDispatchOutcome: outcome,
    lastError: outcome === "confirmed" ? null : "Отправка нажата, но DOM не подтвердил сообщение"
  };
}

export function mergeRuntimeState(observedState, latestState) {
  const observedById = new Map(observedState.chats.map((chat) => [chat.id, chat]));
  return {
    ...latestState,
    checkInProgress: false,
    lastCheckAt: observedState.lastCheckAt,
    logs: mergeLogs(latestState.logs, observedState.logs),
    chats: latestState.chats.map((latestChat) => {
      const observed = observedById.get(latestChat.id);
      if (!observed) return latestChat;
      const sameControlRevision = nonNegativeInteger(observed.controlRevision)
        === nonNegativeInteger(latestChat.controlRevision);
      if (!sameControlRevision) return latestChat;
      const runtimeAutoStop = observed.enabled === false
        && ["stop-phrase", "continuation-limit", "runtime-limit"].includes(observed.lastStopReason);
      return {
        ...latestChat,
        enabled: runtimeAutoStop ? false : latestChat.enabled,
        runStartedAt: observed.runStartedAt,
        continuationCount: observed.continuationCount,
        taskActive: runtimeAutoStop ? false : observed.taskActive,
        taskStartedAt: observed.taskStartedAt,
        taskCompletedAt: runtimeAutoStop ? observed.taskCompletedAt : latestChat.taskCompletedAt,
        taskCompletionReason: runtimeAutoStop ? observed.taskCompletionReason : latestChat.taskCompletionReason,
        lastDecision: observed.lastDecision,
        nextEligibleAt: runtimeAutoStop ? null : observed.nextEligibleAt,
        lastTelegramErrorKey: observed.lastTelegramErrorKey,
        tabId: observed.tabId,
        lastObservedFingerprint: observed.lastObservedFingerprint,
        lastCommandedFingerprint: observed.lastCommandedFingerprint,
        lastObservedAt: observed.lastObservedAt,
        lastCommandAt: observed.lastCommandAt,
        lastDispatchOutcome: observed.lastDispatchOutcome,
        lastObservedSessionId: observed.lastObservedSessionId,
        lastSnapshotAt: observed.lastSnapshotAt,
        lastHardRefreshAt: observed.lastHardRefreshAt,
        lastRecoveryAt: observed.lastRecoveryAt,
        lastRecoveryReason: observed.lastRecoveryReason,
        staleRecoveries: observed.staleRecoveries,
        lastStoppedAt: runtimeAutoStop ? observed.lastStoppedAt : latestChat.lastStoppedAt,
        lastStopReason: runtimeAutoStop ? observed.lastStopReason : latestChat.lastStopReason,
        lastError: observed.lastError
      };
    })
  };
}

export function normalizeStopPhrase(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_STOP_PHRASE_LENGTH);
}

export function createPortableConfig(state, exportedAt = new Date().toISOString()) {
  const normalized = normalizeState(state);
  return {
    format: PORTABLE_CONFIG_FORMAT,
    version: PORTABLE_CONFIG_VERSION,
    exportedAt,
    credentialsIncluded: false,
    runtimeStateIncluded: false,
    defaults: {
      intervalMinutes: normalized.intervalMinutes,
      commandText: normalized.commandText,
      stopPhrase: normalized.stopPhrase,
      theme: normalized.theme
    },
    chats: normalized.chats.map((chat) => ({
      title: chat.title,
      url: chat.url,
      enabled: chat.enabled,
      profile: normalizeChatProfile(chat.profile)
    }))
  };
}

export function applyPortableConfig(raw, at = new Date().toISOString()) {
  if (!raw || typeof raw !== "object") throw new Error("Файл конфигурации ChatPulse повреждён.");
  if (raw.format !== PORTABLE_CONFIG_FORMAT || Number(raw.version) !== PORTABLE_CONFIG_VERSION) {
    throw new Error("Неподдерживаемый формат конфигурации ChatPulse.");
  }
  if (!Array.isArray(raw.chats)) throw new Error("В конфигурации отсутствует список чатов.");
  if (raw.chats.length > MAX_CHAT_COUNT) {
    throw new Error(`Конфигурация содержит больше ${MAX_CHAT_COUNT} чатов.`);
  }

  const next = defaultState();
  next.enabled = false;
  next.intervalMinutes = clampInterval(raw.defaults?.intervalMinutes ?? next.intervalMinutes);
  next.commandText = typeof raw.defaults?.commandText === "string" && raw.defaults.commandText.trim()
    ? raw.defaults.commandText.trim().slice(0, 4_000)
    : DEFAULT_COMMAND;
  next.stopPhrase = normalizeStopPhrase(raw.defaults?.stopPhrase);
  next.theme = raw.defaults?.theme === "preview" ? "preview" : "macos";
  next.sessionId = createSessionId();
  next.logs = [];
  next.chats = raw.chats.map((rawChat) => {
    const chat = createChat({
      title: rawChat?.title,
      url: rawChat?.url,
      tabId: null,
      now: at
    });
    return {
      ...chat,
      enabled: rawChat?.enabled !== false,
      profile: normalizeChatProfile(rawChat?.profile),
      runStartedAt: null,
      continuationCount: 0,
      taskActive: false,
      taskStartedAt: null,
      taskCompletedAt: null,
      taskCompletionReason: null,
      lastObservedSessionId: null,
      lastObservedFingerprint: null,
      lastCommandedFingerprint: null,
      nextEligibleAt: null,
      tabId: null
    };
  });
  return next;
}

function decisionResult(chat, decision) {
  return { chat: { ...chat, lastDecision: decision }, decision };
}

function mergeLogs(latestLogs, observedLogs) {
  const byId = new Map();
  for (const log of [...latestLogs, ...observedLogs]) {
    if (!isValidLog(log)) continue;
    const key = typeof log.id === "string" && log.id
      ? log.id
      : `${log.at || ""}|${log.level || ""}|${log.message}`;
    byId.set(key, log);
  }
  return [...byId.values()]
    .sort((left, right) => String(left.at || "").localeCompare(String(right.at || "")))
    .slice(-MAX_LOG_ENTRIES);
}

function timestampOrZero(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function finiteNonNegative(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function boundedInteger(value, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(Math.trunc(parsed), 0), maximum);
}

function nonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function stringOrNull(value) {
  return typeof value === "string" && value.length ? value : null;
}

function isValidLog(value) {
  return value && typeof value === "object" && typeof value.message === "string";
}
