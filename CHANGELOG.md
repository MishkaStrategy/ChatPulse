# Changelog

## 0.7.1 beta — active GitHub Actions awareness

- treat every observed non-`completed` GitHub Actions workflow run as active project work that blocks watchdog restart;
- inspect up to 100 recent public workflow runs in the same single read-only API request, while keeping the existing 10-minute polling throttle, eight-repository cap and no-token/no-write boundary;
- refresh repository activity while unfinished runs exist and start a fresh `N`-minute idle window when active work transitions to no active work, so stale pre-run idle time can never cause an immediate restart;
- fail closed when workflow status metadata is missing or malformed, preserving the rule that API/permission/network uncertainty is never treated as inactivity;
- retain new-run activity reset and one-restart-per-marker idempotency after all active work has finished;
- make the Control Center repository field explicit: enter `owner/repo`, for example `MishkaStrategy/ChatPulse`, not a GitHub URL or an `/actions` URL;
- extend deterministic and loaded-Chromium E2E coverage so a real active CI run must block restart before the completed/idle/restart path is exercised;
- move deterministic beta package/provenance output to ChatPulse 0.7.1.

## 0.7.0 beta — GitHub Actions inactivity watchdog

- add an optional per-chat GitHub Actions watchdog bound to a public `owner/repo`;
- interpret repository activity as creation of a new GitHub Actions workflow run and restart a stalled project chat after configured `N` idle minutes;
- establish a fresh baseline on the first successful observation so an old historical run can never cause an immediate restart;
- deduplicate repository polling, throttle public API reads to a 10-minute minimum cadence and cap active unique repositories at eight;
- treat permission, network, 403/404, rate-limit and malformed GitHub API responses as errors only — never as inactivity;
- allow at most one controlled restart-send per workflow-run activity marker until a new run appears;
- preserve existing ChatGPT run counters, runtime limits, stop phrase, `controlRevision`, global session, draft/generation protection and master-stop semantics during watchdog restart;
- persist the real dispatch fingerprint/count/restart key before optional notification work;
- add `api.github.com` only as an `optional_host_permission`; the public v1 client sends no GitHub token/Authorization and performs no repository writes or workflow dispatches;
- expose `owner/repo`, idle timeout and runtime watchdog status in each Control Center profile;
- include watcher configuration in portable JSON while excluding run IDs, activity timestamps, restart history and errors;
- move deterministic beta package/provenance output to ChatPulse 0.7.0.

## 0.6.0 beta — Control Center and guarded task profiles

- add per-chat profiles with inherited/custom continuation command, interval and stop phrase;
- add exact per-run continuation and runtime limits, checked before sending and again after a recorded dispatch so `N` can never become `N+1`;
- add guarded **run until completion** mode that refuses to start without a stop phrase, continuation limit or runtime limit;
- add isolated `taskOnly` engine mode when a task starts from master-stop, so unrelated ordinary chats stay dormant; keep the top Stop action as a full master-stop for active tasks and ordinary monitoring;
- persist at-most-once dispatch fingerprints/counts before Telegram/network notification work and invalidate stale task checks on manual/global stop;
- add schema v4 runtime fields for task progress, completion reason, per-chat scheduling and control-revision-safe profile changes;
- replace the simple chat list in full options with a Control Center showing status, next check, progress, errors and task state for every tracked chat;
- add Telegram operational events for task start, stop phrase, continuation/runtime limits and generic automation errors without sending response text, URL, command or stop phrase;
- add portable JSON configuration export/import for defaults and chat profiles only; credentials, tab IDs, fingerprints, logs, dispatch history and task runtime are excluded;
- leave global monitoring stopped after import and regenerate chat IDs/runtime baselines so imported state cannot replay an old dispatch;
- retain all 0.5.4/0.5.5 stop-phrase, controlRevision, recovery, at-most-once and Telegram optional-permission/privacy guarantees;
- move deterministic package/provenance output to ChatPulse 0.6.0 beta.

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
