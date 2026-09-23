import test from "node:test";
import assert from "node:assert/strict";

import { normalizeChatURL } from "../../chrome-extension/lib/model-v2.js";
import {
  PULSE2_CAPTURE_DELAY_MS,
  applyPulse2SettingsPatch,
  beginPulse2Rotation,
  capturePulse2Chat,
  completePulse2Route,
  defaultPulse2State,
  markPulse2CaptureWait,
  normalizePulse2ProjectURL,
  normalizePulse2State,
  observePulse2Snapshot,
  recordPulse2Dispatch,
  startPulse2State
} from "../../chrome-extension/lib/pulse2-model.js";

const CHAT_A = "https://chatgpt.com/c/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CHAT_B = "https://chatgpt.com/c/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const CHAT_C = "https://chatgpt.com/c/cccccccc-cccc-cccc-cccc-cccccccccccc";
const PROJECT_A = "https://chatgpt.com/g/g-p-project-a/project";
const PROJECT_B = "https://chatgpt.com/g/g-p-project-b/project";

function configured(routes = [{ id: "route-a", name: "A", currentChatUrl: CHAT_A, projectUrl: PROJECT_A }], overrides = {}) {
  let state = defaultPulse2State();
  state = applyPulse2SettingsPatch(state, {
    routes,
    commandText: "go",
    intervalMinutes: 2,
    messagesPerCycle: 2,
    maxCycles: 3,
    ...overrides
  });
  return state;
}

function route(state, id) {
  return state.routes.find((item) => item.id === id);
}

function assistantSnapshot(fingerprint) {
  return {
    pageReady: true,
    authenticated: true,
    errorDetected: false,
    isGenerating: false,
    latestRole: "assistant",
    latestFingerprint: fingerprint,
    visibilityState: "visible"
  };
}

test("project-scoped chat URLs remain valid current chats", () => {
  const scoped = "https://chatgpt.com/g/g-p-project-a/c/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  assert.equal(normalizeChatURL(scoped), scoped);
});

test("project URL normalization accepts project routes and rejects chat URLs", () => {
  assert.equal(normalizePulse2ProjectURL(PROJECT_A), PROJECT_A);
  assert.equal(normalizePulse2ProjectURL("https://chat.openai.com/projects/demo?tab=files"), "https://chatgpt.com/projects/demo");
  assert.equal(normalizePulse2ProjectURL(CHAT_A), null);
  assert.equal(normalizePulse2ProjectURL("https://example.com/projects/demo"), null);
});

test("legacy single-route state migrates into schema v2 routes without losing runtime", () => {
  const migrated = normalizePulse2State({
    schemaVersion: 1,
    enabled: true,
    phase: "monitoring",
    currentChatUrl: CHAT_A,
    projectUrl: PROJECT_A,
    commandText: "go",
    intervalMinutes: 2,
    messagesPerCycle: 3,
    maxCycles: 4,
    cycleNumber: 2,
    cycleContinuationCount: 1,
    totalContinuationCount: 4,
    history: [{ cycle: 1, url: CHAT_A, createdAt: "2026-09-16T10:00:00.000Z", source: "initial" }]
  });
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.enabled, true);
  assert.equal(migrated.routes.length, 1);
  assert.equal(migrated.routes[0].currentChatUrl, CHAT_A);
  assert.equal(migrated.routes[0].cycleNumber, 2);
  assert.equal(migrated.routes[0].cycleContinuationCount, 1);
});

test("current chat is optional and an empty route starts by creating its first project chat", () => {
  const state = configured([{ id: "route-a", name: "A", currentChatUrl: "", projectUrl: PROJECT_A }]);
  const started = startPulse2State(state, { at: "2026-09-22T10:00:00.000Z" });
  const current = route(started, "route-a");
  assert.equal(started.enabled, true);
  assert.equal(current.currentChatUrl, "");
  assert.equal(current.phase, "rotating");
  assert.equal(current.initializingChat, true);
  assert.equal(current.cycleNumber, 1);
  assert.equal(current.history.length, 0);
});

test("multiple projects start independently with separate runtime state", () => {
  const state = configured([
    { id: "route-a", name: "A", currentChatUrl: CHAT_A, projectUrl: PROJECT_A },
    { id: "route-b", name: "B", currentChatUrl: "", projectUrl: PROJECT_B }
  ]);
  const started = startPulse2State(state, {
    tabIds: { "route-a": 11 },
    at: "2026-09-22T10:00:00.000Z"
  });
  assert.equal(started.routes.length, 2);
  assert.equal(route(started, "route-a").phase, "monitoring");
  assert.equal(route(started, "route-a").tabId, 11);
  assert.equal(route(started, "route-b").phase, "rotating");
  assert.equal(route(started, "route-b").initializingChat, true);
});

test("dispatch counters on one project do not mutate another project", () => {
  let state = startPulse2State(configured([
    { id: "route-a", name: "A", currentChatUrl: CHAT_A, projectUrl: PROJECT_A },
    { id: "route-b", name: "B", currentChatUrl: CHAT_B, projectUrl: PROJECT_B }
  ]), { at: "2026-09-22T10:00:00.000Z" });
  state = recordPulse2Dispatch(state, "route-a", "answer-a", "confirmed", "2026-09-22T10:02:00.000Z");
  assert.equal(route(state, "route-a").cycleContinuationCount, 1);
  assert.equal(route(state, "route-a").totalContinuationCount, 1);
  assert.equal(route(state, "route-b").cycleContinuationCount, 0);
  assert.equal(route(state, "route-b").totalContinuationCount, 0);
});

test("stable assistant response becomes eligible only after the configured delay per route", () => {
  let state = startPulse2State(configured(), { at: "2026-09-22T10:00:00.000Z" });
  let result = observePulse2Snapshot(state, "route-a", assistantSnapshot("answer-1"), Date.parse("2026-09-22T10:00:00.000Z"));
  assert.equal(result.decision, "response-changed");
  state = result.state;
  result = observePulse2Snapshot(state, "route-a", assistantSnapshot("answer-1"), Date.parse("2026-09-22T10:01:59.000Z"));
  assert.equal(result.decision, "waiting-delay");
  result = observePulse2Snapshot(result.state, "route-a", assistantSnapshot("answer-1"), Date.parse("2026-09-22T10:02:00.000Z"));
  assert.equal(result.decision, "send-auto-response");
});

test("unconfirmed dispatch never advances counters and can be confirmed by the next assistant response", () => {
  let state = startPulse2State(configured(undefined, {
    intervalMinutes: 1,
    messagesPerCycle: 1
  }), { at: "2026-09-23T00:00:00.000Z" });

  let observed = observePulse2Snapshot(
    state,
    "route-a",
    assistantSnapshot("answer-1"),
    Date.parse("2026-09-23T00:00:00.000Z")
  );
  state = observed.state;
  observed = observePulse2Snapshot(
    state,
    "route-a",
    assistantSnapshot("answer-1"),
    Date.parse("2026-09-23T00:01:00.000Z")
  );
  assert.equal(observed.decision, "send-auto-response");

  state = recordPulse2Dispatch(
    observed.state,
    "route-a",
    "answer-1",
    "submitted-unconfirmed",
    "2026-09-23T00:01:00.000Z"
  );
  assert.equal(route(state, "route-a").cycleContinuationCount, 0);
  assert.equal(route(state, "route-a").totalContinuationCount, 0);
  assert.equal(route(state, "route-a").rotationPending, false);
  assert.equal(route(state, "route-a").lastDispatchOutcome, "submitted-unconfirmed");
  assert.equal(
    Date.parse(route(state, "route-a").nextCheckAt) - Date.parse("2026-09-23T00:01:00.000Z"),
    5 * 60_000
  );

  observed = observePulse2Snapshot(
    state,
    "route-a",
    assistantSnapshot("answer-2"),
    Date.parse("2026-09-23T00:02:00.000Z")
  );
  assert.equal(observed.decision, "response-changed");
  assert.equal(route(observed.state, "route-a").cycleContinuationCount, 1);
  assert.equal(route(observed.state, "route-a").totalContinuationCount, 1);
  assert.equal(route(observed.state, "route-a").rotationPending, true);
  assert.equal(route(observed.state, "route-a").lastDispatchOutcome, "confirmed-by-response");
  assert.equal(route(observed.state, "route-a").lastError, null);
});

test("unconfirmed dispatch on the same assistant response backs off instead of hammering", () => {
  let state = startPulse2State(configured(undefined, {
    intervalMinutes: 1
  }), { at: "2026-09-23T00:00:00.000Z" });
  let observed = observePulse2Snapshot(
    state,
    "route-a",
    assistantSnapshot("answer-1"),
    Date.parse("2026-09-23T00:00:00.000Z")
  );
  state = recordPulse2Dispatch(
    observed.state,
    "route-a",
    "answer-1",
    "submitted-unconfirmed",
    "2026-09-23T00:01:00.000Z"
  );
  observed = observePulse2Snapshot(
    state,
    "route-a",
    assistantSnapshot("answer-1"),
    Date.parse("2026-09-23T00:06:00.000Z")
  );
  assert.equal(observed.decision, "already-dispatched");
  assert.equal(route(observed.state, "route-a").cycleContinuationCount, 0);
  assert.equal(
    Date.parse(route(observed.state, "route-a").nextCheckAt) - Date.parse("2026-09-23T00:06:00.000Z"),
    5 * 60_000
  );
});

test("capture and dispatch use a short recheck while configured delay remains response-based", () => {
  let state = startPulse2State(configured([
    { id: "route-a", name: "A", currentChatUrl: "", projectUrl: PROJECT_A }
  ], { intervalMinutes: 60 }), { at: "2026-09-22T10:00:00.000Z" });
  state = markPulse2CaptureWait(state, "route-a", "2026-09-22T10:00:30.000Z");
  state = capturePulse2Chat(state, "route-a", CHAT_A, {
    at: "2026-09-22T10:02:30.000Z",
    visibilityState: "visible"
  });
  assert.equal(route(state, "route-a").lastPageVisibility, "visible");
  assert.equal(
    Date.parse(route(state, "route-a").nextCheckAt) - Date.parse("2026-09-22T10:02:30.000Z"),
    30_000
  );

  let observed = observePulse2Snapshot(state, "route-a", assistantSnapshot("answer-1"), Date.parse("2026-09-22T10:03:00.000Z"));
  assert.equal(observed.decision, "response-changed");
  assert.equal(
    Date.parse(route(observed.state, "route-a").nextCheckAt) - Date.parse("2026-09-22T10:03:00.000Z"),
    60 * 60_000
  );

  observed = observePulse2Snapshot(observed.state, "route-a", assistantSnapshot("answer-1"), Date.parse("2026-09-22T11:03:00.000Z"));
  assert.equal(observed.decision, "send-auto-response");
  state = recordPulse2Dispatch(observed.state, "route-a", "answer-1", "confirmed", "2026-09-22T11:03:00.000Z");
  assert.equal(
    Date.parse(route(state, "route-a").nextCheckAt) - Date.parse("2026-09-22T11:03:00.000Z"),
    30_000
  );
});

test("monitor transient and auth states use bounded retry timing", () => {
  let state = startPulse2State(configured(undefined, { intervalMinutes: 60 }), {
    at: "2026-09-23T00:00:00.000Z"
  });
  const now = Date.parse("2026-09-23T00:00:00.000Z");

  let observed = observePulse2Snapshot(state, "route-a", {
    pageReady: false,
    visibilityState: "visible"
  }, now);
  assert.equal(observed.decision, "page-not-ready");
  assert.equal(Date.parse(route(observed.state, "route-a").nextCheckAt) - now, 30_000);

  observed = observePulse2Snapshot(state, "route-a", {
    pageReady: true,
    authenticated: false,
    visibilityState: "visible"
  }, now);
  assert.equal(observed.decision, "not-authenticated");
  assert.equal(Date.parse(route(observed.state, "route-a").nextCheckAt) - now, 5 * 60_000);

  observed = observePulse2Snapshot(state, "route-a", {
    pageReady: true,
    authenticated: true,
    errorDetected: false,
    isGenerating: true,
    visibilityState: "visible"
  }, now);
  assert.equal(observed.decision, "generating");
  assert.equal(Date.parse(route(observed.state, "route-a").nextCheckAt) - now, 30_000);
});

test("initial project-created chat becomes cycle 1 instead of cycle 2", () => {
  let state = startPulse2State(configured([
    { id: "route-a", name: "A", currentChatUrl: "", projectUrl: PROJECT_A }
  ]), { at: "2026-09-22T10:00:00.000Z" });
  state = markPulse2CaptureWait(state, "route-a", "2026-09-22T10:00:30.000Z");
  assert.equal(Date.parse(route(state, "route-a").captureDueAt) - Date.parse("2026-09-22T10:00:30.000Z"), PULSE2_CAPTURE_DELAY_MS);
  state = capturePulse2Chat(state, "route-a", CHAT_A, { at: "2026-09-22T10:02:30.000Z" });
  const current = route(state, "route-a");
  assert.equal(current.phase, "monitoring");
  assert.equal(current.cycleNumber, 1);
  assert.equal(current.initializingChat, false);
  assert.equal(current.history.length, 1);
  assert.equal(current.history[0].source, "project-initial");
});

test("normal rotation increments only that route and preserves two-minute capture contract", () => {
  let state = startPulse2State(configured(), { at: "2026-09-22T10:00:00.000Z" });
  state = beginPulse2Rotation({ ...state, routes: state.routes.map((r) => r.id === "route-a" ? { ...r, rotationPending: true } : r) }, "route-a", "2026-09-22T10:10:00.000Z");
  state = markPulse2CaptureWait(state, "route-a", "2026-09-22T10:10:30.000Z");
  state = capturePulse2Chat(state, "route-a", CHAT_C, { at: "2026-09-22T10:12:30.000Z" });
  assert.equal(route(state, "route-a").cycleNumber, 2);
  assert.equal(route(state, "route-a").history.at(-1).source, "project");
});

test("completing one route does not stop other active routes", () => {
  let state = startPulse2State(configured([
    { id: "route-a", name: "A", currentChatUrl: CHAT_A, projectUrl: PROJECT_A },
    { id: "route-b", name: "B", currentChatUrl: CHAT_B, projectUrl: PROJECT_B }
  ]), { at: "2026-09-22T10:00:00.000Z" });
  state = completePulse2Route(state, "route-a");
  assert.equal(route(state, "route-a").phase, "completed");
  assert.equal(route(state, "route-b").phase, "monitoring");
  assert.equal(state.enabled, true);
});

test("same current chat cannot be assigned to two Pulse 2.0 routes", () => {
  assert.throws(() => configured([
    { id: "route-a", name: "A", currentChatUrl: CHAT_A, projectUrl: PROJECT_A },
    { id: "route-b", name: "B", currentChatUrl: CHAT_A, projectUrl: PROJECT_B }
  ]), /один и тот же текущий чат/i);
});

test("settings cannot be mutated while Pulse 2.0 is running", () => {
  const running = startPulse2State(configured(), { at: "2026-09-22T10:00:00.000Z" });
  assert.throws(() => applyPulse2SettingsPatch(running, { messagesPerCycle: 9 }), /Остановите Pulse 2\.0/);
});
