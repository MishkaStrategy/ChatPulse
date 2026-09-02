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
- Telegram bot tokens;
- screenshots containing account or billing information.

## Security boundaries

ChatPulse:

- runs locally in Google Chrome;
- has no backend and no telemetry;
- keeps permanent host access restricted to `chatgpt.com` and `chat.openai.com`;
- declares `https://api.telegram.org/*` and `https://api.github.com/*` only as optional host permissions and asks for each from the corresponding direct settings action;
- does not request `cookies`, `history`, `webRequest`, `debugger`, `nativeMessaging` or `<all_urls>`;
- stores ordinary settings, per-chat profiles and runtime state in `chrome.storage.local`;
- stores Telegram chat ID and bot token in a separate local config, while exposing only `enabled`, `chatId`, `tokenConfigured` and permission status to UI runtime state;
- records technical response fingerprints only for duplicate prevention and never intentionally logs the Telegram token, ChatGPT response text or configured stop phrase.

## Per-chat task and limit boundary

Per-chat profiles reuse the same scheduler, freshness-preflight, `controlRevision` and `at-most-once` state machine as ordinary monitoring. Updating a profile advances `controlRevision`; an older in-flight check therefore cannot dispatch using stale command/limit settings.

A continuation limit is checked before dispatch and again immediately after `recordDispatch()`. The count advances only after the dispatch outcome has been fixed, so a limit of `N` permits at most `N` commands, never `N+1`. Runtime limits are checked before a new send. The resulting fingerprint/outcome checkpoint is persisted to local storage before Telegram or other network notification work; a concurrent profile edit keeps the newer profile/control state while still accounting for the real same-run dispatch.

The **run until completion** mode is rejected unless the effective profile has at least one completion guard: stop phrase, continuation limit or runtime limit. Starting a task resets only that chat's run counter/baseline and does not erase the global safety state of other chats. If ordinary monitoring is off, the engine enters `taskOnly` mode and schedules only active task chats; unrelated enabled chats remain dormant. The top Stop action is still a master stop: it turns the engine off and closes active task mode without disabling the chat itself. Manual/global task stop advances `controlRevision`, invalidating any older in-flight task snapshot.

## GitHub Actions watchdog boundary

The 0.7.0 watchdog is read-only and public-repository-only. It sends no GitHub token or `Authorization` header, performs no GitHub writes and never dispatches workflows. Public API polling is deduplicated by repository, throttled to a fixed safe cadence and bounded to a small number of unique repositories.

The first successful observation establishes a fresh inactivity baseline. GitHub permission/network/403/404/rate-limit/invalid-response failures are errors only and are never converted into a stall. Restart selection is allowed only after a successful current poll, and a workflow-run marker can produce at most one submitted restart until a new run appears.

A watchdog restart stays inside the existing ChatGPT conversation and reuses the existing safety state machine. It does not call `startChatRun()`, reset counters or bypass runtime/continuation limits. Before sending it revalidates master-stop/task scope, chat enabled state, global session, `controlRevision`, stop phrase, completion guards, page/auth state, generation and user draft. The actual dispatch and watchdog restart key are durably checkpointed before optional notification work.

Portable configuration may contain the non-secret `owner/repo`, enabled flag and idle timeout, but excludes observed workflow-run IDs, activity/check timestamps, restart history and watchdog errors.

## Portable configuration boundary

Export/import is a configuration transport, not a raw storage backup. Export may contain global defaults and per-chat URLs/titles/profiles, but must not contain Telegram bot tokens, tab IDs, session IDs, fingerprints, dispatch history, local logs or active task runtime.

Import validates supported ChatGPT URLs/schema, regenerates local chat/runtime identity and baselines, resets counters, and leaves global monitoring stopped. Existing Telegram credentials remain in their separate local storage key and are not overwritten by import.

## Telegram delivery boundary

Telegram notification code is non-critical to continuation state. Continuation notifications are attempted only after ChatPulse has recorded the continuation fingerprint/outcome for at-most-once protection. Operational events may report task start, stop phrase, continuation/runtime limits or a generic automation error.

Telegram receives only the tracked chat title and a fixed event/outcome string. It does not receive the ChatGPT conversation URL, response text, configured stop phrase or continuation command. A Telegram timeout, permission revocation or Bot API error may add a warning to the local journal, but cannot roll back continuation state, resend a ChatGPT command or disable another chat.

Treat the Telegram bot token like a password: rotate it through BotFather if it is ever exposed.

## User responsibilities

Install the unpacked extension only from a trusted copy of this repository. Review `manifest.json` before loading it and re-check permissions after updates. If Telegram notifications are no longer needed, disable them and revoke the optional `api.telegram.org` permission in Chrome. For unattended task mode, set a completion guard appropriate to the job and review Control Center status when the task matters.
