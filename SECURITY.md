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
- declares `https://api.telegram.org/*` only as an optional host permission and asks for it from a direct settings action;
- does not request `cookies`, `history`, `webRequest`, `debugger`, `nativeMessaging` or `<all_urls>`;
- stores ordinary settings, per-chat profiles and runtime state in `chrome.storage.local`;
- stores Telegram chat ID and bot token in a separate local config, while exposing only `enabled`, `chatId`, `tokenConfigured` and permission status to UI runtime state;
- records technical response fingerprints only for duplicate prevention and never intentionally logs the Telegram token, ChatGPT response text or configured stop phrase.

## Per-chat task and limit boundary

Per-chat profiles reuse the same scheduler, freshness-preflight, `controlRevision` and `at-most-once` state machine as ordinary monitoring. Updating a profile advances `controlRevision`; an older in-flight check therefore cannot dispatch using stale command/limit settings.

A continuation limit is checked before dispatch and again immediately after `recordDispatch()`. The count advances only after the dispatch outcome has been fixed, so a limit of `N` permits at most `N` commands, never `N+1`. Runtime limits are checked before a new send. The resulting fingerprint/outcome checkpoint is persisted to local storage before Telegram or other network notification work; a concurrent profile edit keeps the newer profile/control state while still accounting for the real same-run dispatch.

The **run until completion** mode is rejected unless the effective profile has at least one completion guard: stop phrase, continuation limit or runtime limit. Starting a task resets only that chat's run counter/baseline and does not erase the global safety state of other chats. If ordinary monitoring is off, the engine enters `taskOnly` mode and schedules only active task chats; unrelated enabled chats remain dormant. The top Stop action is still a master stop: it turns the engine off and closes active task mode without disabling the chat itself. Manual/global task stop advances `controlRevision`, invalidating any older in-flight task snapshot.

## Portable configuration boundary

Export/import is a configuration transport, not a raw storage backup. Export may contain global defaults and per-chat URLs/titles/profiles, but must not contain Telegram bot tokens, tab IDs, session IDs, fingerprints, dispatch history, local logs or active task runtime.

Import validates supported ChatGPT URLs/schema, regenerates local chat/runtime identity and baselines, resets counters, and leaves global monitoring stopped. Existing Telegram credentials remain in their separate local storage key and are not overwritten by import.

## Telegram delivery boundary

Telegram notification code is non-critical to continuation state. Continuation notifications are attempted only after ChatPulse has recorded the continuation fingerprint/outcome for at-most-once protection. Operational events may report task start, stop phrase, continuation/runtime limits or a generic automation error.

Telegram receives only the tracked chat title and a fixed event/outcome string. It does not receive the ChatGPT conversation URL, response text, configured stop phrase or continuation command. A Telegram timeout, permission revocation or Bot API error may add a warning to the local journal, but cannot roll back continuation state, resend a ChatGPT command or disable another chat.

Treat the Telegram bot token like a password: rotate it through BotFather if it is ever exposed.

## User responsibilities

Install the unpacked extension only from a trusted copy of this repository. Review `manifest.json` before loading it and re-check permissions after updates. If Telegram notifications are no longer needed, disable them and revoke the optional `api.telegram.org` permission in Chrome. For unattended task mode, set a completion guard appropriate to the job and review Control Center status when the task matters.
