#!/usr/bin/env python3
from pathlib import Path


def replace_once(path_str, old, new, label):
    path = Path(path_str)
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one block, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")
    print(f"patched: {label}")


# ---------- model-v2.js ----------
replace_once(
    "chrome-extension/lib/model-v2.js",
    '''export function hasCompletionGuard(profile) {
  return Boolean(normalizeStopPhrase(profile?.stopPhrase))
    || boundedInteger(profile?.maxContinuations, MAX_CONTINUATIONS) > 0
    || boundedInteger(profile?.maxRuntimeMinutes, MAX_RUNTIME_MINUTES) > 0;
}

export function createChat({ title, url, tabId = null, now = new Date().toISOString() }) {''',
    '''export function hasCompletionGuard(profile) {
  return Boolean(normalizeStopPhrase(profile?.stopPhrase))
    || boundedInteger(profile?.maxContinuations, MAX_CONTINUATIONS) > 0
    || boundedInteger(profile?.maxRuntimeMinutes, MAX_RUNTIME_MINUTES) > 0;
}

export function applyGlobalSettingsPatch(state, patch = {}) {
  const next = { ...state };
  const previousCommand = state.commandText || DEFAULT_COMMAND;
  const previousInterval = clampInterval(state.intervalMinutes);
  const previousStopPhrase = normalizeStopPhrase(state.stopPhrase);

  if (Object.hasOwn(patch, "intervalMinutes")) {
    next.intervalMinutes = clampInterval(patch.intervalMinutes);
  }
  if (typeof patch.commandText === "string" && patch.commandText.trim()) {
    next.commandText = patch.commandText.trim().slice(0, 4_000);
  }
  if (Object.hasOwn(patch, "stopPhrase")) {
    next.stopPhrase = normalizeStopPhrase(patch.stopPhrase);
  }
  if (patch.theme === "macos" || patch.theme === "preview") {
    next.theme = patch.theme;
  }

  const commandChanged = (next.commandText || DEFAULT_COMMAND) !== previousCommand;
  const intervalChanged = clampInterval(next.intervalMinutes) !== previousInterval;
  const stopChanged = normalizeStopPhrase(next.stopPhrase) !== previousStopPhrase;

  next.chats = state.chats.map((chat) => {
    const profile = normalizeChatProfile(chat.profile);
    const inheritsChangedSetting = (commandChanged && profile.commandText === null)
      || (intervalChanged && profile.intervalMinutes === null)
      || (stopChanged && profile.stopPhrase === null);
    return inheritsChangedSetting
      ? {
          ...chat,
          controlRevision: nonNegativeInteger(chat.controlRevision) + 1,
          nextEligibleAt: null
        }
      : chat;
  });

  for (const chat of next.chats) {
    if (chat.taskActive && !hasCompletionGuard(effectiveChatProfile(next, chat))) {
      throw new Error(`Активная задача «${chat.title}» потеряет последний guard. Сначала задайте стоп-фразу, лимит продолжений или лимит времени.`);
    }
  }
  return next;
}

export function stopTaskMode(chat, reason = "manual-task-stop", at = new Date().toISOString()) {
  if (!chat.taskActive) return chat;
  return {
    ...chat,
    taskActive: false,
    taskCompletedAt: at,
    taskCompletionReason: String(reason),
    nextEligibleAt: null,
    lastDecision: `task-stopped-${String(reason)}`
  };
}

export function createChat({ title, url, tabId = null, now = new Date().toISOString() }) {''',
    "global settings + task mode helpers",
)

replace_once(
    "chrome-extension/lib/model-v2.js",
    '''    schemaVersion: 4,
    enabled: false,
    checkInProgress: false,''',
    '''    schemaVersion: 4,
    enabled: false,
    taskOnly: false,
    checkInProgress: false,''',
    "default taskOnly state",
)

replace_once(
    "chrome-extension/lib/model-v2.js",
    '''    schemaVersion: 4,
    enabled: raw?.enabled === true,
    checkInProgress: raw?.checkInProgress === true,''',
    '''    schemaVersion: 4,
    enabled: raw?.enabled === true,
    taskOnly: raw?.taskOnly === true,
    checkInProgress: raw?.checkInProgress === true,''',
    "normalize taskOnly state",
)

replace_once(
    "chrome-extension/lib/model-v2.js",
    '''  next.logs = [];
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
  return next;''',
    '''  next.logs = [];
  const seenURLs = new Set();
  next.chats = raw.chats.map((rawChat) => {
    const chat = createChat({
      title: rawChat?.title,
      url: rawChat?.url,
      tabId: null,
      now: at
    });
    if (seenURLs.has(chat.url)) {
      throw new Error("Конфигурация содержит один и тот же чат несколько раз.");
    }
    seenURLs.add(chat.url);
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
  return next;''',
    "reject duplicate portable chat URLs",
)

# ---------- service-worker-v2.js ----------
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  appendLog,
  applyCompletion,
  applyPortableConfig,
  clampInterval,''',
    '''  appendLog,
  applyCompletion,
  applyGlobalSettingsPatch,
  applyPortableConfig,
  clampInterval,''',
    "import global settings patch helper",
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  scheduleNextChatCheck,
  startChatRun,
  stopChatRun''',
    '''  scheduleNextChatCheck,
  startChatRun,
  stopChatRun,
  stopTaskMode''',
    "import task mode stop helper",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''      state = appendLog({
        ...state,
        enabled: true,
        sessionId: createSessionId()
      }, "info", "Наблюдение запущено");''',
    '''      state = {
        ...state,
        chats: state.chats.map((chat) => chat.enabled
          ? startChatRun(chat, { task: false })
          : chat)
      };
      state = appendLog({
        ...state,
        enabled: true,
        taskOnly: false,
        sessionId: createSessionId()
      }, "info", "Наблюдение запущено");''',
    "normal monitoring starts fresh runs",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    case "STOP_MONITORING": {
      let state = await loadState();
      const activeTasks = state.chats.filter((chat) => chat.taskActive).length;
      state = appendLog({
        ...state,
        enabled: false,
        checkInProgress: false
      }, "info", activeTasks > 0
        ? "Обычное наблюдение остановлено; активные задачи продолжаются"
        : "Наблюдение остановлено");
      state = await configureAlarm(state);
      await persistAndPublish(state);
      return { state };
    }''',
    '''    case "STOP_MONITORING": {
      let state = await loadState();
      state = {
        ...state,
        enabled: false,
        taskOnly: false,
        checkInProgress: false,
        chats: state.chats.map((chat) => stopTaskMode(chat, "global-stop"))
      };
      state = appendLog(state, "info", "ChatPulse полностью остановлен; активные задачи завершены общим Stop");
      state = await configureAlarm(state);
      await persistAndPublish(state);
      return { state };
    }''',
    "master stop semantics",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    case "REMOVE_CHAT":
      return { state: await mutateChat(message.chatId, (state, index) => {''',
    '''    case "REMOVE_CHAT":
      assertIdentityMutationSafe();
      return { state: await mutateChat(message.chatId, (state, index) => {''',
    "block remove during active check",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''      state.chats[index] = startChatRun(state.chats[index], { task: true });
      state = appendLog(state, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);
      state = await configureAlarm(state);
      await persistAndPublish(state);
      state = await notifyChatEvent(state, state.chats[index], "task-started");
      await persistAndPublish(state);
      void runCheck("task-start");''',
    '''      state.chats[index] = startChatRun(state.chats[index], { task: true });
      const selectedChatId = state.chats[index].id;
      state = appendLog({
        ...state,
        enabled: true,
        taskOnly: state.enabled ? state.taskOnly === true : true
      }, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);
      state = await configureAlarm(state);
      await persistAndPublish(state);
      state = await notifyChatEvent(state, state.chats[index], "task-started");
      await persistAndPublish(state);
      void runCheck("task-start", false, selectedChatId);''',
    "task-only start + targeted immediate check",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''        const chat = state.chats[index];
        state.chats[index] = stopChatRun(chat, "manual-task-stop");
        return appendLog(state, "info", `Задача «${chat.title}» остановлена вручную`);''',
    '''        const chat = state.chats[index];
        state.chats[index] = stopTaskMode(chat, "manual-task-stop");
        return appendLog(state, "info", `Задача «${chat.title}» остановлена вручную`);''',
    "manual task stop keeps chat enabled",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    case "UPDATE_SETTINGS": {
      const patch = message.patch || {};
      await updateTelegramConfig(patch);
      return { state: await updateSettings(patch) };
    }''',
    '''    case "UPDATE_SETTINGS": {
      const patch = message.patch || {};
      return { state: await updateSettings(patch) };
    }''',
    "validate global settings before Telegram mutation",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    case "IMPORT_CONFIG": {
      let state = applyPortableConfig(message.config);''',
    '''    case "IMPORT_CONFIG": {
      assertIdentityMutationSafe();
      let state = applyPortableConfig(message.config);''',
    "block import during active check",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''async function updateSettings(patch) {
  let state = await loadState();
  if (Object.hasOwn(patch, "intervalMinutes")) {
    state.intervalMinutes = clampInterval(patch.intervalMinutes);
  }
  if (typeof patch.commandText === "string" && patch.commandText.trim()) {
    state.commandText = patch.commandText.trim();
  }
  if (Object.hasOwn(patch, "stopPhrase")) {
    state.stopPhrase = normalizeStopPhrase(patch.stopPhrase);
  }
  if (patch.theme === "macos" || patch.theme === "preview") {
    state.theme = patch.theme;
  }
  state = appendLog(state, "info", "Общие настройки ChatPulse обновлены");
  state = await configureAlarm(state);
  await persistAndPublish(state);
  return state;
}''',
    '''async function updateSettings(patch) {
  let state = await loadState();
  state = applyGlobalSettingsPatch(state, patch);
  await updateTelegramConfig(patch);
  state = appendLog(state, "info", "Общие настройки ChatPulse обновлены");
  state = await configureAlarm(state);
  await persistAndPublish(state);
  return state;
}''',
    "global inherited settings safety",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''async function runCheck(source, allowWhenStopped = false) {
  if (activeCheck) return activeCheck;
  activeCheck = performCheck(source, allowWhenStopped).finally(() => {
    activeCheck = null;
  });
  return activeCheck;
}

async function performCheck(source, allowWhenStopped) {
  let observedState = await loadState();
  const hasActiveTasks = observedState.chats.some((chat) => chat.enabled && chat.taskActive);
  if (!observedState.enabled && !hasActiveTasks && !allowWhenStopped) return;''',
    '''async function runCheck(source, allowWhenStopped = false, onlyChatId = null) {
  if (activeCheck) return activeCheck;
  activeCheck = performCheck(source, allowWhenStopped, onlyChatId).finally(() => {
    activeCheck = null;
  });
  return activeCheck;
}

async function performCheck(source, allowWhenStopped, onlyChatId = null) {
  let observedState = await loadState();
  if (!observedState.enabled && !allowWhenStopped) return;''',
    "targetable checks + master engine gate",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    let chat = observedState.chats[index];
    if (!chat.enabled) continue;
    if (!observedState.enabled && !chat.taskActive && !allowWhenStopped) continue;
    if (!bypassSchedule && !isChatDue(chat)) continue;''',
    '''    let chat = observedState.chats[index];
    if (onlyChatId && chat.id !== onlyChatId) continue;
    if (!chat.enabled) continue;
    if (observedState.taskOnly && !chat.taskActive && !allowWhenStopped) continue;
    if (!bypassSchedule && !isChatDue(chat)) continue;''',
    "task-only loop isolation",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''      const sameControlRevision = Number(liveChat?.controlRevision || 0)
        === Number(observedState.chats[index].controlRevision || 0);
      if (!liveChat?.enabled || !sameControlRevision || (!latestState.enabled && !liveChat.taskActive && !allowWhenStopped)) {''',
    '''      const sameControlRevision = Number(liveChat?.controlRevision || 0)
        === Number(observedState.chats[index].controlRevision || 0);
      const sameSession = latestState.sessionId === observedState.sessionId;
      const engineAllowsChat = latestState.enabled
        && (!latestState.taskOnly || liveChat?.taskActive === true);
      if (!liveChat?.enabled || !sameControlRevision || !sameSession || (!engineAllowsChat && !allowWhenStopped)) {''',
    "live session/control/task-only send gate",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''async function configureAlarm(state) {
  await chrome.alarms.clear(ALARM_NAME);
  const globalInterval = clampInterval(state.intervalMinutes);
  const eligibleChats = state.chats.filter((chat) => chat.enabled && (state.enabled || chat.taskActive));
  const engineActive = state.enabled || eligibleChats.length > 0;
  if (!engineActive) return { ...state, intervalMinutes: globalInterval, nextCheckAt: null };

  const enabledIntervals = eligibleChats
    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);''',
    '''async function configureAlarm(state) {
  await chrome.alarms.clear(ALARM_NAME);
  const globalInterval = clampInterval(state.intervalMinutes);
  if (!state.enabled) {
    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }

  const eligibleChats = state.chats.filter((chat) => chat.enabled && (!state.taskOnly || chat.taskActive));
  if (state.taskOnly && eligibleChats.length === 0) {
    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }
  const enabledIntervals = eligibleChats
    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);''',
    "master/taskOnly alarm scheduling",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''async function updateBadge(state) {
  const activeTasks = state.chats.filter((chat) => chat.taskActive).length;
  const text = state.checkInProgress ? "…" : activeTasks > 0 ? String(Math.min(activeTasks, 99)) : state.enabled ? "ON" : "";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({
    color: state.checkInProgress ? "#9B5CFF" : activeTasks > 0 ? "#31C48D" : "#2C8CFF"
  });
  await chrome.action.setTitle({
    title: state.enabled
      ? `ChatPulse работает · ${state.chats.filter((chat) => chat.enabled).length} чатов · ${activeTasks} задач`
      : "ChatPulse остановлен"
  });
}''',
    '''async function updateBadge(state) {
  const activeTasks = state.chats.filter((chat) => chat.taskActive).length;
  const text = state.checkInProgress
    ? "…"
    : state.enabled && state.taskOnly
      ? String(Math.min(activeTasks, 99))
      : state.enabled
        ? "ON"
        : "";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({
    color: state.checkInProgress ? "#9B5CFF" : state.taskOnly ? "#31C48D" : "#2C8CFF"
  });
  await chrome.action.setTitle({
    title: !state.enabled
      ? "ChatPulse остановлен"
      : state.taskOnly
        ? `ChatPulse: работают только задачи · ${activeTasks}`
        : `ChatPulse работает · ${state.chats.filter((chat) => chat.enabled).length} чатов · ${activeTasks} задач`
  });
}''',
    "badge taskOnly status",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''function decisionLevel(decision) {''',
    '''function assertIdentityMutationSafe() {
  if (activeCheck) {
    throw new Error("Дождитесь завершения текущей проверки перед удалением чата или импортом конфигурации.");
  }
}

function decisionLevel(decision) {''',
    "identity mutation race guard",
)
