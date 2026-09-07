import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { replaceChatURLInState } from "../../chrome-extension/lib/chat-url-mutation.js";
import { createChat, defaultState } from "../../chrome-extension/lib/model-v2.js";

const serviceWorkerPath = fileURLToPath(new URL("../../chrome-extension/background/service-worker-v2.js", import.meta.url));
const tokenUiPath = fileURLToPath(new URL("../../chrome-extension/options/github-token-ui.js", import.meta.url));
const chatUrlUiPath = fileURLToPath(new URL("../../chrome-extension/options/chat-url-ui.js", import.meta.url));
const serviceWorker = await readFile(serviceWorkerPath, "utf8");
const tokenUi = await readFile(tokenUiPath, "utf8");
const chatUrlUi = await readFile(chatUrlUiPath, "utf8");

function configuredChat(title, url) {
  return {
    ...createChat({ title, url, tabId: 44, now: "2026-09-07T10:00:00.000Z" }),
    controlRevision: 7,
    enabled: true,
    profile: {
      commandText: "continue",
      intervalMinutes: 3,
      stopPhrase: "done",
      maxContinuations: 25,
      maxRuntimeMinutes: 120,
      telegramNotify: true,
      githubWatchEnabled: true,
      githubWatchOnly: true,
      githubRepository: "MishkaStrategy/ChatPulse",
      githubIdleMinutes: 45
    },
    runStartedAt: "2026-09-07T10:01:00.000Z",
    continuationCount: 12,
    taskActive: true,
    taskStartedAt: "2026-09-07T10:02:00.000Z",
    githubWatchStartedAt: "2026-09-07T10:03:00.000Z",
    githubLastRunId: "123",
    githubLastRunCreatedAt: "2026-09-07T10:04:00.000Z",
    githubLastActivityAt: "2026-09-07T10:04:00.000Z",
    githubLastAttemptAt: "2026-09-07T10:05:00.000Z",
    githubLastCheckedAt: "2026-09-07T10:05:00.000Z",
    githubActiveRunCount: 1,
    githubLastRestartAt: "2026-09-07T10:06:00.000Z",
    githubLastRestartKey: "run:123",
    githubRestartCount: 2,
    githubRestartGraceKey: "run:123",
    githubRestartGraceUntil: "2026-09-07T10:07:00.000Z",
    lastDecision: "already-continued",
    lastObservedFingerprint: "old-observed",
    lastCommandedFingerprint: "old-commanded",
    lastObservedAt: "2026-09-07T10:08:00.000Z",
    lastCommandAt: "2026-09-07T10:09:00.000Z",
    lastDispatchOutcome: "confirmed",
    lastObservedSessionId: "old-session",
    lastSnapshotAt: "2026-09-07T10:08:00.000Z",
    lastHardRefreshAt: "2026-09-07T10:00:00.000Z",
    lastRecoveryAt: "2026-09-07T10:10:00.000Z",
    lastRecoveryReason: "periodic-freshness",
    staleRecoveries: 3,
    lastStoppedAt: "2026-09-07T10:11:00.000Z",
    lastStopReason: "old-page",
    lastError: "old-page-error"
  };
}

test("changing a chat URL preserves configuration/task/GitHub state and clears only page-bound runtime", () => {
  const chat = configuredChat("Project", "https://chatgpt.com/c/old-chat");
  const state = { ...defaultState(), enabled: true, chats: [chat] };
  const result = replaceChatURLInState(state, chat.id, "https://chatgpt.com/c/new-chat?utm=ignored");
  const updated = result.chat;

  assert.equal(result.changed, true);
  assert.notEqual(result.state, state);
  assert.equal(updated.id, chat.id);
  assert.equal(updated.url, "https://chatgpt.com/c/new-chat");
  assert.equal(updated.title, chat.title);
  assert.deepEqual(updated.profile, chat.profile);
  assert.equal(updated.enabled, true);
  assert.equal(updated.controlRevision, 8);
  assert.equal(updated.runStartedAt, chat.runStartedAt);
  assert.equal(updated.continuationCount, 12);
  assert.equal(updated.taskActive, true);
  assert.equal(updated.taskStartedAt, chat.taskStartedAt);
  assert.equal(updated.githubLastRunId, "123");
  assert.equal(updated.githubLastActivityAt, chat.githubLastActivityAt);
  assert.equal(updated.githubRestartCount, 2);
  assert.equal(updated.githubRestartGraceKey, "run:123");
  assert.equal(updated.nextEligibleAt, null);

  for (const field of [
    "tabId", "lastDecision", "lastObservedFingerprint", "lastCommandedFingerprint",
    "lastObservedAt", "lastCommandAt", "lastDispatchOutcome", "lastObservedSessionId",
    "lastSnapshotAt", "lastHardRefreshAt", "lastRecoveryAt", "lastRecoveryReason",
    "lastStoppedAt", "lastStopReason", "lastError"
  ]) {
    assert.equal(updated[field], null, `${field} must be reset for the recreated page`);
  }
  assert.equal(updated.staleRecoveries, 0);
});

test("unchanged normalized URL is a no-op and duplicate/invalid URLs are rejected", () => {
  const first = configuredChat("First", "https://chatgpt.com/c/first");
  const second = configuredChat("Second", "https://chatgpt.com/c/second");
  const state = { ...defaultState(), chats: [first, second] };

  const unchanged = replaceChatURLInState(state, first.id, "https://chatgpt.com/c/first?x=1");
  assert.equal(unchanged.changed, false);
  assert.equal(unchanged.state, state);
  assert.equal(unchanged.chat.controlRevision, 7);
  assert.equal(unchanged.chat.tabId, 44);
  assert.equal(unchanged.chat.lastObservedFingerprint, "old-observed");

  assert.throws(
    () => replaceChatURLInState(state, first.id, "https://chatgpt.com/c/second"),
    /уже используется/
  );
  assert.throws(
    () => replaceChatURLInState(state, first.id, "https://example.com/not-chatgpt"),
    /конкретный чат ChatGPT/
  );
});

test("Control Center URL save is background-mediated and service worker treats it as identity mutation", () => {
  assert.ok(chatUrlUi.includes('class="profile-chat-url"'));
  assert.ok(chatUrlUi.includes('class="save-chat-url secondary-button"'));
  assert.ok(chatUrlUi.includes('type: "UPDATE_CHAT_URL"'));
  assert.ok(chatUrlUi.includes("chrome.runtime.sendMessage"));
  assert.equal(chatUrlUi.includes("chrome.storage"), false, "options URL editor must not write state storage directly");
  assert.ok(tokenUi.includes('import("./chat-url-ui.js")'), "Control Center must load the URL editor module");
  assert.ok(serviceWorker.includes('case "UPDATE_CHAT_URL"'));
  assert.ok(serviceWorker.includes("assertIdentityMutationSafe()"));
  assert.ok(serviceWorker.includes("replaceChatURLInState"));
});
