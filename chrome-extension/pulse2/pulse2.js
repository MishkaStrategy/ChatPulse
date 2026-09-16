const PORT_NAME = "chatpulse-pulse2";
const REQUEST_TIMEOUT_MS = 20_000;

const ui = {
  openPulse1Button: document.querySelector("#openPulse1Button"),
  toggleButton: document.querySelector("#toggleButton"),
  statusValue: document.querySelector("#statusValue"),
  statusDetail: document.querySelector("#statusDetail"),
  cycleValue: document.querySelector("#cycleValue"),
  cycleDetail: document.querySelector("#cycleDetail"),
  responseValue: document.querySelector("#responseValue"),
  responseDetail: document.querySelector("#responseDetail"),
  nextValue: document.querySelector("#nextValue"),
  phaseDetail: document.querySelector("#phaseDetail"),
  chatUrlField: document.querySelector("#chatUrlField"),
  projectUrlField: document.querySelector("#projectUrlField"),
  commandField: document.querySelector("#commandField"),
  startMessageField: document.querySelector("#startMessageField"),
  intervalField: document.querySelector("#intervalField"),
  messagesPerCycleField: document.querySelector("#messagesPerCycleField"),
  maxCyclesField: document.querySelector("#maxCyclesField"),
  useCurrentButton: document.querySelector("#useCurrentButton"),
  openCurrentButton: document.querySelector("#openCurrentButton"),
  saveButton: document.querySelector("#saveButton"),
  checkButton: document.querySelector("#checkButton"),
  messageBar: document.querySelector("#messageBar"),
  currentUrlLabel: document.querySelector("#currentUrlLabel"),
  phaseValue: document.querySelector("#phaseValue"),
  totalResponsesValue: document.querySelector("#totalResponsesValue"),
  lastCheckValue: document.querySelector("#lastCheckValue"),
  errorValue: document.querySelector("#errorValue"),
  historyList: document.querySelector("#historyList"),
  versionLabel: document.querySelector("#versionLabel")
};

let state = null;
let port = null;
let busy = false;
let reconnectTimer = null;
let requestSequence = 0;
const pending = new Map();

const manifest = chrome.runtime.getManifest();
ui.versionLabel.textContent = `ChatPulse ${manifest.version_name || manifest.version}`;

connect();

ui.openPulse1Button.addEventListener("click", () => chrome.runtime.openOptionsPage());
ui.useCurrentButton.addEventListener("click", () => { void runAction("USE_CURRENT_CHAT"); });
ui.openCurrentButton.addEventListener("click", () => { void runAction("OPEN_CURRENT_CHAT", {}, false); });
ui.saveButton.addEventListener("click", () => { void saveSettings(); });
ui.checkButton.addEventListener("click", () => { void runAction("CHECK_NOW"); });
ui.toggleButton.addEventListener("click", () => { void togglePulse2(); });

async function togglePulse2() {
  if (state?.enabled) {
    await runAction("STOP");
    return;
  }
  const saved = await saveSettings(false);
  if (!saved) return;
  await runAction("START");
}

async function saveSettings(showSuccess = true) {
  return runAction("UPDATE_SETTINGS", {
    patch: {
      currentChatUrl: ui.chatUrlField.value.trim(),
      projectUrl: ui.projectUrlField.value.trim(),
      commandText: ui.commandField.value,
      startMessage: ui.startMessageField.value,
      intervalMinutes: Number(ui.intervalField.value),
      messagesPerCycle: Number(ui.messagesPerCycleField.value),
      maxCycles: Number(ui.maxCyclesField.value)
    }
  }, showSuccess);
}

function connect() {
  clearTimeout(reconnectTimer);
  port = chrome.runtime.connect({ name: PORT_NAME });
  port.onMessage.addListener(handlePortMessage);
  port.onDisconnect.addListener(() => {
    port = null;
    for (const { reject, timeout } of pending.values()) {
      clearTimeout(timeout);
      reject(new Error("Pulse 2.0 переподключается к фоновому engine."));
    }
    pending.clear();
    reconnectTimer = setTimeout(connect, 500);
  });
  void request("GET_STATE").catch((error) => showMessage(errorMessage(error), "error"));
}

function handlePortMessage(message) {
  if (message?.kind === "state" && message.state) {
    state = message.state;
    render();
    return;
  }
  if (message?.kind !== "response" || !message.requestId) return;
  const waiter = pending.get(message.requestId);
  if (!waiter) return;
  pending.delete(message.requestId);
  clearTimeout(waiter.timeout);
  if (message.ok) waiter.resolve(message);
  else waiter.reject(new Error(message.error || "Pulse 2.0 не ответил."));
}

async function runAction(type, payload = {}, showSuccess = true) {
  if (busy) return false;
  setBusy(true);
  try {
    const response = await request(type, payload);
    if (response.state) state = response.state;
    render();
    if (showSuccess) showMessage(successMessage(type), "info");
    return true;
  } catch (error) {
    showMessage(errorMessage(error), "error");
    return false;
  } finally {
    setBusy(false);
  }
}

function request(type, payload = {}) {
  if (!port) return Promise.reject(new Error("Фоновый engine Pulse 2.0 недоступен."));
  const requestId = `pulse2-ui-${Date.now()}-${++requestSequence}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error("Pulse 2.0 не ответил вовремя."));
    }, REQUEST_TIMEOUT_MS);
    pending.set(requestId, { resolve, reject, timeout });
    port.postMessage({ requestId, type, ...payload });
  });
}

function render() {
  if (!state) return;
  const running = state.enabled === true;
  ui.toggleButton.textContent = running ? "Остановить Pulse 2.0" : "Запустить Pulse 2.0";
  ui.toggleButton.dataset.running = String(running);
  ui.statusValue.textContent = statusLabel(state);
  ui.statusDetail.textContent = statusDetail(state);
  ui.cycleValue.textContent = `${state.cycleNumber}/${state.maxCycles}`;
  ui.cycleDetail.textContent = `${state.completedCycles} завершено`;
  ui.responseValue.textContent = `${state.cycleContinuationCount}/${state.messagesPerCycle}`;
  ui.responseDetail.textContent = `${state.totalContinuationCount} всего`;
  ui.nextValue.textContent = nextActionLabel(state);
  ui.phaseDetail.textContent = phaseLabel(state.phase);

  ui.chatUrlField.value = state.currentChatUrl || "";
  ui.projectUrlField.value = state.projectUrl || "";
  ui.commandField.value = state.commandText || "go";
  ui.startMessageField.value = state.startMessage || "";
  ensureIntervalOption(state.intervalMinutes);
  ui.intervalField.value = String(state.intervalMinutes);
  ui.messagesPerCycleField.value = String(state.messagesPerCycle);
  ui.maxCyclesField.value = String(state.maxCycles);

  for (const control of [
    ui.chatUrlField,
    ui.projectUrlField,
    ui.commandField,
    ui.startMessageField,
    ui.intervalField,
    ui.messagesPerCycleField,
    ui.maxCyclesField,
    ui.useCurrentButton,
    ui.saveButton
  ]) {
    control.disabled = running || busy;
  }
  ui.openCurrentButton.disabled = busy || !state.currentChatUrl;
  ui.checkButton.disabled = busy || !running || state.phase !== "monitoring";

  ui.currentUrlLabel.textContent = state.currentChatUrl || "—";
  ui.currentUrlLabel.title = state.currentChatUrl || "";
  ui.phaseValue.textContent = phaseLabel(state.phase);
  ui.totalResponsesValue.textContent = String(state.totalContinuationCount || 0);
  ui.lastCheckValue.textContent = state.lastCheckAt ? formatDateTime(state.lastCheckAt) : "—";
  ui.errorValue.textContent = state.lastError || "—";
  ui.errorValue.style.color = state.lastError ? "var(--danger)" : "inherit";
  renderHistory(state.history || []);
}

function renderHistory(history) {
  ui.historyList.replaceChildren();
  for (const item of [...history].reverse()) {
    const row = document.createElement("div");
    row.className = "history-item";
    const cycle = document.createElement("strong");
    cycle.textContent = `Цикл ${item.cycle}`;
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = item.title || item.url;
    link.title = item.url;
    const meta = document.createElement("small");
    meta.textContent = `${item.source === "project" ? "создан в проекте" : "исходный"} · ${formatDateTime(item.createdAt)}`;
    row.append(cycle, link, meta);
    ui.historyList.append(row);
  }
}

function statusLabel(value) {
  if (value.checkInProgress) return "Проверка…";
  if (!value.enabled) {
    if (value.phase === "completed") return "Завершён";
    if (value.phase === "error") return "Ошибка";
    return "Остановлен";
  }
  if (value.phase === "capture-wait") return "Ждёт новый URL";
  if (value.phase === "rotating") return "Создаёт новый чат";
  return "Работает";
}

function statusDetail(value) {
  if (value.lastError) return value.lastError;
  if (value.phase === "capture-wait" && value.captureDueAt) {
    return `Захват ссылки после ${formatDateTime(value.captureDueAt)}`;
  }
  if (value.rotationPending) return "Лимит автоответов достигнут; ждём завершения последнего ответа перед ротацией";
  if (value.enabled) return "Pulse 1.0 не затрагивается";
  if (value.phase === "completed") return "Все заданные циклы завершены";
  return "Автономный engine выключен";
}

function nextActionLabel(value) {
  if (value.phase === "capture-wait" && value.captureDueAt) return formatDateTime(value.captureDueAt);
  if (value.nextCheckAt) return formatDateTime(value.nextCheckAt);
  if (value.phase === "rotating") return "Ротация";
  if (value.phase === "completed") return "Готово";
  return "—";
}

function phaseLabel(phase) {
  return {
    idle: "Ожидание запуска",
    monitoring: "Мониторинг текущего чата",
    rotating: "Переход в проект и создание чата",
    "capture-wait": "Двухминутная задержка перед захватом URL",
    completed: "Все циклы завершены",
    stopped: "Остановлен вручную",
    error: "Остановлен из-за ошибки"
  }[phase] || phase || "—";
}

function successMessage(type) {
  return {
    UPDATE_SETTINGS: "Настройки Pulse 2.0 сохранены.",
    USE_CURRENT_CHAT: "Открытый чат добавлен в Pulse 2.0.",
    START: "Pulse 2.0 запущен в отдельном автономном режиме.",
    STOP: "Pulse 2.0 остановлен. Pulse 1.0 не изменён.",
    CHECK_NOW: "Проверка Pulse 2.0 выполнена.",
    OPEN_CURRENT_CHAT: "Текущий чат открыт."
  }[type] || "Готово.";
}

function ensureIntervalOption(value) {
  const normalized = String(value);
  if ([...ui.intervalField.options].some((option) => option.value === normalized)) return;
  const option = document.createElement("option");
  option.value = normalized;
  option.textContent = `${normalized} мин`;
  ui.intervalField.append(option);
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

function setBusy(value) {
  busy = value;
  render();
}

function showMessage(message, kind) {
  ui.messageBar.hidden = false;
  ui.messageBar.textContent = message;
  ui.messageBar.dataset.kind = kind;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    ui.messageBar.hidden = true;
  }, kind === "error" ? 8_000 : 4_000);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
