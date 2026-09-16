import test from "node:test";
import assert from "node:assert/strict";

import {
  PULSE2_CAPTURE_DELAY_MS,
  applyPulse2SettingsPatch,
  beginPulse2Rotation,
  capturePulse2Chat,
  defaultPulse2State,
  markPulse2CaptureWait,
  normalizePulse2ProjectURL,
  observePulse2Snapshot,
  recordPulse2Dispatch,
  startPulse2State
} from "../../chrome-extension/lib/pulse2-model.js";

const CHAT_A = "https://chatgpt.com/c/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CHAT_B = "https://chatgpt.com/c/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const PROJECT = "https://chatgpt.com/g/g-p-project123/project";

function configured(overrides = {}) {
  let state = defaultPulse2State();
  state = applyPulse2SettingsPatch(state, {
    currentChatUrl: CHAT_A,
    projectUrl: PROJECT,
    commandText: "go",
    intervalMinutes: 2,
    messagesPerCycle: 2,
    maxCycles: 3,
    ...overrides
  });
  return state;
}

function assistantSnapshot(fingerprint) {
  return {
    pageReady: true,
    authenticated: true,
    errorDetected: false,
    isGenerating: false,
    latestRole: "assistant",
    latestFingerprint: fingerprint
  };
}

test("project URL normalization accepts project routes and rejects chat URLs", () => {
  assert.equal(normalizePulse2ProjectURL(PROJECT), PROJECT);
  assert.equal(
    normalizePulse2ProjectURL("https://chat.openai.com/projects/demo?tab=files"),
    "https://chatgpt.com/projects/demo"
  );
  assert.equal(normalizePulse2ProjectURL(CHAT_A), null);
  assert.equal(normalizePulse2ProjectURL("https://example.com/projects/demo"), null);
});

test("Pulse 2.0 starts with an isolated cycle counter and baseline", () => {
  const started = startPulse2State(configured(), {
    tabId: 42,
    at: "2026-09-16T10:00:00.000Z"
  });
  assert.equal(started.enabled, true);
  assert.equal(started.phase, "monitoring");
  assert.equal(started.cycleNumber, 1);
  assert.equal(started.cycleContinuationCount, 0);
  assert.equal(started.totalContinuationCount, 0);
  assert.equal(started.history.length, 1);
  assert.equal(started.history[0].url, CHAT_A);
  assert.equal(started.tabId, 42);
});

test("stable assistant response becomes eligible only after the configured delay", () => {
  let state = startPulse2State(configured(), { at: "2026-09-16T10:00:00.000Z" });
  let result = observePulse2Snapshot(state, assistantSnapshot("answer-1"), Date.parse("2026-09-16T10:00:00.000Z"));
  assert.equal(result.decision, "response-changed");
  state = result.state;

  result = observePulse2Snapshot(state, assistantSnapshot("answer-1"), Date.parse("2026-09-16T10:01:59.000Z"));
  assert.equal(result.decision, "waiting-delay");

  result = observePulse2Snapshot(result.state, assistantSnapshot("answer-1"), Date.parse("2026-09-16T10:02:00.000Z"));
  assert.equal(result.decision, "send-auto-response");
});

test("after N auto-responses Pulse 2.0 waits for the next completed assistant response, then rotates", () => {
  let state = startPulse2State(configured({ messagesPerCycle: 2 }), {
    at: "2026-09-16T10:00:00.000Z"
  });

  state = recordPulse2Dispatch(state, "answer-1", "confirmed", "2026-09-16T10:02:00.000Z");
  assert.equal(state.rotationPending, false);
  state = recordPulse2Dispatch(state, "answer-2", "confirmed", "2026-09-16T10:04:00.000Z");
  assert.equal(state.cycleContinuationCount, 2);
  assert.equal(state.rotationPending, true);

  let result = observePulse2Snapshot(state, assistantSnapshot("answer-after-second-send"), Date.parse("2026-09-16T10:05:00.000Z"));
  assert.equal(result.decision, "response-changed");
  state = result.state;

  result = observePulse2Snapshot(state, assistantSnapshot("answer-after-second-send"), Date.parse("2026-09-16T10:07:00.000Z"));
  assert.equal(result.decision, "rotate");
});

test("rotation waits two minutes before capturing a new persistent chat URL", () => {
  let state = startPulse2State(configured(), { at: "2026-09-16T10:00:00.000Z" });
  state = beginPulse2Rotation({ ...state, rotationPending: true }, "2026-09-16T10:10:00.000Z");
  state = markPulse2CaptureWait(state, "2026-09-16T10:10:30.000Z");
  assert.equal(
    Date.parse(state.captureDueAt) - Date.parse("2026-09-16T10:10:30.000Z"),
    PULSE2_CAPTURE_DELAY_MS
  );

  state = capturePulse2Chat(state, CHAT_B, {
    title: "Новый проектный чат",
    at: "2026-09-16T10:12:30.000Z"
  });
  assert.equal(state.phase, "monitoring");
  assert.equal(state.currentChatUrl, CHAT_B);
  assert.equal(state.cycleNumber, 2);
  assert.equal(state.cycleContinuationCount, 0);
  assert.equal(state.rotationPending, false);
  assert.equal(state.history.at(-1).source, "project");
});

test("settings cannot be mutated while Pulse 2.0 is running", () => {
  const running = startPulse2State(configured(), { at: "2026-09-16T10:00:00.000Z" });
  assert.throws(
    () => applyPulse2SettingsPatch(running, { messagesPerCycle: 9 }),
    /Остановите Pulse 2\.0/
  );
});
