import assert from "node:assert/strict";
import test from "node:test";

import {
  createChat,
  defaultState,
  mergeRuntimeState
} from "../../chrome-extension/lib/model-v2.js";

test("новый control revision отбрасывает весь stale runtime snapshot", () => {
  const original = createChat({
    title: "Race chat",
    url: "https://chatgpt.com/c/control-race",
    now: "2026-09-02T01:00:00.000Z"
  });

  const observed = {
    ...defaultState(),
    lastCheckAt: "2026-09-02T01:05:00.000Z",
    chats: [{
      ...original,
      enabled: false,
      controlRevision: 0,
      tabId: 99,
      lastObservedFingerprint: "stale-answer",
      lastCommandedFingerprint: "older-answer",
      lastObservedSessionId: "old-session",
      lastSnapshotAt: "2026-09-02T01:05:00.000Z",
      lastRecoveryAt: "2026-09-02T01:04:00.000Z",
      lastStopReason: "stop-phrase",
      lastStoppedAt: "2026-09-02T01:05:00.000Z"
    }]
  };

  const latest = {
    ...defaultState(),
    chats: [{
      ...original,
      enabled: true,
      controlRevision: 1,
      tabId: 7,
      lastObservedFingerprint: null,
      lastCommandedFingerprint: null,
      lastObservedSessionId: null,
      lastSnapshotAt: null,
      lastRecoveryAt: null,
      lastStopReason: null,
      lastStoppedAt: null
    }]
  };

  const merged = mergeRuntimeState(observed, latest);
  const chat = merged.chats[0];
  assert.equal(chat.enabled, true);
  assert.equal(chat.controlRevision, 1);
  assert.equal(chat.tabId, 7);
  assert.equal(chat.lastObservedFingerprint, null);
  assert.equal(chat.lastCommandedFingerprint, null);
  assert.equal(chat.lastObservedSessionId, null);
  assert.equal(chat.lastSnapshotAt, null);
  assert.equal(chat.lastRecoveryAt, null);
  assert.equal(chat.lastStopReason, null);
  assert.equal(chat.lastStoppedAt, null);
});
