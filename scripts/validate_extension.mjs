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
assert.equal(manifest.version, "0.5.5");
assert.equal(manifest.version_name, "0.5.5 beta");
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
  "telegram.test.mjs"
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
const packageScript = await readFile(path.join(root, "scripts/package_extension.py"), "utf8");

// Released 0.5.4 safety invariants must remain present.
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
assert.ok(background.includes("stopPhrase: latestState.stopPhrase"));
assert.ok(background.includes("resolveChatTab"));
assert.ok(background.includes("lastAccessed"));
assert.ok(background.includes("chrome.windows.update"));
assert.ok(background.includes("ensureChatTab(chat)"));
assert.ok(background.includes("chrome.tabs.reload"));
assert.ok(background.includes("autoDiscardable: false"));
assert.ok(background.includes("waitForHydratedSnapshot"));
assert.ok(content.includes("stopPhraseMatched"));
assert.ok(content.includes("normalize(\"NFKC\")") || content.includes('.normalize("NFKC")'));
assert.ok(content.includes("phraseMatches"));
assert.ok(content.includes("MutationObserver"));
assert.ok(content.includes("hasDraft"));
assert.ok(content.includes("document.wasDiscarded"));

// Telegram may augment post-dispatch behavior, but may not join continuation state.
for (const token of [
  "attachTelegramState",
  "notifyTelegramContinuation",
  "sendTelegramTest",
  "updateTelegramConfig"
]) {
  assert.ok(background.includes(token), `Service worker не использует ${token}`);
}
assert.ok(background.indexOf("recordDispatch(") < background.indexOf("notifyTelegramContinuation("),
  "Telegram notification must happen only after at-most-once dispatch is recorded");
assert.ok(telegram.includes('const TELEGRAM_CONFIG_KEY = "chatpulseTelegramConfig"'));
assert.ok(telegram.includes('export const TELEGRAM_ORIGIN = "https://api.telegram.org/*"'));
assert.ok(telegram.includes("tokenConfigured: Boolean(config.botToken)"));
assert.ok(telegram.includes("permissionGranted: await hasTelegramPermission()"));
assert.ok(telegram.includes("if (!hasTelegramPatch) return getTelegramPublicConfig()"));
assert.ok(telegram.includes("text: String(text).slice(0, 4096)"));
assert.ok(!telegram.includes("responseText"), "Telegram module must not receive ChatGPT response text");

assert.ok(popupHTML.includes('id="versionLabel"'));
assert.ok(optionsHTML.includes('id="versionLabel"'));
assert.ok(optionsHTML.includes('id="stopPhraseField"'));
assert.ok(optionsHTML.includes('maxlength="500"'));
for (const id of ["telegramEnabled", "telegramChatId", "telegramBotToken", "telegramTestButton", "telegramStatus"]) {
  assert.ok(optionsHTML.includes(`id="${id}"`), `Options UI missing ${id}`);
}
assert.ok(popupJS.includes("chrome.runtime.getManifest()"));
assert.ok(optionsJS.includes("chrome.runtime.getManifest()"));
assert.ok(optionsJS.includes("commandDirty"));
assert.ok(optionsJS.includes("stopPhraseDirty"));
assert.ok(optionsJS.includes("intervalDirty"));
assert.ok(optionsJS.includes("telegramDirty"));
assert.ok(optionsJS.includes("if (telegramDirty)"), "Unrelated settings must not revalidate Telegram config");
assert.ok(optionsJS.includes("chrome.permissions.request({ origins: [TELEGRAM_ORIGIN] })"));
assert.ok(optionsJS.includes('lastStopReason === "stop-phrase"'));
assert.ok(optionsCSS.includes(".integration-box"));

for (const staleVersion of ["0.5.0 beta", "0.5.1 beta", "0.5.2 beta", "0.5.4 beta"]) {
  assert.ok(!popupHTML.includes(staleVersion), `Popup содержит жёстко заданную устаревшую версию ${staleVersion}`);
  assert.ok(!optionsHTML.includes(staleVersion), `Options содержит жёстко заданную устаревшую версию ${staleVersion}`);
}
for (const color of ["#071126", "#11183a", "#24123d", "#2c8cff", "#9b5cff"]) {
  assert.ok(
    popupCSS.toLowerCase().includes(color) && optionsCSS.toLowerCase().includes(color),
    `В обоих интерфейсах отсутствует цвет превью ${color}`
  );
}
assert.ok(packageScript.includes('ChatPulse-Chrome-v0.5.5-beta.zip'));
assert.ok(packageScript.includes('ChatPulse-Chrome-v0.5.5-source-manifest.txt'));

console.log("Manifest V3, стоп-фраза, Telegram optional-permission boundary, интерфейс и структура ChatPulse 0.5.5 прошли статический аудит.");
