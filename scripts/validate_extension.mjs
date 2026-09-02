import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionRoot = path.join(root, "chrome-extension");
const manifestPath = path.join(extensionRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

assert.equal(manifest.manifest_version, 3, "Требуется Manifest V3");
assert.equal(manifest.name, "ChatPulse");
assert.equal(manifest.version, "0.6.0");
assert.equal(manifest.version_name, "0.6.0 beta");
assert.equal(manifest.background?.type, "module");
assert.equal(manifest.background?.service_worker, "background/service-worker-v2.js");
assert.equal(manifest.action?.default_popup, "popup/popup.html");
assert.equal(manifest.options_page, "options/options.html");

const permissions = new Set(manifest.permissions || []);
for (const required of ["alarms", "scripting", "storage", "tabs"]) {
  assert.ok(permissions.has(required), `Отсутствует разрешение ${required}`);
}
for (const forbidden of ["cookies", "history", "webRequest", "debugger", "nativeMessaging"]) {
  assert.ok(!permissions.has(forbidden), `Лишнее чувствительное разрешение ${forbidden}`);
}

const hosts = new Set(manifest.host_permissions || []);
assert.deepEqual(
  [...hosts].sort(),
  ["https://chat.openai.com/*", "https://chatgpt.com/*"],
  "Постоянный доступ должен быть ограничен официальными доменами ChatGPT"
);
const optionalHosts = new Set(manifest.optional_host_permissions || []);
assert.deepEqual(
  [...optionalHosts].sort(),
  ["https://api.telegram.org/*"],
  "Telegram должен быть единственным опциональным host permission"
);
assert.ok(!hosts.has("https://api.telegram.org/*"), "Telegram запрещён в постоянных host_permissions");
assert.ok(!JSON.stringify(manifest).includes("<all_urls>"), "Запрещён широкий доступ <all_urls>");
assert.ok(!JSON.stringify(manifest).includes("http://*/*"), "Запрещён общий HTTP-доступ");

const requiredFiles = [
  "manifest.json",
  "assets/logo.svg",
  "lib/model-v2.js",
  "background/service-worker-v2.js",
  "background/telegram.js",
  "content/content-script.js",
  "popup/popup.html",
  "popup/popup.css",
  "popup/popup.js",
  "options/options.html",
  "options/options.css",
  "options/control-center.css",
  "options/options.js"
];
for (const relativePath of requiredFiles) {
  const file = path.join(extensionRoot, relativePath);
  const metadata = await stat(file);
  assert.ok(metadata.isFile() && metadata.size > 0, `Файл отсутствует или пуст: ${relativePath}`);
}
for (const testFile of [
  "service-worker.test.mjs",
  "control-revision.test.mjs",
  "telegram.test.mjs",
  "profile-task.test.mjs",
  "task-service-worker.test.mjs",
  "dispatch-checkpoint.test.mjs",
  "configuration-safety.test.mjs"
]) {
  await stat(path.join(root, "tests/chrome-extension", testFile));
}
await stat(path.join(root, "scripts/package_extension.py"));

const model = await readFile(path.join(extensionRoot, "lib/model-v2.js"), "utf8");
const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");
const telegram = await readFile(path.join(extensionRoot, "background/telegram.js"), "utf8");
const content = await readFile(path.join(extensionRoot, "content/content-script.js"), "utf8");
const popupHTML = await readFile(path.join(extensionRoot, "popup/popup.html"), "utf8");
const popupJS = await readFile(path.join(extensionRoot, "popup/popup.js"), "utf8");
const popupCSS = await readFile(path.join(extensionRoot, "popup/popup.css"), "utf8");
const optionsHTML = await readFile(path.join(extensionRoot, "options/options.html"), "utf8");
const optionsJS = await readFile(path.join(extensionRoot, "options/options.js"), "utf8");
const optionsCSS = await readFile(path.join(extensionRoot, "options/options.css"), "utf8");
const controlCSS = await readFile(path.join(extensionRoot, "options/control-center.css"), "utf8");
const packageScript = await readFile(path.join(root, "scripts/package_extension.py"), "utf8");

// Released 0.5.4 / 0.5.5 safety invariants must remain present.
assert.ok(model.includes("продолжай и не останавливайся до технического лимита"));
assert.ok(model.includes("MAX_STOP_PHRASE_LENGTH = 500"));
assert.ok(model.includes('lastStopReason: "stop-phrase"'));
assert.ok(model.includes("controlRevision"));
assert.ok(model.includes("if (!sameControlRevision) return latestChat"));
assert.ok(model.includes("lastCommandedFingerprint"));
assert.ok(model.includes("planTabRecovery"));
assert.ok(background.includes("submitted-unconfirmed"));
assert.ok(background.includes("normalizeStopPhrase"));
assert.ok(background.includes("stop-phrase-matched"));
assert.ok(background.includes("resolveChatTab"));
assert.ok(background.includes("lastAccessed"));
assert.ok(background.includes("chrome.windows.update"));
assert.ok(background.includes("ensureChatTab(chat)"));
assert.ok(background.includes("chrome.tabs.reload"));
assert.ok(background.includes("autoDiscardable: false"));
assert.ok(background.includes("waitForHydratedSnapshot"));
assert.ok(content.includes("stopPhraseMatched"));
assert.ok(content.includes('normalize("NFKC")'));
assert.ok(content.includes("phraseMatches"));
assert.ok(content.includes("MutationObserver"));
assert.ok(content.includes("hasDraft"));
assert.ok(content.includes("document.wasDiscarded"));

// 0.6.0 state/profile/task/configuration contract.
for (const token of [
  "schemaVersion: 4",
  "taskOnly: false",
  "defaultChatProfile",
  "effectiveChatProfile",
  "applyGlobalSettingsPatch",
  "completionGuardReason",
  "startChatRun",
  "stopTaskMode",
  "scheduleNextChatCheck",
  "continuationCount",
  "runtimeAutoStop",
  "mergeDispatchCheckpoint",
  "createPortableConfig",
  "applyPortableConfig",
  "seenURLs",
  "credentialsIncluded: false",
  "runtimeStateIncluded: false"
]) {
  assert.ok(model.includes(token), `Model missing 0.6.0 invariant: ${token}`);
}
for (const token of [
  'case "UPDATE_CHAT_PROFILE"',
  'case "START_TASK"',
  'case "STOP_TASK"',
  'case "EXPORT_CONFIG"',
  'case "IMPORT_CONFIG"',
  "sameControlRevision",
  "sameSession",
  "taskOnly",
  "assertIdentityMutationSafe",
  "persistDispatchCheckpoint",
  "completionGuardReason",
  "applyGlobalSettingsPatch",
  "stopTaskMode",
  "profile.commandText",
  "profile.intervalMinutes",
  "profile.stopPhrase"
]) {
  assert.ok(background.includes(token), `Service worker missing 0.6.0 invariant: ${token}`);
}
assert.ok(
  background.indexOf("recordDispatch(") < background.indexOf("persistDispatchCheckpoint(observedState.chats[index])"),
  "Dispatch must be recorded before durable checkpoint"
);
assert.ok(
  background.indexOf("persistDispatchCheckpoint(observedState.chats[index])") < background.indexOf('"continuation",\n        outcome'),
  "Continuation notification must happen after durable at-most-once checkpoint"
);
assert.ok(
  background.indexOf("const liveGuard = completionGuardReason") < background.indexOf("CHATPULSE_SEND"),
  "Live limit guard must run before send"
);
assert.ok(background.includes('runCheck("task-start", false, selectedChatId)'), "Task immediate check must target only selected chat");
assert.ok(background.includes("if (observedState.taskOnly && !chat.taskActive && !allowWhenStopped) continue;"));
assert.ok(background.includes("latestState.sessionId === observedState.sessionId"));
assert.ok(background.includes('stopTaskMode(chat, "global-stop")'), "Top Stop must terminate active task mode");

// Telegram stays optional, generic, post-state and privacy-safe.
for (const token of [
  "attachTelegramState",
  "notifyTelegramEvent",
  "sendTelegramTest",
  "updateTelegramConfig"
]) {
  assert.ok(background.includes(token), `Service worker не использует ${token}`);
}
assert.ok(telegram.includes('const TELEGRAM_CONFIG_KEY = "chatpulseTelegramConfig"'));
assert.ok(telegram.includes('export const TELEGRAM_ORIGIN = "https://api.telegram.org/*"'));
assert.ok(telegram.includes("tokenConfigured: Boolean(config.botToken)"));
assert.ok(telegram.includes("permissionGranted: await hasTelegramPermission()"));
assert.ok(telegram.includes("if (!hasTelegramPatch) return getTelegramPublicConfig()"));
assert.ok(telegram.includes("text: String(text).slice(0, 4096)"));
for (const event of ["stop-phrase", "continuation-limit", "runtime-limit", "automation-error", "task-started"]) {
  assert.ok(telegram.includes(event), `Telegram event missing: ${event}`);
}
for (const forbidden of ["responseText", "conversationUrl", "stopPhrase", "commandText"]) {
  assert.ok(!telegram.includes(forbidden), `Telegram module must not receive ${forbidden}`);
}

// Control Center, compact popup and safe portable configuration UX.
assert.ok(popupHTML.includes('id="versionLabel"'));
assert.ok(optionsHTML.includes('id="versionLabel"'));
assert.ok(optionsHTML.includes("Control Center"));
assert.ok(optionsHTML.includes('id="stopPhraseField"'));
assert.ok(optionsHTML.includes('maxlength="500"'));
for (const id of [
  "telegramEnabled",
  "telegramChatId",
  "telegramBotToken",
  "telegramTestButton",
  "telegramStatus",
  "taskMetric",
  "exportButton",
  "importButton",
  "importFile"
]) {
  assert.ok(optionsHTML.includes(`id="${id}"`), `Options UI missing ${id}`);
}
for (const className of [
  "profile-command",
  "profile-interval",
  "profile-stop-mode",
  "profile-max-continuations",
  "profile-max-runtime",
  "profile-telegram-notify",
  "task-chat",
  "chat-progress-bar"
]) {
  assert.ok(optionsHTML.includes(className), `Control Center missing ${className}`);
}
assert.ok(popupJS.includes("chrome.runtime.getManifest()"));
assert.ok(popupJS.includes("currentState.taskOnly"), "Popup must distinguish task-only engine state");
assert.ok(popupJS.includes("Master-stop"), "Popup must explain master-stop state");
assert.ok(popupJS.includes("Остановить всё"), "Task-only popup must expose master stop");
assert.ok(optionsJS.includes("chrome.runtime.getManifest()"));
assert.ok(optionsJS.includes("commandDirty"));
assert.ok(optionsJS.includes("stopPhraseDirty"));
assert.ok(optionsJS.includes("intervalDirty"));
assert.ok(optionsJS.includes("telegramDirty"));
assert.ok(optionsJS.includes("profileDrafts"));
assert.ok(optionsJS.includes("EXPORT_CONFIG"));
assert.ok(optionsJS.includes("IMPORT_CONFIG"));
assert.ok(optionsJS.includes("START_TASK"));
assert.ok(optionsJS.includes("chrome.permissions.request({ origins: [TELEGRAM_ORIGIN] })"));
assert.ok(optionsJS.includes("Bot token") || optionsHTML.includes("Bot token"));
assert.ok(optionsHTML.includes("никогда не попадает в экспорт"));
assert.ok(optionsHTML.includes("создаёт новые безопасные baseline"));
assert.ok(optionsCSS.includes(".integration-box"));
assert.ok(controlCSS.includes(".control-chat-row"));
assert.ok(controlCSS.includes(".profile-grid"));
assert.ok(controlCSS.includes(".chat-progress-bar"));

for (const staleVersion of ["0.5.0 beta", "0.5.1 beta", "0.5.2 beta", "0.5.4 beta", "0.5.5 beta"]) {
  assert.ok(!popupHTML.includes(staleVersion), `Popup содержит жёстко заданную устаревшую версию ${staleVersion}`);
  assert.ok(!optionsHTML.includes(staleVersion), `Options содержит жёстко заданную устаревшую версию ${staleVersion}`);
}
for (const color of ["#071126", "#11183a", "#24123d", "#2c8cff", "#9b5cff"]) {
  assert.ok(
    popupCSS.toLowerCase().includes(color) && optionsCSS.toLowerCase().includes(color),
    `В обоих интерфейсах отсутствует цвет превью ${color}`
  );
}
assert.ok(packageScript.includes('ChatPulse-Chrome-v0.6.0-beta.zip'));
assert.ok(packageScript.includes('ChatPulse-Chrome-v0.6.0-source-manifest.txt'));

console.log("Manifest V3, legacy safety, schema v4 profiles/tasks, taskOnly master-stop, durable dispatch, Control Center, portable config and Telegram privacy boundaries ChatPulse 0.6.0 прошли статический аудит.");
