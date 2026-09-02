from pathlib import Path
import json

ROOT = Path('.')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    return text.replace(old, new, 1)

# Manifest: optional GitHub API access only.
manifest_path = ROOT / 'chrome-extension/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
optional = list(manifest.get('optional_host_permissions', []))
origin = 'https://api.github.com/*'
if origin not in optional:
    optional.append(origin)
manifest['optional_host_permissions'] = optional
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Control Center HTML.
html_path = ROOT / 'chrome-extension/options/options.html'
html = html_path.read_text(encoding='utf-8')
html = replace_once(
    html,
    '''          <label class="toggle-line profile-telegram">\n            <input class="profile-telegram-notify" type="checkbox">\n            <span>Telegram-события для этого чата</span>\n          </label>\n\n          <div class="profile-actions profile-wide">''',
    '''          <section class="integration-box profile-wide profile-github-watch" aria-label="GitHub Actions watchdog">\n            <div class="integration-heading">\n              <div>\n                <span class="eyebrow">Project watchdog</span>\n                <h3>GitHub Actions</h3>\n              </div>\n              <label class="toggle-line">\n                <input class="profile-github-watch-enabled" type="checkbox">\n                <span>Следить за activity</span>\n              </label>\n            </div>\n            <div class="field-row">\n              <label class="field">\n                <span>Repository</span>\n                <input class="profile-github-repository" type="text" autocomplete="off" spellcheck="false" placeholder="owner/repo">\n                <small>Публичный GitHub repository, привязанный к этому project-чату.</small>\n              </label>\n              <label class="field">\n                <span>Перезапуск после простоя, минут</span>\n                <input class="profile-github-idle" type="number" min="10" max="10080" step="1" inputmode="numeric">\n                <small>Если новый workflow run не появился за N минут, будет максимум один controlled restart до следующей новой Actions activity.</small>\n              </label>\n            </div>\n            <small class="profile-github-status">Watchdog выключен.</small>\n            <p class="integration-note">Доступ к <code>api.github.com</code> запрашивается Chrome только при включении. ChatPulse читает только последний публичный workflow run, не использует GitHub token, не запускает workflows и не пишет в repository.</p>\n          </section>\n\n          <label class="toggle-line profile-telegram">\n            <input class="profile-telegram-notify" type="checkbox">\n            <span>Telegram-события для этого чата</span>\n          </label>\n\n          <div class="profile-actions profile-wide">''',
    'watchdog profile HTML'
)
html_path.write_text(html, encoding='utf-8')

# Control Center JS.
js_path = ROOT / 'chrome-extension/options/options.js'
js = js_path.read_text(encoding='utf-8')
js = replace_once(
    js,
    'const TELEGRAM_ORIGIN = "https://api.telegram.org/*";\n',
    'const TELEGRAM_ORIGIN = "https://api.telegram.org/*";\nconst GITHUB_ORIGIN = "https://api.github.com/*";\n',
    'GitHub origin constant'
)

js = replace_once(
    js,
    '''async function ensureTelegramPermission() {\n  try {\n    const granted = await chrome.permissions.request({ origins: [TELEGRAM_ORIGIN] });\n    if (!granted) {\n      showMessage("Telegram-уведомления не включены: Chrome не выдал доступ к api.telegram.org.", "error");\n      return false;\n    }\n    return true;\n  } catch (error) {\n    showMessage(errorMessage(error), "error");\n    return false;\n  }\n}\n''',
    '''async function ensureTelegramPermission() {\n  try {\n    const granted = await chrome.permissions.request({ origins: [TELEGRAM_ORIGIN] });\n    if (!granted) {\n      showMessage("Telegram-уведомления не включены: Chrome не выдал доступ к api.telegram.org.", "error");\n      return false;\n    }\n    return true;\n  } catch (error) {\n    showMessage(errorMessage(error), "error");\n    return false;\n  }\n}\n\nasync function ensureGithubPermission() {\n  try {\n    if (await chrome.permissions.contains({ origins: [GITHUB_ORIGIN] })) return true;\n    const granted = await chrome.permissions.request({ origins: [GITHUB_ORIGIN] });\n    if (!granted) {\n      showMessage("GitHub Actions watchdog не включён: Chrome не выдал optional access к api.github.com.", "error");\n      return false;\n    }\n    return true;\n  } catch (error) {\n    showMessage(errorMessage(error), "error");\n    return false;\n  }\n}\n''',
    'GitHub permission helper'
)

js = replace_once(
    js,
    '''    const maxRuntime = row.querySelector(".profile-max-runtime");\n    const telegramNotify = row.querySelector(".profile-telegram-notify");\n    const effectiveText = row.querySelector(".profile-effective");\n''',
    '''    const maxRuntime = row.querySelector(".profile-max-runtime");\n    const githubWatchEnabled = row.querySelector(".profile-github-watch-enabled");\n    const githubRepository = row.querySelector(".profile-github-repository");\n    const githubIdle = row.querySelector(".profile-github-idle");\n    const githubStatus = row.querySelector(".profile-github-status");\n    const telegramNotify = row.querySelector(".profile-telegram-notify");\n    const effectiveText = row.querySelector(".profile-effective");\n''',
    'watchdog row controls'
)

js = replace_once(
    js,
    '''    maxContinuations.value = String(draft.maxContinuations);\n    maxRuntime.value = String(draft.maxRuntimeMinutes);\n    telegramNotify.checked = draft.telegramNotify;\n    effectiveText.textContent = profileSummary(effective);\n''',
    '''    maxContinuations.value = String(draft.maxContinuations);\n    maxRuntime.value = String(draft.maxRuntimeMinutes);\n    githubWatchEnabled.checked = draft.githubWatchEnabled;\n    githubRepository.value = draft.githubRepository || "";\n    githubIdle.value = String(draft.githubIdleMinutes);\n    githubStatus.textContent = githubWatchStatus(chat, effective);\n    telegramNotify.checked = draft.telegramNotify;\n    effectiveText.textContent = profileSummary(effective);\n''',
    'watchdog draft render'
)

js = replace_once(
    js,
    '''      profileDrafts.set(chat.id, nextDraft);\n      stop.disabled = nextDraft.stopMode !== "custom";\n    };\n    for (const control of [command, interval, stopMode, stop, maxContinuations, maxRuntime, telegramNotify]) {\n''',
    '''      profileDrafts.set(chat.id, nextDraft);\n      stop.disabled = nextDraft.stopMode !== "custom";\n      githubRepository.disabled = !nextDraft.githubWatchEnabled;\n      githubIdle.disabled = !nextDraft.githubWatchEnabled;\n    };\n    githubRepository.disabled = !draft.githubWatchEnabled;\n    githubIdle.disabled = !draft.githubWatchEnabled;\n    for (const control of [command, interval, stopMode, stop, maxContinuations, maxRuntime, githubWatchEnabled, githubRepository, githubIdle, telegramNotify]) {\n''',
    'watchdog draft capture'
)

js = replace_once(
    js,
    '''async function saveChatProfile(chatId, row, showSuccess = true) {\n  const draft = readProfileDraft(row);\n  const profile = draftToProfile(draft);\n''',
    '''async function saveChatProfile(chatId, row, showSuccess = true) {\n  const draft = readProfileDraft(row);\n  if (draft.githubWatchEnabled) {\n    if (!draft.githubRepository) {\n      showMessage("Для GitHub Actions watchdog укажите repository в формате owner/repo.", "error");\n      return false;\n    }\n    if (!(await ensureGithubPermission())) return false;\n  }\n  const profile = draftToProfile(draft);\n''',
    'watchdog permission before profile save'
)

js = replace_once(
    js,
    '''    maxContinuations: nonNegativeInteger(root.querySelector(".profile-max-continuations").value),\n    maxRuntimeMinutes: nonNegativeInteger(root.querySelector(".profile-max-runtime").value),\n    telegramNotify: root.querySelector(".profile-telegram-notify").checked\n''',
    '''    maxContinuations: nonNegativeInteger(root.querySelector(".profile-max-continuations").value),\n    maxRuntimeMinutes: nonNegativeInteger(root.querySelector(".profile-max-runtime").value),\n    githubWatchEnabled: root.querySelector(".profile-github-watch-enabled").checked,\n    githubRepository: root.querySelector(".profile-github-repository").value.trim(),\n    githubIdleMinutes: boundedInteger(root.querySelector(".profile-github-idle").value, 10, 10080, 30),\n    telegramNotify: root.querySelector(".profile-telegram-notify").checked\n''',
    'read watchdog profile draft'
)

js = replace_once(
    js,
    '''    maxContinuations: nonNegativeInteger(profile.maxContinuations),\n    maxRuntimeMinutes: nonNegativeInteger(profile.maxRuntimeMinutes),\n    telegramNotify: profile.telegramNotify !== false\n''',
    '''    maxContinuations: nonNegativeInteger(profile.maxContinuations),\n    maxRuntimeMinutes: nonNegativeInteger(profile.maxRuntimeMinutes),\n    githubWatchEnabled: profile.githubWatchEnabled === true,\n    githubRepository: profile.githubRepository || "",\n    githubIdleMinutes: boundedInteger(profile.githubIdleMinutes, 10, 10080, 30),\n    telegramNotify: profile.telegramNotify !== false\n''',
    'watchdog profile to draft'
)

js = replace_once(
    js,
    '''    maxContinuations: draft.maxContinuations,\n    maxRuntimeMinutes: draft.maxRuntimeMinutes,\n    telegramNotify: draft.telegramNotify\n''',
    '''    maxContinuations: draft.maxContinuations,\n    maxRuntimeMinutes: draft.maxRuntimeMinutes,\n    githubWatchEnabled: draft.githubWatchEnabled,\n    githubRepository: draft.githubRepository || null,\n    githubIdleMinutes: draft.githubIdleMinutes,\n    telegramNotify: draft.telegramNotify\n''',
    'draft to watchdog profile'
)

js = replace_once(
    js,
    '''    maxContinuations: nonNegativeInteger(profile.maxContinuations),\n    maxRuntimeMinutes: nonNegativeInteger(profile.maxRuntimeMinutes),\n    telegramNotify: profile.telegramNotify !== false\n  };\n}\n\nfunction profileSummary(profile) {\n''',
    '''    maxContinuations: nonNegativeInteger(profile.maxContinuations),\n    maxRuntimeMinutes: nonNegativeInteger(profile.maxRuntimeMinutes),\n    githubWatchEnabled: profile.githubWatchEnabled === true,\n    githubRepository: profile.githubRepository || null,\n    githubIdleMinutes: boundedInteger(profile.githubIdleMinutes, 10, 10080, 30),\n    telegramNotify: profile.telegramNotify !== false\n  };\n}\n\nfunction profileSummary(profile) {\n''',
    'effective watchdog profile'
)

js = replace_once(
    js,
    '''  if (profile.stopPhrase) pieces.push("stop guard");\n  if (!profile.telegramNotify) pieces.push("Telegram off");\n''',
    '''  if (profile.stopPhrase) pieces.push("stop guard");\n  if (profile.githubWatchEnabled && profile.githubRepository) pieces.push(`Actions ${profile.githubRepository} · ${profile.githubIdleMinutes} мин`);\n  if (!profile.telegramNotify) pieces.push("Telegram off");\n''',
    'watchdog profile summary'
)

js = replace_once(
    js,
    '''function renderProgress(root, chat, profile) {\n''',
    '''function githubWatchStatus(chat, profile) {\n  if (!profile.githubWatchEnabled) return "Watchdog выключен.";\n  if (!profile.githubRepository) return "Укажите repository в формате owner/repo.";\n  if (chat.githubLastError) return `GitHub: ${chat.githubLastError}`;\n  if (!chat.githubWatchStartedAt) return `GitHub Actions · ${profile.githubRepository} · baseline ещё не создан`;\n  const pieces = [`GitHub Actions · ${profile.githubRepository}`];\n  if (chat.githubLastActivityAt) pieces.push(`activity ${formatDateTime(chat.githubLastActivityAt)}`);\n  if (chat.githubLastCheckedAt) pieces.push(`проверено ${formatDateTime(chat.githubLastCheckedAt)}`);\n  if (chat.githubLastRestartAt) pieces.push(`restart ${formatDateTime(chat.githubLastRestartAt)}`);\n  if (chat.githubRestartCount > 0) pieces.push(`restart count ${chat.githubRestartCount}`);\n  return pieces.join(" · ");\n}\n\nfunction renderProgress(root, chat, profile) {\n''',
    'watchdog runtime status'
)

js = replace_once(
    js,
    '''function nonNegativeInteger(value) {\n  const parsed = Number(value);\n  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;\n}\n''',
    '''function nonNegativeInteger(value) {\n  const parsed = Number(value);\n  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;\n}\n\nfunction boundedInteger(value, minimum, maximum, fallback) {\n  const parsed = Number(value);\n  if (!Number.isFinite(parsed)) return fallback;\n  return Math.min(Math.max(Math.trunc(parsed), minimum), maximum);\n}\n''',
    'bounded UI integer'
)

js = replace_once(
    js,
    '''    if (mode && stop) stop.disabled = mode.value !== "custom";\n  }\n}\n''',
    '''    if (mode && stop) stop.disabled = mode.value !== "custom";\n    const githubEnabled = row.querySelector(".profile-github-watch-enabled");\n    const githubRepository = row.querySelector(".profile-github-repository");\n    const githubIdle = row.querySelector(".profile-github-idle");\n    if (githubEnabled && githubRepository && githubIdle) {\n      githubRepository.disabled = !githubEnabled.checked;\n      githubIdle.disabled = !githubEnabled.checked;\n    }\n  }\n}\n''',
    'restore watchdog disabled controls after busy'
)

js_path.write_text(js, encoding='utf-8')

# Regression tests for UI permission and portable privacy.
test_path = ROOT / 'tests/chrome-extension/github-watchdog-ui.test.mjs'
test_path.write_text(r'''import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createChat,
  createPortableConfig,
  defaultState
} from "../../chrome-extension/lib/model-v2.js";

const manifestPath = fileURLToPath(new URL("../../chrome-extension/manifest.json", import.meta.url));
const optionsPath = fileURLToPath(new URL("../../chrome-extension/options/options.js", import.meta.url));
const optionsHtmlPath = fileURLToPath(new URL("../../chrome-extension/options/options.html", import.meta.url));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const options = await readFile(optionsPath, "utf8");
const optionsHtml = await readFile(optionsHtmlPath, "utf8");

test("GitHub API permission is optional and never an install-time host permission", () => {
  assert.ok(manifest.optional_host_permissions.includes("https://api.github.com/*"));
  assert.equal(manifest.host_permissions.includes("https://api.github.com/*"), false);
});

test("Control Center requests GitHub permission only when saving an enabled watcher", () => {
  assert.ok(options.includes('const GITHUB_ORIGIN = "https://api.github.com/*"'));
  assert.ok(options.includes("chrome.permissions.request({ origins: [GITHUB_ORIGIN] })"));
  assert.ok(options.includes("if (draft.githubWatchEnabled)"));
  assert.ok(options.includes("await ensureGithubPermission()"));
  assert.ok(optionsHtml.includes("profile-github-watch-enabled"));
  assert.ok(optionsHtml.includes("profile-github-repository"));
  assert.ok(optionsHtml.includes("profile-github-idle"));
});

test("portable config includes watcher configuration but excludes all watcher runtime state", () => {
  const chat = {
    ...createChat({ title: "Project", url: "https://chatgpt.com/c/project" }),
    profile: {
      ...createChat({ title: "x", url: "https://chatgpt.com/c/x" }).profile,
      githubWatchEnabled: true,
      githubRepository: "MishkaStrategy/ChatPulse",
      githubIdleMinutes: 45
    },
    githubLastRunId: "999",
    githubLastActivityAt: "2026-09-02T07:00:00.000Z",
    githubLastAttemptAt: "2026-09-02T07:01:00.000Z",
    githubLastCheckedAt: "2026-09-02T07:01:00.000Z",
    githubLastRestartAt: "2026-09-02T07:02:00.000Z",
    githubLastRestartKey: "run:999",
    githubRestartCount: 3,
    githubLastError: "secret-ish runtime diagnostic"
  };
  const config = createPortableConfig({ ...defaultState(), chats: [chat] }, "2026-09-02T07:10:00.000Z");
  assert.equal(config.chats[0].profile.githubWatchEnabled, true);
  assert.equal(config.chats[0].profile.githubRepository, "MishkaStrategy/ChatPulse");
  assert.equal(config.chats[0].profile.githubIdleMinutes, 45);
  const serialized = JSON.stringify(config);
  for (const forbidden of [
    "githubLastRunId", "githubLastActivityAt", "githubLastAttemptAt", "githubLastCheckedAt",
    "githubLastRestartAt", "githubLastRestartKey", "githubRestartCount", "githubLastError",
    "secret-ish runtime diagnostic", "run:999"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
''', encoding='utf-8')

print('Applied ChatPulse 0.7.0 watchdog Control Center and optional permission UI.')
