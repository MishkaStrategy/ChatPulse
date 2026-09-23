const PORT_NAME = "chatpulse-pulse2";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ROUTES = 20;

const ui = {
  openPulse1Button: document.querySelector("#openPulse1Button"),
  toggleButton: document.querySelector("#toggleButton"),
  statusValue: document.querySelector("#statusValue"),
  statusDetail: document.querySelector("#statusDetail"),
  projectsValue: document.querySelector("#projectsValue"),
  projectsDetail: document.querySelector("#projectsDetail"),
  cycleValue: document.querySelector("#cycleValue"),
  cycleDetail: document.querySelector("#cycleDetail"),
  responseValue: document.querySelector("#responseValue"),
  responseDetail: document.querySelector("#responseDetail"),
  routeTabs: document.querySelector("#routeTabs"),
  addRouteButton: document.querySelector("#addRouteButton"),
  removeRouteButton: document.querySelector("#removeRouteButton"),
  routeNameField: document.querySelector("#routeNameField"),
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
  dirtyHint: document.querySelector("#dirtyHint"),
  messageBar: document.querySelector("#messageBar"),
  runtimeRouteName: document.querySelector("#runtimeRouteName"),
  currentUrlLabel: document.querySelector("#currentUrlLabel"),
  phaseValue: document.querySelector("#phaseValue"),
  nextValue: document.querySelector("#nextValue"),
  totalResponsesValue: document.querySelector("#totalResponsesValue"),
  lastCheckValue: document.querySelector("#lastCheckValue"),
  errorValue: document.querySelector("#errorValue"),
  historyList: document.querySelector("#historyList"),
  versionLabel: document.querySelector("#versionLabel")
};

const editableControls = [
  ui.routeNameField,
  ui.chatUrlField,
  ui.projectUrlField,
  ui.commandField,
  ui.startMessageField,
  ui.intervalField,
  ui.messagesPerCycleField,
  ui.maxCyclesField
];

let state = null;
let draft = null;
let draftDirty = false;
let selectedRouteId = null;
let port = null;
let busy = false;
let reconnectTimer = null;
let requestSequence = 0;
let lastRouteTabsSignature = "";
const pending = new Map();

const manifest = chrome.runtime.getManifest();
ui.versionLabel.textContent = `ChatPulse ${manifest.version_name || manifest.version}`;

connect();

ui.openPulse1Button.addEventListener("click", () => chrome.runtime.openOptionsPage());
ui.addRouteButton.addEventListener("click", addRoute);
ui.removeRouteButton.addEventListener("click", removeSelectedRoute);
ui.useCurrentButton.addEventListener("click", () => { void useCurrentChat(); });
ui.openCurrentButton.addEventListener("click", () => { void openCurrentChat(); });
ui.saveButton.addEventListener("click", () => { void saveSettings(); });
ui.checkButton.addEventListener("click", () => { void checkSelectedRoute(); });
ui.toggleButton.addEventListener("click", () => { void togglePulse2(); });

ui.routeNameField.addEventListener("input", () => updateSelectedRouteDraft("name", ui.routeNameField.value));
ui.chatUrlField.addEventListener("input", () => updateSelectedRouteDraft("currentChatUrl", ui.chatUrlField.value));
ui.projectUrlField.addEventListener("input", () => updateSelectedRouteDraft("projectUrl", ui.projectUrlField.value));
ui.commandField.addEventListener("input", () => updateGlobalDraft("commandText", ui.commandField.value));
ui.startMessageField.addEventListener("input", () => updateGlobalDraft("startMessage", ui.startMessageField.value));
ui.intervalField.addEventListener("change", () => updateGlobalDraft("intervalMinutes", ui.intervalField.value));
ui.messagesPerCycleField.addEventListener("input", () => updateGlobalDraft("messagesPerCycle", ui.messagesPerCycleField.value));
ui.maxCyclesField.addEventListener("input", () => updateGlobalDraft("maxCycles", ui.maxCyclesField.value));

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
  if (!draft || busy) return false;
  setBusy(true);
  try {
    const response = await request("UPDATE_SETTINGS", {
      patch: {
        commandText: draft.commandText,
        startMessage: draft.startMessage,
        intervalMinutes: Number(draft.intervalMinutes),
        messagesPerCycle: Number(draft.messagesPerCycle),
        maxCycles: Number(draft.maxCycles),
        routes: draft.routes.map((route) => ({
          id: route.id,
          name: route.name,
          currentChatUrl: route.currentChatUrl.trim(),
          projectUrl: route.projectUrl.trim()
        }))
      }
    });
    if (response.state) state = response.state;
    draftDirty = false;
    syncDraftFromState(state, true);
    render();
    if (showSuccess) showMessage("Настройки Pulse 2.0 сохранены.", "info");
    return true;
  } catch (error) {
    showMessage(errorMessage(error), "error");
    return false;
  } finally {
    setBusy(false);
  }
}

async function useCurrentChat() {
  if (state?.enabled || busy) return;
  setBusy(true);
  try {
    const response = await request("GET_ACTIVE_CHAT_URL");
    const route = selectedDraftRoute();
    if (!route) throw new Error("Сначала выберите проект.");
    route.currentChatUrl = response.url || "";
    markDraftDirty();
    renderDraftFields();
    showMessage("Открытый чат подставлен в выбранный маршрут. Сохраните настройки.", "info");
  } catch (error) {
    showMessage(errorMessage(error), "error");
  } finally {
    setBusy(false);
  }
}

async function openCurrentChat() {
  const route = selectedDraftRoute();
  const url = route?.currentChatUrl?.trim();
  if (!url || !selectedRouteId) {
    showMessage("У выбранного маршрута ещё нет текущего чата.", "error");
    return;
  }
  await runAction("OPEN_CURRENT_CHAT", { routeId: selectedRouteId }, false);
}

async function checkSelectedRoute() {
  if (!selectedRouteId) return;
  await runAction("CHECK_NOW", { routeId: selectedRouteId });
}

function addRoute() {
  if (state?.enabled || busy || !draft) return;
  if (draft.routes.length >= MAX_ROUTES) {
    showMessage(`Можно добавить не больше ${MAX_ROUTES} проектов.`, "error");
    return;
  }
  const id = createRouteId();
  draft.routes.push({
    id,
    name: `Проект ${draft.routes.length + 1}`,
    currentChatUrl: "",
    projectUrl: ""
  });
  selectedRouteId = id;
  markDraftDirty();
  lastRouteTabsSignature = "";
  render();
  ui.routeNameField.focus();
}

function removeSelectedRoute() {
  if (state?.enabled || busy || !draft || !selectedRouteId) return;
  if (draft.routes.length <= 1) {
    showMessage("В Pulse 2.0 должен остаться хотя бы один проект.", "error");
    return;
  }
  const index = draft.routes.findIndex((route) => route.id === selectedRouteId);
  if (index < 0) return;
  draft.routes.splice(index, 1);
  selectedRouteId = draft.routes[Math.min(index, draft.routes.length - 1)]?.id || null;
  markDraftDirty();
  lastRouteTabsSignature = "";
  render();
}

function updateSelectedRouteDraft(key, value) {
  const route = selectedDraftRoute();
  if (!route || state?.enabled) return;
  route[key] = value;
  markDraftDirty();
  if (key === "name") renderRouteTabs();
  renderControlsState();
}

function updateGlobalDraft(key, value) {
  if (!draft || state?.enabled) return;
  draft[key] = value;
  markDraftDirty();
  renderControlsState();
}

function markDraftDirty() {
  draftDirty = true;
  ui.dirtyHint.hidden = false;
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
  void request("GET_STATE").then((response) => {
    if (response.state) {
      state = response.state;
      maybeSyncDraftFromLiveState();
      render();
    }
  }).catch((error) => showMessage(errorMessage(error), "error"));
}

function handlePortMessage(message) {
  if (message?.kind === "state" && message.state) {
    state = message.state;
    maybeSyncDraftFromLiveState();
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

function maybeSyncDraftFromLiveState() {
  if (!state) return;
  if (!draft || state.enabled || (!draftDirty && !settingsFocused())) {
    syncDraftFromState(state, true);
  }
}

function syncDraftFromState(source, preserveSelection = false) {
  if (!source) return;
  const previousSelection = preserveSelection ? selectedRouteId : null;
  draft = {
    commandText: source.commandText || "go",
    startMessage: source.startMessage || "",
    intervalMinutes: String(source.intervalMinutes ?? 5),
    messagesPerCycle: String(source.messagesPerCycle ?? 5),
    maxCycles: String(source.maxCycles ?? 3),
    routes: (source.routes || []).map((route, index) => ({
      id: route.id || createRouteId(),
      name: route.name || `Проект ${index + 1}`,
      currentChatUrl: route.currentChatUrl || "",
      projectUrl: route.projectUrl || ""
    }))
  };
  if (!draft.routes.length) {
    draft.routes.push({ id: createRouteId(), name: "Проект 1", currentChatUrl: "", projectUrl: "" });
  }
  selectedRouteId = draft.routes.some((route) => route.id === previousSelection)
    ? previousSelection
    : draft.routes[0].id;
  draftDirty = false;
  lastRouteTabsSignature = "";
}

async function runAction(type, payload = {}, showSuccess = true) {
  if (busy) return false;
  setBusy(true);
  try {
    const response = await request(type, payload);
    if (response.state) state = response.state;
    maybeSyncDraftFromLiveState();
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
  if (!state || !draft) return;
  renderStatus();
  renderRouteTabs();
  renderDraftFields();
  renderControlsState();
  renderRuntime();
}

function renderStatus() {
  const routes = state.routes || [];
  const activeRoutes = routes.filter((route) => !["completed", "stopped", "error"].includes(route.phase));
  const completed = routes.filter((route) => route.phase === "completed").length;
  const errors = routes.filter((route) => route.phase === "error").length;
  ui.toggleButton.textContent = state.enabled ? "Остановить Pulse 2.0" : "Запустить Pulse 2.0";
  ui.toggleButton.dataset.running = String(state.enabled === true);
  ui.statusValue.textContent = state.enabled ? "Работает" : state.phase === "completed" ? "Завершён" : state.phase === "error" ? "Есть ошибки" : "Остановлен";
  ui.statusDetail.textContent = state.lastError || (state.enabled ? "Маршруты выполняются независимо" : "Автономный engine выключен");
  ui.projectsValue.textContent = `${activeRoutes.length}/${routes.length}`;
  ui.projectsDetail.textContent = `${completed} завершено${errors ? ` · ${errors} с ошибкой` : ""}`;

  const selected = selectedStateRoute();
  ui.cycleValue.textContent = selected ? `${selected.cycleNumber}/${state.maxCycles}` : "—";
  ui.cycleDetail.textContent = selected ? `${selected.completedCycles} завершено` : "Выберите проект";
  ui.responseValue.textContent = selected ? `${selected.cycleContinuationCount}/${state.messagesPerCycle}` : "—";
  ui.responseDetail.textContent = selected ? `${selected.totalContinuationCount} всего` : "—";
}

function renderRouteTabs() {
  if (!draft) return;
  const signature = JSON.stringify(draft.routes.map((route) => {
    const live = state?.routes?.find((item) => item.id === route.id);
    return [route.id, route.name, live?.phase || "draft", route.id === selectedRouteId];
  }));
  if (signature === lastRouteTabsSignature) return;
  lastRouteTabsSignature = signature;
  ui.routeTabs.replaceChildren();
  for (const route of draft.routes) {
    const live = state?.routes?.find((item) => item.id === route.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "route-tab";
    button.dataset.selected = String(route.id === selectedRouteId);
    const title = document.createElement("strong");
    title.textContent = route.name.trim() || "Без названия";
    const status = document.createElement("small");
    status.textContent = routeStatusLabel(live?.phase || "draft");
    if (live?.phase === "error") status.dataset.kind = "error";
    button.append(title, status);
    button.addEventListener("click", () => {
      selectedRouteId = route.id;
      lastRouteTabsSignature = "";
      render();
    });
    ui.routeTabs.append(button);
  }
}

function renderDraftFields() {
  const route = selectedDraftRoute();
  setControlValue(ui.routeNameField, route?.name || "");
  setControlValue(ui.chatUrlField, route?.currentChatUrl || "");
  setControlValue(ui.projectUrlField, route?.projectUrl || "");
  setControlValue(ui.commandField, draft.commandText || "go");
  setControlValue(ui.startMessageField, draft.startMessage || "");
  ensureIntervalOption(draft.intervalMinutes);
  setControlValue(ui.intervalField, String(draft.intervalMinutes));
  setControlValue(ui.messagesPerCycleField, String(draft.messagesPerCycle));
  setControlValue(ui.maxCyclesField, String(draft.maxCycles));
  ui.dirtyHint.hidden = !draftDirty;
}

function renderControlsState() {
  const running = state?.enabled === true;
  for (const control of [...editableControls, ui.addRouteButton, ui.removeRouteButton, ui.useCurrentButton, ui.saveButton]) {
    control.disabled = running || busy;
  }
  ui.removeRouteButton.disabled = running || busy || !draft || draft.routes.length <= 1;
  const route = selectedDraftRoute();
  const live = selectedStateRoute();
  ui.openCurrentButton.disabled = busy
    || !route?.currentChatUrl?.trim()
    || (running && live?.phase !== "monitoring");
  ui.checkButton.disabled = busy || !running || live?.phase !== "monitoring";
  ui.toggleButton.disabled = busy;
}

function renderRuntime() {
  const route = selectedStateRoute();
  const draftRoute = selectedDraftRoute();
  ui.runtimeRouteName.textContent = route?.name || draftRoute?.name || "—";
  ui.currentUrlLabel.textContent = route?.currentChatUrl || draftRoute?.currentChatUrl || "—";
  ui.currentUrlLabel.title = route?.currentChatUrl || draftRoute?.currentChatUrl || "";
  ui.phaseValue.textContent = route ? routeStatusLabel(route.phase) : "Не сохранён";
  ui.nextValue.textContent = route ? nextActionLabel(route) : "—";
  ui.totalResponsesValue.textContent = String(route?.totalContinuationCount || 0);
  ui.lastCheckValue.textContent = route?.lastCheckAt ? formatDateTime(route.lastCheckAt) : "—";
  ui.errorValue.textContent = route?.lastError || "—";
  ui.errorValue.style.color = route?.lastError ? "var(--danger)" : "inherit";
  renderHistory(route?.history || []);
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
    const source = item.source === "initial" ? "исходный" : item.source === "project-initial" ? "первый созданный" : "создан в проекте";
    meta.textContent = `${source} · ${formatDateTime(item.createdAt)}`;
    row.append(cycle, link, meta);
    ui.historyList.append(row);
  }
}

function selectedDraftRoute() {
  return draft?.routes?.find((route) => route.id === selectedRouteId) || null;
}

function selectedStateRoute() {
  return state?.routes?.find((route) => route.id === selectedRouteId) || null;
}

function setControlValue(control, value) {
  if (!control || document.activeElement === control) return;
  const normalized = String(value ?? "");
  if (control.value !== normalized) control.value = normalized;
}

function settingsFocused() {
  return editableControls.includes(document.activeElement);
}

function routeStatusLabel(phase) {
  return {
    draft: "не сохранён",
    idle: "готов к запуску",
    monitoring: "мониторинг",
    rotating: "создание чата",
    "capture-wait": "ожидание URL",
    completed: "завершён",
    stopped: "остановлен",
    error: "ошибка"
  }[phase] || phase || "—";
}

function nextActionLabel(route) {
  if (route.phase === "capture-wait" && route.captureDueAt) return formatDateTime(route.captureDueAt);
  if (route.nextCheckAt) return formatDateTime(route.nextCheckAt);
  if (route.phase === "rotating") return route.initializingChat ? "Создание первого чата" : "Ротация";
  if (route.phase === "completed") return "Готово";
  return "—";
}

function successMessage(type) {
  return {
    START: "Pulse 2.0 запущен. Каждый проект работает в отдельном маршруте.",
    STOP: "Pulse 2.0 остановлен. Pulse 1.0 не изменён.",
    CHECK_NOW: "Проверка выбранного маршрута выполнена."
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

function createRouteId() {
  if (globalThis.crypto?.randomUUID) return `route-${globalThis.crypto.randomUUID()}`;
  return `route-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  if (state && draft) renderControlsState();
}

function showMessage(message, kind) {
  ui.messageBar.hidden = false;
  ui.messageBar.textContent = message;
  ui.messageBar.dataset.kind = kind;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => { ui.messageBar.hidden = true; }, kind === "error" ? 8_000 : 4_000);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
