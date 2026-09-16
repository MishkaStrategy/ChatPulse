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

test("Pulse 2.0 is loaded beside, not instead of, Pulse 1.0", () => {
  assert.equal(manifest.background.service_worker, "background/service-worker-v3.js");
  assert.match(wrapper, /import "\.\/service-worker-v2\.js"/);
  assert.match(wrapper, /import "\.\/pulse2-engine\.js"/);
});

test("Pulse 2.0 owns independent storage, alarms, port and controls", () => {
  assert.match(engine, /const STORAGE_KEY = "chatpulse2State"/);
  assert.match(engine, /PULSE2_PORT_NAME = "chatpulse-pulse2"/);
  assert.match(engine, /PULSE2_ALARM_NAME = "chatpulse-pulse2-monitor"/);
  assert.match(engine, /PULSE2_CAPTURE_ALARM_NAME = "chatpulse-pulse2-capture"/);
  assert.match(engine, /PULSE1_STORAGE_KEY = "chatpulseState"/);
  assert.doesNotMatch(engine, /chrome\.storage\.local\.set\(\{ \[PULSE1_STORAGE_KEY\]/);
  assert.match(engine, /assertNoPulse1Collision/);
});

test("Pulse 2.0 rotation captures the URL only after its bounded two-minute wait", () => {
  assert.match(model, /PULSE2_CAPTURE_DELAY_MS = 2 \* 60_000/);
  assert.match(model, /PULSE2_CAPTURE_RETRY_MS = 30_000/);
  assert.match(model, /PULSE2_MAX_CAPTURE_ATTEMPTS = 10/);
  assert.match(engine, /phase === "capture-wait"/);
  assert.match(engine, /normalizedURL !== state\.currentChatUrl/);
  assert.match(engine, /capturePulse2Chat/);
});

test("project chat creation uses a dedicated content helper and the common safe sender", () => {
  assert.match(helper, /PULSE2_PREPARE_PROJECT_CHAT/);
  assert.match(engine, /PULSE2_PREPARE_PROJECT_CHAT/);
  assert.match(engine, /type: "CHATPULSE_SEND"/);
  assert.match(engine, /effectivePulse2StartMessage/);
});

test("Pulse 2.0 has a separate full-page UI and connects through the isolated port", () => {
  assert.match(page, /Pulse 2\.0/);
  assert.match(page, /Проект ChatGPT/);
  assert.match(page, /Автоответов на цикл/);
  assert.match(page, /Количество циклов/);
  assert.match(ui, /chrome\.runtime\.connect\(\{ name: PORT_NAME \}\)/);
  assert.match(ui, /openPulse1Button/);
});
