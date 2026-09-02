from pathlib import Path

ROOT = Path('.')
path = ROOT / 'chrome-extension/background/service-worker-v2.js'
text = path.read_text(encoding='utf-8')


def once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    text = text.replace(old, new, 1)

once(
'''  effectiveChatProfile,\n  hasCompletionGuard,\n  isChatDue,\n''',
'''  effectiveChatProfile,\n  GITHUB_POLL_INTERVAL_MINUTES,\n  githubWatchdogDecision,\n  hasCompletionGuard,\n  isChatDue,\n  MAX_GITHUB_WATCHED_REPOSITORIES,\n''',
'import watchdog constants'
)
once(
'''  mergeRuntimeState,\n  normalizeChatProfile,\n  normalizeChatURL,\n''',
'''  mergeRuntimeState,\n  normalizeChatProfile,\n  normalizeChatURL,\n  normalizeGithubRepository,\n''',
'import github normalization'
)
once(
'''  prepareChatRun,\n  recordDispatch,\n  recordRecovery,\n  scheduleNextChatCheck,\n''',
'''  prepareChatRun,\n  recordDispatch,\n  recordGithubActionsObservation,\n  recordGithubRestart,\n  recordGithubWatchError,\n  recordRecovery,\n  resetGithubWatchRuntime,\n  scheduleNextChatCheck,\n  shouldPollGithubRepository,\n''',
'import watchdog state functions'
)
once(
'''import {\n  attachTelegramState,\n  notifyTelegramEvent,\n  sendTelegramTest,\n  updateTelegramConfig\n} from "./telegram.js";\n''',
'''import {\n  attachTelegramState,\n  notifyTelegramEvent,\n  sendTelegramTest,\n  updateTelegramConfig\n} from "./telegram.js";\nimport {\n  fetchLatestGithubWorkflowRun,\n  hasGithubApiPermission\n} from "./github-actions.js";\n''',
'import github client'
)
once(
'''const ALARM_NAME = "chatpulse-monitor";\n''',
'''const ALARM_NAME = "chatpulse-monitor";\nconst GITHUB_ALARM_NAME = "chatpulse-github-actions-watchdog";\n''',
'github alarm name'
)
once(
'''chrome.alarms.onAlarm.addListener((alarm) => {\n  if (alarm.name === ALARM_NAME) void runCheck("alarm");\n});\n''',
'''chrome.alarms.onAlarm.addListener((alarm) => {\n  if (alarm.name === ALARM_NAME) void runCheck("alarm");\n  if (alarm.name === GITHUB_ALARM_NAME) void runCheck("github-watchdog");\n});\n''',
'github alarm listener'
)
once(
'''      void runCheck("start");\n      return { state };\n''',
'''      void runCheck("start").then(() => runCheck("github-watchdog-start"));\n      return { state };\n''',
'start watchdog chain'
)
once(
'''    case "CHECK_NOW":\n      await runCheck("manual", true);\n      return { state: await loadState() };\n''',
'''    case "CHECK_NOW":\n      await runCheck("manual", true);\n      await runCheck("github-watchdog-manual");\n      return { state: await loadState() };\n''',
'manual watchdog check'
)
old_profile = '''    case "UPDATE_CHAT_PROFILE":\n      return { state: await mutateChat(message.chatId, (state, index) => {\n        const current = state.chats[index];\n        const profile = normalizeChatProfile({\n          ...current.profile,\n          ...(message.profile || {})\n        });\n        const candidate = {\n          ...current,\n          profile,\n          controlRevision: Number(current.controlRevision || 0) + 1,\n          nextEligibleAt: null\n        };\n        if (candidate.taskActive && !hasCompletionGuard(effectiveChatProfile(state, candidate))) {\n          throw new Error("Активная задача должна иметь стоп-фразу, лимит продолжений или лимит времени.");\n        }\n        state.chats[index] = candidate;\n        return appendLog(state, "info", `Профиль «${current.title}» обновлён`);\n      }) };\n'''
new_profile = '''    case "UPDATE_CHAT_PROFILE": {\n      const state = await updateChatProfile(message.chatId, message.profile || {});\n      const chat = state.chats.find((candidate) => candidate.id === message.chatId);\n      if (state.enabled && chat && effectiveChatProfile(state, chat).githubWatchEnabled) {\n        void runCheck("github-watchdog-profile");\n      }\n      return { state };\n    }\n'''
once(old_profile, new_profile, 'profile update case')
once(
'''      void runCheck("task-start", false, selectedChatId);\n      return { state };\n''',
'''      void runCheck("task-start", false, selectedChatId)\n        .then(() => runCheck("github-watchdog-task-start"));\n      return { state };\n''',
'task watchdog chain'
)
once(
'''      let state = applyPortableConfig(message.config);\n      state = appendLog(state, "info", "Портативная конфигурация импортирована; мониторинг оставлен остановленным для безопасного baseline");\n      await chrome.alarms.clear(ALARM_NAME);\n''',
'''      let state = applyPortableConfig(message.config);\n      assertGithubWatchCapacity(state);\n      state = appendLog(state, "info", "Портативная конфигурация импортирована; мониторинг оставлен остановленным для безопасного baseline");\n      await chrome.alarms.clear(ALARM_NAME);\n      await chrome.alarms.clear(GITHUB_ALARM_NAME);\n''',
'import watchdog validation'
)

insert_after_mutate = '''async function mutateChat(chatId, mutator) {\n  let state = await loadState();\n  const index = state.chats.findIndex((chat) => chat.id === chatId);\n  if (index < 0) throw new Error("Чат не найден.");\n  state = mutator(state, index) || state;\n  state = await configureAlarm(state);\n  await persistAndPublish(state);\n  return state;\n}\n'''
update_profile_fn = insert_after_mutate + '''\nasync function updateChatProfile(chatId, profilePatch) {\n  let state = await loadState();\n  const index = state.chats.findIndex((chat) => chat.id === chatId);\n  if (index < 0) throw new Error("Чат не найден.");\n\n  const current = state.chats[index];\n  const requestedProfile = { ...current.profile, ...(profilePatch || {}) };\n  if (requestedProfile.githubWatchEnabled === true && !normalizeGithubRepository(requestedProfile.githubRepository)) {\n    throw new Error("Для GitHub Actions watchdog укажите repository в формате owner/repo.");\n  }\n  const profile = normalizeChatProfile(requestedProfile);\n  const previousProfile = normalizeChatProfile(current.profile);\n  const watchdogChanged = previousProfile.githubWatchEnabled !== profile.githubWatchEnabled\n    || previousProfile.githubRepository !== profile.githubRepository\n    || previousProfile.githubIdleMinutes !== profile.githubIdleMinutes;\n\n  let candidate = {\n    ...current,\n    profile,\n    controlRevision: Number(current.controlRevision || 0) + 1,\n    nextEligibleAt: null\n  };\n  if (watchdogChanged) candidate = resetGithubWatchRuntime(candidate);\n  if (candidate.taskActive && !hasCompletionGuard(effectiveChatProfile(state, candidate))) {\n    throw new Error("Активная задача должна иметь стоп-фразу, лимит продолжений или лимит времени.");\n  }\n  state.chats[index] = candidate;\n  assertGithubWatchCapacity(state);\n  state = appendLog(state, "info", `Профиль «${current.title}» обновлён`);\n  state = await configureAlarm(state);\n  await persistAndPublish(state);\n  return state;\n}\n\nfunction assertGithubWatchCapacity(state) {\n  const repositories = new Set();\n  for (const chat of state.chats) {\n    const profile = effectiveChatProfile(state, chat);\n    if (profile.githubWatchEnabled && profile.githubRepository) repositories.add(profile.githubRepository);\n  }\n  if (repositories.size > MAX_GITHUB_WATCHED_REPOSITORIES) {\n    throw new Error(`GitHub Actions watchdog поддерживает не более ${MAX_GITHUB_WATCHED_REPOSITORIES} уникальных repositories.`);\n  }\n}\n'''
once(insert_after_mutate, update_profile_fn, 'profile update helper')

once(
'''async function performCheck(source, allowWhenStopped, onlyChatId = null) {\n  let observedState = await loadState();\n''',
'''async function performCheck(source, allowWhenStopped, onlyChatId = null) {\n  if (source.startsWith("github-watchdog")) {\n    return performGithubWatchdog(source);\n  }\n  let observedState = await loadState();\n''',
'route watchdog source'
)

marker = 'async function persistRunStartCheckpoint(runtimeChat) {\n'
watchdog_runtime = r'''async function performGithubWatchdog(source) {
  let observedState = await loadState();
  if (!observedState.enabled) return;

  const eligible = observedState.chats.filter((chat) => {
    if (!chat.enabled) return false;
    if (observedState.taskOnly && !chat.taskActive) return false;
    const profile = effectiveChatProfile(observedState, chat);
    return profile.githubWatchEnabled && Boolean(profile.githubRepository);
  });
  if (!eligible.length) return;

  const groups = new Map();
  for (const chat of eligible) {
    const profile = effectiveChatProfile(observedState, chat);
    const list = groups.get(profile.githubRepository) || [];
    list.push(chat.id);
    groups.set(profile.githubRepository, list);
  }
  if (groups.size > MAX_GITHUB_WATCHED_REPOSITORIES) {
    observedState = appendLog(observedState, "error", `GitHub Actions watchdog остановлен: превышен лимит ${MAX_GITHUB_WATCHED_REPOSITORIES} repositories`);
    const latest = await loadState();
    const merged = mergeRuntimeState({ ...observedState, lastCheckAt: latest.lastCheckAt }, latest);
    await persistAndPublish(merged);
    return;
  }

  const forcePoll = source === "github-watchdog-manual";
  const permissionGranted = await hasGithubApiPermission();
  const now = new Date().toISOString();
  let touched = false;

  for (const [repository, chatIds] of groups) {
    const groupChats = chatIds
      .map((id) => observedState.chats.find((chat) => chat.id === id))
      .filter(Boolean);
    if (!forcePoll && !groupChats.some((chat) => shouldPollGithubRepository(chat))) continue;

    touched = true;
    if (!permissionGranted) {
      for (const chatId of chatIds) {
        const index = observedState.chats.findIndex((chat) => chat.id === chatId);
        if (index >= 0) {
          observedState.chats[index] = recordGithubWatchError(
            observedState.chats[index],
            "Chrome не выдал optional access к api.github.com.",
            now
          );
        }
      }
      observedState = appendLog(observedState, "warning", `${repository}: GitHub Actions watchdog ждёт optional permission`);
      continue;
    }

    try {
      const activity = await fetchLatestGithubWorkflowRun(repository);
      for (const chatId of chatIds) {
        const index = observedState.chats.findIndex((chat) => chat.id === chatId);
        if (index >= 0) {
          observedState.chats[index] = recordGithubActionsObservation(
            observedState.chats[index],
            activity,
            now
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      for (const chatId of chatIds) {
        const index = observedState.chats.findIndex((chat) => chat.id === chatId);
        if (index >= 0) observedState.chats[index] = recordGithubWatchError(observedState.chats[index], message, now);
      }
      observedState = appendLog(observedState, "warning", `${repository}: ${message}`);
    }
  }

  if (!touched) return;
  const latestAfterFetch = await loadState();
  let merged = mergeRuntimeState({ ...observedState, lastCheckAt: latestAfterFetch.lastCheckAt }, latestAfterFetch);
  merged = await configureAlarm(merged);
  await persistAndPublish(merged);

  const restartIds = merged.chats
    .filter((chat) => {
      if (!chat.enabled || (merged.taskOnly && !chat.taskActive)) return false;
      const profile = effectiveChatProfile(merged, chat);
      return profile.githubWatchEnabled
        && githubWatchdogDecision(chat, profile.githubIdleMinutes).decision === "restart";
    })
    .map((chat) => chat.id);

  for (const chatId of restartIds) {
    await attemptGithubWatchdogRestart(chatId);
  }
}

async function attemptGithubWatchdogRestart(chatId) {
  let state = await loadState();
  if (!state.enabled) return;
  let index = state.chats.findIndex((chat) => chat.id === chatId);
  if (index < 0) return;
  let chat = state.chats[index];
  if (!chat.enabled || (state.taskOnly && !chat.taskActive)) return;

  let profile = effectiveChatProfile(state, chat);
  if (!profile.githubWatchEnabled || !profile.githubRepository) return;
  const stall = githubWatchdogDecision(chat, profile.githubIdleMinutes);
  if (stall.decision !== "restart" || !stall.restartKey) return;

  const guard = completionGuardReason(chat, profile);
  if (guard) {
    state.chats[index] = applyCompletion(chat, guard);
    state = appendLog(state, "info", `${chat.title}: ${completionDescription(guard)}`);
    state = await notifyChatEvent(state, state.chats[index], guard);
    state = await configureAlarm(state);
    await persistAndPublish(state);
    return;
  }

  const sessionId = state.sessionId;
  const controlRevision = Number(chat.controlRevision || 0);
  try {
    let tab = await ensureChatTab(chat);
    const freshness = await obtainFreshSnapshot({
      tab,
      chat,
      intervalMinutes: profile.intervalMinutes,
      stopPhrase: profile.stopPhrase,
      allowPeriodicRefresh: false
    });
    tab = freshness.tab;
    let runtimeChat = { ...chat, tabId: tab.id ?? null };
    if (freshness.recoveryReason) runtimeChat = recordRecovery(runtimeChat, freshness.recoveryReason);
    const firstDecision = decide(runtimeChat, freshness.snapshot, sessionId);
    runtimeChat = firstDecision.chat;

    if (firstDecision.decision === "stop-phrase-matched") {
      if (await persistSingleRuntimeChat(runtimeChat, sessionId)) {
        const stopped = await loadState();
        const stoppedChat = stopped.chats.find((candidate) => candidate.id === chatId);
        if (stoppedChat) {
          const notified = await notifyChatEvent(stopped, stoppedChat, "stop-phrase");
          await persistAndPublish(await configureAlarm(notified));
        }
      }
      return;
    }

    if (freshness.snapshot?.hasDraft === true) {
      await persistSingleRuntimeChat({ ...runtimeChat, lastDecision: "github-restart-user-draft" }, sessionId);
      await appendGithubRestartLog(chatId, "restart отложен: в поле ввода есть пользовательский черновик", "info");
      return;
    }
    if (!["send-continuation", "already-continued"].includes(firstDecision.decision)) {
      await persistSingleRuntimeChat(runtimeChat, sessionId);
      await appendGithubRestartLog(chatId, `restart отложен: ${decisionDescription(firstDecision.decision)}`, "info");
      return;
    }

    state = await loadState();
    index = state.chats.findIndex((candidate) => candidate.id === chatId);
    if (index < 0) return;
    chat = state.chats[index];
    profile = effectiveChatProfile(state, chat);
    const stillSameControl = Number(chat.controlRevision || 0) === controlRevision;
    const stillSameSession = state.sessionId === sessionId;
    const stillEligible = state.enabled && chat.enabled && (!state.taskOnly || chat.taskActive)
      && profile.githubWatchEnabled;
    const liveStall = githubWatchdogDecision(chat, profile.githubIdleMinutes);
    if (!stillSameControl || !stillSameSession || !stillEligible || liveStall.restartKey !== stall.restartKey
        || liveStall.decision !== "restart") {
      return;
    }

    const liveGuard = completionGuardReason(chat, profile);
    if (liveGuard) {
      state.chats[index] = applyCompletion(chat, liveGuard);
      state = appendLog(state, "info", `${chat.title}: ${completionDescription(liveGuard)}`);
      state = await notifyChatEvent(state, state.chats[index], liveGuard);
      await persistAndPublish(await configureAlarm(state));
      return;
    }

    const preflight = await obtainFreshSnapshot({
      tab: await chrome.tabs.get(tab.id),
      chat,
      intervalMinutes: profile.intervalMinutes,
      stopPhrase: profile.stopPhrase,
      allowPeriodicRefresh: false
    });
    if (preflight.snapshot?.hasDraft === true) {
      await appendGithubRestartLog(chatId, "restart отложен после preflight: обнаружен пользовательский черновик", "info");
      return;
    }
    const preflightDecision = decide(chat, preflight.snapshot, sessionId);
    if (preflightDecision.decision === "stop-phrase-matched") {
      if (await persistSingleRuntimeChat(preflightDecision.chat, sessionId)) {
        const stopped = await loadState();
        const stoppedChat = stopped.chats.find((candidate) => candidate.id === chatId);
        if (stoppedChat) {
          const notified = await notifyChatEvent(stopped, stoppedChat, "stop-phrase");
          await persistAndPublish(await configureAlarm(notified));
        }
      }
      return;
    }
    if (!["send-continuation", "already-continued"].includes(preflightDecision.decision)) {
      await persistSingleRuntimeChat(preflightDecision.chat, sessionId);
      await appendGithubRestartLog(chatId, `restart отменён после preflight: ${decisionDescription(preflightDecision.decision)}`, "info");
      return;
    }

    const fingerprint = String(preflight.snapshot?.latestFingerprint || "");
    if (!fingerprint) return;
    const response = await sendToContent(preflight.tab.id, {
      type: "CHATPULSE_SEND",
      command: profile.commandText
    }, { attempts: 2, timeoutMs: 15_000 });
    if (!response?.ok) throw new Error(response?.error || "Команда watchdog restart не отправлена.");

    const outcome = response.outcome === "confirmed" ? "confirmed" : "submitted-unconfirmed";
    runtimeChat = recordDispatch(preflightDecision.chat, fingerprint, outcome);
    runtimeChat = recordGithubRestart(runtimeChat, stall.restartKey);
    const checkpoint = await persistDispatchCheckpoint(runtimeChat);

    let latest = await loadState();
    const persistedChat = latest.chats.find((candidate) => candidate.id === chatId) || checkpoint.chat;
    latest = appendLog(
      latest,
      outcome === "confirmed" ? "info" : "warning",
      `GitHub Actions stall: restart-команда отправлена в «${persistedChat.title}» · ${persistedChat.profile?.githubRepository || profile.githubRepository} · продолжение ${persistedChat.continuationCount}`
    );
    latest = await notifyChatEvent(latest, persistedChat, "continuation", outcome);
    if (checkpoint.guard) {
      latest = appendLog(latest, "info", `${persistedChat.title}: ${completionDescription(checkpoint.guard)}`);
      latest = await notifyChatEvent(latest, persistedChat, checkpoint.guard);
    }
    await persistAndPublish(await configureAlarm(latest));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await appendGithubRestartLog(chatId, `GitHub Actions stall restart не выполнен: ${message}`, "warning");
  }
}

async function persistSingleRuntimeChat(runtimeChat, expectedSessionId) {
  const latest = await loadState();
  if (latest.sessionId !== expectedSessionId) return false;
  const index = latest.chats.findIndex((chat) => chat.id === runtimeChat.id);
  if (index < 0) return false;
  if (Number(latest.chats[index].controlRevision || 0) !== Number(runtimeChat.controlRevision || 0)) return false;
  const observed = {
    ...latest,
    lastCheckAt: latest.lastCheckAt,
    chats: latest.chats.map((chat, chatIndex) => chatIndex === index ? runtimeChat : chat)
  };
  await saveState(mergeRuntimeState(observed, latest));
  return true;
}

async function appendGithubRestartLog(chatId, message, level = "info") {
  let latest = await loadState();
  const chat = latest.chats.find((candidate) => candidate.id === chatId);
  latest = appendLog(latest, level, `${chat?.title || "Чат"}: ${message}`);
  await persistAndPublish(latest);
}

'''
once(marker, watchdog_runtime + marker, 'watchdog runtime functions')

old_alarm = '''async function configureAlarm(state) {\n  await chrome.alarms.clear(ALARM_NAME);\n  const globalInterval = clampInterval(state.intervalMinutes);\n  if (!state.enabled) {\n    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };\n  }\n\n  const eligibleChats = state.chats.filter((chat) => chat.enabled && (!state.taskOnly || chat.taskActive));\n  if (state.taskOnly && eligibleChats.length === 0) {\n    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };\n  }\n  const enabledIntervals = eligibleChats\n    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);\n  const alarmInterval = enabledIntervals.length\n    ? Math.min(...enabledIntervals)\n    : globalInterval;\n  await chrome.alarms.create(ALARM_NAME, {\n    delayInMinutes: alarmInterval,\n    periodInMinutes: alarmInterval\n  });\n  return {\n    ...state,\n    intervalMinutes: globalInterval,\n    nextCheckAt: new Date(Date.now() + alarmInterval * 60_000).toISOString()\n  };\n}\n'''
new_alarm = '''async function configureAlarm(state) {\n  await chrome.alarms.clear(ALARM_NAME);\n  await chrome.alarms.clear(GITHUB_ALARM_NAME);\n  const globalInterval = clampInterval(state.intervalMinutes);\n  if (!state.enabled) {\n    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };\n  }\n\n  const eligibleChats = state.chats.filter((chat) => chat.enabled && (!state.taskOnly || chat.taskActive));\n  if (state.taskOnly && eligibleChats.length === 0) {\n    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };\n  }\n  const enabledIntervals = eligibleChats\n    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);\n  const alarmInterval = enabledIntervals.length\n    ? Math.min(...enabledIntervals)\n    : globalInterval;\n  await chrome.alarms.create(ALARM_NAME, {\n    delayInMinutes: alarmInterval,\n    periodInMinutes: alarmInterval\n  });\n\n  const watchedRepositories = new Set(eligibleChats\n    .map((chat) => effectiveChatProfile(state, chat))\n    .filter((profile) => profile.githubWatchEnabled && profile.githubRepository)\n    .map((profile) => profile.githubRepository));\n  if (watchedRepositories.size > 0 && watchedRepositories.size <= MAX_GITHUB_WATCHED_REPOSITORIES) {\n    await chrome.alarms.create(GITHUB_ALARM_NAME, {\n      delayInMinutes: GITHUB_POLL_INTERVAL_MINUTES,\n      periodInMinutes: GITHUB_POLL_INTERVAL_MINUTES\n    });\n  }\n\n  return {\n    ...state,\n    intervalMinutes: globalInterval,\n    nextCheckAt: new Date(Date.now() + alarmInterval * 60_000).toISOString()\n  };\n}\n'''
once(old_alarm, new_alarm, 'configure GitHub alarm')

path.write_text(text, encoding='utf-8')

runtime_test = ROOT / 'tests/chrome-extension/github-watchdog-runtime.test.mjs'
runtime_test.write_text(r'''import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workerPath = fileURLToPath(new URL("../../chrome-extension/background/service-worker-v2.js", import.meta.url));
const worker = await readFile(workerPath, "utf8");

test("GitHub watchdog uses a distinct alarm but the shared activeCheck serialization", () => {
  assert.match(worker, /chatpulse-github-actions-watchdog/);
  assert.match(worker, /if \(source\.startsWith\("github-watchdog"\)\)/);
  assert.match(worker, /activeCheck = performCheck/);
});

test("GitHub API failures are recorded and never mapped directly to a restart", () => {
  const start = worker.indexOf("async function performGithubWatchdog");
  const end = worker.indexOf("async function attemptGithubWatchdogRestart", start);
  const block = worker.slice(start, end);
  assert.ok(block.includes("recordGithubWatchError"));
  assert.ok(block.includes("fetchLatestGithubWorkflowRun"));
  assert.ok(block.includes("githubWatchdogDecision"));
  const catchIndex = block.indexOf("} catch (error)");
  const restartIndex = block.indexOf("attemptGithubWatchdogRestart");
  assert.ok(catchIndex >= 0);
  assert.equal(restartIndex, -1, "fetch loop must persist observations before invoking restart attempts");
});

test("watchdog restart preserves run counters and uses durable dispatch checkpoint", () => {
  const start = worker.indexOf("async function attemptGithubWatchdogRestart");
  const end = worker.indexOf("async function persistSingleRuntimeChat", start);
  const block = worker.slice(start, end);
  assert.equal(block.includes("startChatRun("), false, "watchdog restart must not reset runStartedAt/counter");
  assert.ok(block.includes("completionGuardReason"));
  assert.ok(block.includes("hasDraft"));
  assert.ok(block.includes('"already-continued"'));
  assert.ok(block.includes("recordDispatch("));
  assert.ok(block.includes("recordGithubRestart("));
  assert.ok(block.includes("persistDispatchCheckpoint("));
  assert.ok(block.indexOf("recordGithubRestart(") < block.indexOf("persistDispatchCheckpoint("));
});

test("live watchdog send gate requires same session, control revision and master engine", () => {
  const start = worker.indexOf("async function attemptGithubWatchdogRestart");
  const end = worker.indexOf("async function persistSingleRuntimeChat", start);
  const block = worker.slice(start, end);
  assert.ok(block.includes("stillSameControl"));
  assert.ok(block.includes("stillSameSession"));
  assert.ok(block.includes("state.enabled && chat.enabled"));
  assert.ok(block.includes("liveStall.restartKey !== stall.restartKey"));
});

test("configured GitHub repositories are deduplicated and bounded", () => {
  assert.ok(worker.includes("const groups = new Map()"));
  assert.ok(worker.includes("MAX_GITHUB_WATCHED_REPOSITORIES"));
  assert.ok(worker.includes("assertGithubWatchCapacity(state)"));
});
''', encoding='utf-8')

print('Applied ChatPulse 0.7.0 GitHub watchdog runtime patch.')
