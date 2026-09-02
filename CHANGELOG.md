# Changelog

## 0.5.5 beta — optional Telegram notifications

- add opt-in Telegram notifications after ChatPulse records an automatic continuation dispatch;
- request `https://api.telegram.org/*` only through `optional_host_permissions` from a direct user gesture;
- keep bot token and chat ID in a separate `chrome.storage.local` config; never expose the token in public runtime state;
- send only the tracked chat title and continuation outcome, never the ChatGPT response text or conversation URL;
- make Telegram delivery failure non-critical so it cannot retry or roll back at-most-once continuation state;
- add a test-send action plus permission/config status in the full options interface;
- keep unrelated command, stop-phrase and interval saves independent of Telegram permission state;
- retain all 0.5.4 stop-phrase, control-revision, recovery and duplicate-prevention regression coverage;
- move reproducible beta packaging/provenance to version 0.5.5.

## 0.5.4 beta — per-chat stop phrase rebuild

- add a configurable stop phrase for completed assistant responses;
- normalize matching with Unicode NFKC, case folding and collapsed whitespace;
- disable only the chat whose latest completed assistant response contains the phrase;
- never dispatch a continuation for a stop-matched response;
- preserve manual re-enable with a control revision so an in-flight check cannot re-disable it;
- keep response text and the configured phrase out of logs;
- add model and service-worker coverage for stop matching, user/generation exclusions and two-chat isolation;
- rebuild the release from current `main` rather than the retired incomplete Issue #14 payload;
- add reproducible beta ZIP packaging with a canonical source manifest and new SHA-256 evidence.

## 0.5.2 beta — release hardening

- derive popup and options version labels from the extension Manifest;
- add a chat from the full options interface by selecting the last used concrete ChatGPT tab;
- reuse and activate an existing tracked tab instead of creating duplicate tabs;
- preserve unsaved command text and interval while switching interface themes;
- surface the latest tab recovery in popup and options runtime status;
- add a full mocked Chrome Tabs/service-worker integration test covering recovery, at-most-once dispatch, adding from options and duplicate-free opening;
- expand static validation and five-cycle CI packaging for version 0.5.2.

## 0.5.1 beta — stale-tab recovery

- detect Chrome `discarded` and `frozen` managed tabs before reading the page;
- mark managed tabs as `autoDiscardable: false` when supported;
- add bounded content-script timeouts and automatic reinjection;
- reload and rehydrate a chat when its content script stops responding or the page reports an error;
- periodically refresh inactive chats every 5–15 minutes to synchronize stale SPA content with the server;
- never perform a periodic refresh on an active tab, during normal generation, or while the composer contains a user draft;
- recover an inactive generation only after it has remained stuck for more than 20 minutes;
- repeat the freshness preflight immediately before sending a continuation command;
- preserve at-most-once dispatch protection across all recovery paths;
- record the last recovery time, reason and recovery count in local state;
- add dedicated stale-tab recovery tests and expand the Manifest V3 audit.

## 0.5.0 beta — Chrome extension

- replaced the unsupported embedded WebKit login with the authenticated Google Chrome profile;
- migrated to Manifest V3;
- added background scheduling with `chrome.alarms`;
- added selected-chat management and automatic tab recovery;
- preserved baseline delay and at-most-once duplicate protection;
- added macOS and ChatPulse Preview themes;
- added local logs, settings and manual diagnostics;
- limited permissions to `alarms`, `scripting`, `storage` and `tabs`;
- added five-cycle CI, ZIP packaging and SHA-256 validation;
- removed the native macOS/WebKit implementation from the active repository branches.

The current repository is Chrome-extension-only.
