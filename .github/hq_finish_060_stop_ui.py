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


replace_once(
    "chrome-extension/lib/model-v2.js",
    '''  return {
    ...chat,
    taskActive: false,
    taskCompletedAt: at,
    taskCompletionReason: String(reason),
    nextEligibleAt: null,
    lastDecision: `task-stopped-${String(reason)}`
  };''',
    '''  return {
    ...chat,
    controlRevision: nonNegativeInteger(chat.controlRevision) + 1,
    taskActive: false,
    taskCompletedAt: at,
    taskCompletionReason: String(reason),
    nextEligibleAt: null,
    lastDecision: `task-stopped-${String(reason)}`
  };''',
    "task stop advances control revision",
)

replace_once(
    "chrome-extension/options/options.js",
    '''  ui.toggleButton.textContent = state.enabled ? "Остановить" : "Запустить";''',
    '''  ui.toggleButton.textContent = state.enabled
    ? state.taskOnly ? "Остановить всё" : "Остановить"
    : "Запустить";''',
    "Control Center master stop button",
)

replace_once(
    "chrome-extension/options/options.js",
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
    '''  ui.statusValue.textContent = state.checkInProgress
    ? "Проверка…"
    : !state.enabled
      ? "Остановлен"
      : state.taskOnly
        ? "Работают задачи"
        : "Работает";
  ui.statusDetail.textContent = state.enabled
    ? `${activeChats} активных · ${activeTasks} задач · ${errors} ошибок${state.taskOnly ? " · обычные чаты не проверяются" : ""}`
    : "Master-stop активен · фоновые отправки выключены";''',
    "Control Center taskOnly status",
)

replace_once(
    "chrome-extension/options/options.js",
    '''    "manual-task-stop": "Задача остановлена вручную",
    manual: "Наблюдение отключено"''',
    '''    "manual-task-stop": "Задача остановлена вручную",
    "global-stop": "Задача остановлена общим Stop",
    manual: "Наблюдение отключено"''',
    "Control Center global stop reason",
)

replace_once(
    "chrome-extension/options/options.js",
    '''    STOP_MONITORING: "Обычное наблюдение остановлено. Активные задачи продолжаются до своих guard-условий.",''',
    '''    STOP_MONITORING: "ChatPulse полностью остановлен. Активные задачи завершены общим Stop.",''',
    "Control Center master stop success copy",
)
