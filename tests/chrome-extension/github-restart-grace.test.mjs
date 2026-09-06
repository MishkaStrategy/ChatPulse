import assert from "node:assert/strict";
import test from "node:test";

import {
  GITHUB_RESTART_GRACE_ALARM_PREFIX,
  GITHUB_RESTART_GRACE_MS,
  chatIdFromGithubRestartGraceAlarm,
  githubRestartGraceAlarmName,
  planGithubRestartAuthGrace
} from "../../chrome-extension/background/github-restart-grace.js";

test("unauthenticated restart gets a full 60-second warm-up from first detection", () => {
  const now = Date.parse("2026-09-05T10:00:45.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: "2026-09-05T10:00:00.000Z" },
    restartKey: "run:1",
    now
  });
  assert.equal(GITHUB_RESTART_GRACE_MS, 60_000);
  assert.equal(plan.defer, true);
  assert.equal(plan.reason, "restart-warmup");
  assert.equal(plan.delayMs, 60_000);
  assert.equal(plan.until, "2026-09-05T10:01:45.000Z");
});

test("document age does not consume the one allowed restart warm-up", () => {
  const now = Date.parse("2026-09-05T10:05:00.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: "2026-09-05T09:30:00.000Z" },
    restartKey: "run:1",
    now
  });
  assert.equal(plan.defer, true);
  assert.equal(plan.until, "2026-09-05T10:06:00.000Z");
  assert.equal(plan.delayMs, 60_000);
});

test("authenticated pages do not enter auth grace", () => {
  const now = Date.parse("2026-09-05T10:02:00.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: true, documentStartedAt: "2026-09-05T10:01:50.000Z" },
    restartKey: "run:1",
    now
  });
  assert.equal(plan.defer, false);
  assert.equal(plan.reason, "not-applicable");
});

test("same restart episode reuses a pending grace without postponing its deadline", () => {
  const now = Date.parse("2026-09-05T10:00:30.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: "2026-09-05T10:00:25.000Z" },
    restartKey: "run:1",
    existingKey: "run:1",
    existingUntil: "2026-09-05T10:01:00.000Z",
    now
  });
  assert.equal(plan.defer, true);
  assert.equal(plan.reason, "existing-grace");
  assert.equal(plan.until, "2026-09-05T10:01:00.000Z");
  assert.equal(plan.delayMs, 30_000);
});

test("same restart episode cannot start a second grace after the first expires", () => {
  const now = Date.parse("2026-09-05T10:01:01.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: "2026-09-05T10:01:00.500Z" },
    restartKey: "run:1",
    existingKey: "run:1",
    existingUntil: "2026-09-05T10:01:00.000Z",
    now
  });
  assert.equal(plan.defer, false);
  assert.equal(plan.reason, "grace-expired");
});

test("a new restart episode may receive its own 60-second warm-up", () => {
  const now = Date.parse("2026-09-05T10:02:05.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: "2026-09-05T09:00:00.000Z" },
    restartKey: "run:2",
    existingKey: "run:1",
    existingUntil: "2026-09-05T10:01:00.000Z",
    now
  });
  assert.equal(plan.defer, true);
  assert.equal(plan.until, "2026-09-05T10:03:05.000Z");
  assert.equal(plan.delayMs, 60_000);
});

test("grace alarm names round-trip a chat id", () => {
  const name = githubRestartGraceAlarmName("chat-123");
  assert.equal(name, `${GITHUB_RESTART_GRACE_ALARM_PREFIX}chat-123`);
  assert.equal(chatIdFromGithubRestartGraceAlarm(name), "chat-123");
  assert.equal(chatIdFromGithubRestartGraceAlarm("chatpulse-monitor"), null);
});
