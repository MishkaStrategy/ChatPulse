import assert from "node:assert/strict";
import test from "node:test";

import {
  GITHUB_RESTART_GRACE_ALARM_PREFIX,
  GITHUB_RESTART_GRACE_MS,
  chatIdFromGithubRestartGraceAlarm,
  githubRestartGraceAlarmName,
  planGithubRestartAuthGrace
} from "../../chrome-extension/background/github-restart-grace.js";

test("fresh unauthenticated document gets exactly 60 seconds from document start", () => {
  const startedAt = Date.parse("2026-09-05T10:00:00.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: new Date(startedAt).toISOString() },
    restartKey: "run:1",
    now: startedAt + 5_000
  });
  assert.equal(GITHUB_RESTART_GRACE_MS, 60_000);
  assert.equal(plan.defer, true);
  assert.equal(plan.reason, "new-document");
  assert.equal(plan.delayMs, 55_000);
  assert.equal(plan.until, "2026-09-05T10:01:00.000Z");
});

test("authenticated or old documents do not enter auth grace", () => {
  const now = Date.parse("2026-09-05T10:02:00.000Z");
  assert.equal(planGithubRestartAuthGrace({
    snapshot: { authenticated: true, documentStartedAt: "2026-09-05T10:01:50.000Z" },
    restartKey: "run:1",
    now
  }).defer, false);
  assert.equal(planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: "2026-09-05T10:00:00.000Z" },
    restartKey: "run:1",
    now
  }).reason, "document-old");
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

test("a new restart episode may receive its own fresh-document grace", () => {
  const now = Date.parse("2026-09-05T10:02:05.000Z");
  const plan = planGithubRestartAuthGrace({
    snapshot: { authenticated: false, documentStartedAt: "2026-09-05T10:02:00.000Z" },
    restartKey: "run:2",
    existingKey: "run:1",
    existingUntil: "2026-09-05T10:01:00.000Z",
    now
  });
  assert.equal(plan.defer, true);
  assert.equal(plan.until, "2026-09-05T10:03:00.000Z");
});

test("grace alarm names round-trip a chat id", () => {
  const name = githubRestartGraceAlarmName("chat-123");
  assert.equal(name, `${GITHUB_RESTART_GRACE_ALARM_PREFIX}chat-123`);
  assert.equal(chatIdFromGithubRestartGraceAlarm(name), "chat-123");
  assert.equal(chatIdFromGithubRestartGraceAlarm("chatpulse-monitor"), null);
});
