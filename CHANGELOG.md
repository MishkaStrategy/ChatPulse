# Changelog

## 0.8.5 beta — reliable overnight monitoring after first project chat

- foreground each due Pulse 2.0 managed chat tab before reading assistant state or sending an auto-response, then restore the user's previous tab when it is still safe to do so;
- keep the tab foregrounded when a due monitoring check transitions into project rotation;
- decouple assistant-observation polling from the configured auto-response delay: monitoring wakes every 30 seconds but only routes whose `nextCheckAt` is due are touched;
- after initial project-chat URL capture and after every auto-response dispatch, schedule a 30-second recheck so the next assistant response is discovered promptly instead of waiting the full configured delay before observation;
- keep the configured delay (for example 1 hour) as the actual stability delay counted after a specific assistant response is first observed;
- retry transient page/generation/waiting states at 30 seconds and authentication/page-error states at a bounded 5-minute backoff;
- preserve project-scoped current chat URLs such as `/g/<project>/c/<chat-id>`;
- add loaded-Chromium alarm-driven regression coverage for the overnight path and safe focus restoration;
- move deterministic beta package/provenance output to ChatPulse 0.8.5.

## 0.8.4 beta — foreground Project tab before new-chat creation

- when Pulse 2.0 starts a route without a current chat, open its Project tab as an active Chrome tab instead of leaving project initialization entirely in the background;
- before every first-chat or next-chat rotation, explicitly activate the route-owned managed tab and focus its Chrome window when possible;
- keep the Project tab foregrounded through page-load settling, project-composer discovery and start-message submission so ChatGPT can fully hydrate controls that may not render in a background tab;
- keep ordinary monitoring of existing chats background-capable; foreground switching is scoped to project-chat creation/rotation;
- retain the 0.8.3 rotation recovery watchdog and make recovery attempts foreground the same managed tab before composer lookup;
- add loaded-Chromium regression coverage that starts with the Project tab intentionally in the background and requires Pulse to make it active before rotation succeeds;
- move deterministic beta package/provenance output to ChatPulse 0.8.4.

## 0.8.3 beta — recover stalled first project-chat creation

- create each managed tab synchronously during START, using the current chat when present or the Project page when the current chat is empty;
- add a dedicated 30-second recovery alarm for Pulse 2.0 routes in the `rotating` / project-chat-creation phase;
- make persisted rotating routes resume after a Manifest V3 service-worker sleep/restart instead of remaining indefinitely on **Создание первого чата**;
- record a rotation attempt timestamp in runtime so the UI no longer looks permanently untouched while work is actually running;
- avoid reloading a project page that is already open in the managed tab;
- if the start message was already sent and the managed tab has already become a new concrete `/c/...` URL before a background interruption, adopt that chat and continue URL capture instead of creating a duplicate chat;
- add loaded-Chromium regression coverage that seeds the exact persisted stuck state and verifies alarm-driven recovery without another user action;
- move deterministic beta package/provenance output to ChatPulse 0.8.3.

## 0.8.2 beta — current ChatGPT Project composer compatibility

- recognize the current project landing composer shown as **Новый чат в … / New chat in …** even when no separate New chat button exists;
- activate that composer shell and wait for the real textarea/contenteditable before sending the start message;
- wait up to 12 seconds for bounded project UI hydration instead of failing after a one-shot lookup;
- retain the legacy explicit New chat button path as a fallback;
- add loaded-Chromium regression coverage reproducing the screenshot-style project layout with no New chat button;
- move deterministic beta package/provenance output to ChatPulse 0.8.2.

## 0.7.4 beta — independent GitHub Actions scheduling

- fix a scheduler starvation bug where each ordinary interval check recreated/postponed the GitHub 10-minute alarm and each GitHub watchdog check could recreate/postpone a longer ordinary alarm;
- preserve unchanged Chrome alarms and only recreate the specific scheduler whose desired period actually changed;
- serialize simultaneous ordinary and GitHub scheduler triggers so a later trigger is queued with its own source/parameters instead of being dropped behind an active check;
- treat a fresh ChatGPT document that temporarily reports unauthenticated as a 60-second warm-up, then retry through a one-shot alarm with a fresh GitHub Actions read before any restart send;
- add per-chat **Только GitHub Actions** mode: no automatic ordinary interval checks for that chat while the Actions watchdog remains active;
- keep manual **Проверить сейчас** available in Actions-only mode and keep global Stop as the master stop for all automatic sends;
- preserve active-run blocking, active-to-idle fresh countdown, fail-closed API errors, private-token isolation and one-restart-per-workflow-marker semantics;
- add a regression proving more than two independent workflow-run inactivity episodes can restart normally;
- move deterministic beta package/provenance output to ChatPulse 0.7.4.

## 0.7.3 beta — replace hung background tabs

- replace hard-hung managed background ChatGPT tabs with a fresh inactive tab for the exact same conversation URL instead of reloading the broken tab;
- classify discarded, frozen, content-unreachable, page-error and 20-minute stuck-generation recovery as replacement recovery;
- keep active tabs and user drafts protected from destructive recovery;
- keep normal generation untouched until the existing stuck threshold is reached;
- keep periodic freshness as a soft reload rather than creating a new tab;
- add rollback if the old tab cannot be removed after replacement creation;
- preserve GitHub watchdog, private token isolation, continuation guards and at-most-once dispatch semantics;
- move deterministic beta package/provenance output to ChatPulse 0.7.3.

## 0.7.2 beta — private GitHub Actions access

- add private-repository GitHub Actions watchdog support through a repository-keyed GitHub token stored only in local extension storage;
- recommend a fine-grained PAT restricted to the exact repository with `Actions: Read-only`; classic PAT `repo` scope remains compatible but is broader and not recommended;
- add a masked GitHub token field, **Проверить токен** control and explicit access status to each per-chat GitHub watchdog profile;
- verify a pasted token against the exact configured `owner/repo` workflow-runs read endpoint before saving a new credential;
- keep public repositories token-optional and unauthenticated by default;
- restrict `chrome.storage.local` to `TRUSTED_CONTEXTS` when supported so content scripts cannot directly read locally stored credentials;
- keep GitHub tokens outside `chatpulseState`, portable export, logs, runtime messages and ChatGPT content-script traffic;
- keep the GitHub client read-only: bounded `GET` workflow-run reads only, no workflow dispatch or repository writes;
- preserve 0.7.1 unfinished-run blocking, active-to-idle fresh baseline, fail-closed API handling and one-restart-per-marker semantics;
- move deterministic beta package/provenance output to ChatPulse 0.7.2.

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
