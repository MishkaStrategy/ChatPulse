import assert from "node:assert/strict";
import test from "node:test";

import {
  GITHUB_POLL_INTERVAL_MINUTES,
  MAX_GITHUB_WATCHED_REPOSITORIES,
  clampGithubIdleMinutes,
  createChat,
  defaultState,
  githubWatchdogDecision,
  normalizeGithubRepository,
  normalizeState,
  recordGithubActionsObservation,
  recordGithubRestart,
  recordGithubWatchError,
  resetGithubWatchRuntime,
  shouldPollGithubRepository
} from "../../chrome-extension/lib/model-v2.js";

test("schema v4 migrates to schema v5 with GitHub watcher disabled", () => {
  const state = normalizeState({
    ...defaultState(),
    schemaVersion: 4,
    chats: [{
      ...createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
      profile: { telegramNotify: true }
    }]
  });
  assert.equal(state.schemaVersion, 5);
  assert.equal(state.chats[0].profile.githubWatchEnabled, false);
  assert.equal(state.chats[0].profile.githubRepository, null);
  assert.equal(state.chats[0].profile.githubIdleMinutes, 30);
  assert.equal(state.chats[0].githubLastRunId, null);
});

test("GitHub repository identifiers are strict owner/repo values", () => {
  assert.equal(normalizeGithubRepository("MishkaStrategy/ChatPulse"), "MishkaStrategy/ChatPulse");
  assert.equal(normalizeGithubRepository("  owner/repo-name  "), "owner/repo-name");
  for (const value of ["", "owner", "/repo", "owner/", "https://github.com/a/b", "a/b/c", "a/repo.git", "a/..", "a b/repo"]) {
    assert.equal(normalizeGithubRepository(value), null, value);
  }
});

test("GitHub idle N is bounded for public API safety", () => {
  assert.equal(clampGithubIdleMinutes(1), 10);
  assert.equal(clampGithubIdleMinutes(45), 45);
  assert.equal(clampGithubIdleMinutes(999999), 10080);
  assert.equal(GITHUB_POLL_INTERVAL_MINUTES, 10);
  assert.equal(MAX_GITHUB_WATCHED_REPOSITORIES, 8);
});

test("first successful Actions observation establishes a fresh baseline and never restarts immediately", () => {
  const chat = createChat({ title: "A", url: "https://chatgpt.com/c/a" });
  const observed = recordGithubActionsObservation(chat, {
    runId: 100,
    createdAt: "2026-09-01T00:00:00.000Z"
  }, "2026-09-02T07:00:00.000Z");
  assert.equal(observed.githubLastRunId, "100");
  assert.equal(observed.githubLastActivityAt, "2026-09-02T07:00:00.000Z");
  assert.equal(githubWatchdogDecision(observed, 10, Date.parse("2026-09-02T07:00:01.000Z")).decision, "active");
});

test("new workflow run resets inactivity episode", () => {
  const base = recordGithubActionsObservation(
    createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    { runId: "100", createdAt: "2026-09-02T07:00:00.000Z" },
    "2026-09-02T07:00:00.000Z"
  );
  const restarted = recordGithubRestart(base, "run:100", "2026-09-02T07:20:00.000Z");
  const next = recordGithubActionsObservation(restarted, {
    runId: "101",
    createdAt: "2026-09-02T07:25:00.000Z"
  }, "2026-09-02T07:26:00.000Z");
  assert.equal(next.githubLastActivityAt, "2026-09-02T07:25:00.000Z");
  assert.equal(next.githubLastRestartKey, null);
  assert.equal(githubWatchdogDecision(next, 10, Date.parse("2026-09-02T07:30:00.000Z")).decision, "active");
});

test("one inactivity marker can produce at most one successful restart", () => {
  let chat = recordGithubActionsObservation(
    createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    { runId: "100", createdAt: "2026-09-02T07:00:00.000Z" },
    "2026-09-02T07:00:00.000Z"
  );
  const stalled = githubWatchdogDecision(chat, 10, Date.parse("2026-09-02T07:11:00.000Z"));
  assert.equal(stalled.decision, "restart");
  assert.equal(stalled.restartKey, "run:100");
  chat = recordGithubRestart(chat, stalled.restartKey, "2026-09-02T07:11:10.000Z");
  assert.equal(chat.githubRestartCount, 1);
  assert.equal(githubWatchdogDecision(chat, 10, Date.parse("2026-09-02T08:00:00.000Z")).decision, "already-restarted");
});

test("successful empty Actions list starts its own baseline", () => {
  const chat = recordGithubActionsObservation(
    createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    {},
    "2026-09-02T07:00:00.000Z"
  );
  assert.equal(chat.githubLastRunId, null);
  assert.equal(githubWatchdogDecision(chat, 10, Date.parse("2026-09-02T07:09:59.000Z")).decision, "active");
  const decision = githubWatchdogDecision(chat, 10, Date.parse("2026-09-02T07:10:00.000Z"));
  assert.equal(decision.decision, "restart");
  assert.match(decision.restartKey, /^empty:/);
});

test("GitHub errors never create activity or a restart decision", () => {
  const chat = recordGithubWatchError(
    createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    "GitHub API 403",
    "2026-09-02T07:00:00.000Z"
  );
  assert.equal(chat.githubWatchStartedAt, null);
  assert.equal(chat.githubLastActivityAt, null);
  assert.equal(githubWatchdogDecision(chat, 10, Date.parse("2026-09-03T07:00:00.000Z")).decision, "baseline-required");
});

test("GitHub polling is throttled by last attempt including failures", () => {
  const chat = recordGithubWatchError(
    createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    "offline",
    "2026-09-02T07:00:00.000Z"
  );
  assert.equal(shouldPollGithubRepository(chat, Date.parse("2026-09-02T07:09:59.000Z")), false);
  assert.equal(shouldPollGithubRepository(chat, Date.parse("2026-09-02T07:10:00.000Z")), true);
});

test("resetting watcher runtime does not reset continuation/runtime safety counters", () => {
  const original = {
    ...createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
    runStartedAt: "2026-09-02T06:00:00.000Z",
    continuationCount: 7,
    githubLastRunId: "100",
    githubLastRestartKey: "run:100",
    githubRestartCount: 2
  };
  const reset = resetGithubWatchRuntime(original);
  assert.equal(reset.runStartedAt, original.runStartedAt);
  assert.equal(reset.continuationCount, 7);
  assert.equal(reset.githubLastRunId, null);
  assert.equal(reset.githubLastRestartKey, null);
  assert.equal(reset.githubRestartCount, 0);
});
