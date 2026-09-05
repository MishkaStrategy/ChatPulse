#!/usr/bin/env python3
from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, got {count}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def append_before(path, marker, addition):
    replace_once(path, marker, addition + marker)


# Pure grace planner: one grace per restart episode, exactly 60 seconds from document start.
grace_module = Path("chrome-extension/background/github-restart-grace.js")
if grace_module.exists():
    raise SystemExit("github-restart-grace.js already exists")
grace_module.write_text(r'''export const GITHUB_RESTART_GRACE_MS = 60_000;
export const GITHUB_RESTART_GRACE_ALARM_PREFIX = "chatpulse-github-restart-grace:";

export function githubRestartGraceAlarmName(chatId) {
  const id = typeof chatId === "string" ? chatId.trim() : "";
  if (!id) throw new Error("Chat id is required for GitHub restart grace alarm.");
  return `${GITHUB_RESTART_GRACE_ALARM_PREFIX}${id}`;
}

export function chatIdFromGithubRestartGraceAlarm(name) {
  if (typeof name !== "string" || !name.startsWith(GITHUB_RESTART_GRACE_ALARM_PREFIX)) return null;
  const chatId = name.slice(GITHUB_RESTART_GRACE_ALARM_PREFIX.length);
  return chatId || null;
}

export function planGithubRestartAuthGrace({
  snapshot,
  restartKey,
  existingKey = null,
  existingUntil = null,
  now = Date.now()
} = {}) {
  const key = typeof restartKey === "string" && restartKey ? restartKey : null;
  if (!key || snapshot?.authenticated !== false) {
    return { defer: false, reason: "not-applicable", until: null, delayMs: 0 };
  }

  const priorKey = typeof existingKey === "string" && existingKey ? existingKey : null;
  const priorUntilMs = Date.parse(String(existingUntil || ""));
  if (priorKey === key && Number.isFinite(priorUntilMs)) {
    if (now < priorUntilMs) {
      return {
        defer: true,
        reason: "existing-grace",
        until: new Date(priorUntilMs).toISOString(),
        delayMs: Math.max(0, priorUntilMs - now)
      };
    }
    return {
      defer: false,
      reason: "grace-expired",
      until: new Date(priorUntilMs).toISOString(),
      delayMs: 0
    };
  }

  const documentStartedAtMs = Date.parse(String(snapshot?.documentStartedAt || ""));
  if (!Number.isFinite(documentStartedAtMs)) {
    return { defer: false, reason: "unknown-document-age", until: null, delayMs: 0 };
  }
  const safeStartedAtMs = Math.min(documentStartedAtMs, now);
  const ageMs = Math.max(0, now - safeStartedAtMs);
  if (ageMs >= GITHUB_RESTART_GRACE_MS) {
    return { defer: false, reason: "document-old", until: null, delayMs: 0 };
  }

  const untilMs = safeStartedAtMs + GITHUB_RESTART_GRACE_MS;
  return {
    defer: true,
    reason: "new-document",
    until: new Date(untilMs).toISOString(),
    delayMs: Math.max(0, untilMs - now)
  };
}
''', encoding="utf-8")

# Persist grace runtime fields; portable export remains profile-only.
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubRestartCount: 0,\n    githubLastError: null,\n    tabId: Number.isInteger(tabId) ? tabId : null,\n",
    "    githubRestartCount: 0,\n    githubLastError: null,\n    githubRestartGraceKey: null,\n    githubRestartGraceUntil: null,\n    tabId: Number.isInteger(tabId) ? tabId : null,\n"
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubRestartCount: nonNegativeInteger(raw.githubRestartCount),\n    githubLastError: stringOrNull(raw.githubLastError),\n    tabId: Number.isInteger(raw.tabId) ? raw.tabId : null,\n",
    "    githubRestartCount: nonNegativeInteger(raw.githubRestartCount),\n    githubLastError: stringOrNull(raw.githubLastError),\n    githubRestartGraceKey: stringOrNull(raw.githubRestartGraceKey),\n    githubRestartGraceUntil: validTimestampOrNull(raw.githubRestartGraceUntil),\n    tabId: Number.isInteger(raw.tabId) ? raw.tabId : null,\n"
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubLastRestartAt: null,\n    githubLastRestartKey: null,\n    githubRestartCount: 0,\n    githubLastError: null\n  };\n}\n\nexport function recordGithubWatchError",
    "    githubLastRestartAt: null,\n    githubLastRestartKey: null,\n    githubRestartCount: 0,\n    githubLastError: null,\n    githubRestartGraceKey: null,\n    githubRestartGraceUntil: null\n  };\n}\n\nexport function recordGithubWatchError"
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubActiveRunCount: normalizedActiveRunCount,\n    githubLastRestartKey: runChanged ? null : stringOrNull(chat?.githubLastRestartKey),\n    githubLastError: null\n",
    "    githubActiveRunCount: normalizedActiveRunCount,\n    githubLastRestartKey: runChanged ? null : stringOrNull(chat?.githubLastRestartKey),\n    githubRestartGraceKey: runChanged || hasActiveRuns ? null : stringOrNull(chat?.githubRestartGraceKey),\n    githubRestartGraceUntil: runChanged || hasActiveRuns ? null : validTimestampOrNull(chat?.githubRestartGraceUntil),\n    githubLastError: null\n"
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubLastRestartKey: String(restartKey),\n    githubRestartCount: nonNegativeInteger(chat?.githubRestartCount) + 1,\n    githubLastError: null\n",
    "    githubLastRestartKey: String(restartKey),\n    githubRestartCount: nonNegativeInteger(chat?.githubRestartCount) + 1,\n    githubRestartGraceKey: null,\n    githubRestartGraceUntil: null,\n    githubLastError: null\n"
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubRestartCount: Math.max(\n      nonNegativeInteger(latestChat?.githubRestartCount),\n      nonNegativeInteger(runtimeChat?.githubRestartCount)\n    ),\n    lastError: runtimeChat.lastError\n",
    "    githubRestartCount: Math.max(\n      nonNegativeInteger(latestChat?.githubRestartCount),\n      nonNegativeInteger(runtimeChat?.githubRestartCount)\n    ),\n    githubRestartGraceKey: runtimeChat.githubRestartGraceKey,\n    githubRestartGraceUntil: runtimeChat.githubRestartGraceUntil,\n    lastError: runtimeChat.lastError\n"
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "        githubLastRestartKey: observed.githubLastRestartKey,\n        githubRestartCount: observed.githubRestartCount,\n        githubLastError: observed.githubLastError,\n        tabId: observed.tabId,\n",
    "        githubLastRestartKey: observed.githubLastRestartKey,\n        githubRestartCount: observed.githubRestartCount,\n        githubLastError: observed.githubLastError,\n        githubRestartGraceKey: observed.githubRestartGraceKey,\n        githubRestartGraceUntil: observed.githubRestartGraceUntil,\n        tabId: observed.tabId,\n"
)

# Service worker wiring: one-shot alarm, targeted force-poll, no stale Actions send.
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''import {
  fetchLatestGithubWorkflowRun,
  hasGithubApiPermission
} from "./github-actions.js";
import {
  replaceBackgroundTab,
''',
    '''import {
  fetchLatestGithubWorkflowRun,
  hasGithubApiPermission
} from "./github-actions.js";
import {
  chatIdFromGithubRestartGraceAlarm,
  githubRestartGraceAlarmName,
  planGithubRestartAuthGrace
} from "./github-restart-grace.js";
import {
  replaceBackgroundTab,
'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void runCheck("alarm");
  if (alarm.name === GITHUB_ALARM_NAME) void runCheck("github-watchdog");
});
''',
    '''chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void runCheck("alarm");
  if (alarm.name === GITHUB_ALARM_NAME) void runCheck("github-watchdog");
  const graceChatId = chatIdFromGithubRestartGraceAlarm(alarm.name);
  if (graceChatId) void handleGithubRestartGraceAlarm(graceChatId);
});
'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '  if (source.startsWith("github-watchdog")) {\n    return performGithubWatchdog(source);\n  }\n',
    '  if (source.startsWith("github-watchdog")) {\n    return performGithubWatchdog(source, onlyChatId);\n  }\n'
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    'async function performGithubWatchdog(source) {\n',
    'async function performGithubWatchdog(source, onlyChatId = null) {\n'
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  const eligible = observedState.chats.filter((chat) => {
    if (!chat.enabled) return false;
''',
    '''  const eligible = observedState.chats.filter((chat) => {
    if (onlyChatId && chat.id !== onlyChatId) return false;
    if (!chat.enabled) return false;
'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '  const forcePoll = source === "github-watchdog-manual";\n',
    '  const forcePoll = source === "github-watchdog-manual" || source === "github-watchdog-grace";\n'
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    const firstDecision = decide(runtimeChat, freshness.snapshot, sessionId);
    runtimeChat = firstDecision.chat;

    if (firstDecision.decision === "stop-phrase-matched") {
''',
    '''    const firstDecision = decide(runtimeChat, freshness.snapshot, sessionId);
    runtimeChat = firstDecision.chat;

    if (firstDecision.decision === "not-authenticated") {
      const deferred = await deferGithubRestartForAuthWarmup({
        chat: runtimeChat,
        snapshot: freshness.snapshot,
        restartKey: stall.restartKey,
        sessionId
      });
      if (deferred) return;
    }

    if (firstDecision.decision === "stop-phrase-matched") {
'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    const preflightDecision = decide(chat, preflight.snapshot, sessionId);
    if (preflightDecision.decision === "stop-phrase-matched") {
''',
    '''    const preflightDecision = decide(chat, preflight.snapshot, sessionId);
    if (preflightDecision.decision === "not-authenticated") {
      const deferred = await deferGithubRestartForAuthWarmup({
        chat: preflightDecision.chat,
        snapshot: preflight.snapshot,
        restartKey: stall.restartKey,
        sessionId
      });
      if (deferred) return;
    }
    if (preflightDecision.decision === "stop-phrase-matched") {
'''
)
append_before(
    "chrome-extension/background/service-worker-v2.js",
    "async function persistSingleRuntimeChat(runtimeChat, expectedSessionId) {\n",
    '''async function deferGithubRestartForAuthWarmup({ chat, snapshot, restartKey, sessionId }) {
  const plan = planGithubRestartAuthGrace({
    snapshot,
    restartKey,
    existingKey: chat.githubRestartGraceKey,
    existingUntil: chat.githubRestartGraceUntil
  });
  if (!plan.defer) return false;

  const deferredChat = {
    ...chat,
    githubRestartGraceKey: String(restartKey),
    githubRestartGraceUntil: plan.until,
    lastDecision: "github-restart-warmup"
  };
  const persisted = await persistSingleRuntimeChat(deferredChat, sessionId);
  if (!persisted) return true;

  await chrome.alarms.create(githubRestartGraceAlarmName(chat.id), {
    when: Date.parse(plan.until)
  });
  await appendGithubRestartLog(
    chat.id,
    "restart отложен: новая вкладка прогревается до 60 секунд перед проверкой входа",
    "info"
  );
  return true;
}

async function handleGithubRestartGraceAlarm(chatId) {
  const state = await loadState();
  if (!state.enabled) return;
  const chat = state.chats.find((candidate) => candidate.id === chatId);
  if (!chat?.enabled || !chat.githubRestartGraceKey || !chat.githubRestartGraceUntil) return;

  const untilMs = Date.parse(chat.githubRestartGraceUntil);
  if (!Number.isFinite(untilMs)) return;
  if (Date.now() < untilMs) {
    await chrome.alarms.create(githubRestartGraceAlarmName(chatId), { when: untilMs });
    return;
  }
  await runCheck("github-watchdog-grace", false, chatId);
}

async function clearGithubRestartGraceAlarms(chats) {
  const candidates = Array.isArray(chats) ? chats : [];
  await Promise.all(candidates.map((chat) =>
    chrome.alarms.clear(githubRestartGraceAlarmName(chat.id)).catch(() => false)
  ));
}

'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  if (!state.enabled) {
    await syncPeriodicAlarm(ALARM_NAME, null);
    await syncPeriodicAlarm(GITHUB_ALARM_NAME, null);
    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }
''',
    '''  if (!state.enabled) {
    await syncPeriodicAlarm(ALARM_NAME, null);
    await syncPeriodicAlarm(GITHUB_ALARM_NAME, null);
    await clearGithubRestartGraceAlarms(state.chats);
    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }
'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  if (state.taskOnly && eligibleChats.length === 0) {
    await syncPeriodicAlarm(ALARM_NAME, null);
    await syncPeriodicAlarm(GITHUB_ALARM_NAME, null);
    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }
''',
    '''  if (state.taskOnly && eligibleChats.length === 0) {
    await syncPeriodicAlarm(ALARM_NAME, null);
    await syncPeriodicAlarm(GITHUB_ALARM_NAME, null);
    await clearGithubRestartGraceAlarms(state.chats);
    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }
'''
)

# Unit tests for pure timing planner and one-grace-per-episode rule.
grace_test = Path("tests/chrome-extension/github-restart-grace.test.mjs")
if grace_test.exists():
    raise SystemExit("github-restart-grace.test.mjs already exists")
grace_test.write_text(r'''import assert from "node:assert/strict";
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
''', encoding="utf-8")

# Dynamic service-worker harness supports one-shot absolute alarms.
replace_once(
    "tests/chrome-extension/service-worker.test.mjs",
    '''        alarms.set(name, {
          name,
          scheduledTime: Date.now() + Number(info.delayInMinutes || 0) * 60_000,
          periodInMinutes: info.periodInMinutes
        });
''',
    '''        const absoluteWhen = Number(info.when);
        alarms.set(name, {
          name,
          scheduledTime: Number.isFinite(absoluteWhen)
            ? absoluteWhen
            : Date.now() + Number(info.delayInMinutes || 0) * 60_000,
          periodInMinutes: info.periodInMinutes
        });
'''
)
replace_once(
    "tests/chrome-extension/service-worker.test.mjs",
    '''  fireAlarm(name) {
    for (const listener of alarmListeners) listener({ name });
  },
''',
    '''  fireAlarm(name) {
    const alarm = alarms.get(name);
    if (alarm && !alarm.periodInMinutes) alarms.delete(name);
    for (const listener of alarmListeners) listener({ name, scheduledTime: alarm?.scheduledTime });
  },
'''
)
append_before(
    "tests/chrome-extension/service-worker.test.mjs",
    "console.log(JSON.stringify({\n",
    r'''// 12. A newly created ChatGPT document gets one 60-second auth warm-up before watchdog retry.
const graceNow = Date.now();
const graceActivityAt = new Date(graceNow - 31 * 60_000).toISOString();
const graceAttemptAt = new Date(graceNow - 11 * 60_000).toISOString();
installState({
  profile: {
    ...model.defaultChatProfile(),
    githubWatchEnabled: true,
    githubWatchOnly: true,
    githubRepository: 'MishkaStrategy/ChatPulse',
    githubIdleMinutes: 30
  },
  githubWatchStartedAt: new Date(graceNow - 2 * 60 * 60_000).toISOString(),
  githubLastRunId: '9001',
  githubLastRunCreatedAt: new Date(graceNow - 2 * 60 * 60_000).toISOString(),
  githubLastActivityAt: graceActivityAt,
  githubLastAttemptAt: graceAttemptAt,
  githubLastCheckedAt: graceAttemptAt,
  githubActiveRunCount: 0,
  githubLastRestartKey: null,
  lastHardRefreshAt: new Date().toISOString()
}, { enabled: true, intervalMinutes: 5 });
const graceChatId = harness.data.chatpulseState.chats[0].id;
harness.tabs.clear();
harness.metrics.creates = 0;
harness.metrics.sends = 0;
harness.metrics.alarmCreatesByName = {};
let graceAuthReady = false;
const graceDocumentStartedAt = new Date().toISOString();
harness.setSendHandler(async (_id, message) => {
  if (message.type === 'CHATPULSE_INSPECT') {
    return {
      ok: true,
      snapshot: makeSnapshot({
        authenticated: graceAuthReady,
        hasComposer: graceAuthReady,
        messageCount: graceAuthReady ? 1 : 0,
        documentStartedAt: graceDocumentStartedAt
      })
    };
  }
  if (message.type === 'CHATPULSE_SEND') {
    harness.metrics.sends += 1;
    return { ok: true, outcome: 'confirmed' };
  }
  return { ok: true };
});
githubFetches = 0;
harness.setGithubFetchHandler(async () => {
  githubFetches += 1;
  return {
    ok: true,
    status: 200,
    headers: { get() { return null; } },
    async json() {
      return { workflow_runs: [{ id: 9001, created_at: new Date(graceNow - 2 * 60 * 60_000).toISOString(), status: 'completed' }] };
    }
  };
});
harness.fireAlarm('chatpulse-github-actions-watchdog');
const graceScheduleDeadline = Date.now() + 5_000;
while (!harness.data.chatpulseState?.chats?.[0]?.githubRestartGraceUntil && Date.now() < graceScheduleDeadline) {
  await new Promise((resolve) => setTimeout(resolve, 10));
}
assert.equal(harness.metrics.creates, 1, 'watchdog must create the missing background chat tab');
assert.equal(harness.metrics.sends, 0, 'fresh unauthenticated document must not receive a command');
assert.equal(githubFetches, 1);
const graceAlarmName = `chatpulse-github-restart-grace:${graceChatId}`;
const graceAlarm = harness.alarms.get(graceAlarmName);
assert.ok(graceAlarm, 'one-shot auth grace alarm must be scheduled');
const graceDelayFromDocumentStart = graceAlarm.scheduledTime - Date.parse(graceDocumentStartedAt);
assert.ok(graceDelayFromDocumentStart >= 59_000 && graceDelayFromDocumentStart <= 60_000, graceDelayFromDocumentStart);

harness.fireAlarm(graceAlarmName);
const earlyRescheduleDeadline = Date.now() + 2_000;
while ((harness.metrics.alarmCreatesByName[graceAlarmName] || 0) < 2 && Date.now() < earlyRescheduleDeadline) {
  await new Promise((resolve) => setTimeout(resolve, 10));
}
assert.equal(githubFetches, 1, 'early grace alarm must not force a GitHub read');
assert.equal(harness.metrics.sends, 0);

harness.data.chatpulseState.chats[0].githubRestartGraceUntil = new Date(Date.now() - 1).toISOString();
graceAuthReady = true;
harness.fireAlarm(graceAlarmName);
const graceSendDeadline = Date.now() + 5_000;
while (harness.metrics.sends < 1 && Date.now() < graceSendDeadline) {
  await new Promise((resolve) => setTimeout(resolve, 10));
}
assert.equal(githubFetches, 2, 'expired grace retry must revalidate GitHub Actions before sending');
assert.equal(harness.metrics.sends, 1);
assert.equal(harness.data.chatpulseState.chats[0].githubLastRestartKey, 'run:9001');
assert.equal(harness.data.chatpulseState.chats[0].githubRestartGraceKey, null);
assert.equal(harness.data.chatpulseState.chats[0].githubRestartGraceUntil, null);

'''
)
replace_once(
    "tests/chrome-extension/service-worker.test.mjs",
    "  simultaneous_alarm_serialization: 'PASS',\n  reload_count_last_scenario: harness.metrics.reloads,\n",
    "  simultaneous_alarm_serialization: 'PASS',\n  github_post_open_auth_grace: 'PASS',\n  reload_count_last_scenario: harness.metrics.reloads,\n"
)

# Model lifecycle regression for the new runtime-only grace fields.
replace_once(
    "tests/chrome-extension/github-watchdog.test.mjs",
    "  assert.equal(state.chats[0].githubActiveRunCount, 0);\n});\n",
    "  assert.equal(state.chats[0].githubActiveRunCount, 0);\n  assert.equal(state.chats[0].githubRestartGraceKey, null);\n  assert.equal(state.chats[0].githubRestartGraceUntil, null);\n});\n"
)
append_before(
    "tests/chrome-extension/github-watchdog.test.mjs",
    'test("successful empty Actions list starts its own baseline", () => {\n',
    r'''test("post-open restart grace runtime is preserved locally but cleared by activity, restart and reset", () => {
  const original = normalizeState({
    ...defaultState(),
    chats: [{
      ...createChat({ title: "A", url: "https://chatgpt.com/c/a" }),
      githubWatchStartedAt: "2026-09-05T09:00:00.000Z",
      githubLastRunId: "100",
      githubLastActivityAt: "2026-09-05T09:00:00.000Z",
      githubLastCheckedAt: "2026-09-05T09:10:00.000Z",
      githubRestartGraceKey: "run:100",
      githubRestartGraceUntil: "2026-09-05T10:01:00.000Z"
    }]
  }).chats[0];
  assert.equal(original.githubRestartGraceKey, "run:100");
  assert.equal(original.githubRestartGraceUntil, "2026-09-05T10:01:00.000Z");

  const active = recordGithubActionsObservation(original, {
    runId: "100",
    createdAt: "2026-09-05T09:00:00.000Z",
    activeRunCount: 1
  }, "2026-09-05T10:00:00.000Z");
  assert.equal(active.githubRestartGraceKey, null);
  assert.equal(active.githubRestartGraceUntil, null);

  const restarted = recordGithubRestart(original, "run:100", "2026-09-05T10:01:00.000Z");
  assert.equal(restarted.githubRestartGraceKey, null);
  assert.equal(restarted.githubRestartGraceUntil, null);

  const reset = resetGithubWatchRuntime(original);
  assert.equal(reset.githubRestartGraceKey, null);
  assert.equal(reset.githubRestartGraceUntil, null);
});

'''
)

# Portable config explicitly excludes grace runtime state.
replace_once(
    "tests/chrome-extension/github-watchdog-ui.test.mjs",
    '    githubLastRestartKey: "run:999",\n    githubRestartCount: 3,\n    githubLastError: "secret-ish runtime diagnostic"\n',
    '    githubLastRestartKey: "run:999",\n    githubRestartCount: 3,\n    githubRestartGraceKey: "run:999",\n    githubRestartGraceUntil: "2026-09-02T07:09:00.000Z",\n    githubLastError: "secret-ish runtime diagnostic"\n'
)
replace_once(
    "tests/chrome-extension/github-watchdog-ui.test.mjs",
    '    "githubActiveRunCount", "githubLastRestartAt", "githubLastRestartKey", "githubRestartCount", "githubLastError",\n',
    '    "githubActiveRunCount", "githubLastRestartAt", "githubLastRestartKey", "githubRestartCount",\n    "githubRestartGraceKey", "githubRestartGraceUntil", "githubLastError",\n'
)

# Static runtime wiring coverage.
append_before(
    "tests/chrome-extension/github-watchdog-runtime.test.mjs",
    'test("GitHub API failures are recorded and never mapped directly to a restart", () => {\n',
    r'''test("post-open auth grace is a one-shot alarm with targeted forced GitHub revalidation", () => {
  assert.match(worker, /chatpulse-github-restart-grace:/);
  assert.match(worker, /handleGithubRestartGraceAlarm/);
  assert.match(worker, /deferGithubRestartForAuthWarmup/);
  assert.match(worker, /performGithubWatchdog\(source, onlyChatId\)/);
  assert.match(worker, /if \(onlyChatId && chat\.id !== onlyChatId\) return false/);
  assert.match(worker, /source === "github-watchdog-grace"/);
  assert.match(worker, /when: Date\.parse\(plan\.until\)/);
  assert.match(worker, /githubRestartGraceKey/);
  assert.match(worker, /githubRestartGraceUntil/);
});

'''
)

# Syntax/static validator/package coverage for the new shipped module/test.
replace_once(
    "package.json",
    "node --check chrome-extension/background/service-worker-v2.js && node --check chrome-extension/background/tab-recovery.js",
    "node --check chrome-extension/background/service-worker-v2.js && node --check chrome-extension/background/github-restart-grace.js && node --check chrome-extension/background/tab-recovery.js"
)
replace_once(
    "scripts/validate_extension.mjs",
    '  "background/service-worker-v2.js",\n  "background/tab-recovery.js",\n',
    '  "background/service-worker-v2.js",\n  "background/github-restart-grace.js",\n  "background/tab-recovery.js",\n'
)
replace_once(
    "scripts/validate_extension.mjs",
    '  "github-watchdog.test.mjs",\n  "github-actions-client.test.mjs",\n',
    '  "github-watchdog.test.mjs",\n  "github-restart-grace.test.mjs",\n  "github-actions-client.test.mjs",\n'
)
replace_once(
    "scripts/validate_extension.mjs",
    'const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");\nconst tabRecovery = await readFile(path.join(extensionRoot, "background/tab-recovery.js"), "utf8");\n',
    'const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");\nconst githubRestartGrace = await readFile(path.join(extensionRoot, "background/github-restart-grace.js"), "utf8");\nconst tabRecovery = await readFile(path.join(extensionRoot, "background/tab-recovery.js"), "utf8");\n'
)
append_before(
    "scripts/validate_extension.mjs",
    "// 0.7.2 private-repository credential boundary.\n",
    r'''// 0.7.4 post-open authentication grace remains bounded and fail-closed.
for (const token of [
  "GITHUB_RESTART_GRACE_MS = 60_000",
  "GITHUB_RESTART_GRACE_ALARM_PREFIX",
  "planGithubRestartAuthGrace",
  "grace-expired"
]) {
  assert.ok(githubRestartGrace.includes(token), `GitHub auth-grace module missing ${token}`);
}
for (const token of [
  "handleGithubRestartGraceAlarm",
  "deferGithubRestartForAuthWarmup",
  'source === "github-watchdog-grace"',
  "performGithubWatchdog(source, onlyChatId)",
  "githubRestartGraceKey",
  "githubRestartGraceUntil"
]) {
  assert.ok(background.includes(token), `Service worker missing auth-grace invariant: ${token}`);
}
assert.ok(background.includes("if (onlyChatId && chat.id !== onlyChatId) return false"));
assert.ok(background.includes("when: Date.parse(plan.until)"));

'''
)
replace_once(
    "scripts/validate_extension.mjs",
    "independent GitHub Actions scheduler, Actions-only mode, fail-closed watchdog",
    "independent GitHub Actions scheduler, Actions-only mode, 60-second post-open auth grace, fail-closed watchdog"
)

# Changelog documents the exact user-visible race fix.
replace_once(
    "CHANGELOG.md",
    "- serialize simultaneous ordinary and GitHub scheduler triggers so a later trigger is queued with its own source/parameters instead of being dropped behind an active check;\n",
    "- serialize simultaneous ordinary and GitHub scheduler triggers so a later trigger is queued with its own source/parameters instead of being dropped behind an active check;\n- treat a fresh ChatGPT document that temporarily reports unauthenticated as a 60-second warm-up, then retry through a one-shot alarm with a fresh GitHub Actions read before any restart send;\n"
)
