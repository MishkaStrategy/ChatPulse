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
assert.equal(manifest.version, "0.7.4");
assert.equal(manifest.version_name, "0.7.4 beta");
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
  ["https://api.github.com/*", "https://api.telegram.org/*"],
  "Внешние API должны оставаться только opt-in optional host permissions"
);
assert.ok(!hosts.has("https://api.telegram.org/*"), "Telegram запрещён в постоянных host_permissions");
assert.ok(!hosts.has("https://api.github.com/*"), "GitHub API запрещён в постоянных host_permissions");
assert.ok(!JSON.stringify(manifest).includes("<all_urls>"), "Запрещён широкий доступ <all_urls>");
assert.ok(!JSON.stringify(manifest).includes("http://*/*"), "Запрещён общий HTTP-доступ");

const requiredFiles = [
  "manifest.json",
  "assets/logo.svg",
  "lib/model-v2.js",
  "background/service-worker-v2.js",
  "background/tab-recovery.js",
  "background/github-actions.js",
  "background/telegram.js",
  "content/content-script.js",
  "popup/popup.html",
  "popup/popup.css",
  "popup/popup.js",
  "options/options.html",
  "options/options.css",
  "options/control-center.css",
  "options/options.js",
  "options/github-token-ui.js"
];
for (const relativePath of requiredFiles) {
  const file = path.join(extensionRoot, relativePath);
  const metadata = await stat(file);
  assert.ok(metadata.isFile() && metadata.size > 0, `Файл отсутствует или пуст: ${relativePath}`);
}
for (const testFile of [
  "service-worker.test.mjs",
  "tab-recovery.test.mjs",
  "control-revision.test.mjs",
  "telegram.test.mjs",
  "profile-task.test.mjs",
  "task-service-worker.test.mjs",
  "dispatch-checkpoint.test.mjs",
  "configuration-safety.test.mjs",
  "github-watchdog.test.mjs",
  "github-actions-client.test.mjs",
  "github-token-security.test.mjs",
  "github-watchdog-runtime.test.mjs",
  "github-watchdog-ui.test.mjs"
]) {
  await stat(path.join(root, "tests/chrome-extension", testFile));
}
await stat(path.join(root, "scripts/package_extension.py"));

const model = await readFile(path.join(extensionRoot, "lib/model-v2.js"), "utf8");
const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");
const tabRecovery = await readFile(path.join(extensionRoot, "background/tab-recovery.js"), "utf8");
const githubActions = await readFile(path.join(extensionRoot, "background/github-actions.js"), "utf8");
const telegram = await readFile(path.join(extensionRoot, "background/telegram.js"), "utf8");
const content = await readFile(path.join(extensionRoot, "content/content-script.js"), "utf8");
const popupHTML = await readFile(path.join(extensionRoot, "popup/popup.html"), "utf8");
const popupJS = await readFile(path.join(extensionRoot, "popup/popup.js"), "utf8");
const popupCSS = await readFile(path.join(extensionRoot, "popup/popup.css"), "utf8");
const optionsHTML = await readFile(path.join(extensionRoot, "options/options.html"), "utf8");
const optionsJS = await readFile(path.join(extensionRoot, "options/options.js"), "utf8");
const githubTokenUI = await readFile(path.join(extensionRoot, "options/github-token-ui.js"), "utf8");
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
assert.ok(background.includes("replaceBackgroundTab(chrome.tabs, tab, chatURL)"));
assert.ok(background.includes("tabRecoveryMode(reason)"));
assert.ok(tabRecovery.includes("REPLACEMENT_RECOVERY_REASONS"));
assert.ok(tabRecovery.includes("tabsApi.create"));
assert.ok(tabRecovery.includes("tabsApi.remove"));
assert.ok(tabRecovery.includes("active: false"));
assert.ok(background.includes("autoDiscardable: false"));
assert.ok(background.includes("waitForHydratedSnapshot"));
assert.ok(content.includes("stopPhraseMatched"));
assert.ok(content.includes('normalize("NFKC")'));
assert.ok(content.includes("phraseMatches"));
assert.ok(content.includes("MutationObserver"));
assert.ok(content.includes("hasDraft"));
assert.ok(content.includes("document.wasDiscarded"));

// 0.6.0 state/profile/task/configuration boundaries retained.
for (const token of [
  "schemaVersion: 5",
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
  assert.ok(model.includes(token), `Model missing retained profile/task invariant: ${token}`);
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
  assert.ok(background.includes(token), `Service worker missing retained profile/task invariant: ${token}`);
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

// 0.7.1 active GitHub Actions watchdog invariants remain intact.
for (const token of [
  "MIN_GITHUB_IDLE_MINUTES = 10",
  "GITHUB_POLL_INTERVAL_MINUTES = 10",
  "MAX_GITHUB_WATCHED_REPOSITORIES = 8",
  "normalizeGithubRepository",
  "recordGithubActionsObservation",
  "githubWatchdogDecision",
  "recordGithubRestart",
  "resetGithubWatchRuntime",
  "githubActiveRunCount",
  'decision: "actions-active"'
]) {
  assert.ok(model.includes(token), `Model missing GitHub watchdog invariant: ${token}`);
}
for (const token of [
  "GITHUB_ALARM_NAME",
  "performGithubWatchdog",
  "attemptGithubWatchdogRestart",
  "successfulRepositories.has(profile.githubRepository)",
  "sameSession",
  "completionGuardReason",
  "recordGithubRestart",
  "persistDispatchCheckpoint",
  "MAX_GITHUB_WATCHED_REPOSITORIES"
]) {
  assert.ok(background.includes(token), `Service worker missing GitHub watchdog invariant: ${token}`);
}
assert.ok(!background.slice(
  background.indexOf("async function attemptGithubWatchdogRestart"),
  background.indexOf("async function persistSingleRuntimeChat")
).includes("startChatRun("), "Watchdog restart must preserve the existing run counter/runtime");
assert.ok(background.includes("successfulRepositories.has(profile.githubRepository)"), "Current failed GitHub poll must not select a restart");
assert.ok(model.includes("githubWatchOnly"), "Model must retain the per-chat GitHub-only mode");
assert.ok(background.includes("syncPeriodicAlarm"), "Scheduler must synchronize alarms independently");
assert.ok(background.includes("chrome.alarms.get"), "Scheduler must preserve unchanged alarm scheduledTime");
assert.ok(background.includes('source === "alarm" || source === "start"'), "Automatic ordinary checks must identify scheduler/start sources");
assert.ok(background.includes("profile.githubWatchOnly"), "Automatic ordinary checks must exclude GitHub-only chats");
assert.ok(!background.includes("if (activeCheck) return activeCheck;"), "Concurrent scheduler triggers must never be dropped");
assert.ok(background.includes("previous.catch(() => {})"), "Queued scheduler trigger must survive rejection of the previous check");
assert.ok(background.includes("if (activeCheck === tracked) activeCheck = null;"), "Only the current queue tail may release the shared check guard");
assert.ok(githubActions.includes('export const GITHUB_API_ORIGIN = "https://api.github.com/*"'));
assert.ok(githubActions.includes('credentials: "omit"'), "GitHub client must omit browser credentials");
assert.ok(githubActions.includes("RUN_PAGE_SIZE = 100"));
assert.ok(githubActions.includes("actions/runs?per_page=${RUN_PAGE_SIZE}"));
assert.ok(githubActions.includes('candidate.status !== "completed"'), "Unfinished workflow runs must count as active work");
assert.ok(githubActions.includes("activeRunCount"));
assert.ok(githubActions.includes("x-ratelimit-remaining"));

// 0.7.2 private-repository credential boundary.
for (const token of [
  'GITHUB_CREDENTIALS_KEY = "chatpulseGithubCredentialsV1"',
  "protectGithubCredentialStorage",
  'accessLevel: "TRUSTED_CONTEXTS"',
  "saveGithubToken",
  "clearGithubToken",
  "listGithubTokenRepositories",
  "verifyGithubTokenAccess",
  "normalizeGithubToken",
  "githubCredentialKey",
  'headers.Authorization = `Bearer ${token}`',
  'permission: "actions:read"'
]) {
  assert.ok(githubActions.includes(token), `GitHub credential boundary missing ${token}`);
}
assert.ok(githubActions.includes("if (token) headers.Authorization"), "Authorization must be conditional on a configured token");
for (const forbidden of ['method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"', "/dispatches", "workflow_dispatch"]) {
  assert.ok(!githubActions.includes(forbidden), `GitHub client must remain read-only: ${forbidden}`);
}
assert.ok(!background.includes("GITHUB_CREDENTIALS_KEY"), "Credential store must not enter service-worker runtime state logic");
assert.ok(!model.includes("githubToken"), "GitHub token must never enter model/chatpulseState");
assert.ok(!content.includes("githubToken"), "GitHub token must never enter ChatGPT content script");

for (const className of [
  "profile-github-watch-enabled",
  "profile-github-watch-only",
  "profile-github-repository",
  "profile-github-idle",
  "profile-github-status",
  "profile-github-token",
  "profile-github-token-status",
  "test-github-token",
  "clear-github-token"
]) {
  assert.ok(optionsHTML.includes(className), `Control Center missing GitHub control ${className}`);
}
assert.ok(optionsJS.includes('const GITHUB_ORIGIN = "https://api.github.com/*"'));
assert.ok(optionsJS.includes("chrome.permissions.request({ origins: [GITHUB_ORIGIN] })"));
assert.ok(optionsJS.includes("if (draft.githubWatchEnabled)"));
assert.ok(optionsHTML.includes('placeholder="MishkaStrategy/ChatPulse"'));
assert.ok(optionsHTML.includes("Формат: <code>owner/repo</code>"));
assert.ok(optionsHTML.includes("Не вставляйте URL GitHub"));
assert.ok(optionsHTML.includes("/actions"));
assert.ok(optionsHTML.includes("незавершённый GitHub Actions run"));
assert.ok(optionsHTML.includes("отсчёт N минут начинается заново"));
assert.ok(optionsHTML.includes('class="profile-github-token" type="password"'));
assert.ok(optionsHTML.includes("Проверить токен"));
assert.ok(optionsHTML.includes("Actions: Read-only"));
assert.ok(optionsHTML.includes("Classic PAT"));
assert.ok(optionsHTML.includes("не рекомендуется"));
assert.ok(optionsHTML.includes("GitHub tokens"));
for (const token of [
  "verifyGithubTokenAccess",
  "saveGithubToken",
  "clearGithubToken",
  "listGithubTokenRepositories",
  "githubTokenBypass",
  "stopImmediatePropagation",
  "Token сохранён локально"
]) {
  assert.ok(githubTokenUI.includes(token), `GitHub token UI missing ${token}`);
}
assert.ok(!githubTokenUI.includes("chrome.runtime.sendMessage"), "Token UI must not send credentials through runtime messages");

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
assert.ok(optionsHTML.includes("GitHub tokens"));
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
assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.4-beta.zip'));
assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.4-source-manifest.txt'));

console.log("Manifest V3, legacy safety, schema v5 profiles/tasks, independent GitHub Actions scheduler, Actions-only mode, fail-closed watchdog, private-repository read-only token isolation, taskOnly master-stop, durable dispatch, Control Center, portable config and Telegram privacy ChatPulse 0.7.4 прошли статический аудит.");
