#!/usr/bin/env python3
from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, got {count}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def append_before(path, marker, addition):
    replace_once(path, marker, addition + marker)


# Model: additive per-chat GitHub-only mode, default-off and valid only with a configured watcher.
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubWatchEnabled: false,\n    githubRepository: null,\n",
    "    githubWatchEnabled: false,\n    githubWatchOnly: false,\n    githubRepository: null,\n",
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubWatchEnabled: raw?.githubWatchEnabled === true && Boolean(normalizeGithubRepository(raw?.githubRepository)),\n    githubRepository: normalizeGithubRepository(raw?.githubRepository),\n",
    "    githubWatchEnabled: raw?.githubWatchEnabled === true && Boolean(normalizeGithubRepository(raw?.githubRepository)),\n    githubWatchOnly: raw?.githubWatchEnabled === true\n      && Boolean(normalizeGithubRepository(raw?.githubRepository))\n      && raw?.githubWatchOnly === true,\n    githubRepository: normalizeGithubRepository(raw?.githubRepository),\n",
)
replace_once(
    "chrome-extension/lib/model-v2.js",
    "    githubWatchEnabled: profile.githubWatchEnabled,\n    githubRepository: profile.githubRepository,\n",
    "    githubWatchEnabled: profile.githubWatchEnabled,\n    githubWatchOnly: profile.githubWatchOnly,\n    githubRepository: profile.githubRepository,\n",
)

# Service worker: GitHub-only chats skip only automatic ordinary checks, not manual/task-start checks.
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    "    if (onlyChatId && chat.id !== onlyChatId) continue;\n    if (!chat.enabled) continue;\n    if (observedState.taskOnly && !chat.taskActive && !allowWhenStopped) continue;\n    if (!bypassSchedule && !isChatDue(chat)) continue;\n\n    let profile = effectiveChatProfile(observedState, chat);\n    chat = prepareChatRun(chat);\n",
    "    if (onlyChatId && chat.id !== onlyChatId) continue;\n    if (!chat.enabled) continue;\n    if (observedState.taskOnly && !chat.taskActive && !allowWhenStopped) continue;\n\n    let profile = effectiveChatProfile(observedState, chat);\n    const automaticOrdinaryCheck = source === \"alarm\" || source === \"start\";\n    if (profile.githubWatchOnly && automaticOrdinaryCheck) continue;\n    if (!bypassSchedule && !isChatDue(chat)) continue;\n\n    chat = prepareChatRun(chat);\n",
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    "      observedState.chats[index] = scheduleNextChatCheck(\n        result.chat,\n        profile.intervalMinutes\n      );\n",
    "      observedState.chats[index] = scheduleOrdinaryNextCheck(result.chat, profile);\n",
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    "      observedState.chats[index] = scheduleNextChatCheck(\n        preflightDecision.chat,\n        profile.intervalMinutes\n      );\n",
    "      observedState.chats[index] = scheduleOrdinaryNextCheck(preflightDecision.chat, profile);\n",
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    "      observedState.chats[index] = scheduleNextChatCheck({\n        ...observedState.chats[index],\n        lastDecision: \"error\",\n        lastError: message\n      }, profile.intervalMinutes);\n",
    "      observedState.chats[index] = scheduleOrdinaryNextCheck({\n        ...observedState.chats[index],\n        lastDecision: \"error\",\n        lastError: message\n      }, profile);\n",
)

old_alarm = '''async function configureAlarm(state) {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.clear(GITHUB_ALARM_NAME);
  const globalInterval = clampInterval(state.intervalMinutes);
  if (!state.enabled) {
    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }

  const eligibleChats = state.chats.filter((chat) => chat.enabled && (!state.taskOnly || chat.taskActive));
  if (state.taskOnly && eligibleChats.length === 0) {
    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }
  const enabledIntervals = eligibleChats
    .map((chat) => effectiveChatProfile(state, chat).intervalMinutes);
  const alarmInterval = enabledIntervals.length
    ? Math.min(...enabledIntervals)
    : globalInterval;
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: alarmInterval,
    periodInMinutes: alarmInterval
  });

  const watchedRepositories = new Set(eligibleChats
    .map((chat) => effectiveChatProfile(state, chat))
    .filter((profile) => profile.githubWatchEnabled && profile.githubRepository)
    .map((profile) => profile.githubRepository));
  if (watchedRepositories.size > 0 && watchedRepositories.size <= MAX_GITHUB_WATCHED_REPOSITORIES) {
    await chrome.alarms.create(GITHUB_ALARM_NAME, {
      delayInMinutes: GITHUB_POLL_INTERVAL_MINUTES,
      periodInMinutes: GITHUB_POLL_INTERVAL_MINUTES
    });
  }

  return {
    ...state,
    intervalMinutes: globalInterval,
    nextCheckAt: new Date(Date.now() + alarmInterval * 60_000).toISOString()
  };
}
'''
new_alarm = '''function scheduleOrdinaryNextCheck(chat, profile) {
  if (profile?.githubWatchOnly) return { ...chat, nextEligibleAt: null };
  return scheduleNextChatCheck(chat, profile.intervalMinutes);
}

async function syncPeriodicAlarm(name, intervalMinutes) {
  const desiredInterval = Number(intervalMinutes);
  const shouldRun = Number.isFinite(desiredInterval) && desiredInterval > 0;
  const existing = await chrome.alarms.get(name);
  if (!shouldRun) {
    if (existing) await chrome.alarms.clear(name);
    return null;
  }
  if (existing && Number(existing.periodInMinutes) === desiredInterval) return existing;
  if (existing) await chrome.alarms.clear(name);
  await chrome.alarms.create(name, {
    delayInMinutes: desiredInterval,
    periodInMinutes: desiredInterval
  });
  return chrome.alarms.get(name);
}

async function configureAlarm(state) {
  const globalInterval = clampInterval(state.intervalMinutes);
  if (!state.enabled) {
    await syncPeriodicAlarm(ALARM_NAME, null);
    await syncPeriodicAlarm(GITHUB_ALARM_NAME, null);
    return { ...state, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }

  const eligibleChats = state.chats.filter((chat) => chat.enabled && (!state.taskOnly || chat.taskActive));
  if (state.taskOnly && eligibleChats.length === 0) {
    await syncPeriodicAlarm(ALARM_NAME, null);
    await syncPeriodicAlarm(GITHUB_ALARM_NAME, null);
    return { ...state, enabled: false, taskOnly: false, intervalMinutes: globalInterval, nextCheckAt: null };
  }

  const profiles = eligibleChats.map((chat) => effectiveChatProfile(state, chat));
  const intervalProfiles = profiles.filter((profile) => !profile.githubWatchOnly);
  const alarmInterval = intervalProfiles.length
    ? Math.min(...intervalProfiles.map((profile) => profile.intervalMinutes))
    : null;
  const normalAlarm = await syncPeriodicAlarm(ALARM_NAME, alarmInterval);

  const watchedRepositories = new Set(profiles
    .filter((profile) => profile.githubWatchEnabled && profile.githubRepository)
    .map((profile) => profile.githubRepository));
  const githubInterval = watchedRepositories.size > 0
    && watchedRepositories.size <= MAX_GITHUB_WATCHED_REPOSITORIES
    ? GITHUB_POLL_INTERVAL_MINUTES
    : null;
  await syncPeriodicAlarm(GITHUB_ALARM_NAME, githubInterval);

  const scheduledTime = Number(normalAlarm?.scheduledTime);
  const nextCheckAt = Number.isFinite(scheduledTime)
    ? new Date(scheduledTime).toISOString()
    : alarmInterval
      ? new Date(Date.now() + alarmInterval * 60_000).toISOString()
      : null;
  return {
    ...state,
    intervalMinutes: globalInterval,
    nextCheckAt
  };
}
'''
replace_once("chrome-extension/background/service-worker-v2.js", old_alarm, new_alarm)

# Control Center: explicit Actions-only toggle.
replace_once(
    "chrome-extension/options/options.html",
    "            <div class=\"field-row\">\n              <label class=\"field profile-wide\">\n                <span>GitHub token · только для private repository</span>\n",
    "            <label class=\"toggle-line\">\n              <input class=\"profile-github-watch-only\" type=\"checkbox\">\n              <span>Только GitHub Actions</span>\n            </label>\n            <p class=\"integration-note\">Обычный автоматический интервал для этого чата будет отключён. GitHub Actions watchdog продолжит проверять repository независимо примерно каждые 10 минут; «Проверить сейчас» остаётся доступно вручную.</p>\n            <div class=\"field-row\">\n              <label class=\"field profile-wide\">\n                <span>GitHub token · только для private repository</span>\n",
)

replace_once(
    "chrome-extension/options/options.js",
    "    const githubWatchEnabled = row.querySelector(\".profile-github-watch-enabled\");\n    const githubRepository = row.querySelector(\".profile-github-repository\");\n",
    "    const githubWatchEnabled = row.querySelector(\".profile-github-watch-enabled\");\n    const githubWatchOnly = row.querySelector(\".profile-github-watch-only\");\n    const githubRepository = row.querySelector(\".profile-github-repository\");\n",
)
replace_once(
    "chrome-extension/options/options.js",
    "    githubWatchEnabled.checked = draft.githubWatchEnabled;\n    githubRepository.value = draft.githubRepository || \"\";\n",
    "    githubWatchEnabled.checked = draft.githubWatchEnabled;\n    githubWatchOnly.checked = draft.githubWatchOnly;\n    githubRepository.value = draft.githubRepository || \"\";\n",
)
replace_once(
    "chrome-extension/options/options.js",
    '''    const capture = () => {
      const nextDraft = readProfileDraft(row);
      profileDrafts.set(chat.id, nextDraft);
      stop.disabled = nextDraft.stopMode !== "custom";
      githubRepository.disabled = !nextDraft.githubWatchEnabled;
      githubIdle.disabled = !nextDraft.githubWatchEnabled;
    };
    githubRepository.disabled = !draft.githubWatchEnabled;
    githubIdle.disabled = !draft.githubWatchEnabled;
    for (const control of [command, interval, stopMode, stop, maxContinuations, maxRuntime, githubWatchEnabled, githubRepository, githubIdle, telegramNotify]) {
''',
    '''    const capture = () => {
      const nextDraft = readProfileDraft(row);
      if (!nextDraft.githubWatchEnabled) nextDraft.githubWatchOnly = false;
      profileDrafts.set(chat.id, nextDraft);
      stop.disabled = nextDraft.stopMode !== "custom";
      githubWatchOnly.checked = nextDraft.githubWatchOnly;
      githubWatchOnly.disabled = !nextDraft.githubWatchEnabled;
      githubRepository.disabled = !nextDraft.githubWatchEnabled;
      githubIdle.disabled = !nextDraft.githubWatchEnabled;
      interval.disabled = nextDraft.githubWatchOnly;
    };
    githubWatchOnly.disabled = !draft.githubWatchEnabled;
    githubRepository.disabled = !draft.githubWatchEnabled;
    githubIdle.disabled = !draft.githubWatchEnabled;
    interval.disabled = draft.githubWatchOnly;
    for (const control of [command, interval, stopMode, stop, maxContinuations, maxRuntime, githubWatchEnabled, githubWatchOnly, githubRepository, githubIdle, telegramNotify]) {
''',
)
replace_once(
    "chrome-extension/options/options.js",
    "    githubWatchEnabled: root.querySelector(\".profile-github-watch-enabled\").checked,\n    githubRepository: root.querySelector(\".profile-github-repository\").value.trim(),\n",
    "    githubWatchEnabled: root.querySelector(\".profile-github-watch-enabled\").checked,\n    githubWatchOnly: root.querySelector(\".profile-github-watch-only\").checked,\n    githubRepository: root.querySelector(\".profile-github-repository\").value.trim(),\n",
)
replace_once(
    "chrome-extension/options/options.js",
    "    githubWatchEnabled: profile.githubWatchEnabled === true,\n    githubRepository: profile.githubRepository || \"\",\n",
    "    githubWatchEnabled: profile.githubWatchEnabled === true,\n    githubWatchOnly: profile.githubWatchOnly === true,\n    githubRepository: profile.githubRepository || \"\",\n",
)
replace_once(
    "chrome-extension/options/options.js",
    "    githubWatchEnabled: draft.githubWatchEnabled,\n    githubRepository: draft.githubRepository || null,\n",
    "    githubWatchEnabled: draft.githubWatchEnabled,\n    githubWatchOnly: draft.githubWatchEnabled && draft.githubWatchOnly,\n    githubRepository: draft.githubRepository || null,\n",
)
replace_once(
    "chrome-extension/options/options.js",
    "    githubWatchEnabled: profile.githubWatchEnabled === true,\n    githubRepository: profile.githubRepository || null,\n",
    "    githubWatchEnabled: profile.githubWatchEnabled === true,\n    githubWatchOnly: profile.githubWatchEnabled === true && profile.githubWatchOnly === true,\n    githubRepository: profile.githubRepository || null,\n",
)
replace_once(
    "chrome-extension/options/options.js",
    "function profileSummary(profile) {\n  const pieces = [`${formatInterval(profile.intervalMinutes)} интервал`];\n",
    "function profileSummary(profile) {\n  const pieces = [profile.githubWatchOnly ? \"только GitHub Actions\" : `${formatInterval(profile.intervalMinutes)} интервал`];\n",
)

# Deterministic service-worker alarm model: preserve existing alarm schedule instead of recreating it.
replace_once(
    "tests/chrome-extension/service-worker.test.mjs",
    "  const data = {};\n  const tabs = new Map();\n  const metrics = { reloads: 0, injections: 0, sends: 0, inspections: 0, alarmCreates: 0, creates: 0, windowFocuses: 0 };\n",
    "  const data = {};\n  const tabs = new Map();\n  const alarms = new Map();\n  const metrics = { reloads: 0, injections: 0, sends: 0, inspections: 0, alarmCreates: 0, alarmCreatesByName: {}, creates: 0, windowFocuses: 0 };\n",
)
replace_once(
    "tests/chrome-extension/service-worker.test.mjs",
    '''    alarms: {
      onAlarm: { addListener(fn) { alarmListeners.push(fn); } },
      async clear() { return true; },
      async create() { metrics.alarmCreates += 1; }
    },
''',
    '''    alarms: {
      onAlarm: { addListener(fn) { alarmListeners.push(fn); } },
      async get(name) { return clone(alarms.get(name)); },
      async clear(name) { return alarms.delete(name); },
      async create(name, info) {
        metrics.alarmCreates += 1;
        metrics.alarmCreatesByName[name] = (metrics.alarmCreatesByName[name] || 0) + 1;
        alarms.set(name, {
          name,
          scheduledTime: Date.now() + Number(info.delayInMinutes || 0) * 60_000,
          periodInMinutes: info.periodInMinutes
        });
      }
    },
''',
)
replace_once(
    "tests/chrome-extension/service-worker.test.mjs",
    "    data,\n    tabs,\n    metrics,\n",
    "    data,\n    tabs,\n    alarms,\n    metrics,\n",
)
append_before(
    "tests/chrome-extension/service-worker.test.mjs",
    "console.log(JSON.stringify({\n",
    '''// 9. Scheduler configuration is idempotent: ordinary and GitHub alarms keep their original schedule.
installState({
  profile: {
    ...model.defaultChatProfile(),
    githubWatchEnabled: true,
    githubWatchOnly: false,
    githubRepository: 'MishkaStrategy/ChatPulse',
    githubIdleMinutes: 30
  }
}, { enabled: true, intervalMinutes: 5 });
harness.alarms.clear();
harness.metrics.alarmCreatesByName = {};
result = await harness.invoke({ type: 'UPDATE_SETTINGS', patch: { intervalMinutes: 5 } });
assert.equal(result.ok, true, result.error);
const normalAlarmScheduledTime = harness.alarms.get('chatpulse-monitor')?.scheduledTime;
const githubAlarmScheduledTime = harness.alarms.get('chatpulse-github-actions-watchdog')?.scheduledTime;
assert.ok(normalAlarmScheduledTime);
assert.ok(githubAlarmScheduledTime);
result = await harness.invoke({ type: 'UPDATE_SETTINGS', patch: { intervalMinutes: 5 } });
assert.equal(result.ok, true, result.error);
assert.equal(harness.metrics.alarmCreatesByName['chatpulse-monitor'], 1, 'unchanged ordinary alarm must not be recreated');
assert.equal(harness.metrics.alarmCreatesByName['chatpulse-github-actions-watchdog'], 1, 'unchanged GitHub alarm must not be recreated');
assert.equal(harness.alarms.get('chatpulse-monitor').scheduledTime, normalAlarmScheduledTime);
assert.equal(harness.alarms.get('chatpulse-github-actions-watchdog').scheduledTime, githubAlarmScheduledTime);

// 10. A GitHub-only chat schedules only the independent Actions watchdog.
installState({
  profile: {
    ...model.defaultChatProfile(),
    githubWatchEnabled: true,
    githubWatchOnly: true,
    githubRepository: 'MishkaStrategy/ChatPulse',
    githubIdleMinutes: 30
  }
}, { enabled: true, intervalMinutes: 5 });
harness.alarms.clear();
harness.metrics.alarmCreatesByName = {};
result = await harness.invoke({ type: 'UPDATE_SETTINGS', patch: { intervalMinutes: 5 } });
assert.equal(result.ok, true, result.error);
assert.equal(harness.alarms.has('chatpulse-monitor'), false, 'GitHub-only chat must not schedule ordinary interval alarm');
assert.equal(harness.alarms.get('chatpulse-github-actions-watchdog')?.periodInMinutes, 10);
assert.equal(result.state.nextCheckAt, null);

''',
)
replace_once(
    "tests/chrome-extension/service-worker.test.mjs",
    "  stop_phrase_single_chat: 'PASS',\n  reload_count_last_scenario: harness.metrics.reloads,\n",
    "  stop_phrase_single_chat: 'PASS',\n  independent_alarm_lifecycle: 'PASS',\n  github_only_scheduler: 'PASS',\n  reload_count_last_scenario: harness.metrics.reloads,\n",
)

# Watchdog profile and repeated-episode regressions.
replace_once(
    "tests/chrome-extension/github-watchdog.test.mjs",
    "  normalizeGithubRepository,\n  normalizeState,\n",
    "  normalizeChatProfile,\n  normalizeGithubRepository,\n  normalizeState,\n",
)
append_before(
    "tests/chrome-extension/github-watchdog.test.mjs",
    'test("first successful Actions observation establishes a fresh baseline and never restarts immediately", () => {\n',
    '''test("GitHub-only mode is default-off and requires an enabled configured watcher", () => {
  assert.equal(normalizeChatProfile({}).githubWatchOnly, false);
  assert.equal(normalizeChatProfile({ githubWatchOnly: true }).githubWatchOnly, false);
  assert.equal(normalizeChatProfile({
    githubWatchEnabled: true,
    githubWatchOnly: true,
    githubRepository: "MishkaStrategy/ChatPulse"
  }).githubWatchOnly, true);
});

test("watchdog continues across more than two independent workflow-run episodes", () => {
  let chat = createChat({ title: "A", url: "https://chatgpt.com/c/a" });
  const base = Date.parse("2026-09-02T07:00:00.000Z");
  for (let index = 0; index < 3; index += 1) {
    const observedAt = new Date(base + index * 60 * 60_000).toISOString();
    chat = recordGithubActionsObservation(chat, {
      runId: String(100 + index),
      createdAt: observedAt,
      activeRunCount: 0
    }, observedAt);
    const decision = githubWatchdogDecision(chat, 10, base + index * 60 * 60_000 + 11 * 60_000);
    assert.equal(decision.decision, "restart");
    chat = recordGithubRestart(chat, decision.restartKey, new Date(base + index * 60 * 60_000 + 11 * 60_000).toISOString());
  }
  assert.equal(chat.githubRestartCount, 3);
  assert.equal(chat.githubLastRestartKey, "run:102");
});

''',
)

# UI/portable configuration coverage.
replace_once(
    "tests/chrome-extension/github-watchdog-ui.test.mjs",
    "      githubWatchEnabled: true,\n      githubRepository: \"MishkaStrategy/ChatPulse\",\n",
    "      githubWatchEnabled: true,\n      githubWatchOnly: true,\n      githubRepository: \"MishkaStrategy/ChatPulse\",\n",
)
replace_once(
    "tests/chrome-extension/github-watchdog-ui.test.mjs",
    "  assert.equal(config.chats[0].profile.githubWatchEnabled, true);\n  assert.equal(config.chats[0].profile.githubRepository, \"MishkaStrategy/ChatPulse\");\n",
    "  assert.equal(config.chats[0].profile.githubWatchEnabled, true);\n  assert.equal(config.chats[0].profile.githubWatchOnly, true);\n  assert.equal(config.chats[0].profile.githubRepository, \"MishkaStrategy/ChatPulse\");\n",
)
replace_once(
    "tests/chrome-extension/github-watchdog-ui.test.mjs",
    '  assert.ok(optionsHtml.includes("отсчёт N минут начинается заново"));\n});\n',
    '  assert.ok(optionsHtml.includes("отсчёт N минут начинается заново"));\n  assert.ok(optionsHtml.includes("profile-github-watch-only"));\n  assert.ok(optionsHtml.includes("Только GitHub Actions"));\n  assert.ok(optionsHtml.includes("Обычный автоматический интервал для этого чата будет отключён"));\n});\n',
)

# Release metadata and static audit.
replace_once("chrome-extension/manifest.json", '"version": "0.7.3"', '"version": "0.7.4"')
replace_once("chrome-extension/manifest.json", '"version_name": "0.7.3 beta"', '"version_name": "0.7.4 beta"')
replace_once(
    "chrome-extension/manifest.json",
    '"description": "Локально продолжает выбранные чаты ChatGPT, заменяет зависшие фоновые вкладки новыми и fail-closed отслеживает GitHub Actions."',
    '"description": "Локально продолжает выбранные чаты ChatGPT, независимо отслеживает GitHub Actions и поддерживает Actions-only режим."',
)
replace_once("package.json", '"version": "0.7.3-beta.1"', '"version": "0.7.4-beta.1"')
replace_once("scripts/package_extension.py", "ChatPulse-Chrome-v0.7.3-beta.zip", "ChatPulse-Chrome-v0.7.4-beta.zip")
replace_once("scripts/package_extension.py", "ChatPulse-Chrome-v0.7.3-source-manifest.txt", "ChatPulse-Chrome-v0.7.4-source-manifest.txt")
replace_once("scripts/validate_extension.mjs", 'assert.equal(manifest.version, "0.7.3");', 'assert.equal(manifest.version, "0.7.4");')
replace_once("scripts/validate_extension.mjs", 'assert.equal(manifest.version_name, "0.7.3 beta");', 'assert.equal(manifest.version_name, "0.7.4 beta");')
replace_once(
    "scripts/validate_extension.mjs",
    '  "profile-github-watch-enabled",\n  "profile-github-repository",\n',
    '  "profile-github-watch-enabled",\n  "profile-github-watch-only",\n  "profile-github-repository",\n',
)
replace_once(
    "scripts/validate_extension.mjs",
    'assert.ok(background.includes("successfulRepositories.has(profile.githubRepository)"), "Current failed GitHub poll must not select a restart");\n',
    'assert.ok(background.includes("successfulRepositories.has(profile.githubRepository)"), "Current failed GitHub poll must not select a restart");\nassert.ok(model.includes("githubWatchOnly"), "Model must retain the per-chat GitHub-only mode");\nassert.ok(background.includes("syncPeriodicAlarm"), "Scheduler must synchronize alarms independently");\nassert.ok(background.includes("chrome.alarms.get"), "Scheduler must preserve unchanged alarm scheduledTime");\nassert.ok(background.includes(\'source === "alarm" || source === "start"\'), "Automatic ordinary checks must identify scheduler/start sources");\nassert.ok(background.includes("profile.githubWatchOnly"), "Automatic ordinary checks must exclude GitHub-only chats");\n',
)
replace_once(
    "scripts/validate_extension.mjs",
    "assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.3-beta.zip'));",
    "assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.4-beta.zip'));",
)
replace_once(
    "scripts/validate_extension.mjs",
    "assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.3-source-manifest.txt'));",
    "assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.4-source-manifest.txt'));",
)
replace_once(
    "scripts/validate_extension.mjs",
    'console.log("Manifest V3, legacy safety, schema v5 profiles/tasks, active GitHub Actions fail-closed watchdog, private-repository read-only token isolation, taskOnly master-stop, durable dispatch, Control Center, portable config and Telegram privacy ChatPulse 0.7.3 прошли статический аудит.");',
    'console.log("Manifest V3, legacy safety, schema v5 profiles/tasks, independent GitHub Actions scheduler, Actions-only mode, fail-closed watchdog, private-repository read-only token isolation, taskOnly master-stop, durable dispatch, Control Center, portable config and Telegram privacy ChatPulse 0.7.4 прошли статический аудит.");',
)

replace_once(
    "CHANGELOG.md",
    "# Changelog\n\n",
    '''# Changelog

## 0.7.4 beta — independent GitHub Actions scheduling

- fix a scheduler starvation bug where each ordinary interval check recreated/postponed the GitHub 10-minute alarm and each GitHub watchdog check could recreate/postpone a longer ordinary alarm;
- preserve unchanged Chrome alarms and only recreate the specific scheduler whose desired period actually changed;
- add per-chat **Только GitHub Actions** mode: no automatic ordinary interval checks for that chat while the Actions watchdog remains active;
- keep manual **Проверить сейчас** available in Actions-only mode and keep global Stop as the master stop for all automatic sends;
- preserve active-run blocking, active-to-idle fresh countdown, fail-closed API errors, private-token isolation and one-restart-per-workflow-marker semantics;
- add a regression proving more than two independent workflow-run inactivity episodes can restart normally;
- move deterministic beta package/provenance output to ChatPulse 0.7.4.

''',
)
