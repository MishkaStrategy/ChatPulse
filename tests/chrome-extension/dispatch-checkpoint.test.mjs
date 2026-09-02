import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createChat,
  mergeDispatchCheckpoint,
  recordDispatch,
  startChatRun
} from "../../chrome-extension/lib/model-v2.js";

const workerPath = fileURLToPath(new URL("../../chrome-extension/background/service-worker-v2.js", import.meta.url));
const workerSource = await readFile(workerPath, "utf8");

test("START_TASK resets only the selected chat baseline, not the global session", () => {
  const startIndex = workerSource.indexOf('case "START_TASK"');
  const stopIndex = workerSource.indexOf('case "STOP_TASK"');
  assert.ok(startIndex >= 0 && stopIndex > startIndex, "START_TASK block not found");
  const block = workerSource.slice(startIndex, stopIndex);
  assert.ok(block.includes("startChatRun(state.chats[index], { task: true })"));
  assert.equal(block.includes("sessionId: createSessionId()"), false, "task start must not reset every chat baseline");

  const selected = startChatRun({
    ...createChat({ title: "Selected", url: "https://chatgpt.com/c/selected" }),
    lastObservedSessionId: "global-session"
  }, { task: true, at: "2026-09-02T06:00:00.000Z" });
  const other = {
    ...createChat({ title: "Other", url: "https://chatgpt.com/c/other" }),
    lastObservedSessionId: "global-session"
  };
  assert.equal(selected.lastObservedSessionId, null);
  assert.equal(other.lastObservedSessionId, "global-session");
});

test("dispatch checkpoint preserves fresh profile revision and counts the same run", () => {
  const base = startChatRun(createChat({ title: "A", url: "https://chatgpt.com/c/a" }), {
    at: "2026-09-02T06:00:00.000Z"
  });
  const runtime = recordDispatch({
    ...base,
    controlRevision: 2,
    lastObservedFingerprint: "answer-1",
    lastObservedSessionId: "session-a",
    lastObservedAt: "2026-09-02T06:01:00.000Z",
    lastSnapshotAt: "2026-09-02T06:01:00.000Z"
  }, "answer-1", "confirmed", "2026-09-02T06:01:05.000Z");
  const latest = {
    ...base,
    controlRevision: 3,
    profile: { ...base.profile, maxContinuations: 10 },
    continuationCount: 0,
    lastCommandedFingerprint: null,
    lastCommandAt: null,
    lastDispatchOutcome: null
  };

  const checkpoint = mergeDispatchCheckpoint(runtime, latest);
  assert.equal(checkpoint.controlRevision, 3, "fresh control revision must win");
  assert.equal(checkpoint.profile.maxContinuations, 10, "fresh profile must win");
  assert.equal(checkpoint.continuationCount, 1, "actual dispatch must count because runStartedAt is unchanged");
  assert.equal(checkpoint.lastCommandedFingerprint, "answer-1", "actual dispatch must remain at-most-once protected");
  assert.equal(checkpoint.lastCommandAt, "2026-09-02T06:01:05.000Z");
  assert.equal(checkpoint.lastDispatchOutcome, "confirmed");
});

test("dispatch checkpoint increments an existing same run even after a profile edit", () => {
  const base = startChatRun(createChat({ title: "A", url: "https://chatgpt.com/c/a" }), {
    at: "2026-09-02T06:00:00.000Z"
  });
  const latest = {
    ...base,
    controlRevision: 8,
    continuationCount: 3,
    profile: { ...base.profile, maxContinuations: 5 }
  };
  const runtime = recordDispatch({
    ...base,
    controlRevision: 7,
    continuationCount: 3
  }, "answer-4", "submitted-unconfirmed", "2026-09-02T06:02:00.000Z");

  const checkpoint = mergeDispatchCheckpoint(runtime, latest);
  assert.equal(checkpoint.profile.maxContinuations, 5);
  assert.equal(checkpoint.controlRevision, 8);
  assert.equal(checkpoint.continuationCount, 4, "profile edit must not make the actual same-run send disappear from the limit counter");
  assert.equal(checkpoint.lastCommandedFingerprint, "answer-4");
  assert.equal(checkpoint.lastDispatchOutcome, "submitted-unconfirmed");
});

test("dispatch checkpoint protects fingerprint but does not charge an older send to a newer run", () => {
  const oldRun = startChatRun(createChat({ title: "A", url: "https://chatgpt.com/c/a" }), {
    at: "2026-09-02T06:00:00.000Z"
  });
  const runtime = recordDispatch({ ...oldRun, continuationCount: 2 }, "old-answer", "confirmed", "2026-09-02T06:03:00.000Z");
  const newRun = startChatRun({ ...oldRun, controlRevision: 9 }, {
    at: "2026-09-02T06:02:30.000Z"
  });

  const checkpoint = mergeDispatchCheckpoint(runtime, newRun);
  assert.equal(checkpoint.runStartedAt, "2026-09-02T06:02:30.000Z");
  assert.equal(checkpoint.continuationCount, 0, "new run counter must stay fresh");
  assert.equal(checkpoint.lastCommandedFingerprint, "old-answer", "late old-run send must still be duplicate-protected");
});

test("service worker persists at-most-once dispatch before Telegram/network notification", () => {
  const recordIndex = workerSource.indexOf("recordDispatch(");
  const checkpointIndex = workerSource.indexOf("persistDispatchCheckpoint(observedState.chats[index])");
  const continuationNotifyIndex = workerSource.indexOf('"continuation",\n        outcome');
  assert.ok(recordIndex >= 0);
  assert.ok(checkpointIndex > recordIndex, "dispatch must be recorded before storage checkpoint");
  assert.ok(continuationNotifyIndex > checkpointIndex, "Telegram notification must happen after durable checkpoint");

  const helperIndex = workerSource.indexOf("async function persistDispatchCheckpoint(runtimeChat)");
  assert.ok(helperIndex >= 0, "durable dispatch checkpoint helper missing");
  const helperBlock = workerSource.slice(helperIndex, workerSource.indexOf("async function notifyChatEvent", helperIndex));
  assert.ok(helperBlock.includes("await saveState(latestState)"), "checkpoint must reach chrome.storage before returning");
  assert.ok(helperBlock.includes("mergeDispatchCheckpoint(runtimeChat, latestState.chats[index])"));
});

test("task-start Telegram event is emitted only after task state is persisted", () => {
  const startIndex = workerSource.indexOf('case "START_TASK"');
  const stopIndex = workerSource.indexOf('case "STOP_TASK"');
  const block = workerSource.slice(startIndex, stopIndex);
  const persistIndex = block.indexOf("await persistAndPublish(state)");
  const notifyIndex = block.indexOf('notifyChatEvent(state, state.chats[index], "task-started")');
  assert.ok(persistIndex >= 0 && notifyIndex > persistIndex, "task start must be persisted before Telegram event");
});

test("task mode has its own engine scope while top Stop remains master stop", () => {
  const startTaskIndex = workerSource.indexOf('case "START_TASK"');
  const stopTaskIndex = workerSource.indexOf('case "STOP_TASK"');
  const startTaskBlock = workerSource.slice(startTaskIndex, stopTaskIndex);
  assert.ok(startTaskBlock.includes("taskOnly:"), "START_TASK must choose taskOnly engine mode");
  assert.ok(startTaskBlock.includes('runCheck("task-start", false, selectedChatId)'), "task start immediate check must target only selected chat");

  const stopMonitoringIndex = workerSource.indexOf('case "STOP_MONITORING"');
  const checkNowIndex = workerSource.indexOf('case "CHECK_NOW"');
  const stopBlock = workerSource.slice(stopMonitoringIndex, checkNowIndex);
  assert.ok(stopBlock.includes("enabled: false"));
  assert.ok(stopBlock.includes("taskOnly: false"));
  assert.ok(stopBlock.includes('stopTaskMode(chat, "global-stop")'), "top Stop must terminate active task mode");
});

test("taskOnly loop excludes ordinary chats and live send gate requires same global session", () => {
  assert.ok(workerSource.includes("if (observedState.taskOnly && !chat.taskActive && !allowWhenStopped) continue;"));
  assert.ok(workerSource.includes("const sameSession = latestState.sessionId === observedState.sessionId;"));
  assert.ok(workerSource.includes("!sameSession"), "old pre-Stop/Start checks must not send in a new global session");
  assert.ok(workerSource.includes("!latestState.taskOnly || liveChat?.taskActive === true"));
});

test("destructive identity mutations are blocked during an active check", () => {
  const removeIndex = workerSource.indexOf('case "REMOVE_CHAT"');
  const toggleIndex = workerSource.indexOf('case "TOGGLE_CHAT"');
  assert.ok(workerSource.slice(removeIndex, toggleIndex).includes("assertIdentityMutationSafe()"));
  const importIndex = workerSource.indexOf('case "IMPORT_CONFIG"');
  const clearLogsIndex = workerSource.indexOf('case "CLEAR_LOGS"');
  assert.ok(workerSource.slice(importIndex, clearLogsIndex).includes("assertIdentityMutationSafe()"));
  assert.ok(workerSource.includes("function assertIdentityMutationSafe()"));
});
