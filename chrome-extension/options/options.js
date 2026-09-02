const TELEGRAM_ORIGIN = "https://api.telegram.org/*";

const ui = {
  body: document.body,
  themeSelect: document.querySelector("#themeSelect"),
  toggleButton: document.querySelector("#toggleButton"),
  statusValue: document.querySelector("#statusValue"),
  statusDetail: document.querySelector("#statusDetail"),
  chatMetric: document.querySelector("#chatMetric"),
  taskMetric: document.querySelector("#taskMetric"),
  taskMetricDetail: document.querySelector("#taskMetricDetail"),
  lastCheckMetric: document.querySelector("#lastCheckMetric"),
  nextCheckMetric: document.querySelector("#nextCheckMetric"),
  commandField: document.querySelector("#commandField"),
  stopPhraseField: document.querySelector("#stopPhraseField"),
  intervalSelect: document.querySelector("#intervalSelect"),
  telegramEnabled: document.querySelector("#telegramEnabled"),
  telegramChatId: document.querySelector("#telegramChatId"),
  telegramBotToken: document.querySelector("#telegramBotToken"),
  telegramTestButton: document.querySelector("#telegramTestButton"),
  telegramStatus: document.querySelector("#telegramStatus"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  checkButton: document.querySelector("#checkButton"),
  saveButton: document.querySelector("#saveButton"),
  addCurrentButton: document.querySelector("#addCurrentButton"),
  addCurrentTopButton: document.querySelector("#addCurrentTopButton"),
  clearLogsButton: document.querySelector("#clearLogsButton"),
  messageBar: document.querySelector("#messageBar"),
  chatTable: document.querySelector("#chatTable"),
  logList: document.querySelector("#logList"),
  chatRowTemplate: document.querySelector("#chatRowTemplate"),
  logTemplate: document.querySelector("#logTemplate"),
  versionLabel: document.querySelector("#versionLabel")
};

let state = null;
let busy = false;
let messageTimer = null;
let commandDirty = false;
let stopPhraseDirty = false;
let intervalDirty = false;
let telegramDirty = false;
const profileDrafts = new Map();
const openProfiles = new Set();

const manifest = chrome.runtime.getManifest();
ui.versionLabel.textContent = `ChatPulse ${manifest.version_name || manifest.version}`;

void refresh();

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "STATE_UPDATED" && message.state) {
    rememberOpenProfiles();
    state = message.state;
    render();
  }
});

ui.toggleButton.addEventListener("click", () => action(
  state?.enabled ? "STOP_MONITORING" : "START_MONITORING"
));
ui.checkButton.addEventListener("click", () => action("CHECK_NOW"));
ui.addCurrentButton.addEventListener("click", () => action("ADD_CURRENT_CHAT"));
ui.addCurrentTopButton.addEventListener("click", () => action("ADD_CURRENT_CHAT"));
ui.clearLogsButton.addEventListener("click", () => action("CLEAR_LOGS"));
ui.commandField.addEventListener("input", () => {
  commandDirty = ui.commandField.value !== (state?.commandText || "");
});
ui.stopPhraseField.addEventListener("input", () => {
  stopPhraseDirty = ui.stopPhraseField.value !== (state?.stopPhrase || "");
});
ui.intervalSelect.addEventListener("change", () => {
  intervalDirty = Number(ui.intervalSelect.value) !== Number(state?.intervalMinutes);
});
for (const control of [ui.telegramEnabled, ui.telegramChatId, ui.telegramBotToken]) {
  control.addEventListener("input", () => { telegramDirty = true; });
  control.addEventListener("change", () => { telegramDirty = true; });
}
ui.saveButton.addEventListener("click", () => { void saveSettings(); });
ui.telegramTestButton.addEventListener("click", () => { void testTelegram(); });
ui.exportButton.addEventListener("click", () => { void exportConfig(); });
ui.importButton.addEventListener("click", () => ui.importFile.click());
ui.importFile.addEventListener("change", () => { void importConfigFile(); });
ui.themeSelect.addEventListener("change", () => {
  ui.body.dataset.theme = ui.themeSelect.value === "preview" ? "preview" : "macos";
  void action("UPDATE_SETTINGS", { patch: { theme: ui.themeSelect.value } }, false);
});

async function refresh() {
  try {
    const response = await request("GET_STATE");
    state = response.state;
    render(true);
  } catch (error) {
    showMessage(errorMessage(error), "error");
  }
}

async function saveSettings() {
  const patch = {
    commandText: ui.commandField.value,
    stopPhrase: ui.stopPhraseField.value,
    intervalMinutes: Number(ui.intervalSelect.value),
    theme: ui.themeSelect.value
  };

  if (telegramDirty) {
    if (ui.telegramEnabled.checked && !(await ensureTelegramPermission())) return;
    patch.telegramEnabled = ui.telegramEnabled.checked;
    patch.telegramChatId = ui.telegramChatId.value;
    if (ui.telegramBotToken.value.trim()) {
      patch.telegramBotToken = ui.telegramBotToken.value.trim();
    }
  }

  await action("UPDATE_SETTINGS", { patch });
}

async function testTelegram() {
  if (!(await ensureTelegramPermission())) return;
  const patch = {
    telegramEnabled: true,
    telegramChatId: ui.telegramChatId.value
  };
  if (ui.telegramBotToken.value.trim()) {
    patch.telegramBotToken = ui.telegramBotToken.value.trim();
  }
  const updated = await action("UPDATE_SETTINGS", { patch }, false);
  if (!updated) return;
  ui.telegramEnabled.checked = true;
  await action("TEST_TELEGRAM");
}

async function ensureTelegramPermission() {
  try {
    const granted = await chrome.permissions.request({ origins: [TELEGRAM_ORIGIN] });
    if (!granted) {
      showMessage("Telegram-уведомления не включены: Chrome не выдал доступ к api.telegram.org.", "error");
      return false;
    }
    return true;
  } catch (error) {
    showMessage(errorMessage(error), "error");
    return false;
  }
}

async function exportConfig() {
  if (busy) return;
  setBusy(true);
  try {
    const response = await request("EXPORT_CONFIG");
    const payload = JSON.stringify(response.config, null, 2);
    const blob = new Blob([`${payload}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ChatPulse-config-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    showMessage("Конфигурация экспортирована без Telegram token и runtime-данных.", "info");
  } catch (error) {
    showMessage(errorMessage(error), "error");
  } finally {
    setBusy(false);
  }
}

async function importConfigFile() {
  const [file] = ui.importFile.files || [];
  ui.importFile.value = "";
  if (!file) return;
  if (file.size > 1_000_000) {
    showMessage("Файл конфигурации слишком большой.", "error");
    return;
  }
  try {
    const config = JSON.parse(await file.text());
    if (!confirm("Импорт заменит список отслеживаемых чатов и общие настройки. Telegram credentials останутся локальными и не изменятся. Продолжить?")) {
      return;
    }
    profileDrafts.clear();
    openProfiles.clear();
    await action("IMPORT_CONFIG", { config });
  } catch (error) {
    showMessage(`Не удалось импортировать конфигурацию: ${errorMessage(error)}`, "error");
  }
}

async function action(type, payload = {}, showSuccess = true) {
  if (busy) return false;
  setBusy(true);
  try {
    const response = await request(type, payload);
    if (response.state) state = response.state;
    const patch = payload?.patch || {};
    if (type === "UPDATE_SETTINGS" && Object.hasOwn(patch, "commandText")) commandDirty = false;
    if (type === "UPDATE_SETTINGS" && Object.hasOwn(patch, "stopPhrase")) stopPhraseDirty = false;
    if (type === "UPDATE_SETTINGS" && Object.hasOwn(patch, "intervalMinutes")) intervalDirty = false;
    if (type === "UPDATE_SETTINGS" && Object.keys(patch).some((key) => key.startsWith("telegram"))) {
      telegramDirty = false;
      ui.telegramBotToken.value = "";
    }
    render(type === "GET_STATE" || type === "IMPORT_CONFIG");
    if (showSuccess) showMessage(successMessage(type), "info");
    return true;
  } catch (error) {
    showMessage(errorMessage(error), "error");
    return false;
  } finally {
    setBusy(false);
  }
}

async function request(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...payload });
  if (!response?.ok) throw new Error(response?.error || "Фоновый процесс ChatPulse не ответил.");
  return response;
}

function render(initial = false) {
  if (!state) return;

  ui.body.dataset.theme = state.theme === "preview" ? "preview" : "macos";
  ui.themeSelect.value = state.theme;
  ui.toggleButton.textContent = state.enabled ? "Остановить" : "Запустить";
  ui.toggleButton.dataset.running = String(state.enabled);

  const activeChats = state.chats.filter((chat) => chat.enabled).length;
  const activeTasks = state.chats.filter((chat) => chat.taskActive).length;
  const completedTasks = state.chats.filter((chat) => chat.taskCompletedAt).length;
  const errors = state.chats.filter((chat) => chat.lastError).length;
  ui.statusValue.textContent = state.checkInProgress
    ? "Проверка…"
    : state.enabled
      ? "Работает"
      : "Остановлен";
  ui.statusDetail.textContent = state.enabled
    ? `${activeChats} активных · ${activeTasks} задач · ${errors} ошибок`
    : "Фоновый таймер не активен";
  ui.chatMetric.textContent = String(activeChats);
  ui.taskMetric.textContent = String(activeTasks);
  ui.taskMetricDetail.textContent = `${completedTasks} завершено в текущем локальном state`;
  ui.lastCheckMetric.textContent = state.lastCheckAt ? formatDateTime(state.lastCheckAt) : "—";
  ui.nextCheckMetric.textContent = `Следующая: ${state.nextCheckAt ? formatDateTime(state.nextCheckAt) : "—"}`;

  if (initial || !commandDirty) ui.commandField.value = state.commandText;
  if (initial || !stopPhraseDirty) ui.stopPhraseField.value = state.stopPhrase || "";
  ensureIntervalOption(state.intervalMinutes);
  if (initial || !intervalDirty) ui.intervalSelect.value = String(state.intervalMinutes);

  const telegram = state.telegram || {
    enabled: false,
    chatId: "",
    tokenConfigured: false,
    permissionGranted: false
  };
  if (initial || !telegramDirty) {
    ui.telegramEnabled.checked = telegram.enabled === true;
    ui.telegramChatId.value = telegram.chatId || "";
    ui.telegramBotToken.value = "";
  }
  ui.telegramBotToken.placeholder = telegram.tokenConfigured
    ? "Токен сохранён · оставьте пустым"
    : "Токен от @BotFather";
  ui.telegramStatus.textContent = telegram.enabled
    ? telegram.permissionGranted
      ? `Включено${telegram.tokenConfigured ? " · token сохранён" : ""}`
      : "Включено, но доступ к Telegram отозван"
    : telegram.tokenConfigured
      ? "Выключено · token сохранён локально"
      : "Telegram выключен.";

  renderChats();
  renderLogs();
}

function renderChats() {
  rememberOpenProfiles();
  ui.chatTable.replaceChildren();

  for (const chat of state.chats) {
    const fragment = ui.chatRowTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".chat-row");
    const details = row.querySelector(".profile-details");
    const openButton = row.querySelector(".open-chat");
    const toggleButton = row.querySelector(".toggle-chat");
    const taskButton = row.querySelector(".task-chat");
    const removeButton = row.querySelector(".remove-chat");
    const saveProfileButton = row.querySelector(".save-profile");
    const effective = effectiveProfile(chat);
    const draft = profileDrafts.get(chat.id) || profileToDraft(chat.profile);

    row.dataset.enabled = String(chat.enabled);
    row.dataset.task = String(chat.taskActive === true);
    row.dataset.error = String(Boolean(chat.lastError));
    row.dataset.chatId = chat.id;
    details.dataset.chatId = chat.id;
    details.open = openProfiles.has(chat.id);
    details.addEventListener("toggle", () => {
      if (details.open) openProfiles.add(chat.id);
      else openProfiles.delete(chat.id);
    });

    row.querySelector(".chat-title").textContent = chat.title;
    row.querySelector(".chat-url").textContent = chat.url;
    row.querySelector(".chat-status-label").textContent = chatStatusLabel(chat);
    row.querySelector(".chat-runtime-text").textContent = runtimeText(chat);
    renderProgress(row, chat, effective);

    toggleButton.textContent = chat.enabled ? "Отключить" : "Включить";
    taskButton.textContent = chat.taskActive ? "Остановить задачу" : "Запустить до завершения";
    taskButton.dataset.running = String(chat.taskActive === true);

    const command = row.querySelector(".profile-command");
    const interval = row.querySelector(".profile-interval");
    const stopMode = row.querySelector(".profile-stop-mode");
    const stop = row.querySelector(".profile-stop");
    const maxContinuations = row.querySelector(".profile-max-continuations");
    const maxRuntime = row.querySelector(".profile-max-runtime");
    const telegramNotify = row.querySelector(".profile-telegram-notify");
    const effectiveText = row.querySelector(".profile-effective");

    command.value = draft.commandText || "";
    command.placeholder = `Общая: ${truncate(state.commandText, 80)}`;
    ensureProfileIntervalOption(interval, draft.intervalMinutes);
    interval.value = draft.intervalMinutes === null ? "" : String(draft.intervalMinutes);
    stopMode.value = draft.stopMode;
    stop.value = draft.stopPhrase;
    stop.disabled = draft.stopMode !== "custom";
    maxContinuations.value = String(draft.maxContinuations);
    maxRuntime.value = String(draft.maxRuntimeMinutes);
    telegramNotify.checked = draft.telegramNotify;
    effectiveText.textContent = profileSummary(effective);

    const capture = () => {
      const nextDraft = readProfileDraft(row);
      profileDrafts.set(chat.id, nextDraft);
      stop.disabled = nextDraft.stopMode !== "custom";
    };
    for (const control of [command, interval, stopMode, stop, maxContinuations, maxRuntime, telegramNotify]) {
      control.addEventListener("input", capture);
      control.addEventListener("change", capture);
    }

    openButton.addEventListener("click", () => action("OPEN_CHAT", { chatId: chat.id }));
    toggleButton.addEventListener("click", () => action("TOGGLE_CHAT", { chatId: chat.id }));
    saveProfileButton.addEventListener("click", () => { void saveChatProfile(chat.id, row); });
    taskButton.addEventListener("click", () => { void toggleTask(chat, row); });
    removeButton.addEventListener("click", async () => {
      if (!confirm(`Удалить чат «${chat.title}» из ChatPulse?`)) return;
      profileDrafts.delete(chat.id);
      openProfiles.delete(chat.id);
      await action("REMOVE_CHAT", { chatId: chat.id });
    });

    ui.chatTable.append(row);
  }
}

async function saveChatProfile(chatId, row, showSuccess = true) {
  const draft = readProfileDraft(row);
  const profile = draftToProfile(draft);
  const saved = await action("UPDATE_CHAT_PROFILE", { chatId, profile }, showSuccess);
  if (saved) profileDrafts.delete(chatId);
  return saved;
}

async function toggleTask(chat, row) {
  if (chat.taskActive) {
    await action("STOP_TASK", { chatId: chat.id });
    return;
  }
  if (profileDrafts.has(chat.id)) {
    const saved = await saveChatProfile(chat.id, row, false);
    if (!saved) return;
  }
  await action("START_TASK", { chatId: chat.id });
}

function readProfileDraft(root) {
  const intervalRaw = root.querySelector(".profile-interval").value;
  return {
    commandText: root.querySelector(".profile-command").value.trim(),
    intervalMinutes: intervalRaw === "" ? null : Number(intervalRaw),
    stopMode: root.querySelector(".profile-stop-mode").value,
    stopPhrase: root.querySelector(".profile-stop").value,
    maxContinuations: nonNegativeInteger(root.querySelector(".profile-max-continuations").value),
    maxRuntimeMinutes: nonNegativeInteger(root.querySelector(".profile-max-runtime").value),
    telegramNotify: root.querySelector(".profile-telegram-notify").checked
  };
}

function profileToDraft(profile = {}) {
  const stopValue = Object.hasOwn(profile, "stopPhrase") ? profile.stopPhrase : null;
  const stopMode = stopValue === null || stopValue === undefined
    ? "inherit"
    : stopValue === ""
      ? "off"
      : "custom";
  return {
    commandText: profile.commandText || "",
    intervalMinutes: profile.intervalMinutes ?? null,
    stopMode,
    stopPhrase: stopMode === "custom" ? stopValue : "",
    maxContinuations: nonNegativeInteger(profile.maxContinuations),
    maxRuntimeMinutes: nonNegativeInteger(profile.maxRuntimeMinutes),
    telegramNotify: profile.telegramNotify !== false
  };
}

function draftToProfile(draft) {
  return {
    commandText: draft.commandText || null,
    intervalMinutes: draft.intervalMinutes,
    stopPhrase: draft.stopMode === "inherit"
      ? null
      : draft.stopMode === "off"
        ? ""
        : draft.stopPhrase,
    maxContinuations: draft.maxContinuations,
    maxRuntimeMinutes: draft.maxRuntimeMinutes,
    telegramNotify: draft.telegramNotify
  };
}

function effectiveProfile(chat) {
  const profile = chat.profile || {};
  const stopPhrase = profile.stopPhrase === null || profile.stopPhrase === undefined
    ? state.stopPhrase || ""
    : profile.stopPhrase;
  return {
    commandText: profile.commandText || state.commandText,
    intervalMinutes: profile.intervalMinutes ?? state.intervalMinutes,
    stopPhrase,
    maxContinuations: nonNegativeInteger(profile.maxContinuations),
    maxRuntimeMinutes: nonNegativeInteger(profile.maxRuntimeMinutes),
    telegramNotify: profile.telegramNotify !== false
  };
}

function profileSummary(profile) {
  const pieces = [`${formatInterval(profile.intervalMinutes)} интервал`];
  if (profile.maxContinuations > 0) pieces.push(`≤ ${profile.maxContinuations} продолжений`);
  if (profile.maxRuntimeMinutes > 0) pieces.push(`≤ ${formatDuration(profile.maxRuntimeMinutes)}`);
  if (profile.stopPhrase) pieces.push("stop guard");
  if (!profile.telegramNotify) pieces.push("Telegram off");
  return pieces.join(" · ");
}

function renderProgress(root, chat, profile) {
  const text = root.querySelector(".chat-progress-text");
  const bar = root.querySelector(".chat-progress-bar");
  const pieces = [];
  pieces.push(`${chat.continuationCount || 0}${profile.maxContinuations > 0 ? `/${profile.maxContinuations}` : ""} продолжений`);

  const startedAt = Date.parse(String(chat.runStartedAt || ""));
  const elapsedMinutes = Number.isFinite(startedAt)
    ? Math.max(0, Math.floor((Date.now() - startedAt) / 60_000))
    : 0;
  if (profile.maxRuntimeMinutes > 0) {
    pieces.push(`${formatDuration(elapsedMinutes)} / ${formatDuration(profile.maxRuntimeMinutes)}`);
  }
  if (chat.taskCompletedAt) pieces.push(`завершено: ${completionLabel(chat.taskCompletionReason)}`);
  text.textContent = pieces.join(" · ");

  if (profile.maxContinuations > 0) {
    bar.hidden = false;
    bar.max = profile.maxContinuations;
    bar.value = Math.min(chat.continuationCount || 0, profile.maxContinuations);
  } else if (profile.maxRuntimeMinutes > 0) {
    bar.hidden = false;
    bar.max = profile.maxRuntimeMinutes;
    bar.value = Math.min(elapsedMinutes, profile.maxRuntimeMinutes);
  } else {
    bar.hidden = true;
  }
}

function chatStatusLabel(chat) {
  if (chat.taskActive) return "Задача выполняется";
  if (!chat.enabled) return completionLabel(chat.lastStopReason) || "Отключён";
  if (chat.lastError) return "Ошибка";
  return {
    generating: "ChatGPT генерирует",
    "baseline-recorded": "Baseline записан",
    "response-changed": "Новый ответ",
    "waiting-for-assistant": "Ждёт ответа",
    "already-continued": "Ответ уже продолжен",
    "send-continuation": "Готов к продолжению",
    "page-not-ready": "Страница загружается",
    "not-authenticated": "Нет входа",
    "page-error": "Ошибка страницы",
    "no-messages": "Нет сообщений",
    enabled: "Включён",
    "task-started": "Задача запущена"
  }[chat.lastDecision] || "Наблюдение включено";
}

function runtimeText(chat) {
  if (!chat.enabled && chat.lastStopReason) {
    return `${completionLabel(chat.lastStopReason)}${chat.lastStoppedAt ? ` · ${formatDateTime(chat.lastStoppedAt)}` : ""}`;
  }
  if (!chat.enabled) return "Наблюдение отключено";
  if (chat.lastError) return `Ошибка: ${chat.lastError}`;
  if (chat.nextEligibleAt) return `Следующая проверка ${formatDateTime(chat.nextEligibleAt)}`;
  if (chat.lastRecoveryAt && (!chat.lastCommandAt || chat.lastRecoveryAt > chat.lastCommandAt)) {
    return `Вкладка восстановлена ${formatDateTime(chat.lastRecoveryAt)}`;
  }
  if (chat.lastCommandAt) {
    const outcome = chat.lastDispatchOutcome === "confirmed" ? "подтверждено" : "клик выполнен";
    return `Отправлено ${formatDateTime(chat.lastCommandAt)} · ${outcome}`;
  }
  if (chat.lastObservedAt) return `Проверен ${formatDateTime(chat.lastObservedAt)}`;
  return "Ожидает первой безопасной проверки";
}

function completionLabel(reason) {
  return {
    "stop-phrase": "Остановлен стоп-фразой",
    "continuation-limit": "Лимит продолжений достигнут",
    "runtime-limit": "Лимит времени достигнут",
    "manual-task-stop": "Задача остановлена вручную",
    manual: "Наблюдение отключено"
  }[reason] || "";
}

function renderLogs() {
  ui.logList.replaceChildren();
  const recentLogs = [...state.logs].reverse().slice(0, 100);

  for (const log of recentLogs) {
    const fragment = ui.logTemplate.content.cloneNode(true);
    const entry = fragment.querySelector(".log-entry");
    entry.dataset.level = log.level || "debug";
    fragment.querySelector("time").textContent = formatDateTime(log.at);
    fragment.querySelector(".log-level").textContent = levelLabel(log.level);
    fragment.querySelector("p").textContent = log.message;
    ui.logList.append(fragment);
  }
}

function rememberOpenProfiles() {
  for (const details of ui.chatTable.querySelectorAll(".profile-details[data-chat-id]")) {
    if (details.open) openProfiles.add(details.dataset.chatId);
    else openProfiles.delete(details.dataset.chatId);
  }
}

function ensureIntervalOption(value) {
  const raw = String(value);
  if ([...ui.intervalSelect.options].some((option) => option.value === raw)) return;
  const option = document.createElement("option");
  option.value = raw;
  option.textContent = `${value} мин`;
  ui.intervalSelect.append(option);
}

function ensureProfileIntervalOption(select, value) {
  if (value === null || value === undefined) return;
  const raw = String(value);
  if ([...select.options].some((option) => option.value === raw)) return;
  const option = document.createElement("option");
  option.value = raw;
  option.textContent = `${value} мин`;
  select.append(option);
}

function successMessage(type) {
  const messages = {
    START_MONITORING: "Наблюдение запущено. Первая проверка новой сессии будет пассивной.",
    STOP_MONITORING: "Наблюдение остановлено.",
    CHECK_NOW: "Ручная проверка завершена.",
    ADD_CURRENT_CHAT: "Последний использованный чат ChatGPT добавлен или обновлён.",
    REMOVE_CHAT: "Чат удалён.",
    TOGGLE_CHAT: "Состояние чата изменено.",
    UPDATE_CHAT_PROFILE: "Профиль чата сохранён.",
    START_TASK: "Задача запущена до условия завершения.",
    STOP_TASK: "Задача остановлена.",
    UPDATE_SETTINGS: "Общие настройки сохранены.",
    TEST_TELEGRAM: "Тестовое уведомление отправлено в Telegram.",
    IMPORT_CONFIG: "Конфигурация импортирована. Мониторинг оставлен остановленным для безопасного baseline.",
    CLEAR_LOGS: "Журнал очищен.",
    OPEN_CHAT: "Чат открыт в Chrome."
  };
  return messages[type] || "Готово.";
}

function levelLabel(level) {
  return {
    debug: "ОТЛАДКА",
    info: "ИНФО",
    warning: "ВНИМАНИЕ",
    error: "ОШИБКА"
  }[level] || "СОБЫТИЕ";
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function formatDuration(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  if (total < 60) return `${Math.round(total)} мин`;
  const hours = Math.floor(total / 60);
  const rest = Math.round(total % 60);
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function formatInterval(minutes) {
  const value = Number(minutes);
  if (value === 0.5) return "30 сек";
  return formatDuration(value);
}

function nonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

function truncate(value, length) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function setBusy(value) {
  busy = value;
  for (const control of document.querySelectorAll("button, select, textarea, input")) {
    control.disabled = value;
  }
  if (!value) syncProfileStopDisabled();
}

function syncProfileStopDisabled() {
  for (const row of ui.chatTable.querySelectorAll(".chat-row")) {
    const mode = row.querySelector(".profile-stop-mode");
    const stop = row.querySelector(".profile-stop");
    if (mode && stop) stop.disabled = mode.value !== "custom";
  }
}

function showMessage(message, level) {
  clearTimeout(messageTimer);
  ui.messageBar.hidden = false;
  ui.messageBar.dataset.level = level;
  ui.messageBar.textContent = message;
  messageTimer = setTimeout(() => {
    ui.messageBar.hidden = true;
  }, 5_000);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
