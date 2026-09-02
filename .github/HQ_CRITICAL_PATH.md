---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 22
updated_at: 2026-09-02T07:24:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.0-github-actions-watchdog
basis_sha: 0d5f8e941c04a2a231dc846c5d45180a7514f78b
---

# HQ Critical Path

## 1. Released predecessor

ChatPulse 0.6.0 beta is RELEASED.
Product merge on main: `ca202a094424ae637c2ad381b44300fb604ccec8`.
Canonical 0.6.0 ZIP: `54963345846658b7e8794ec3fafbb45fecfd0abcd17fd1e808c75795bfd9b82b`.
Canonical 0.6.0 source manifest: `4e08b1108a7a91ec00299e198a97d92d1af6d631e485a091d30ab03c2b2f7690`.
Branch/PR/main five-cycle evidence and dependency runner policy are PASS.

## 2. Current release contract — ChatPulse 0.7.0 beta

Owner scope: per-chat GitHub Actions inactivity watchdog. A project chat may bind to public GitHub `owner/repo`; if no new Actions workflow run is created for configured `N` minutes, ChatPulse may perform one controlled restart-send for that inactivity episode.

Interpretation of new repository work: appearance of a new latest GitHub Actions workflow-run ID. Restart stays in the same ChatGPT conversation and uses the chat's effective continuation command.

Explicit exclusions: private-repository auth/token, GitHub writes/workflow dispatch, cloud/backend, opening a new ChatGPT conversation, counting API failures as inactivity, resetting run/runtime counters, or changing ordinary scheduler at-most-once behavior.

## 3. Safety contract

- schema v5; watchdog disabled by default;
- strict `owner/repo` normalization;
- idle window bounded 10–10080 minutes;
- GitHub public API poll cadence at least 10 minutes;
- at most eight unique watched repositories and deduplicated polling per cycle;
- GitHub API is only `optional_host_permissions: https://api.github.com/*`;
- public client sends no Authorization/token and makes read-only `actions/runs?per_page=1` requests;
- first successful observation always establishes a fresh baseline, never immediate restart;
- new workflow-run ID resets inactivity episode/restart key;
- successful empty run list creates baseline at observation time;
- permission/network/403/404/rate-limit/malformed response records error only;
- restart candidates are selected only for repositories successfully polled in the current watchdog cycle;
- one activity marker permits at most one submitted restart before a new run appears;
- restart does not call `startChatRun()`, so `runStartedAt` and continuation count are preserved;
- before send: master engine/chat/task scope, `controlRevision`, global session, limits, stop phrase, auth/page-ready, generation, draft and fresh preflight are revalidated;
- watchdog may intentionally nudge an externally stalled response under its separate repository-episode idempotency, while the ordinary scheduler's response-level at-most-once path remains unchanged;
- actual restart is a real `recordDispatch()` plus `recordGithubRestart()` and is durably checkpointed before optional notification;
- master Stop disables watchdog;
- portable config includes only watcher enabled/repository/idle settings and excludes all run/activity/restart/error runtime state.

## 4. Implemented candidate

Canonical branch: `release/0.7.0-github-actions-watchdog`.
Current frozen candidate: `0d5f8e941c04a2a231dc846c5d45180a7514f78b`.

Core/model:
- GitHub watcher profile + runtime fields and migration to schema v5;
- baseline/activity/error/restart/poll transitions;
- dispatch-checkpoint merge preserves real watchdog restart through concurrent profile edits;
- watcher runtime reset never resets normal run/runtime counters.

GitHub client/runtime:
- new `background/github-actions.js` read-only public client;
- serialized watchdog uses same `activeCheck` lock as normal scheduler;
- separate 10-minute watchdog alarm;
- repository polling dedup/cap/throttle;
- current-success gate prevents stale baseline restart after an API failure;
- controlled same-chat restart with stop/limit/session/control/draft/generation preflight and durable dispatch checkpoint.

Control Center/config:
- per-chat GitHub enabled toggle, `owner/repo`, idle `N`, status/activity/restart/error display;
- optional permission requested directly from Save/Start user gesture (no asynchronous `permissions.contains` before request);
- portable export carries configuration only and drops all watchdog runtime history.

Release surface:
- Manifest/package set to 0.7.0 beta / 0.7.0-beta.1;
- syntax gate includes `github-actions.js`;
- static validator asserts schema-v5/watchdog/privacy/optional-permission/no-Authorization boundaries;
- deterministic package names moved to 0.7.0;
- README/CHANGELOG/PRIVACY/SECURITY updated;
- exact 0.7 release workflow listens to `release/0.7.0-github-actions-watchdog`, PRs to main and main.

## 5. Evidence so far

Core focused gate: PASS.
Runtime focused/full regression gate: PASS; current suite grew from 58 to 77 tests before UI.
Control Center/UI gate: PASS; suite grew to 80 tests.
Release-surface smoke before workflow control-plane split: 80/80 PASS, static audit PASS, deterministic package PASS.
Observed pre-freeze package smoke hashes (must be re-proven at frozen head):
- ZIP `36b8decd2e79d782e0b566138ce6a2a81420f1e887b1879dae9b17c2fd55de60`;
- source manifest `da443cde522abf7cc8299983c512ff42dbc8dcd47bf0b6a2104b58cf16c7bed1`;
- packaged extension file count 15.
Permission-gesture hardening gate: PASS with all regressions.
All temporary helper scripts/workflows are removed from frozen candidate.

## 6. Release gates

GATE-1 0.6.0 predecessor release: SATISFIED.
GATE-2 schema/watchdog decision model + migration: SATISFIED.
GATE-3 GitHub client/runtime controlled restart + fail-closed API handling: SATISFIED.
GATE-4 Control Center/config/docs + optional-permission/privacy boundary: SATISFIED.
GATE-5 exact frozen branch 5-cycle regression/package/security: ACTIVE.
GATE-6 canonical PR merge-tree equality/reviews/threads: PENDING GATE-5.
GATE-7 exact-head merge + post-merge main equality: PENDING GATE-6.

## 7. Current critical path

CP-1 ACTIVE — resolve exact-head run `33603354170` for `0d5f8e94...`; require 5/5 cycles, 80/80 tests each, static PASS and reproducible 0.7 package/provenance.
CP-2 PENDING — adversarial final diff review against released product `ca202a09...`, confirm no helper files/scope drift and canonical hashes.
CP-3 PENDING — open one canonical non-draft PR, verify merge-tree exact evidence plus reviews/threads/mergeability.
CP-4 PENDING — merge exact head, run post-merge main release gate and dependency policy, verify hashes, persist DONE.

## 8. Active execution registry

HQ: final 0.7.0 candidate validation and release owner.
PROJECT_RUNNER: run `33603354170`, branch `release/0.7.0-github-actions-watchdog`, exact head `0d5f8e941c04a2a231dc846c5d45180a7514f78b`, last observed queued.
Workers: NONE — validation/release chain is sequential and exact-head-sensitive.
Codex: NONE.
Human gate: NONE.

## 9. Current blockers

NONE. Exact-head runner execution is pending/active; no user action required.

## 10. Six critical-path audits

Repository Coverage Audit: PASS — manifest/model/service worker/GitHub client/Control Center/portable config/tests/static validator/package/workflow/docs/privacy/security covered.
Evidence Audit: PASS for implementation; final exact-head/merge-tree/main evidence still pending gates.
Release Alignment Audit: PASS — only requested public GitHub Actions inactivity watchdog; no private auth/writes/cloud/new-chat scope.
Dependency & Ordering Audit: PASS — predecessor released first; model → runtime → UI → release surface → exact validation.
Execution & Parallelism Audit: PASS — one canonical writer and deterministic project runner; no conflicting worker writes.
Adversarial Audit: PASS at freeze — current API failure cannot trigger restart, polling bounded, permission remains optional/direct-gesture, one restart per activity episode, counters/guards/session/control/draft/generation preserved, runtime excluded from export.

## 11. Next action

Inspect run `33603354170`; on green, perform final diff/helper audit and open canonical non-draft 0.7.0 PR. On any failure, repair only the evidence-backed defect and re-freeze a new exact head.

## 12. Chat rotation checkpoint

Safe to rotate: YES.
Last completed atomic action: 0.7.0 candidate frozen at `0d5f8e94...`; exact release workflow committed HQ_DIRECT; revision 22 persisted.
Active external execution: run `33603354170`.
Unpersisted material reasoning: NONE.
Recovery: live-read master + revision 22 + branch head + run `33603354170`.
Exact next action after recovery: inspect exact-head release run, then adversarial diff/PR or evidence-backed repair.
