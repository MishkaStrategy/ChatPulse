import assert from "node:assert/strict";
import { readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, "..");
const sourcePath = path.join(scriptsDir, "validate_extension.mjs");
const runtimePath = path.join(scriptsDir, ".validate_extension_release.runtime.mjs");
const releaseVersion = "0.8.6";

const source = await readFile(sourcePath, "utf8");
const releaseSource = source
  .replaceAll("0.7.4", releaseVersion)
  .replace(
    'assert.equal(manifest.background?.service_worker, "background/service-worker-v2.js");',
    'assert.equal(manifest.background?.service_worker, "background/service-worker-v3.js");'
  );

await writeFile(runtimePath, releaseSource, "utf8");
try {
  await import(`${pathToFileURL(runtimePath).href}?release=${releaseVersion}`);
} finally {
  await unlink(runtimePath).catch(() => {});
}

const pulse2Files = [
  "chrome-extension/lib/pulse2-model.js",
  "chrome-extension/background/pulse2-engine.js",
  "chrome-extension/background/service-worker-v3.js",
  "chrome-extension/content/pulse2-content.js",
  "chrome-extension/pulse2/pulse2.html",
  "chrome-extension/pulse2/pulse2.css",
  "chrome-extension/pulse2/pulse2.js",
  "tests/chrome-extension/pulse2-model.test.mjs",
  "tests/chrome-extension/pulse2-runtime.test.mjs",
  "tests/browser/pulse2.chrome-e2e.mjs"
];
for (const relativePath of pulse2Files) {
  const metadata = await stat(path.join(root, relativePath));
  assert.ok(metadata.isFile() && metadata.size > 0, `Pulse 2.0 file missing or empty: ${relativePath}`);
}

const manifest = JSON.parse(await readFile(path.join(root, "chrome-extension/manifest.json"), "utf8"));
assert.equal(manifest.version, releaseVersion);
assert.equal(manifest.background?.service_worker, "background/service-worker-v3.js");
assert.ok(
  manifest.content_scripts?.some((entry) => Array.isArray(entry.js) && entry.js.includes("content/pulse2-content.js")),
  "Pulse 2.0 content helper must load on ChatGPT pages"
);

const wrapper = await readFile(path.join(root, "chrome-extension/background/service-worker-v3.js"), "utf8");
const engine = await readFile(path.join(root, "chrome-extension/background/pulse2-engine.js"), "utf8");
const model = await readFile(path.join(root, "chrome-extension/lib/pulse2-model.js"), "utf8");
const content = await readFile(path.join(root, "chrome-extension/content/pulse2-content.js"), "utf8");
const ui = await readFile(path.join(root, "chrome-extension/pulse2/pulse2.js"), "utf8");
const page = await readFile(path.join(root, "chrome-extension/pulse2/pulse2.html"), "utf8");

assert.ok(wrapper.includes('import "./service-worker-v2.js"'));
assert.ok(wrapper.includes('import "./pulse2-engine.js"'));
assert.ok(engine.includes('const STORAGE_KEY = "chatpulse2State"'));
assert.ok(engine.includes('export const PULSE2_PORT_NAME = "chatpulse-pulse2"'));
assert.ok(engine.includes('export const PULSE2_ALARM_NAME = "chatpulse-pulse2-monitor"'));
assert.ok(engine.includes('export const PULSE2_CAPTURE_ALARM_NAME = "chatpulse-pulse2-capture"'));
assert.ok(engine.includes('export const PULSE2_ROTATION_ALARM_NAME = "chatpulse-pulse2-rotation"'));
assert.ok(engine.includes("performPulse2RotationSweep"), "rotating routes need an alarm-recoverable sweep");
assert.ok(engine.includes("ROTATION_RECOVERY_PERIOD_MINUTES = 0.5"), "rotation recovery watchdog must remain bounded");
assert.ok(engine.includes("recoverPulse2RotationAfterDispatch"), "rotation recovery must adopt a concrete chat URL after a lost post-send checkpoint");
assert.ok(engine.includes("pulse2ChatBelongsToProject"), "rotation recovery must reject unrelated ChatGPT chats");
assert.ok(engine.includes("chatKey === projectKey"), "rotation recovery ownership must match the configured Project");
assert.ok(engine.includes("targetUrl = route.currentChatUrl || route.projectUrl"), "START must synchronously create a managed tab even when current chat is empty");
assert.ok(engine.includes("activatePulse2ManagedTab"), "Project rotation must explicitly foreground its managed tab");
assert.ok(engine.includes("chrome.tabs.update(tabId, { active: true })"), "managed Project tab must become the active Chrome tab before composer lookup");
assert.ok(engine.includes("chrome.windows.update(tab.windowId, { focused: true })"), "managed Project tab window should be focused when possible");
assert.ok(engine.includes("capturePulse2PreviousFocus"), "due monitoring must remember the user tab before foregrounding ChatGPT");
assert.ok(engine.includes("visibilityState: snapshot.visibilityState"), "URL capture must persist evidence from the foregrounded new-chat page");
assert.ok(engine.includes("waitForTabComplete(tab.id, TAB_LOAD_TIMEOUT_MS, normalizedURL)"), "URL capture must foreground and wait for the concrete new-chat URL");
assert.ok(engine.includes("restorePulse2PreviousFocus"), "due monitoring must restore the previous user tab when safe");
assert.ok(engine.includes("MONITOR_ALARM_PERIOD_MINUTES = 0.5"), "monitor scheduler must wake frequently enough to observe assistant completion promptly");
assert.ok(model.includes("PULSE2_MONITOR_RECHECK_MS = 30_000"), "post-capture and post-dispatch monitoring must recheck promptly");
assert.ok(model.includes("PULSE2_MONITOR_ERROR_RETRY_MS = 5 * 60_000"), "monitor errors need a bounded retry backoff");
assert.ok(model.includes('normalizedOutcome === "confirmed"'), "unconfirmed sends must not advance continuation counters");
assert.ok(model.includes("confirmed-by-response"), "a later assistant response may confirm a previously unconfirmed dispatch");
assert.ok(engine.includes("reusablePulse2RouteTab"), "Stop/Start must reuse a still-valid managed tab");
assert.ok(!engine.includes("findUnclaimedPulse2ChatTab"), "lost managed tabs must not hijack arbitrary user-owned matching chat tabs");
assert.ok(engine.includes("pulse2TabReadyForTarget"), "replacement tabs must reach the expected ChatGPT URL before inspection");
assert.ok(engine.includes("inspectPulse2TabAfterHydration"), "ChatGPT DOM hydration must be retried before auth decisions");
assert.ok(engine.includes("inspectPulse2TabWithReloadRecovery"), "loaded but unauthenticated chat snapshots need one bounded foreground reload retry");
assert.ok(engine.includes("chrome.tabs.reload(tabId)"), "reload recovery must explicitly reload the managed tab once");
assert.ok(engine.includes("CHAT_HYDRATION_TIMEOUT_MS = 8_000"), "ChatGPT hydration wait must remain bounded");
assert.ok(engine.includes("Close the gap between the pre-listener read and listener registration"), "tab readiness listener gap must stay closed");
assert.ok(engine.includes("PULSE2_MONITOR_ERROR_RETRY_MS"), "unexpected monitoring failures need bounded retry backoff");
assert.ok(ui.includes('runAction("OPEN_CURRENT_CHAT", { routeId: selectedRouteId }, false)'), "Open Current Chat must go through the background engine");
assert.ok(engine.includes('state.enabled && route.phase !== "monitoring"'), "Open Current Chat must not replace a rotating/capture managed tab");
assert.ok(engine.includes("belongsToProject = changed && pulse2ChatBelongsToProject(normalizedURL, route.projectUrl)"), "capture-wait must reject chats outside the selected project");
assert.ok(ui.includes('running && live?.phase !== "monitoring"'), "Open Current Chat UI must be disabled outside monitoring while running");
assert.ok(engine.includes('const PULSE1_STORAGE_KEY = "chatpulseState"'));
assert.ok(!engine.includes('chrome.storage.local.set({ [PULSE1_STORAGE_KEY]'), "Pulse 2.0 must never write Pulse 1 state");
assert.ok(engine.includes("enqueueEngineOperation"), "multi-route writes must be serialized");
assert.ok(model.includes("PULSE2_SCHEMA_VERSION = 2"));
assert.ok(model.includes("PULSE2_CAPTURE_DELAY_MS = 2 * 60_000"));
assert.ok(model.includes("PULSE2_MAX_ROUTES = 20"));
assert.ok(model.includes("initializingChat"));
assert.ok(model.includes("project-initial"));
assert.ok(content.includes("PULSE2_PREPARE_PROJECT_CHAT"));
assert.ok(content.includes("findProjectComposerSurface"), "Pulse 2.0 must detect direct project composer shells");
assert.ok(content.includes("project-composer-activated"), "direct project composer activation path must remain covered");
assert.ok(content.includes("PROJECT_ENTRY_TIMEOUT_MS = 12_000"), "project entry must tolerate bounded UI hydration");
assert.ok(ui.includes('const PORT_NAME = "chatpulse-pulse2"'));
assert.ok(ui.includes("draftDirty"), "UI must protect unsaved settings draft from live state pushes");
assert.ok(ui.includes("document.activeElement === control"), "focused settings controls must not be overwritten");
assert.ok(page.includes("+ Добавить проект"));
assert.ok(page.includes("Текущий чат <em>необязательно</em>"));
