from pathlib import Path
import json

ROOT = Path('.')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    return text.replace(old, new, 1)

# Manifest version.
manifest_path = ROOT / 'chrome-extension/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['version'] = '0.7.0'
manifest['version_name'] = '0.7.0 beta'
manifest['description'] = 'Локально продолжает выбранные чаты ChatGPT и может fail-closed отслеживать GitHub Actions activity проекта.'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# package.json.
package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
package['version'] = '0.7.0-beta.1'
package['scripts']['check:syntax'] = 'node --check chrome-extension/lib/model-v2.js && node --check chrome-extension/background/service-worker-v2.js && node --check chrome-extension/background/github-actions.js && node --check chrome-extension/background/telegram.js && node --check chrome-extension/content/content-script.js && node --check chrome-extension/popup/popup.js && node --check chrome-extension/options/options.js'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Reproducible package names.
package_script = ROOT / 'scripts/package_extension.py'
text = package_script.read_text(encoding='utf-8')
text = text.replace('ChatPulse-Chrome-v0.6.0-beta.zip', 'ChatPulse-Chrome-v0.7.0-beta.zip')
text = text.replace('ChatPulse-Chrome-v0.6.0-source-manifest.txt', 'ChatPulse-Chrome-v0.7.0-source-manifest.txt')
if 'v0.6.0' in text:
    raise SystemExit('stale 0.6.0 package token remains')
package_script.write_text(text, encoding='utf-8')

# Release workflow.
workflow_path = ROOT / '.github/workflows/extension-ci.yml'
workflow = workflow_path.read_text(encoding='utf-8')
workflow = workflow.replace('0.6.0', '0.7.0')
workflow = workflow.replace('release/0.6.0-control-center', 'release/0.7.0-github-actions-watchdog')
workflow = workflow.replace('Syntax, unit, task, Telegram and static security audit', 'Syntax, unit, task, GitHub watchdog, Telegram and static security audit')
if '0.6.0' in workflow or 'release/0.6.0-control-center' in workflow:
    raise SystemExit('stale 0.6 release workflow token remains')
workflow_path.write_text(workflow, encoding='utf-8')

# Static validator.
validator_path = ROOT / 'scripts/validate_extension.mjs'
validator = validator_path.read_text(encoding='utf-8')
validator = validator.replace('assert.equal(manifest.version, "0.6.0");', 'assert.equal(manifest.version, "0.7.0");')
validator = validator.replace('assert.equal(manifest.version_name, "0.6.0 beta");', 'assert.equal(manifest.version_name, "0.7.0 beta");')
validator = replace_once(
    validator,
    '''assert.deepEqual(\n  [...optionalHosts].sort(),\n  ["https://api.telegram.org/*"],\n  "Telegram должен быть единственным опциональным host permission"\n);\nassert.ok(!hosts.has("https://api.telegram.org/*"), "Telegram запрещён в постоянных host_permissions");''',
    '''assert.deepEqual(\n  [...optionalHosts].sort(),\n  ["https://api.github.com/*", "https://api.telegram.org/*"],\n  "Внешние API должны оставаться только opt-in optional host permissions"\n);\nassert.ok(!hosts.has("https://api.telegram.org/*"), "Telegram запрещён в постоянных host_permissions");\nassert.ok(!hosts.has("https://api.github.com/*"), "GitHub API запрещён в постоянных host_permissions");''',
    'optional host boundary'
)
validator = replace_once(
    validator,
    '  "background/service-worker-v2.js",\n  "background/telegram.js",',
    '  "background/service-worker-v2.js",\n  "background/github-actions.js",\n  "background/telegram.js",',
    'GitHub client required file'
)
validator = replace_once(
    validator,
    '  "configuration-safety.test.mjs"\n]) {',
    '  "configuration-safety.test.mjs",\n  "github-watchdog.test.mjs",\n  "github-actions-client.test.mjs",\n  "github-watchdog-runtime.test.mjs",\n  "github-watchdog-ui.test.mjs"\n]) {',
    'GitHub test files'
)
validator = replace_once(
    validator,
    'const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");\nconst telegram = await readFile',
    'const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");\nconst githubActions = await readFile(path.join(extensionRoot, "background/github-actions.js"), "utf8");\nconst telegram = await readFile',
    'GitHub source read'
)
validator = validator.replace('// 0.6.0 state/profile/task/configuration contract.', '// 0.6.0 state/profile/task/configuration boundaries retained in 0.7.0.')
validator = validator.replace('  "schemaVersion: 4",', '  "schemaVersion: 5",')
validator = validator.replace('`Model missing 0.6.0 invariant: ${token}`', '`Model missing retained profile/task invariant: ${token}`')
validator = validator.replace('`Service worker missing 0.6.0 invariant: ${token}`', '`Service worker missing retained profile/task invariant: ${token}`')

watchdog_static = r'''
// 0.7.0 GitHub Actions watchdog boundary.
for (const token of [
  "MIN_GITHUB_IDLE_MINUTES = 10",
  "GITHUB_POLL_INTERVAL_MINUTES = 10",
  "MAX_GITHUB_WATCHED_REPOSITORIES = 8",
  "normalizeGithubRepository",
  "recordGithubActionsObservation",
  "githubWatchdogDecision",
  "recordGithubRestart",
  "resetGithubWatchRuntime"
]) {
  assert.ok(model.includes(token), `Model missing GitHub watchdog invariant: ${token}`);
}
for (const token of [
  "GITHUB_ALARM_NAME",
  "performGithubWatchdog",
  "attemptGithubWatchdogRestart",
  "successfulRepositories.has(profile.githubRepository)",
  "sameSession",
  "completionGuardReason",
  "recordGithubRestart",
  "persistDispatchCheckpoint",
  "MAX_GITHUB_WATCHED_REPOSITORIES"
]) {
  assert.ok(background.includes(token), `Service worker missing GitHub watchdog invariant: ${token}`);
}
assert.ok(!background.slice(
  background.indexOf("async function attemptGithubWatchdogRestart"),
  background.indexOf("async function persistSingleRuntimeChat")
).includes("startChatRun("), "Watchdog restart must preserve the existing run counter/runtime");
assert.ok(background.includes("successfulRepositories.has(profile.githubRepository)"), "Current failed GitHub poll must not select a restart");
assert.ok(githubActions.includes('export const GITHUB_API_ORIGIN = "https://api.github.com/*"'));
assert.ok(githubActions.includes('credentials: "omit"'), "GitHub client must omit browser credentials");
assert.ok(!githubActions.includes("Authorization"), "0.7.0 public GitHub client must not send an Authorization header");
assert.ok(!githubActions.includes("github_pat_"), "GitHub PAT material is forbidden");
assert.ok(githubActions.includes("actions/runs?per_page=1"));
assert.ok(githubActions.includes("x-ratelimit-remaining"));
for (const className of [
  "profile-github-watch-enabled",
  "profile-github-repository",
  "profile-github-idle",
  "profile-github-status"
]) {
  assert.ok(optionsHTML.includes(className), `Control Center missing GitHub watchdog control ${className}`);
}
assert.ok(optionsJS.includes('const GITHUB_ORIGIN = "https://api.github.com/*"'));
assert.ok(optionsJS.includes("chrome.permissions.request({ origins: [GITHUB_ORIGIN] })"));
assert.ok(optionsJS.includes("if (draft.githubWatchEnabled)"));
assert.ok(optionsHTML.includes("не использует GitHub token"));
'''
validator = replace_once(
    validator,
    '// Telegram stays optional, generic, post-state and privacy-safe.\n',
    watchdog_static + '\n// Telegram stays optional, generic, post-state and privacy-safe.\n',
    'watchdog static section'
)

validator = validator.replace("assert.ok(packageScript.includes('ChatPulse-Chrome-v0.6.0-beta.zip'));", "assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.0-beta.zip'));")
validator = validator.replace("assert.ok(packageScript.includes('ChatPulse-Chrome-v0.6.0-source-manifest.txt'));", "assert.ok(packageScript.includes('ChatPulse-Chrome-v0.7.0-source-manifest.txt'));")
validator = validator.replace(
    'console.log("Manifest V3, legacy safety, schema v4 profiles/tasks, taskOnly master-stop, durable dispatch, Control Center, portable config and Telegram privacy boundaries ChatPulse 0.6.0 прошли статический аудит.");',
    'console.log("Manifest V3, legacy safety, schema v5 profiles/tasks, GitHub Actions watchdog fail-closed boundary, taskOnly master-stop, durable dispatch, Control Center, portable config and Telegram privacy ChatPulse 0.7.0 прошли статический аудит.");'
)
validator_path.write_text(validator, encoding='utf-8')

# Changelog.
changelog_path = ROOT / 'CHANGELOG.md'
changelog = changelog_path.read_text(encoding='utf-8')
entry = '''## 0.7.0 beta — GitHub Actions inactivity watchdog\n\n- add an optional per-chat GitHub Actions watchdog bound to a public `owner/repo`;\n- interpret repository activity as creation of a new GitHub Actions workflow run and restart a stalled project chat after configured `N` idle minutes;\n- establish a fresh baseline on the first successful observation so an old historical run can never cause an immediate restart;\n- deduplicate repository polling, throttle public API reads to a 10-minute minimum cadence and cap active unique repositories at eight;\n- treat permission, network, 403/404, rate-limit and malformed GitHub API responses as errors only — never as inactivity;\n- allow at most one controlled restart-send per workflow-run activity marker until a new run appears;\n- preserve existing ChatGPT run counters, runtime limits, stop phrase, `controlRevision`, global session, draft/generation protection and master-stop semantics during watchdog restart;\n- persist the real dispatch fingerprint/count/restart key before optional notification work;\n- add `api.github.com` only as an `optional_host_permission`; the public v1 client sends no GitHub token/Authorization and performs no repository writes or workflow dispatches;\n- expose `owner/repo`, idle timeout and runtime watchdog status in each Control Center profile;\n- include watcher configuration in portable JSON while excluding run IDs, activity timestamps, restart history and errors;\n- move deterministic beta package/provenance output to ChatPulse 0.7.0.\n\n'''
changelog = replace_once(changelog, '# Changelog\n\n', '# Changelog\n\n' + entry, 'changelog insertion')
changelog_path.write_text(changelog, encoding='utf-8')

# README targeted upgrades.
readme_path = ROOT / 'README.md'
readme = readme_path.read_text(encoding='utf-8')
readme = readme.replace('version-0.6.0_beta', 'version-0.7.0_beta')
readme = readme.replace('В 0.6.0 каждый чат может иметь собственный профиль, лимиты и режим задачи «до завершения».', 'В 0.7.0 к per-chat профилям и guarded task mode добавлен GitHub Actions watchdog для project-чатов.')
readme = replace_once(
    readme,
    '- безопасный экспорт/импорт портативной конфигурации JSON без секретов и runtime history;\n',
    '- безопасный экспорт/импорт портативной конфигурации JSON без секретов и runtime history;\n- опциональный per-chat GitHub Actions watchdog: `owner/repo` + `N` минут простоя → один controlled restart-send до следующей новой workflow activity;\n',
    'README watchdog feature'
)
watchdog_section = '''## GitHub Actions watchdog\n\nДля project-чата в его профиле можно включить **GitHub Actions** и указать публичный repository в формате `owner/repo`. Chrome отдельно запросит optional access к `https://api.github.com/*`. ChatPulse читает только последний публичный workflow run и считает новой activity появление нового run ID.\n\nПервая успешная проверка только создаёт baseline. Затем, если новый workflow run не появился за `N` минут (минимум 10 минут), ChatPulse может один раз отправить обычную эффективную команду продолжения в тот же ChatGPT-чат. Следующий restart для этого repository episode станет возможен только после появления новой Actions activity.\n\nWatchdog не является обходом safety-модели: он не сбрасывает `runStartedAt` или `continuationCount`, учитывает stop phrase и лимиты, проверяет актуальные `controlRevision`/session, не трогает активную генерацию или пользовательский черновик и выключается master-stop кнопкой. Отправка watchdog считается полноценным dispatch и записывается до любых внешних уведомлений.\n\nGitHub API/network/permission/rate-limit/404 ошибки **никогда** не трактуются как простой. В 0.7.0 поддерживаются только публичные repositories без GitHub token; расширение не запускает workflows и ничего не пишет в GitHub.\n\n'''
readme = replace_once(readme, '## Стоп-фраза\n', watchdog_section + '## Стоп-фраза\n', 'README watchdog section')
readme = readme.replace('`api.telegram.org` находится только в `optional_host_permissions`.', '`api.telegram.org` и `api.github.com` находятся только в `optional_host_permissions` и запрашиваются соответствующими opt-in функциями.')
readme = readme.replace('schema-v4 migration, per-chat profiles, limits/task guards, portable-config isolation, Telegram privacy/permission boundary', 'schema-v5 migration, per-chat profiles, limits/task guards, GitHub Actions watchdog fail-closed/idempotency boundary, portable-config isolation, Telegram privacy/permission boundary')
readme = readme.replace('`ChatPulse-Chrome-v0.6.0-beta.zip`', '`ChatPulse-Chrome-v0.7.0-beta.zip`')
readme = readme.replace('`ChatPulse-Chrome-v0.6.0-source-manifest.txt`', '`ChatPulse-Chrome-v0.7.0-source-manifest.txt`')
readme = readme.replace('Текущая разрабатываемая версия — **0.6.0 beta**. Она расширяет выпущенный 0.5.5 Control Center/task-профилями, лимитами, Telegram operational events и переносимой конфигурацией, сохраняя прежние safety boundaries.', 'Текущая разрабатываемая версия — **0.7.0 beta**. Она расширяет выпущенный 0.6.0 fail-closed GitHub Actions inactivity watchdog для project-чатов, сохраняя прежние task/profile/Telegram/at-most-once boundaries.')
readme_path.write_text(readme, encoding='utf-8')

# Privacy.
privacy_path = ROOT / 'PRIVACY.md'
privacy = privacy_path.read_text(encoding='utf-8')
privacy = privacy.replace('индивидуальные профили чатов: собственная команда/интервал/стоп-фраза, лимит продолжений, лимит времени и настройка Telegram-событий;', 'индивидуальные профили чатов: собственная команда/интервал/стоп-фраза, лимит продолжений, лимит времени, настройка Telegram-событий и опциональные `owner/repo` + idle timeout GitHub Actions watchdog;')
privacy = privacy.replace('- локальный task/runtime state: счётчик продолжений, время запуска, статус/причина завершения и следующая допустимая проверка;', '- локальный task/runtime state: счётчик продолжений, время запуска, статус/причина завершения и следующая допустимая проверка;\n- если включён GitHub watchdog: последний публичный workflow run ID/время activity/проверки, restart idempotency key/count и локальная ошибка watchdog;')
privacy = privacy.replace('ChatPulse 0.6.0 экспортирует', 'ChatPulse 0.7.0 экспортирует')
privacy = privacy.replace('- локальный журнал и ошибки runtime.', '- локальный журнал и ошибки runtime;\n- GitHub workflow run IDs, activity/check timestamps, restart keys/counts и ошибки watchdog.')
github_network = '''\nGitHub Actions watchdog также полностью опционален. При его включении Chrome отдельно запрашивает доступ к `https://api.github.com/*`. ChatPulse выполняет только read-only запрос последнего публичного workflow run выбранного `owner/repo`, без Authorization/GitHub token, без записи в repository и без запуска workflows. Permission/network/404/rate-limit/невалидный ответ не считаются inactivity и сами по себе не могут инициировать отправку в ChatGPT.\n'''
privacy = replace_once(privacy, '\nTelegram полностью опционален.', github_network + '\nTelegram полностью опционален.', 'privacy GitHub network')
privacy_path.write_text(privacy, encoding='utf-8')

# Security.
security_path = ROOT / 'SECURITY.md'
security = security_path.read_text(encoding='utf-8')
security = security.replace('- declares `https://api.telegram.org/*` only as an optional host permission and asks for it from a direct settings action;', '- declares `https://api.telegram.org/*` and `https://api.github.com/*` only as optional host permissions and asks for each from the corresponding direct settings action;')
watchdog_security = '''## GitHub Actions watchdog boundary\n\nThe 0.7.0 watchdog is read-only and public-repository-only. It sends no GitHub token or `Authorization` header, performs no GitHub writes and never dispatches workflows. Public API polling is deduplicated by repository, throttled to a fixed safe cadence and bounded to a small number of unique repositories.\n\nThe first successful observation establishes a fresh inactivity baseline. GitHub permission/network/403/404/rate-limit/invalid-response failures are errors only and are never converted into a stall. Restart selection is allowed only after a successful current poll, and a workflow-run marker can produce at most one submitted restart until a new run appears.\n\nA watchdog restart stays inside the existing ChatGPT conversation and reuses the existing safety state machine. It does not call `startChatRun()`, reset counters or bypass runtime/continuation limits. Before sending it revalidates master-stop/task scope, chat enabled state, global session, `controlRevision`, stop phrase, completion guards, page/auth state, generation and user draft. The actual dispatch and watchdog restart key are durably checkpointed before optional notification work.\n\nPortable configuration may contain the non-secret `owner/repo`, enabled flag and idle timeout, but excludes observed workflow-run IDs, activity/check timestamps, restart history and watchdog errors.\n\n'''
security = replace_once(security, '## Portable configuration boundary\n', watchdog_security + '## Portable configuration boundary\n', 'security GitHub section')
security_path.write_text(security, encoding='utf-8')

print('Applied ChatPulse 0.7.0 release metadata, static gate and documentation.')
