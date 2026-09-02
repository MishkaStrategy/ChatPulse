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
- stores ordinary settings in `chrome.storage.local`;
- stores Telegram chat ID and bot token in a separate local config, while exposing only `enabled`, `chatId`, `tokenConfigured` and permission status to UI runtime state;
- records only technical response fingerprints for duplicate prevention and never intentionally logs the Telegram token, ChatGPT response text or configured stop phrase.

## Telegram delivery boundary

Telegram notification code runs only after ChatPulse has already recorded the continuation fingerprint/outcome for at-most-once protection. A Telegram timeout, permission revocation or Bot API error is non-critical: it may add a warning to the local journal, but it cannot roll back continuation state, resend a ChatGPT command or disable another chat.

Telegram receives only the tracked chat title and the continuation outcome. It does not receive the ChatGPT conversation URL or response text. Treat the Telegram bot token like a password: rotate it through BotFather if it is ever exposed.

## User responsibilities

Install the unpacked extension only from a trusted copy of this repository. Review `manifest.json` before loading it and re-check permissions after updates. If Telegram notifications are no longer needed, disable them and revoke the optional `api.telegram.org` permission in Chrome.
