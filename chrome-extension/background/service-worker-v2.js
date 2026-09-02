import {
  appendLog,
  applyCompletion,
  applyPortableConfig,
  clampInterval,
  completionGuardReason,
  createChat,
  createPortableConfig,
  createSessionId,
  decide,
  defaultState,
  effectiveChatProfile,
  hasCompletionGuard,
  isChatDue,
  mergeDispatchCheckpoint,
  mergeRuntimeState,
  normalizeChatProfile,
  normalizeChatURL,
  normalizeState,
  normalizeStopPhrase,
  planTabRecovery,
  prepareChatRun,
  recordDispatch,
  recordRecovery,
  scheduleNextChatCheck,
  startChatRun,
  stopChatRun
} from "../lib/model-v2.js";
import {
  attachTelegramState,
  notifyTelegramEvent,
  sendTelegramTest,
  updateTelegramConfig
} from "./telegram.js";

const STORAGE_KEY = "chatpulseState";
const ALARM_NAME = "chatpulse-monitor";
const CHATGPT_PATTERNS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];
const TAB_LOAD_TIMEOUT_MS = 45_000;
const HYDRATION_TIMEOUT_MS = 20_000;
const CONTENT_MESSAGE_TIMEOUT_MS = 4_000;
const POST_RELOAD_SETTLE_MS = 750;
let activeCheck = null;

chrome.runtime.onInstalled.addListener(() => {
  void initialize("Установлено расширение ChatPulse");
});

chrome.runtime.onStartup.addListener(() => {
  void initialize("Chrome запущен: создана новая безопасная сессия наблюдения");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void runCheck("alarm");
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
      state = appendLog({
        ...state,
        enabled: true,
        sessionId: createSessionId()
      }, "info", "Наблюдение запущено");
      state = await configureAlarm(state);
      await persistAndPublish(state);
      void runCheck("start");
      return { state };
    }

    case "STOP_MONITORING": {
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
    }

    case "CHECK_NOW":
      await runCheck("manual", true);
      return { state: await loadState() };

    case "ADD_CURRENT_CHAT":
      return { state: await addCurrentChat(message.tabId) };

    case "REMOVE_CHAT":
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

    case "UPDATE_CHAT_PROFILE":
      return { state: await mutateChat(message.chatId, (state, index) => {
        const current = state.chats[index];
        const profile = normalizeChatProfile({
          ...current.profile,
          ...(message.profile || {})
        });
        const candidate = {
          ...current,
          profile,
          controlRevision: Number(current.controlRevision || 0) + 1,
          nextEligibleAt: null
        };
        if (candidate.taskActive && !hasCompletionGuard(effectiveChatProfile(state, candidate))) {
          throw new Error("Активная задача должна иметь стоп-фразу, лимит продолжений или лимит времени.");
        }
        state.chats[index] = candidate;
        return appendLog(state, "info", `Профиль «${current.title}» обновлён`);
      }) };

    case "START_TASK": {
      let state = await loadState();
      const index = state.chats.findIndex((chat) => chat.id === message.chatId);
      if (index < 0) throw new Error("Чат не найден.");
      const profile = effectiveChatProfile(state, state.chats[index]);
      if (!hasCompletionGuard(profile)) {
        throw new Error("Для запуска задачи задайте стоп-фразу, лимит продолжений или лимит времени.");
      }
      state.chats[index] = startChatRun(state.chats[index], { task: true });
      state = appendLog(state, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);
      state = await configureAlarm(state);
      await persistAndPublish(state);
      state = await notifyChatEvent(state, state.chats[index], "task-started");
      await persistAndPublish(state);
      void runCheck("task-start");
      return { state };
    }

    case "STOP_TASK":
      return { state: await mutateChat(message.chatId, (state, index) => {
        const chat = state.chats[index];
        state.chats[index] = stopChatRun(chat, "manual-task-stop");
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
      await updateTelegramConfig(patch);
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
      let state = applyPortableConfig(message.config);
      state = appendLog(state, "info", "Портативная конфигурация импортирована; мониторинг оставлен остановленным для безопасного baseline");
      await chrome.alarms.clear(ALARM_NAME);
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

async function runCheck(source, allowWhenStopped = false) {
  if (activeCheck) return activeCheck;
  activeCheck = performCheck(source, allowWhenStopped).finally(() => {
    activeCheck = null;
  });
  return activeCheck;
}

async function performCheck(source, allowWhenStopped) {
  let observedState = await loadState();
  const hasActiveTasks = observedState.chats.some((chat) => chat.enabled && chat.taskActive);
  if (!observedState.enabled && !hasActiveTasks && !allowWhenStopped) return;

  observedState = appendLog(
    { ...observedState, checkInProgress: true },
    "debug",
    `Начата ${source === "manual" ? "ручная" : "плановая"} проверка`
  );
  await persistAndPublish(observedState);

  const bypassSchedule = source !== "alarm";
  for (let index = 0; index < observedState.chats.length; index += 1) {
    let chat = observedState.chats[index];
    if (!chat.enabled) continue;
    if (!observedState.enabled && !chat.taskActive && !allowWhenStopped) continue;
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
      if (!liveChat?.enabled || !sameControlRevision || (!latestState.enabled && !liveChat.taskActive && !allowWhenStopped)) {
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
    return recoverAndInspect(currentTab.id, reason, stopPhrase);
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

  if (plan.refresh) return recoverAndInspect(currentTab.id, plan.reason, stopPhrase);
  if (!snapshot) {
    if (currentTab.active === true) {
      throw new Error("Активная вкладка не ответила; автоматическое обновление отменено для защиты действий пользователя.");
    }
    throw new Error("Не удалось получить актуальное состояние страницы ChatGPT.");
  }
  return { tab: currentTab, snapshot, recoveryReason: null };
}

async function recoverAndInspect(tabId, reason, stopPhrase = "") {
  await reloadTabAndWait(tabId, TAB_LOAD_TIMEOUT_MS);
  await delay(POST_RELOAD_SETTLE_MS);
  const snapshot = await waitForHydratedSnapshot(tabId, HYDRATION_TIMEOUT_MS, stopPhrase);
  return {
    tab: await chrome.tabs.get(tabId),
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
  const globalInterval = clampInterval(state.intervalMinutes);
  const eligibleChats = state.chats.filter((chat) => chat.enabled && (state.enabled || chat.taskActive));
  const engineActive = state.enabled || eligibleChats.length > 0;
  if (!engineActive) return { ...state, intervalMinutes: globalInterval, nextCheckAt: null };

  const enabledIntervals = eligibleChats
    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);
  const alarmInterval = enabledIntervals.length
    ? Math.min(...enabledIntervals)
    : globalInterval;
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: alarmInterval,
    periodInMinutes: alarmInterval
  });
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
