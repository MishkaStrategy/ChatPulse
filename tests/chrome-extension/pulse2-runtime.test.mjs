import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("chrome-extension/manifest.json", "utf8"));
const wrapper = await readFile("chrome-extension/background/service-worker-v3.js", "utf8");
const engine = await readFile("chrome-extension/background/pulse2-engine.js", "utf8");
const model = await readFile("chrome-extension/lib/pulse2-model.js", "utf8");
const helper = await readFile("chrome-extension/content/pulse2-content.js", "utf8");
const page = await readFile("chrome-extension/pulse2/pulse2.html", "utf8");
const ui = await readFile("chrome-extension/pulse2/pulse2.js", "utf8");

test("Pulse 2.0 remains isolated beside Pulse 1.0", () => {
  assert.equal(manifest.background.service_worker, "background/service-worker-v3.js");
  assert.match(wrapper, /import "\.\/service-worker-v2\.js"/);
  assert.match(wrapper, /import "\.\/pulse2-engine\.js"/);
  assert.match(engine, /const STORAGE_KEY = "chatpulse2State"/);
  assert.match(engine, /const PULSE1_STORAGE_KEY = "chatpulseState"/);
  assert.doesNotMatch(engine, /chrome\.storage\.local\.set\(\{ \[PULSE1_STORAGE_KEY\]/);
});

test("Pulse 2.0 schema v2 supports independent multi-route state", () => {
  assert.match(model, /PULSE2_SCHEMA_VERSION = 2/);
  assert.match(model, /routes:/);
  assert.match(model, /PULSE2_MAX_ROUTES = 20/);
  assert.match(engine, /performPulse2Sweep/);
  assert.match(engine, /performPulse2Rotation\(routeId\)/);
  assert.match(engine, /performPulse2Capture\(routeId\)/);
  assert.match(engine, /enqueueEngineOperation/);
});

test("current chat is optional and project initialization is explicit", () => {
  assert.match(model, /initializingChat: !hasChat/);
  assert.match(model, /phase: hasChat \? "monitoring" : "rotating"/);
  assert.match(model, /source = isInitial \? "project-initial" : "project"/);
  assert.match(page, /Текущий чат <em>необязательно<\/em>/);
  assert.match(page, /сам создаст первый чат/);
});

test("editing draft is protected from live state pushes", () => {
  assert.match(ui, /let draftDirty = false/);
  assert.match(ui, /maybeSyncDraftFromLiveState/);
  assert.match(ui, /if \(!draft \|\| state\.enabled \|\| \(!draftDirty && !settingsFocused\(\)\)\)/);
  assert.match(ui, /document\.activeElement === control/);
  assert.match(ui, /Live-обновления статуса их не перезапишут|dirtyHint/);
});

test("multi-project UI can add and remove routes without mutating running settings", () => {
  assert.match(page, /\+ Добавить проект/);
  assert.match(page, /Удалить/);
  assert.match(ui, /addRoute\(\)/);
  assert.match(ui, /removeSelectedRoute\(\)/);
  assert.match(ui, /routes: draft\.routes\.map/);
  assert.match(ui, /running \|\| busy/);
});

test("project entry supports the new direct composer shell as well as legacy New chat actions", () => {
  assert.match(helper, /PROJECT_ENTRY_TIMEOUT_MS = 12_000/);
  assert.match(helper, /findProjectComposerSurface/);
  assert.match(helper, /project-composer-activated/);
  assert.match(helper, /новый чат в\|new chat in/);
  assert.match(helper, /findProjectChatControl/);
  assert.match(helper, /project-new-chat-opened/);
});


test("rotating routes have a persistent recovery alarm and crash-safe post-send adoption", () => {
  assert.match(engine, /PULSE2_ROTATION_ALARM_NAME = "chatpulse-pulse2-rotation"/);
  assert.match(engine, /ROTATION_RECOVERY_PERIOD_MINUTES = 0\.5/);
  assert.match(engine, /performPulse2RotationSweep/);
  assert.match(engine, /alarm\.name === PULSE2_ROTATION_ALARM_NAME/);
  assert.match(engine, /periodInMinutes: ROTATION_RECOVERY_PERIOD_MINUTES/);
  assert.match(engine, /recoverPulse2RotationAfterDispatch/);
  assert.match(engine, /normalizeChatURL\(tab\?\.url\)/);
  assert.match(engine, /lastCheckAt: new Date\(\)\.toISOString\(\)/);
  assert.match(engine, /targetUrl = route\.currentChatUrl \|\| route\.projectUrl/);
});

test("Pulse 2.0 retains bounded URL capture and common safe sender", () => {
  assert.match(model, /PULSE2_CAPTURE_DELAY_MS = 2 \* 60_000/);
  assert.match(model, /PULSE2_CAPTURE_RETRY_MS = 30_000/);
  assert.match(model, /PULSE2_MAX_CAPTURE_ATTEMPTS = 10/);
  assert.match(helper, /PULSE2_PREPARE_PROJECT_CHAT/);
  assert.match(engine, /type: "CHATPULSE_SEND"/);
  assert.match(engine, /effectivePulse2StartMessage/);
});
