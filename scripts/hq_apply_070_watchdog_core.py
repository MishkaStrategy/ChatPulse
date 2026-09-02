from pathlib import Path

ROOT = Path('.')
model_path = ROOT / 'chrome-extension/lib/model-v2.js'
model = model_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

model = replace_once(
    model,
    'export const MAX_RUNTIME_MINUTES = 10_080;\n',
    'export const MAX_RUNTIME_MINUTES = 10_080;\n'
    'export const MIN_GITHUB_IDLE_MINUTES = 10;\n'
    'export const MAX_GITHUB_IDLE_MINUTES = 10_080;\n'
    'export const GITHUB_POLL_INTERVAL_MINUTES = 10;\n'
    'export const MAX_GITHUB_WATCHED_REPOSITORIES = 8;\n',
    'github constants'
)

model = replace_once(
    model,
    'export function refreshIntervalMs(intervalMinutes) {\n  const requested = clampInterval(intervalMinutes) * 3 * 60_000;\n  return Math.min(MAX_REFRESH_INTERVAL_MS, Math.max(MIN_REFRESH_INTERVAL_MS, requested));\n}\n',
    '''export function refreshIntervalMs(intervalMinutes) {\n  const requested = clampInterval(intervalMinutes) * 3 * 60_000;\n  return Math.min(MAX_REFRESH_INTERVAL_MS, Math.max(MIN_REFRESH_INTERVAL_MS, requested));\n}\n\nexport function clampGithubIdleMinutes(value) {\n  const parsed = Number(value);\n  if (!Number.isFinite(parsed)) return 30;\n  return Math.min(\n    Math.max(Math.trunc(parsed), MIN_GITHUB_IDLE_MINUTES),\n    MAX_GITHUB_IDLE_MINUTES\n  );\n}\n\nexport function normalizeGithubRepository(value) {\n  if (typeof value !== "string") return null;\n  const trimmed = value.trim();\n  const match = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\\/([A-Za-z0-9._-]{1,100})$/.exec(trimmed);\n  if (!match) return null;\n  if (match[2] === "." || match[2] === ".." || match[2].endsWith(".git")) return null;\n  return `${match[1]}/${match[2]}`;\n}\n''',
    'github normalization helpers'
)

model = replace_once(
    model,
    '    maxRuntimeMinutes: 0,\n    telegramNotify: true\n',
    '    maxRuntimeMinutes: 0,\n    telegramNotify: true,\n    githubWatchEnabled: false,\n    githubRepository: null,\n    githubIdleMinutes: 30\n',
    'default profile github fields'
)

model = replace_once(
    model,
    '    maxRuntimeMinutes: boundedInteger(raw?.maxRuntimeMinutes, MAX_RUNTIME_MINUTES),\n    telegramNotify: raw?.telegramNotify !== false && fallback.telegramNotify\n',
    '''    maxRuntimeMinutes: boundedInteger(raw?.maxRuntimeMinutes, MAX_RUNTIME_MINUTES),\n    telegramNotify: raw?.telegramNotify !== false && fallback.telegramNotify,\n    githubWatchEnabled: raw?.githubWatchEnabled === true && Boolean(normalizeGithubRepository(raw?.githubRepository)),\n    githubRepository: normalizeGithubRepository(raw?.githubRepository),\n    githubIdleMinutes: clampGithubIdleMinutes(raw?.githubIdleMinutes)\n''',
    'normalize profile github fields'
)

model = replace_once(
    model,
    '    maxRuntimeMinutes: profile.maxRuntimeMinutes,\n    telegramNotify: profile.telegramNotify\n',
    '''    maxRuntimeMinutes: profile.maxRuntimeMinutes,\n    telegramNotify: profile.telegramNotify,\n    githubWatchEnabled: profile.githubWatchEnabled,\n    githubRepository: profile.githubRepository,\n    githubIdleMinutes: profile.githubIdleMinutes\n''',
    'effective profile github fields'
)

model = replace_once(
    model,
    '    lastTelegramErrorKey: null,\n    tabId: Number.isInteger(tabId) ? tabId : null,\n',
    '''    lastTelegramErrorKey: null,\n    githubWatchStartedAt: null,\n    githubLastRunId: null,\n    githubLastRunCreatedAt: null,\n    githubLastActivityAt: null,\n    githubLastAttemptAt: null,\n    githubLastCheckedAt: null,\n    githubLastRestartAt: null,\n    githubLastRestartKey: null,\n    githubRestartCount: 0,\n    githubLastError: null,\n    tabId: Number.isInteger(tabId) ? tabId : null,\n''',
    'create chat github runtime'
)

model = replace_once(
    model,
    '    lastTelegramErrorKey: stringOrNull(raw.lastTelegramErrorKey),\n    tabId: Number.isInteger(raw.tabId) ? raw.tabId : null,\n',
    '''    lastTelegramErrorKey: stringOrNull(raw.lastTelegramErrorKey),\n    githubWatchStartedAt: stringOrNull(raw.githubWatchStartedAt),\n    githubLastRunId: stringOrNull(raw.githubLastRunId),\n    githubLastRunCreatedAt: stringOrNull(raw.githubLastRunCreatedAt),\n    githubLastActivityAt: stringOrNull(raw.githubLastActivityAt),\n    githubLastAttemptAt: stringOrNull(raw.githubLastAttemptAt),\n    githubLastCheckedAt: stringOrNull(raw.githubLastCheckedAt),\n    githubLastRestartAt: stringOrNull(raw.githubLastRestartAt),\n    githubLastRestartKey: stringOrNull(raw.githubLastRestartKey),\n    githubRestartCount: nonNegativeInteger(raw.githubRestartCount),\n    githubLastError: stringOrNull(raw.githubLastError),\n    tabId: Number.isInteger(raw.tabId) ? raw.tabId : null,\n''',
    'normalize chat github runtime'
)

model = replace_once(model, '    schemaVersion: 4,\n', '    schemaVersion: 5,\n', 'default schema v5')
model = replace_once(model, '    schemaVersion: 4,\n', '    schemaVersion: 5,\n', 'normalized schema v5')

anchor = 'export function recordRecovery(chat, reason, at = new Date().toISOString()) {\n'
watchdog_functions = '''export function resetGithubWatchRuntime(chat) {\n  return {\n    ...chat,\n    githubWatchStartedAt: null,\n    githubLastRunId: null,\n    githubLastRunCreatedAt: null,\n    githubLastActivityAt: null,\n    githubLastAttemptAt: null,\n    githubLastCheckedAt: null,\n    githubLastRestartAt: null,\n    githubLastRestartKey: null,\n    githubRestartCount: 0,\n    githubLastError: null\n  };\n}\n\nexport function recordGithubWatchError(chat, message, at = new Date().toISOString()) {\n  return {\n    ...chat,\n    githubLastAttemptAt: at,\n    githubLastError: String(message || "GitHub Actions check failed")\n  };\n}\n\nexport function recordGithubActionsObservation(\n  chat,\n  { runId = null, createdAt = null } = {},\n  at = new Date().toISOString()\n) {\n  const normalizedRunId = runId === null || runId === undefined ? null : String(runId);\n  const normalizedCreatedAt = validTimestampOrNull(createdAt);\n  const hadBaseline = Boolean(chat?.githubWatchStartedAt);\n  const runChanged = hadBaseline && normalizedRunId !== stringOrNull(chat?.githubLastRunId);\n  const observedAtMs = Date.parse(at);\n  const createdAtMs = Date.parse(String(normalizedCreatedAt || ""));\n  const safeCreatedAt = Number.isFinite(createdAtMs) && (!Number.isFinite(observedAtMs) || createdAtMs <= observedAtMs)\n    ? normalizedCreatedAt\n    : at;\n  const nextActivityAt = !hadBaseline\n    ? at\n    : runChanged\n      ? safeCreatedAt\n      : stringOrNull(chat?.githubLastActivityAt) || at;\n\n  return {\n    ...chat,\n    githubWatchStartedAt: stringOrNull(chat?.githubWatchStartedAt) || at,\n    githubLastRunId: normalizedRunId,\n    githubLastRunCreatedAt: normalizedCreatedAt,\n    githubLastActivityAt: nextActivityAt,\n    githubLastAttemptAt: at,\n    githubLastCheckedAt: at,\n    githubLastRestartKey: runChanged ? null : stringOrNull(chat?.githubLastRestartKey),\n    githubLastError: null\n  };\n}\n\nexport function githubWatchdogDecision(chat, idleMinutes, now = Date.now()) {\n  if (!chat?.githubWatchStartedAt || !chat?.githubLastCheckedAt || !chat?.githubLastActivityAt) {\n    return { decision: "baseline-required", restartKey: null, idleMs: 0 };\n  }\n  const activityAt = Date.parse(chat.githubLastActivityAt);\n  if (!Number.isFinite(activityAt)) {\n    return { decision: "baseline-required", restartKey: null, idleMs: 0 };\n  }\n  const idleMs = Math.max(0, now - activityAt);\n  const thresholdMs = clampGithubIdleMinutes(idleMinutes) * 60_000;\n  const restartKey = chat.githubLastRunId\n    ? `run:${chat.githubLastRunId}`\n    : `empty:${chat.githubWatchStartedAt}`;\n  if (idleMs < thresholdMs) return { decision: "active", restartKey, idleMs };\n  if (chat.githubLastRestartKey === restartKey) {\n    return { decision: "already-restarted", restartKey, idleMs };\n  }\n  return { decision: "restart", restartKey, idleMs };\n}\n\nexport function recordGithubRestart(chat, restartKey, at = new Date().toISOString()) {\n  if (!restartKey) throw new Error("GitHub restart key is required.");\n  return {\n    ...chat,\n    githubLastRestartAt: at,\n    githubLastRestartKey: String(restartKey),\n    githubRestartCount: nonNegativeInteger(chat?.githubRestartCount) + 1,\n    githubLastError: null\n  };\n}\n\nexport function shouldPollGithubRepository(chat, now = Date.now()) {\n  const lastAttemptAt = Date.parse(String(chat?.githubLastAttemptAt || ""));\n  if (!Number.isFinite(lastAttemptAt)) return true;\n  return now - lastAttemptAt >= GITHUB_POLL_INTERVAL_MINUTES * 60_000;\n}\n\n'''
model = replace_once(model, anchor, watchdog_functions + anchor, 'watchdog model functions')

model = replace_once(
    model,
    '        lastTelegramErrorKey: observed.lastTelegramErrorKey,\n        tabId: observed.tabId,\n',
    '''        lastTelegramErrorKey: observed.lastTelegramErrorKey,\n        githubWatchStartedAt: observed.githubWatchStartedAt,\n        githubLastRunId: observed.githubLastRunId,\n        githubLastRunCreatedAt: observed.githubLastRunCreatedAt,\n        githubLastActivityAt: observed.githubLastActivityAt,\n        githubLastAttemptAt: observed.githubLastAttemptAt,\n        githubLastCheckedAt: observed.githubLastCheckedAt,\n        githubLastRestartAt: observed.githubLastRestartAt,\n        githubLastRestartKey: observed.githubLastRestartKey,\n        githubRestartCount: observed.githubRestartCount,\n        githubLastError: observed.githubLastError,\n        tabId: observed.tabId,\n''',
    'runtime merge github state'
)

model = replace_once(
    model,
    '    lastCommandedFingerprint: runtimeChat.lastCommandedFingerprint,\n    lastCommandAt: runtimeChat.lastCommandAt,\n    lastDispatchOutcome: runtimeChat.lastDispatchOutcome,\n    lastError: runtimeChat.lastError\n',
    '''    lastCommandedFingerprint: runtimeChat.lastCommandedFingerprint,\n    lastCommandAt: runtimeChat.lastCommandAt,\n    lastDispatchOutcome: runtimeChat.lastDispatchOutcome,\n    githubLastRestartAt: runtimeChat.githubLastRestartAt,\n    githubLastRestartKey: runtimeChat.githubLastRestartKey,\n    githubRestartCount: Math.max(\n      nonNegativeInteger(latestChat?.githubRestartCount),\n      nonNegativeInteger(runtimeChat?.githubRestartCount)\n    ),\n    lastError: runtimeChat.lastError\n''',
    'dispatch checkpoint github idempotency'
)

model = replace_once(
    model,
    'function timestampOrZero(value) {\n',
    '''function validTimestampOrNull(value) {\n  const text = stringOrNull(value);\n  if (!text) return null;\n  return Number.isFinite(Date.parse(text)) ? text : null;\n}\n\nfunction timestampOrZero(value) {\n''',
    'timestamp helper'
)

model_path.write_text(model, encoding='utf-8')

test_path = ROOT / 'tests/chrome-extension/github-watchdog.test.mjs'
test_path.write_text(r'''import assert from "node:assert/strict";
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
''', encoding='utf-8')

print('Applied ChatPulse 0.7.0 watchdog core model and tests.')
