import assert from "node:assert/strict";
import { readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, "..");
const sourcePath = path.join(scriptsDir, "validate_extension.mjs");
const runtimePath = path.join(scriptsDir, ".validate_extension_release.runtime.mjs");
const releaseVersion = "0.8.0";

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
  "tests/chrome-extension/pulse2-runtime.test.mjs"
];
for (const relativePath of pulse2Files) {
  const metadata = await stat(path.join(root, relativePath));
  assert.ok(metadata.isFile() && metadata.size > 0, `Pulse 2.0 file missing or empty: ${relativePath}`);
}

const manifest = JSON.parse(await readFile(path.join(root, "chrome-extension/manifest.json"), "utf8"));
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

assert.ok(wrapper.includes('import "./service-worker-v2.js"'));
assert.ok(wrapper.includes('import "./pulse2-engine.js"'));
assert.ok(engine.includes('const STORAGE_KEY = "chatpulse2State"'));
assert.ok(engine.includes('export const PULSE2_PORT_NAME = "chatpulse-pulse2"'));
assert.ok(engine.includes('export const PULSE2_ALARM_NAME = "chatpulse-pulse2-monitor"'));
assert.ok(engine.includes('export const PULSE2_CAPTURE_ALARM_NAME = "chatpulse-pulse2-capture"'));
assert.ok(engine.includes('const PULSE1_STORAGE_KEY = "chatpulseState"'));
assert.ok(!engine.includes('chrome.storage.local.set({ [PULSE1_STORAGE_KEY]'), "Pulse 2.0 must never write Pulse 1 state");
assert.ok(model.includes("PULSE2_CAPTURE_DELAY_MS = 2 * 60_000"));
assert.ok(model.includes("messagesPerCycle"));
assert.ok(model.includes("maxCycles"));
assert.ok(model.includes("rotationPending"));
assert.ok(model.includes("capturePulse2Chat"));
assert.ok(content.includes("PULSE2_PREPARE_PROJECT_CHAT"));
assert.ok(ui.includes('const PORT_NAME = "chatpulse-pulse2"'));
assert.ok(ui.includes('chrome.runtime.connect({ name: PORT_NAME })'));
