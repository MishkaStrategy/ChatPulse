import assert from "node:assert/strict";
import test from "node:test";

import {
  applyGlobalSettingsPatch,
  applyPortableConfig,
  createChat,
  createPortableConfig,
  defaultState,
  effectiveChatProfile,
  normalizeState,
  startChatRun,
  stopTaskMode
} from "../../chrome-extension/lib/model-v2.js";

test("schema v4 keeps ordinary monitoring as the backward-compatible default engine mode", () => {
  const state = normalizeState({
    schemaVersion: 3,
    enabled: true,
    chats: [{ title: "Legacy", url: "https://chatgpt.com/c/legacy" }]
  });
  assert.equal(state.enabled, true);
  assert.equal(state.taskOnly, false);
});

test("global inherited setting changes advance only affected chat control revisions", () => {
  const inherited = {
    ...createChat({ title: "Inherited", url: "https://chatgpt.com/c/inherited" }),
    controlRevision: 2
  };
  const custom = {
    ...createChat({ title: "Custom", url: "https://chatgpt.com/c/custom" }),
    controlRevision: 7,
    profile: {
      commandText: "custom command",
      intervalMinutes: 2,
      stopPhrase: "CUSTOM DONE",
      maxContinuations: 0,
      maxRuntimeMinutes: 0,
      telegramNotify: true
    }
  };
  const state = {
    ...defaultState(),
    commandText: "old command",
    intervalMinutes: 5,
    stopPhrase: "GLOBAL DONE",
    chats: [inherited, custom]
  };

  const next = applyGlobalSettingsPatch(state, {
    commandText: "new command",
    intervalMinutes: 10,
    stopPhrase: "NEW GLOBAL DONE"
  });
  assert.equal(next.chats[0].controlRevision, 3);
  assert.equal(next.chats[0].nextEligibleAt, null);
  assert.equal(next.chats[1].controlRevision, 7, "fully custom profile must not be invalidated by unrelated globals");
  assert.equal(effectiveChatProfile(next, next.chats[0]).commandText, "new command");
  assert.equal(effectiveChatProfile(next, next.chats[1]).commandText, "custom command");
});

test("removing the only inherited stop guard from an active task fails closed", () => {
  const base = createChat({ title: "Task", url: "https://chatgpt.com/c/task" });
  const task = startChatRun(base, { task: true, at: "2026-09-02T06:00:00.000Z" });
  const state = {
    ...defaultState(),
    enabled: true,
    stopPhrase: "DONE",
    chats: [task]
  };

  assert.throws(
    () => applyGlobalSettingsPatch(state, { stopPhrase: "" }),
    /последний guard/i
  );
});

test("active task may lose inherited stop phrase when another explicit guard remains", () => {
  const base = createChat({ title: "Task", url: "https://chatgpt.com/c/task" });
  const task = startChatRun({
    ...base,
    profile: { ...base.profile, maxContinuations: 3 }
  }, { task: true, at: "2026-09-02T06:00:00.000Z" });
  const state = {
    ...defaultState(),
    enabled: true,
    stopPhrase: "DONE",
    chats: [task]
  };

  const next = applyGlobalSettingsPatch(state, { stopPhrase: "" });
  assert.equal(next.stopPhrase, "");
  assert.equal(next.chats[0].taskActive, true);
  assert.equal(effectiveChatProfile(next, next.chats[0]).maxContinuations, 3);
});

test("portable import rejects duplicate canonical ChatGPT conversations", () => {
  const portable = createPortableConfig({
    ...defaultState(),
    chats: [createChat({ title: "A", url: "https://chatgpt.com/c/same" })]
  });
  portable.chats.push({
    title: "Duplicate alias",
    url: "https://chat.openai.com/c/same",
    enabled: true,
    profile: {}
  });
  assert.throws(
    () => applyPortableConfig(portable),
    /один и тот же чат/i
  );
});

test("stopping task mode keeps chat eligibility but closes task runtime and invalidates stale work", () => {
  const started = startChatRun(createChat({ title: "Task", url: "https://chatgpt.com/c/task" }), {
    task: true,
    at: "2026-09-02T06:00:00.000Z"
  });
  const revisionBeforeStop = started.controlRevision;
  const stopped = stopTaskMode(started, "global-stop", "2026-09-02T06:10:00.000Z");
  assert.equal(stopped.enabled, true);
  assert.equal(stopped.taskActive, false);
  assert.equal(stopped.controlRevision, revisionBeforeStop + 1);
  assert.equal(stopped.taskCompletedAt, "2026-09-02T06:10:00.000Z");
  assert.equal(stopped.taskCompletionReason, "global-stop");
});
