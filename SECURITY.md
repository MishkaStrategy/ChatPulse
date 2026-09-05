# Security Policy

## Supported version

Security fixes are applied to the current Chrome extension beta in `main`.

## Reporting a vulnerability

Use a private GitHub Security Advisory:

`https://github.com/mishkacher/ChatPulse/security/advisories/new`

Do not publish sensitive information in a public issue. Never attach:

- cookies or exported browser profiles;
- email addresses, passwords, one-time codes or passkeys;
- private ChatGPT conversation URLs;
- conversation contents;
- Telegram bot tokens or GitHub access tokens;
- screenshots containing account, token, repository-access or billing information.

## Security boundaries

ChatPulse:

- runs locally in Google Chrome;
- has no backend and no telemetry;
- keeps permanent host access restricted to `chatgpt.com` and `chat.openai.com`;
- declares `https://api.telegram.org/*` and `https://api.github.com/*` only as optional host permissions and asks for each from the corresponding direct settings action;
- does not request `cookies`, `history`, `webRequest`, `debugger`, `nativeMessaging` or `<all_urls>`;
- stores ordinary settings, per-chat profiles and runtime state in `chrome.storage.local`;
- stores Telegram chat ID and bot token in a separate local config, while exposing only `enabled`, `chatId`, `tokenConfigured` and permission status to UI runtime state;
- stores GitHub tokens in a separate repository-keyed local credential store, never in `chatpulseState`; when supported, `chrome.storage.local` access is restricted to `TRUSTED_CONTEXTS` so content scripts do not directly read credentials;
- records technical response fingerprints only for duplicate prevention and never intentionally logs Telegram/GitHub tokens, ChatGPT response text or configured stop phrase.

## Per-chat task and limit boundary

Per-chat profiles reuse the same scheduler, freshness-preflight, `controlRevision` and `at-most-once` state machine as ordinary monitoring. Updating a profile advances `controlRevision`; an older in-flight check therefore cannot dispatch using stale command/limit settings.

A continuation limit is checked before dispatch and again immediately after `recordDispatch()`. The count advances only after the dispatch outcome has been fixed, so a limit of `N` permits at most `N` commands, never `N+1`. Runtime limits are checked before a new send. The resulting fingerprint/outcome checkpoint is persisted to local storage before Telegram or other network notification work; a concurrent profile edit keeps the newer profile/control state while still accounting for the real same-run dispatch.

The **run until completion** mode is rejected unless the effective profile has at least one completion guard: stop phrase, continuation limit or runtime limit. Starting a task resets only that chat's run counter/baseline and does not erase the global safety state of other chats. If ordinary monitoring is off, the engine enters `taskOnly` mode and schedules only active task chats; unrelated enabled chats remain dormant. The top Stop action is still a master stop: it turns the engine off and closes active task mode without disabling the chat itself. Manual/global task stop advances `controlRevision`, invalidating any older in-flight task snapshot.

## GitHub Actions watchdog boundary

The watchdog performs only repository-scoped `GET` reads of recent workflow runs. It never writes to a repository, changes workflow state or calls workflow dispatch endpoints. Public repositories remain credential-free by default.

For a private repository, the user may provide a GitHub token. The recommended credential is a fine-grained personal access token restricted to the exact repository with **Actions: Read-only**. Classic PAT `repo` scope is broader and is not recommended. The token is added only as an `Authorization: Bearer …` header to the same Actions workflow-runs read endpoint while browser credentials remain omitted.

The **Проверить токен** action checks the exact configured `owner/repo` workflow-runs endpoint. A pasted token is not persisted by the check itself. When a new token is saved with a profile, ChatPulse first verifies the same read access and only then stores the credential locally. Token values are never returned by the repository-list helper, copied into portable config, logged, or sent to ChatGPT content scripts.

The first successful observation establishes a fresh inactivity baseline. GitHub permission/network/401/403/404/rate-limit/invalid-response failures are errors only and are never converted into a stall. Restart selection is allowed only after a successful current poll. Every observed non-`completed` workflow run is active work and blocks restart; when active work transitions to none, a fresh idle window starts. A workflow-run marker can produce at most one submitted restart until new activity appears.

A watchdog restart stays inside the existing ChatGPT conversation and reuses the existing safety state machine. It does not call `startChatRun()`, reset counters or bypass runtime/continuation limits. Before sending it revalidates master-stop/task scope, chat enabled state, global session, `controlRevision`, stop phrase, completion guards, page/auth state, generation and user draft. The actual dispatch and watchdog restart key are durably checkpointed before optional notification work.

Portable configuration may contain the non-secret `owner/repo`, enabled flag and idle timeout, but excludes GitHub credentials, observed workflow-run IDs, activity/check timestamps, active-run state, restart history and watchdog errors.

## Portable configuration boundary

Export/import is a configuration transport, not a raw storage backup. Export may contain global defaults and per-chat URLs/titles/profiles, but must not contain Telegram bot tokens, GitHub tokens, tab IDs, session IDs, fingerprints, dispatch history, local logs or active task runtime.

Import validates supported ChatGPT URLs/schema, regenerates local chat/runtime identity and baselines, resets counters, and leaves global monitoring stopped. Existing Telegram and GitHub credentials remain in their separate local storage keys and are not overwritten by import.

## Telegram delivery boundary

Telegram notification code is non-critical to continuation state. Continuation notifications are attempted only after ChatPulse has recorded the continuation fingerprint/outcome for at-most-once protection. Operational events may report task start, stop phrase, continuation/runtime limits or a generic automation error.

Telegram receives only the tracked chat title and a fixed event/outcome string. It does not receive the ChatGPT conversation URL, response text, configured stop phrase or continuation command. A Telegram timeout, permission revocation or Bot API error may add a warning to the local journal, but cannot roll back continuation state, resend a ChatGPT command or disable another chat.

Treat the Telegram bot token and GitHub token like passwords: revoke or rotate them immediately if exposed.

## User responsibilities

Install the unpacked extension only from a trusted copy of this repository. Review `manifest.json` before loading it and re-check permissions after updates. For private GitHub repositories, create the narrowest fine-grained token possible and select only the repository that ChatPulse must watch with `Actions: Read-only`. Remove the saved token when no longer needed. If Telegram notifications are no longer needed, disable them and revoke the optional `api.telegram.org` permission in Chrome. For unattended task mode, set a completion guard appropriate to the job and review Control Center status when the task matters.
