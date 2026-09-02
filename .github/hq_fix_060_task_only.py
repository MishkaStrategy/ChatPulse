#!/usr/bin/env python3
from pathlib import Path


def replace_once(path_str, old, new, label):
    path = Path(path_str)
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one block, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")
    print(f"patched: {label}")


replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    case "STOP_MONITORING": {
      let state = await loadState();
      state = appendLog({
        ...state,
        enabled: false,
        checkInProgress: false,
        nextCheckAt: null
      }, "info", "Наблюдение остановлено");
      await chrome.alarms.clear(ALARM_NAME);
      await persistAndPublish(state);
      return { state };
    }''',
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
    "stop monitoring preserves task scheduler",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''      state = appendLog({
        ...state,
        enabled: true
      }, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);''',
    '''      state = appendLog(state, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);''',
    "task start does not enable ordinary monitoring",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  let observedState = await loadState();
  if (!observedState.enabled && !allowWhenStopped) return;

  observedState = appendLog(''',
    '''  let observedState = await loadState();
  const hasActiveTasks = observedState.chats.some((chat) => chat.enabled && chat.taskActive);
  if (!observedState.enabled && !hasActiveTasks && !allowWhenStopped) return;

  observedState = appendLog(''',
    "task can drive engine while ordinary monitoring is off",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    let chat = observedState.chats[index];
    if (!chat.enabled) continue;
    if (!bypassSchedule && !isChatDue(chat)) continue;''',
    '''    let chat = observedState.chats[index];
    if (!chat.enabled) continue;
    if (!observedState.enabled && !chat.taskActive && !allowWhenStopped) continue;
    if (!bypassSchedule && !isChatDue(chat)) continue;''',
    "task-only loop isolation",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''      if (!liveChat?.enabled || !sameControlRevision || (!latestState.enabled && !allowWhenStopped)) {''',
    '''      if (!liveChat?.enabled || !sameControlRevision || (!latestState.enabled && !liveChat.taskActive && !allowWhenStopped)) {''',
    "task-only send authorization",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''async function configureAlarm(state) {
  await chrome.alarms.clear(ALARM_NAME);
  const globalInterval = clampInterval(state.intervalMinutes);
  if (!state.enabled) return { ...state, intervalMinutes: globalInterval, nextCheckAt: null };

  const enabledIntervals = state.chats
    .filter((chat) => chat.enabled)
    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);
  const alarmInterval = enabledIntervals.length
    ? Math.min(...enabledIntervals)
    : globalInterval;''',
    '''async function configureAlarm(state) {
  await chrome.alarms.clear(ALARM_NAME);
  const globalInterval = clampInterval(state.intervalMinutes);
  const eligibleChats = state.chats.filter((chat) => chat.enabled && (state.enabled || chat.taskActive));
  const engineActive = state.enabled || eligibleChats.length > 0;
  if (!engineActive) return { ...state, intervalMinutes: globalInterval, nextCheckAt: null };

  const enabledIntervals = eligibleChats
    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);
  const alarmInterval = enabledIntervals.length
    ? Math.min(...enabledIntervals)
    : globalInterval;''',
    "task-aware alarm scheduling",
)

replace_once(
    "chrome-extension/options/options.js",
    '''  ui.statusValue.textContent = state.checkInProgress
    ? "Проверка…"
    : state.enabled
      ? "Работает"
      : "Остановлен";
  ui.statusDetail.textContent = state.enabled
    ? `${activeChats} активных · ${activeTasks} задач · ${errors} ошибок`
    : "Фоновый таймер не активен";''',
    '''  ui.statusValue.textContent = state.checkInProgress
    ? "Проверка…"
    : state.enabled
      ? "Работает"
      : activeTasks > 0
        ? "Работают задачи"
        : "Остановлен";
  ui.statusDetail.textContent = state.enabled || activeTasks > 0
    ? `${activeChats} активных · ${activeTasks} задач · ${errors} ошибок${state.enabled ? "" : " · обычное наблюдение выключено"}`
    : "Фоновый таймер не активен";''',
    "Control Center task-only status",
)

replace_once(
    "chrome-extension/options/options.js",
    '''    STOP_MONITORING: "Наблюдение остановлено.",''',
    '''    STOP_MONITORING: "Обычное наблюдение остановлено. Активные задачи продолжаются до своих guard-условий.",''',
    "Control Center stop copy",
)
