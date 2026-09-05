import {
  appendLog,
  applyCompletion,
  applyGlobalSettingsPatch,
  applyPortableConfig,
  clampInterval,
  completionGuardReason,
  createChat,
  createPortableConfig,
  createSessionId,
  decide,
  defaultState,
  effectiveChatProfile,
  GITHUB_POLL_INTERVAL_MINUTES,
  githubWatchdogDecision,
  hasCompletionGuard,
  isChatDue,
  MAX_GITHUB_WATCHED_REPOSITORIES,
  mergeDispatchCheckpoint,
  mergeRuntimeState,
  normalizeChatProfile,
  normalizeChatURL,
  normalizeGithubRepository,
  normalizeState,
  normalizeStopPhrase,
  planTabRecovery,
  prepareChatRun,
  recordDispatch,
  recordGithubActionsObservation,
  recordGithubRestart,
  recordGithubWatchError,
  recordRecovery,
  resetGithubWatchRuntime,
  scheduleNextChatCheck,
  shouldPollGithubRepository,
  startChatRun,
  stopChatRun,
  stopTaskMode
} from "../lib/model-v2.js";
import {
  attachTelegramState,
  notifyTelegramEvent,
  sendTelegramTest,
  updateTelegramConfig
} from "./telegram.js";
import {
  fetchLatestGithubWorkflowRun,
  hasGithubApiPermission
} from "./github-actions.js";
import {
  replaceBackgroundTab,
  tabRecoveryMode
} from "./tab-recovery.js";

const STORAGE_KEY = "chatpulseState";
const ALARM_NAME = "chatpulse-monitor";
const GITHUB_ALARM_NAME = "chatpulse-github-actions-watchdog";
const CHATGPT_PATTERNS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];
const TAB_LOAD_TIMEOUT_MS = 45_000;
const HYDRATION_TIMEOUT_MS = 20_000;
const CONTENT_MESSAGE_TIMEOUT_MS = 4_000;
const POST_RECOVERY_SETTLE_MS = 750;
let activeCheck = null;

chrome.runtime.onInstalled.addListener(() => {
  void initialize("Установлено расширение ChatPulse");
});

chrome.runtime.onStartup.addListener(() => {
  void initialize("Chrome запущен: создана новая безопасная сессия наблюдения");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void runCheck("alarm");
  if (alarm.name === GITHUB_ALARM_NAME) void runCheck("github-watchdog");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(async (result) => {
      const response = result?.state
        ? { ...result, state: await attachTelegramState(result.state) }
        : result;
      sendResponse({ ok: true, ...response });
    })
    .catch((error) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }));
  return true;
});

async function initialize(message) {
  let state = await loadState();
  state = appendLog({
    ...state,
    checkInProgress: false,
    sessionId: createSessionId()
  }, "info", message);
  state = await configureAlarm(state);
  await persistAndPublish(state);
}

async function handleMessage(message) {
  switch (message?.type) {
    case "GET_STATE":
      return { state: await loadState() };

    case "START_MONITORING": {
      let state = await loadState();
      state = {
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
      }, "info", "Наблюдение запущено");
      state = await configureAlarm(state);
      await persistAndPublish(state);
      void runCheck("start").then(() => runCheck("github-watchdog-start"));
      return { state };
    }

    case "STOP_MONITORING": {
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
    }

    case "CHECK_NOW":
      await runCheck("manual", true);
      await runCheck("github-watchdog-manual");
      return { state: await loadState() };

    case "ADD_CURRENT_CHAT":
      return { state: await addCurrentChat(message.tabId) };

    case "REMOVE_CHAT":
      assertIdentityMutationSafe();
      return { state: await mutateChat(message.chatId, (state, index) => {
        const [removed] = state.chats.splice(index, 1);
        return appendLog(state, "info", `Чат «${removed.title}» удалён из ChatPulse`);
      }) };

    case "TOGGLE_CHAT":
      return { state: await mutateChat(message.chatId, (state, index) => {
        const current = state.chats[index];
        state.chats[index] = current.enabled
          ? stopChatRun(current, "manual")
          : startChatRun(current, { task: false });
        const chat = state.chats[index];
        return appendLog(
          state,
          "info",
          `${chat.enabled ? "Включено" : "Отключено"} наблюдение за «${chat.title}»`
        );
      }) };

    case "UPDATE_CHAT_PROFILE": {
      const state = await updateChatProfile(message.chatId, message.profile || {});
      const chat = state.chats.find((candidate) => candidate.id === message.chatId);
      if (state.enabled && chat && effectiveChatProfile(state, chat).githubWatchEnabled) {
        void runCheck("github-watchdog-profile");
      }
      return { state };
    }

    case "START_TASK": {
      let state = await loadState();
      const index = state.chats.findIndex((chat) => chat.id === message.chatId);
      if (index < 0) throw new Error("Чат не найден.");
      const profile = effectiveChatProfile(state, state.chats[index]);
      if (!hasCompletionGuard(profile)) {
        throw new Error("Для запуска задачи задайте стоп-фразу, лимит продолжений или лимит времени.");
      }
      state.chats[index] = startChatRun(state.chats[index], { task: true });
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
      void runCheck("task-start", false, selectedChatId)
        .then(() => runCheck("github-watchdog-task-start"));
      return { state };
    }

    case "STOP_TASK":
      return { state: await mutateChat(message.chatId, (state, index) => {
        const chat = state.chats[index];
        state.chats[index] = stopTaskMode(chat, "manual-task-stop");
        return appendLog(state, "info", `Задача «${chat.title}» остановлена вручную`);
      }) };

    case "OPEN_CHAT": {
      const state = await loadState();
      const chat = state.chats.find((candidate) => candidate.id === message.chatId);
      if (!chat) throw new Error("Чат не найден.");
      const tab = await ensureChatTab(chat);
      if (!Number.isInteger(tab.id)) throw new Error("Chrome не вернул идентификатор вкладки.");
      const opened = await chrome.tabs.update(tab.id, { active: true });
      chat.tabId = tab.id;
      try {
        if (Number.isInteger(opened?.windowId ?? tab.windowId)) {
          await chrome.windows.update(opened?.windowId ?? tab.windowId, { focused: true });
        }
      } catch {
        // Активация вкладки уже выполнена; фокус окна является необязательным улучшением.
      }
      await persistAndPublish(state);
      return { state };
    }

    case "UPDATE_SETTINGS": {
      const patch = message.patch || {};
      return { state: await updateSettings(patch) };
    }

    case "TEST_TELEGRAM":
      await sendTelegramTest();
      return { state: await loadState() };

    case "EXPORT_CONFIG": {
      const state = await loadState();
      return { config: createPortableConfig(state) };
    }

    case "IMPORT_CONFIG": {
      assertIdentityMutationSafe();
      let state = applyPortableConfig(message.config);
      assertGithubWatchCapacity(state);
      state = appendLog(state, "info", "Портативная конфигурация импортирована; мониторинг оставлен остановленным для безопасного baseline");
      await chrome.alarms.clear(ALARM_NAME);
      await chrome.alarms.clear(GITHUB_ALARM_NAME);
      state = await configureAlarm(state);
      await persistAndPublish(state);
      return { state };
    }

    case "CLEAR_LOGS": {
      const state = { ...(await loadState()), logs: [] };
      await persistAndPublish(state);
      return { state };
    }

    default:
      throw new Error("Неизвестная команда расширения.");
  }
}

async function addCurrentChat(preferredTabId = null) {
  const tab = await resolveChatTab(preferredTabId);
  const normalizedURL = normalizeChatURL(tab.url);
  if (!Number.isInteger(tab.id) || !normalizedURL) {
    throw new Error("Откройте хотя бы один конкретный чат ChatGPT в Chrome.");
  }

  await protectManagedTab(tab.id);
  let title = tab.title || "Чат ChatGPT";
  try {
    const response = await sendToContent(tab.id, { type: "CHATPULSE_INSPECT" }, { attempts: 2 });
    if (response?.snapshot?.title) title = response.snapshot.title;
  } catch {
    // Заголовок вкладки используется как безопасный fallback.
  }

  let state = await loadState();
  const index = state.chats.findIndex((chat) => chat.url === normalizedURL);
  if (index >= 0) {
    state.chats[index] = {
      ...startChatRun(state.chats[index], { task: false }),
      title,
      tabId: tab.id,
      lastHardRefreshAt: new Date().toISOString()
    };
    state = appendLog(state, "info", `Чат «${title}» обновлён и включён`);
  } else {
    state.chats.push(createChat({ title, url: normalizedURL, tabId: tab.id }));
    state = appendLog(state, "info", `Добавлен чат «${title}»`);
  }

  state = await configureAlarm(state);
  await persistAndPublish(state);
  return state;
}

async function resolveChatTab(preferredTabId = null) {
  if (Number.isInteger(preferredTabId)) {
    try {
      const preferred = await chrome.tabs.get(preferredTabId);
      if (normalizeChatURL(preferred.url)) return preferred;
    } catch {
      // Переданная вкладка могла быть закрыта до обработки команды.
    }
  }

  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (Number.isInteger(active?.id) && normalizeChatURL(active.url)) return active;

  const candidates = (await chrome.tabs.query({ url: CHATGPT_PATTERNS }))
    .filter((candidate) => Number.isInteger(candidate.id) && normalizeChatURL(candidate.url))
    .sort((left, right) => {
      const activeDifference = Number(right.active === true) - Number(left.active === true);
      if (activeDifference) return activeDifference;
      const accessedDifference = Number(right.lastAccessed || 0) - Number(left.lastAccessed || 0);
      if (accessedDifference) return accessedDifference;
      return Number(right.id || 0) - Number(left.id || 0);
    });

  if (!candidates.length) {
    throw new Error("Откройте конкретный чат ChatGPT, затем повторите добавление.");
  }
  return candidates[0];
}

async function updateSettings(patch) {
  let state = await loadState();
  state = applyGlobalSettingsPatch(state, patch);
  await updateTelegramConfig(patch);
  state = appendLog(state, "info", "Общие настройки ChatPulse обновлены");
  state = await configureAlarm(state);
  await persistAndPublish(state);
  return state;
}

async function mutateChat(chatId, mutator) {
  let state = await loadState();
  const index = state.chats.findIndex((chat) => chat.id === chatId);
  if (index < 0) throw new Error("Чат не найден.");
  state = mutator(state, index) || state;
  state = await configureAlarm(state);
  await persistAndPublish(state);
  return state;
}

async function updateChatProfile(chatId, profilePatch) {
  let state = await loadState();
  const index = state.chats.findIndex((chat) => chat.id === chatId);
  if (index < 0) throw new Error("Чат не найден.");

  const current = state.chats[index];
  const requestedProfile = { ...current.profile, ...(profilePatch || {}) };
  if (requestedProfile.githubWatchEnabled === true && !normalizeGithubRepository(requestedProfile.githubRepository)) {
    throw new Error("Для GitHub Actions watchdog укажите repository в формате owner/repo.");
  }
  const profile = normalizeChatProfile(requestedProfile);
  const previousProfile = normalizeChatProfile(current.profile);
  const watchdogChanged = previousProfile.githubWatchEnabled !== profile.githubWatchEnabled
    || previousProfile.githubRepository !== profile.githubRepository
    || previousProfile.githubIdleMinutes !== profile.githubIdleMinutes;

  let candidate = {
    ...current,
    profile,
    controlRevision: Number(current.controlRevision || 0) + 1,
    nextEligibleAt: null
  };
  if (watchdogChanged) candidate = resetGithubWatchRuntime(candidate);
  if (candidate.taskActive && !hasCompletionGuard(effectiveChatProfile(state, candidate))) {
    throw new Error("Активная задача должна иметь стоп-фразу, лимит продолжений или лимит времени.");
  }
  state.chats[index] = candidate;
  assertGithubWatchCapacity(state);
  state = appendLog(state, "info", `Профиль «${current.title}» обновлён`);
  state = await configureAlarm(state);
  await persistAndPublish(state);
  return state;
}

function assertGithubWatchCapacity(state) {
  const repositories = new Set();
  for (const chat of state.chats) {
    const profile = effectiveChatProfile(state, chat);
    if (profile.githubWatchEnabled && profile.githubRepository) repositories.add(profile.githubRepository);
  }
  if (repositories.size > MAX_GITHUB_WATCHED_REPOSITORIES) {
    throw new Error(`GitHub Actions watchdog поддерживает не более ${MAX_GITHUB_WATCHED_REPOSITORIES} уникальных repositories.`);
  }
}

async function runCheck(source, allowWhenStopped = false, onlyChatId = null) {
  if (activeCheck) return activeCheck;
  activeCheck = performCheck(source, allowWhenStopped, onlyChatId).finally(() => {
    activeCheck = null;
  });
  return activeCheck;
}

async function performCheck(source, allowWhenStopped, onlyChatId = null) {
  if (source.startsWith("github-watchdog")) {
    return performGithubWatchdog(source);
  }
  let observedState = await loadState();
  if (!observedState.enabled && !allowWhenStopped) return;

  observedState = appendLog(
    { ...observedState, checkInProgress: true },
    "debug",
    `Начата ${source === "manual" ? "ручная" : "плановая"} проверка`
  );
  await persistAndPublish(observedState);

  const bypassSchedule = source !== "alarm";
  for (let index = 0; index < observedState.chats.length; index += 1) {
    let chat = observedState.chats[index];
    if (onlyChatId && chat.id !== onlyChatId) continue;
    if (!chat.enabled) continue;
    if (observedState.taskOnly && !chat.taskActive && !allowWhenStopped) continue;
    if (!bypassSchedule && !isChatDue(chat)) continue;

    let profile = effectiveChatProfile(observedState, chat);
    chat = prepareChatRun(chat);
    observedState.chats[index] = chat;
    await persistRunStartCheckpoint(chat);

    const preCheckGuard = completionGuardReason(chat, profile);
    if (preCheckGuard) {
      observedState.chats[index] = applyCompletion(chat, preCheckGuard);
      observedState = appendLog(
        observedState,
        "info",
        `${chat.title}: ${completionDescription(preCheckGuard)}`
      );
      observedState = await notifyChatEvent(observedState, observedState.chats[index], preCheckGuard);
      continue;
    }

    const previousError = chat.lastError;
    try {
      let tab = await ensureChatTab(chat);
      chat.tabId = tab.id ?? null;

      const freshness = await obtainFreshSnapshot({
        tab,
        chat,
        intervalMinutes: profile.intervalMinutes,
        stopPhrase: profile.stopPhrase
      });
      tab = freshness.tab;
      let runtimeChat = { ...chat, tabId: tab.id ?? null };
      if (freshness.recoveryReason) {
        runtimeChat = recordRecovery(runtimeChat, freshness.recoveryReason);
        observedState = appendLog(
          observedState,
          "info",
          `${chat.title}: вкладка восстановлена (${recoveryDescription(freshness.recoveryReason)})`
        );
      }

      const result = decide(runtimeChat, freshness.snapshot, observedState.sessionId);
      observedState.chats[index] = scheduleNextChatCheck(
        result.chat,
        profile.intervalMinutes
      );
      observedState = appendLog(
        observedState,
        decisionLevel(result.decision),
        `${chat.title}: ${decisionDescription(result.decision)}`
      );

      if (result.decision === "stop-phrase-matched") {
        observedState = await notifyChatEvent(
          observedState,
          observedState.chats[index],
          "stop-phrase"
        );
        continue;
      }
      if (result.decision !== "send-continuation") continue;

      const latestState = await loadState();
      const liveChat = latestState.chats.find((candidate) => candidate.id === chat.id);
      const sameControlRevision = Number(liveChat?.controlRevision || 0)
        === Number(observedState.chats[index].controlRevision || 0);
      const sameSession = latestState.sessionId === observedState.sessionId;
      const engineAllowsChat = latestState.enabled
        && (!latestState.taskOnly || liveChat?.taskActive === true);
      if (!liveChat?.enabled || !sameControlRevision || !sameSession || (!engineAllowsChat && !allowWhenStopped)) {
        observedState = appendLog(
          observedState,
          "info",
          `Отправка в «${chat.title}» отменена: состояние или профиль изменились во время проверки`
        );
        continue;
      }

      profile = effectiveChatProfile(latestState, liveChat);
      const liveGuard = completionGuardReason(liveChat, profile);
      if (liveGuard) {
        observedState.chats[index] = applyCompletion(observedState.chats[index], liveGuard);
        observedState = appendLog(
          observedState,
          "info",
          `${chat.title}: ${completionDescription(liveGuard)}`
        );
        observedState = await notifyChatEvent(observedState, observedState.chats[index], liveGuard);
        continue;
      }

      const preflight = await obtainFreshSnapshot({
        tab: await chrome.tabs.get(tab.id),
        chat: observedState.chats[index],
        intervalMinutes: profile.intervalMinutes,
        stopPhrase: profile.stopPhrase,
        allowPeriodicRefresh: false
      });
      if (preflight.recoveryReason) {
        observedState.chats[index] = recordRecovery(
          observedState.chats[index],
          preflight.recoveryReason
        );
        observedState = appendLog(
          observedState,
          "info",
          `${chat.title}: вкладка восстановлена перед отправкой (${recoveryDescription(preflight.recoveryReason)})`
        );
      }

      const preflightDecision = decide(
        observedState.chats[index],
        preflight.snapshot,
        observedState.sessionId
      );
      observedState.chats[index] = scheduleNextChatCheck(
        preflightDecision.chat,
        profile.intervalMinutes
      );
      if (preflightDecision.decision === "stop-phrase-matched") {
        observedState = appendLog(
          observedState,
          "info",
          `Отправка в «${chat.title}» отменена: обнаружена стоп-фраза`
        );
        observedState = await notifyChatEvent(
          observedState,
          observedState.chats[index],
          "stop-phrase"
        );
        continue;
      }
      if (preflightDecision.decision !== "send-continuation") {
        observedState = appendLog(
          observedState,
          "info",
          `Отправка в «${chat.title}» отменена после повторной проверки: ${decisionDescription(preflightDecision.decision)}`
        );
        continue;
      }

      const sendResponse = await sendToContent(preflight.tab.id, {
        type: "CHATPULSE_SEND",
        command: profile.commandText
      }, { attempts: 2, timeoutMs: 15_000 });
      if (!sendResponse?.ok) throw new Error(sendResponse?.error || "Команда не отправлена.");

      const outcome = sendResponse.outcome === "confirmed"
        ? "confirmed"
        : "submitted-unconfirmed";
      observedState.chats[index] = recordDispatch(
        observedState.chats[index],
        preflightDecision.fingerprint,
        outcome
      );
      const checkpoint = await persistDispatchCheckpoint(observedState.chats[index]);
      observedState.chats[index] = checkpoint.chat;
      observedState = appendLog(
        observedState,
        outcome === "confirmed" ? "info" : "warning",
        outcome === "confirmed"
          ? `Команда отправлена в «${chat.title}» · продолжение ${observedState.chats[index].continuationCount}`
          : `Кнопка отправки нажата в «${chat.title}»; повтор для ответа заблокирован · продолжение ${observedState.chats[index].continuationCount}`
      );
      observedState = await notifyChatEvent(
        observedState,
        observedState.chats[index],
        "continuation",
        outcome
      );

      if (checkpoint.guard) {
        observedState = appendLog(
          observedState,
          "info",
          `${chat.title}: ${completionDescription(checkpoint.guard)}`
        );
        observedState = await notifyChatEvent(
          observedState,
          observedState.chats[index],
          checkpoint.guard
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      observedState.chats[index] = scheduleNextChatCheck({
        ...observedState.chats[index],
        lastDecision: "error",
        lastError: message
      }, profile.intervalMinutes);
      observedState = appendLog(observedState, "error", `${chat.title}: ${message}`);
      if (previousError !== message) {
        observedState = await notifyChatEvent(
          observedState,
          observedState.chats[index],
          "automation-error"
        );
      }
    }
  }

  observedState = {
    ...observedState,
    checkInProgress: false,
    lastCheckAt: new Date().toISOString()
  };

  const latestState = await loadState();
  let merged = mergeRuntimeState(observedState, latestState);
  merged = await configureAlarm(merged);
  await persistAndPublish(merged);
}

async function performGithubWatchdog(source) {
  let observedState = await loadState();
  if (!observedState.enabled) return;

  const eligible = observedState.chats.filter((chat) => {
    if (!chat.enabled) return false;
    if (observedState.taskOnly && !chat.taskActive) return false;
    const profile = effectiveChatProfile(observedState, chat);
    return profile.githubWatchEnabled && Boolean(profile.githubRepository);
  });
  if (!eligible.length) return;

  const groups = new Map();
  for (const chat of eligible) {
    const profile = effectiveChatProfile(observedState, chat);
    const list = groups.get(profile.githubRepository) || [];
    list.push(chat.id);
    groups.set(profile.githubRepository, list);
  }
  if (groups.size > MAX_GITHUB_WATCHED_REPOSITORIES) {
    observedState = appendLog(observedState, "error", `GitHub Actions watchdog остановлен: превышен лимит ${MAX_GITHUB_WATCHED_REPOSITORIES} repositories`);
    const latest = await loadState();
    const merged = mergeRuntimeState({ ...observedState, lastCheckAt: latest.lastCheckAt }, latest);
    await persistAndPublish(merged);
    return;
  }

  const forcePoll = source === "github-watchdog-manual";
  const permissionGranted = await hasGithubApiPermission();
  const now = new Date().toISOString();
  let touched = false;
  const successfulRepositories = new Set();

  for (const [repository, chatIds] of groups) {
    const groupChats = chatIds
      .map((id) => observedState.chats.find((chat) => chat.id === id))
      .filter(Boolean);
    if (!forcePoll && !groupChats.some((chat) => shouldPollGithubRepository(chat))) continue;

    touched = true;
    if (!permissionGranted) {
      for (const chatId of chatIds) {
        const index = observedState.chats.findIndex((chat) => chat.id === chatId);
        if (index >= 0) {
          observedState.chats[index] = recordGithubWatchError(
            observedState.chats[index],
            "Chrome не выдал optional access к api.github.com.",
            now
          );
        }
      }
      observedState = appendLog(observedState, "warning", `${repository}: GitHub Actions watchdog ждёт optional permission`);
      continue;
    }

    try {
      const activity = await fetchLatestGithubWorkflowRun(repository);
      successfulRepositories.add(repository);
      for (const chatId of chatIds) {
        const index = observedState.chats.findIndex((chat) => chat.id === chatId);
        if (index >= 0) {
          observedState.chats[index] = recordGithubActionsObservation(
            observedState.chats[index],
            activity,
            now
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      for (const chatId of chatIds) {
        const index = observedState.chats.findIndex((chat) => chat.id === chatId);
        if (index >= 0) observedState.chats[index] = recordGithubWatchError(observedState.chats[index], message, now);
      }
      observedState = appendLog(observedState, "warning", `${repository}: ${message}`);
    }
  }

  if (!touched) return;
  const latestAfterFetch = await loadState();
  let merged = mergeRuntimeState({ ...observedState, lastCheckAt: latestAfterFetch.lastCheckAt }, latestAfterFetch);
  merged = await configureAlarm(merged);
  await persistAndPublish(merged);

  const restartIds = merged.chats
    .filter((chat) => {
      if (!chat.enabled || (merged.taskOnly && !chat.taskActive)) return false;
      const profile = effectiveChatProfile(merged, chat);
      return profile.githubWatchEnabled
        && successfulRepositories.has(profile.githubRepository)
        && githubWatchdogDecision(chat, profile.githubIdleMinutes).decision === "restart";
    })
    .map((chat) => chat.id);

  for (const chatId of restartIds) {
    await attemptGithubWatchdogRestart(chatId);
  }
}

async function attemptGithubWatchdogRestart(chatId) {
  let state = await loadState();
  if (!state.enabled) return;
  let index = state.chats.findIndex((chat) => chat.id === chatId);
  if (index < 0) return;
  let chat = state.chats[index];
  if (!chat.enabled || (state.taskOnly && !chat.taskActive)) return;

  let profile = effectiveChatProfile(state, chat);
  if (!profile.githubWatchEnabled || !profile.githubRepository) return;
  const stall = githubWatchdogDecision(chat, profile.githubIdleMinutes);
  if (stall.decision !== "restart" || !stall.restartKey) return;

  const guard = completionGuardReason(chat, profile);
  if (guard) {
    state.chats[index] = applyCompletion(chat, guard);
    state = appendLog(state, "info", `${chat.title}: ${completionDescription(guard)}`);
    state = await notifyChatEvent(state, state.chats[index], guard);
    state = await configureAlarm(state);
    await persistAndPublish(state);
    return;
  }

  const sessionId = state.sessionId;
  const controlRevision = Number(chat.controlRevision || 0);
  try {
    let tab = await ensureChatTab(chat);
    const freshness = await obtainFreshSnapshot({
      tab,
      chat,
      intervalMinutes: profile.intervalMinutes,
      stopPhrase: profile.stopPhrase,
      allowPeriodicRefresh: false
    });
    tab = freshness.tab;
    let runtimeChat = { ...chat, tabId: tab.id ?? null };
    if (freshness.recoveryReason) runtimeChat = recordRecovery(runtimeChat, freshness.recoveryReason);
    const firstDecision = decide(runtimeChat, freshness.snapshot, sessionId);
    runtimeChat = firstDecision.chat;

    if (firstDecision.decision === "stop-phrase-matched") {
      if (await persistSingleRuntimeChat(runtimeChat, sessionId)) {
        const stopped = await loadState();
        const stoppedChat = stopped.chats.find((candidate) => candidate.id === chatId);
        if (stoppedChat) {
          const notified = await notifyChatEvent(stopped, stoppedChat, "stop-phrase");
          await persistAndPublish(await configureAlarm(notified));
        }
      }
      return;
    }

    if (freshness.snapshot?.hasDraft === true) {
      await persistSingleRuntimeChat({ ...runtimeChat, lastDecision: "github-restart-user-draft" }, sessionId);
      await appendGithubRestartLog(chatId, "restart отложен: в поле ввода есть пользовательский черновик", "info");
      return;
    }
    if (!["send-continuation", "already-continued"].includes(firstDecision.decision)) {
      await persistSingleRuntimeChat(runtimeChat, sessionId);
      await appendGithubRestartLog(chatId, `restart отложен: ${decisionDescription(firstDecision.decision)}`, "info");
      return;
    }

    state = await loadState();
    index = state.chats.findIndex((candidate) => candidate.id === chatId);
    if (index < 0) return;
    chat = state.chats[index];
    profile = effectiveChatProfile(state, chat);
    const stillSameControl = Number(chat.controlRevision || 0) === controlRevision;
    const stillSameSession = state.sessionId === sessionId;
    const stillEligible = state.enabled && chat.enabled && (!state.taskOnly || chat.taskActive)
      && profile.githubWatchEnabled;
    const liveStall = githubWatchdogDecision(chat, profile.githubIdleMinutes);
    if (!stillSameControl || !stillSameSession || !stillEligible || liveStall.restartKey !== stall.restartKey
        || liveStall.decision !== "restart") {
      return;
    }

    const liveGuard = completionGuardReason(chat, profile);
    if (liveGuard) {
      state.chats[index] = applyCompletion(chat, liveGuard);
      state = appendLog(state, "info", `${chat.title}: ${completionDescription(liveGuard)}`);
      state = await notifyChatEvent(state, state.chats[index], liveGuard);
      await persistAndPublish(await configureAlarm(state));
      return;
    }

    const preflight = await obtainFreshSnapshot({
      tab: await chrome.tabs.get(tab.id),
      chat,
      intervalMinutes: profile.intervalMinutes,
      stopPhrase: profile.stopPhrase,
      allowPeriodicRefresh: false
    });
    if (preflight.snapshot?.hasDraft === true) {
      await appendGithubRestartLog(chatId, "restart отложен после preflight: обнаружен пользовательский черновик", "info");
      return;
    }
    const preflightDecision = decide(chat, preflight.snapshot, sessionId);
    if (preflightDecision.decision === "stop-phrase-matched") {
      if (await persistSingleRuntimeChat(preflightDecision.chat, sessionId)) {
        const stopped = await loadState();
        const stoppedChat = stopped.chats.find((candidate) => candidate.id === chatId);
        if (stoppedChat) {
          const notified = await notifyChatEvent(stopped, stoppedChat, "stop-phrase");
          await persistAndPublish(await configureAlarm(notified));
        }
      }
      return;
    }
    if (!["send-continuation", "already-continued"].includes(preflightDecision.decision)) {
      await persistSingleRuntimeChat(preflightDecision.chat, sessionId);
      await appendGithubRestartLog(chatId, `restart отменён после preflight: ${decisionDescription(preflightDecision.decision)}`, "info");
      return;
    }

    const fingerprint = String(preflight.snapshot?.latestFingerprint || "");
    if (!fingerprint) return;
    const response = await sendToContent(preflight.tab.id, {
      type: "CHATPULSE_SEND",
      command: profile.commandText
    }, { attempts: 2, timeoutMs: 15_000 });
    if (!response?.ok) throw new Error(response?.error || "Команда watchdog restart не отправлена.");

    const outcome = response.outcome === "confirmed" ? "confirmed" : "submitted-unconfirmed";
    runtimeChat = recordDispatch(preflightDecision.chat, fingerprint, outcome);
    runtimeChat = recordGithubRestart(runtimeChat, stall.restartKey);
    const checkpoint = await persistDispatchCheckpoint(runtimeChat);

    let latest = await loadState();
    const persistedChat = latest.chats.find((candidate) => candidate.id === chatId) || checkpoint.chat;
    latest = appendLog(
      latest,
      outcome === "confirmed" ? "info" : "warning",
      `GitHub Actions stall: restart-команда отправлена в «${persistedChat.title}» · ${persistedChat.profile?.githubRepository || profile.githubRepository} · продолжение ${persistedChat.continuationCount}`
    );
    latest = await notifyChatEvent(latest, persistedChat, "continuation", outcome);
    if (checkpoint.guard) {
      latest = appendLog(latest, "info", `${persistedChat.title}: ${completionDescription(checkpoint.guard)}`);
      latest = await notifyChatEvent(latest, persistedChat, checkpoint.guard);
    }
    await persistAndPublish(await configureAlarm(latest));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await appendGithubRestartLog(chatId, `GitHub Actions stall restart не выполнен: ${message}`, "warning");
  }
}

async function persistSingleRuntimeChat(runtimeChat, expectedSessionId) {
  const latest = await loadState();
  if (latest.sessionId !== expectedSessionId) return false;
  const index = latest.chats.findIndex((chat) => chat.id === runtimeChat.id);
  if (index < 0) return false;
  if (Number(latest.chats[index].controlRevision || 0) !== Number(runtimeChat.controlRevision || 0)) return false;
  const observed = {
    ...latest,
    lastCheckAt: latest.lastCheckAt,
    chats: latest.chats.map((chat, chatIndex) => chatIndex === index ? runtimeChat : chat)
  };
  await saveState(mergeRuntimeState(observed, latest));
  return true;
}

async function appendGithubRestartLog(chatId, message, level = "info") {
  let latest = await loadState();
  const chat = latest.chats.find((candidate) => candidate.id === chatId);
  latest = appendLog(latest, level, `${chat?.title || "Чат"}: ${message}`);
  await persistAndPublish(latest);
}

async function persistRunStartCheckpoint(runtimeChat) {
  const latestState = await loadState();
  const index = latestState.chats.findIndex((candidate) => candidate.id === runtimeChat.id);
  if (index < 0) return;
  const latestChat = latestState.chats[index];
  const sameControlRevision = Number(latestChat.controlRevision || 0)
    === Number(runtimeChat.controlRevision || 0);
  if (!sameControlRevision || latestChat.runStartedAt || !runtimeChat.runStartedAt) return;
  latestState.chats[index] = { ...latestChat, runStartedAt: runtimeChat.runStartedAt };
  await saveState(latestState);
}

async function persistDispatchCheckpoint(runtimeChat) {
  const latestState = await loadState();
  const index = latestState.chats.findIndex((candidate) => candidate.id === runtimeChat.id);
  if (index < 0) return { chat: runtimeChat, guard: null };

  let checkpointChat = mergeDispatchCheckpoint(runtimeChat, latestState.chats[index]);
  latestState.chats[index] = checkpointChat;
  const currentProfile = effectiveChatProfile(latestState, checkpointChat);
  const guard = checkpointChat.enabled
    ? completionGuardReason(checkpointChat, currentProfile)
    : null;
  if (guard) {
    checkpointChat = applyCompletion(checkpointChat, guard);
    latestState.chats[index] = checkpointChat;
  }
  await saveState(latestState);
  return { chat: checkpointChat, guard };
}

async function notifyChatEvent(state, chat, event, outcome = null) {
  const profile = effectiveChatProfile(state, chat);
  if (!profile.telegramNotify) return state;
  try {
    const telegram = await notifyTelegramEvent({
      chatTitle: chat.title,
      event,
      outcome
    });
    if (!telegram.sent) return state;
    return appendLog(state, "info", `Telegram: событие «${event}» отправлено для «${chat.title}»`);
  } catch (notificationError) {
    const message = notificationError instanceof Error
      ? notificationError.message
      : String(notificationError);
    return appendLog(
      state,
      "warning",
      `Telegram: событие для «${chat.title}» не отправлено (${message})`
    );
  }
}

async function ensureChatTab(chat) {
  if (Number.isInteger(chat.tabId)) {
    try {
      const tab = await chrome.tabs.get(chat.tabId);
      if (normalizeChatURL(tab.url) === chat.url) {
        await protectManagedTab(tab.id);
        return chrome.tabs.get(tab.id);
      }
    } catch {
      // Вкладка закрыта — ищем существующую или создаём новую.
    }
  }

  const tabs = await chrome.tabs.query({ url: CHATGPT_PATTERNS });
  const existing = tabs.find((tab) => normalizeChatURL(tab.url) === chat.url);
  if (existing?.id) {
    await protectManagedTab(existing.id);
    return chrome.tabs.get(existing.id);
  }

  const created = await chrome.tabs.create({ url: chat.url, active: false, pinned: false });
  if (!Number.isInteger(created.id)) throw new Error("Chrome не вернул идентификатор вкладки.");
  await protectManagedTab(created.id);
  return chrome.tabs.get(created.id);
}

async function protectManagedTab(tabId) {
  try {
    await chrome.tabs.update(tabId, { autoDiscardable: false });
  } catch {
    // Старые версии Chrome могут не принять autoDiscardable; восстановление всё равно работает.
  }
}

async function obtainFreshSnapshot({
  tab,
  chat,
  intervalMinutes,
  stopPhrase = "",
  allowPeriodicRefresh = true
}) {
  if (!Number.isInteger(tab?.id)) throw new Error("У вкладки ChatGPT отсутствует идентификатор.");
  await protectManagedTab(tab.id);

  let currentTab = await chrome.tabs.get(tab.id);
  if (currentTab.discarded === true || currentTab.frozen === true) {
    const reason = currentTab.discarded === true ? "discarded-tab" : "frozen-tab";
    return recoverAndInspect(currentTab, chat.url, reason, stopPhrase);
  }

  await waitForTabComplete(currentTab.id, TAB_LOAD_TIMEOUT_MS);

  let snapshot = null;
  try {
    const response = await sendToContent(
      currentTab.id,
      { type: "CHATPULSE_INSPECT", stopPhrase },
      { attempts: 2, timeoutMs: CONTENT_MESSAGE_TIMEOUT_MS }
    );
    snapshot = response?.ok ? response.snapshot : null;
  } catch {
    snapshot = null;
  }

  currentTab = await chrome.tabs.get(currentTab.id);
  const plan = planTabRecovery({
    tab: currentTab,
    snapshot,
    chat: allowPeriodicRefresh ? chat : { ...chat, lastHardRefreshAt: new Date().toISOString() },
    intervalMinutes
  });

  if (plan.refresh) return recoverAndInspect(currentTab, chat.url, plan.reason, stopPhrase);
  if (!snapshot) {
    if (currentTab.active === true) {
      throw new Error("Активная вкладка не ответила; автоматическое обновление отменено для защиты действий пользователя.");
    }
    throw new Error("Не удалось получить актуальное состояние страницы ChatGPT.");
  }
  return { tab: currentTab, snapshot, recoveryReason: null };
}

async function recoverAndInspect(tab, chatURL, reason, stopPhrase = "") {
  let targetTab = tab;
  if (tabRecoveryMode(reason) === "replace" && typeof chrome.tabs.remove === "function") {
    targetTab = await replaceBackgroundTab(chrome.tabs, tab, chatURL);
    await protectManagedTab(targetTab.id);
    await waitForTabComplete(targetTab.id, TAB_LOAD_TIMEOUT_MS);
  } else {
    await reloadTabAndWait(tab.id, TAB_LOAD_TIMEOUT_MS);
    targetTab = await chrome.tabs.get(tab.id);
  }

  await delay(POST_RECOVERY_SETTLE_MS);
  const snapshot = await waitForHydratedSnapshot(targetTab.id, HYDRATION_TIMEOUT_MS, stopPhrase);
  return {
    tab: await chrome.tabs.get(targetTab.id),
    snapshot,
    recoveryReason: reason
  };
}

async function waitForHydratedSnapshot(tabId, timeoutMs, stopPhrase = "") {
  const startedAt = Date.now();
  let lastSnapshot = null;
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await sendToContent(
        tabId,
        { type: "CHATPULSE_INSPECT", stopPhrase },
        { attempts: 1, timeoutMs: CONTENT_MESSAGE_TIMEOUT_MS }
      );
      if (response?.ok && response.snapshot) {
        lastSnapshot = response.snapshot;
        const hydrated = lastSnapshot.pageReady
          && (!lastSnapshot.authenticated
            || lastSnapshot.messageCount > 0
            || lastSnapshot.hasComposer === true);
        if (hydrated) return lastSnapshot;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }

  if (lastSnapshot) return lastSnapshot;
  throw new Error(
    `Страница ChatGPT не восстановилась после обновления: ${lastError?.message || "DOM недоступен"}`
  );
}

async function waitForTabComplete(tabId, timeoutMs) {
  const current = await chrome.tabs.get(tabId);
  if (current.status === "complete" && current.discarded !== true) return current;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => finish(new Error("Вкладка ChatGPT не загрузилась за 45 секунд.")),
      timeoutMs
    );
    const onUpdated = (updatedTabId, changeInfo, updatedTab) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") finish(null, updatedTab);
    };
    const onRemoved = (removedTabId) => {
      if (removedTabId === tabId) finish(new Error("Вкладка ChatGPT закрыта во время проверки."));
    };

    function finish(error, updatedTab) {
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      error ? reject(error) : resolve(updatedTab);
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
  });
}

async function reloadTabAndWait(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(
      () => finish(new Error("Вкладка ChatGPT не обновилась за 45 секунд.")),
      timeoutMs
    );
    const onUpdated = (updatedTabId, changeInfo, updatedTab) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") finish(null, updatedTab);
    };
    const onRemoved = (removedTabId) => {
      if (removedTabId === tabId) finish(new Error("Вкладка ChatGPT закрыта во время восстановления."));
    };

    function finish(error, updatedTab) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      error ? reject(error) : resolve(updatedTab);
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs.reload(tabId).catch((error) => finish(error));
  });
}

async function sendToContent(
  tabId,
  message,
  { attempts = 3, timeoutMs = CONTENT_MESSAGE_TIMEOUT_MS } = {}
) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await withTimeout(
        chrome.tabs.sendMessage(tabId, message),
        timeoutMs,
        "content script не ответил вовремя"
      );
      if (response) return response;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content/content-script.js"]
          });
        } catch {
          // Следующая попытка вернёт исходную понятную ошибку.
        }
      }
    }
    await delay(350);
  }
  throw new Error(
    `Не удалось связаться со страницей ChatGPT: ${lastError?.message || "content script недоступен"}`
  );
}

async function configureAlarm(state) {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.clear(GITHUB_ALARM_NAME);
  const globalInterval = clampInterval(state.intervalMinutes);
  if (!state.enabled) {
    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }

  const eligibleChats = state.chats.filter((chat) => chat.enabled && (!state.taskOnly || chat.taskActive));
  if (state.taskOnly && eligibleChats.length === 0) {
    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }
  const enabledIntervals = eligibleChats
    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);
  const alarmInterval = enabledIntervals.length
    ? Math.min(...enabledIntervals)
    : globalInterval;
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: alarmInterval,
    periodInMinutes: alarmInterval
  });

  const watchedRepositories = new Set(eligibleChats
    .map((chat) => effectiveChatProfile(state, chat))
    .filter((profile) => profile.githubWatchEnabled && profile.githubRepository)
    .map((profile) => profile.githubRepository));
  if (watchedRepositories.size > 0 && watchedRepositories.size <= MAX_GITHUB_WATCHED_REPOSITORIES) {
    await chrome.alarms.create(GITHUB_ALARM_NAME, {
      delayInMinutes: GITHUB_POLL_INTERVAL_MINUTES,
      periodInMinutes: GITHUB_POLL_INTERVAL_MINUTES
    });
  }

  return {
    ...state,
    intervalMinutes: globalInterval,
    nextCheckAt: new Date(Date.now() + alarmInterval * 60_000).toISOString()
  };
}

async function loadState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeState(stored[STORAGE_KEY] || defaultState());
}

async function saveState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: normalizeState(state) });
}

async function persistAndPublish(state) {
  await saveState(state);
  await updateBadge(state);
  try {
    await chrome.runtime.sendMessage({
      type: "STATE_UPDATED",
      state: await attachTelegramState(state)
    });
  } catch {
    // Popup/options могут быть закрыты.
  }
}

async function updateBadge(state) {
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
}

function assertIdentityMutationSafe() {
  if (activeCheck) {
    throw new Error("Дождитесь завершения текущей проверки перед удалением чата или импортом конфигурации.");
  }
}

function decisionLevel(decision) {
  if (decision === "stop-phrase-matched") return "info";
  return ["page-error", "not-authenticated"].includes(decision) ? "warning" : "debug";
}

function decisionDescription(decision) {
  return {
    disabled: "чат отключён",
    "page-not-ready": "страница ещё не готова",
    "not-authenticated": "в профиле Chrome не выполнен вход",
    "page-error": "на странице обнаружена ошибка",
    generating: "ответ ещё создаётся",
    "no-messages": "сообщения не найдены",
    "baseline-recorded": "зафиксировано исходное состояние новой сессии",
    "response-changed": "обнаружен новый ответ; ожидается следующая проверка",
    "waiting-for-assistant": "последнее сообщение принадлежит пользователю",
    "already-continued": "этот ответ уже получил команду",
    "stop-phrase-matched": "обнаружена стоп-фраза; наблюдение за чатом отключено",
    "send-continuation": "ответ стабилен и готов к продолжению"
  }[decision] || decision;
}

function completionDescription(reason) {
  return {
    "continuation-limit": "достигнут лимит продолжений; чат остановлен",
    "runtime-limit": "достигнут лимит времени; чат остановлен"
  }[reason] || `чат остановлен (${reason})`;
}

function recoveryDescription(reason) {
  return {
    "discarded-tab": "Chrome выгрузил вкладку из памяти",
    "frozen-tab": "Chrome заморозил вкладку",
    "content-unreachable": "content script перестал отвечать",
    "page-error": "страница сообщила об ошибке",
    "periodic-freshness": "плановое обновление содержимого",
    "stuck-generation": "генерация зависла более 20 минут",
    "missing-tab": "вкладка была потеряна"
  }[reason] || reason;
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
