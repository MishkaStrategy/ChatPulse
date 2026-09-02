---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 23
updated_at: 2026-09-02T07:28:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.0-github-actions-watchdog
basis_sha: 0d5f8e941c04a2a231dc846c5d45180a7514f78b
---

# HQ Critical Path

## 1. Released predecessor

ChatPulse 0.6.0 beta is RELEASED at product merge `ca202a094424ae637c2ad381b44300fb604ccec8`.
Canonical 0.6.0 ZIP: `54963345846658b7e8794ec3fafbb45fecfd0abcd17fd1e808c75795bfd9b82b`.
Canonical 0.6.0 source manifest: `4e08b1108a7a91ec00299e198a97d92d1af6d631e485a091d30ab03c2b2f7690`.

## 2. Current release contract — ChatPulse 0.7.0 beta

Owner scope: per-chat GitHub Actions inactivity watchdog. A project chat binds to public GitHub `owner/repo`; if no new Actions workflow run appears for configured `N` minutes, ChatPulse may perform one controlled restart-send for that repository inactivity episode.

Interpretation of new repository work: a new latest GitHub Actions workflow-run ID. Restart stays in the same ChatGPT conversation and uses the effective continuation command.

Explicit exclusions: private-repository auth/token, GitHub writes/workflow dispatch, cloud/backend, new ChatGPT conversation, treating API failures as inactivity, resetting normal run/runtime counters, or weakening ordinary scheduler at-most-once behavior.

## 3. Safety contract

- schema v5; watchdog disabled by default;
- strict `owner/repo`; idle 10–10080 minutes;
- public API polling at least every 10 minutes, deduplicated, max eight unique repositories;
- `https://api.github.com/*` is optional host permission only;
- public client sends no Authorization/token and only reads `actions/runs?per_page=1`;
- first successful observation establishes a fresh baseline; historical old run never causes immediate restart;
- new run ID resets inactivity episode/restart idempotency; successful empty list creates baseline at observation time;
- permission/network/403/404/rate-limit/malformed response is error-only;
- restart selection requires successful polling of that repository in the current cycle;
- one activity marker permits at most one submitted restart before a new run appears;
- watchdog does not call `startChatRun()` and preserves run/runtime counters;
- live master engine, task scope, chat enabled, `controlRevision`, global session, completion guards, stop phrase, auth/page state, generation, draft and fresh DOM preflight are revalidated before send;
- watchdog may nudge an already-commanded response only under its independent repository-episode idempotency; ordinary response-level at-most-once remains unchanged;
- actual restart performs `recordDispatch()` + `recordGithubRestart()` and is durably checkpointed before optional notifications;
- master Stop disables watchdog;
- portable config exports only watcher enabled/repository/idle settings, not workflow-run/activity/restart/error runtime.

## 4. Frozen candidate

Branch: `release/0.7.0-github-actions-watchdog`.
Exact frozen head: `0d5f8e941c04a2a231dc846c5d45180a7514f78b`.

Implemented surfaces:
- model/schema v5 and GitHub watchdog transitions;
- read-only `background/github-actions.js` client;
- serialized repository polling and controlled restart runtime;
- optional-permission Control Center fields/status;
- configuration-only portable JSON support;
- 0.7 manifest/package/static validator/workflow/docs/privacy/security.

Final compare against released 0.6 product `ca202a09...`: 19 changed files, all expected watchdog/release surfaces; no temporary HQ helper scripts/workflows and no PR #17 runner-policy content. Branch is ahead only and has the released product commit as merge base.

## 5. Exact branch evidence

Canonical run: `33603354170` on exact head `0d5f8e94...`.

Five independent audit jobs: **5/5 PASS**.
Each exact-head cycle runs the full suite; inspected cycle 4 proves:
- package version `0.7.0-beta.1`;
- **80/80 tests PASS**;
- legacy recovery, active-tab protection, confirmed/unconfirmed at-most-once and stop-phrase regressions PASS;
- GitHub URL/client/error/baseline/idempotency/polling/runtime/permission/export tests PASS;
- static validator PASS: schema v5, optional GitHub boundary, no-token public client, watchdog fail-closed gates, taskOnly/master-stop, durable dispatch, portable config and Telegram privacy.

Exact package/provenance job: `100163016839`, ACTIVE after all five audit jobs passed.
Pre-freeze deterministic smoke hashes (not canonical until exact package job confirms):
- ZIP `36b8decd2e79d782e0b566138ce6a2a81420f1e887b1879dae9b17c2fd55de60`;
- source manifest `da443cde522abf7cc8299983c512ff42dbc8dcd47bf0b6a2104b58cf16c7bed1`;
- packaged extension file count 15.

## 6. Release gates

GATE-1 predecessor 0.6.0: SATISFIED.
GATE-2 schema/watchdog model/migration: SATISFIED.
GATE-3 GitHub client/runtime/fail-closed API handling: SATISFIED.
GATE-4 Control Center/config/docs/optional-permission/privacy: SATISFIED.
GATE-5 exact branch 5-cycle regression: SATISFIED; exact package/security sub-gate ACTIVE.
GATE-6 canonical PR merge-tree equality/reviews/threads: PENDING GATE-5 package.
GATE-7 exact-head merge + post-merge main equality: PENDING GATE-6.

## 7. Current critical path

CP-1 ACTIVE — finish package/provenance job `100163016839`, record exact canonical 0.7 hashes.
CP-2 PENDING — open one canonical non-draft PR after package PASS; verify merge-tree five-cycle/package hash equality plus reviews/threads/mergeability.
CP-3 PENDING — merge exact frozen head and run post-merge `main` release/dependency gates with hash equality.
CP-4 PENDING — persist DONE.

## 8. Active execution registry

HQ: final 0.7.0 candidate validation/release owner.
PROJECT_RUNNER: run `33603354170`, exact head `0d5f8e94...`; audit 5/5 PASS; package job `100163016839` active.
Workers: NONE — remaining release chain is exact-head sequential.
Codex: NONE.
Human gate: NONE.

## 9. Current blockers

NONE. Exact package job is active; no user action required.

## 10. Six critical-path audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS for code/regression/static/diff; package/PR/main evidence remains on critical path.
Release Alignment Audit: PASS — only requested public Actions inactivity watchdog and release plumbing.
Dependency & Ordering Audit: PASS — released 0.6 → model → runtime → UI → release surface → exact branch → PR → main.
Execution & Parallelism Audit: PASS — one canonical writer; project runner validates immutable refs.
Adversarial Audit: PASS — current failed API poll cannot restart; optional permission/direct user gesture; bounded public polling; one restart/activity marker; counters/guards/session/control/draft/generation/master-stop preserved; runtime excluded from export; helper/scope drift absent.

## 11. Next action

Inspect package job `100163016839`; if PASS, persist exact hashes and create canonical non-draft PR. If it fails, repair only the evidence-backed packaging/security defect and refreeze.

## 12. Chat rotation checkpoint

Safe to rotate: YES.
Last completed atomic action: exact frozen 5-cycle audit is 5/5 PASS and final diff/helper audit is clean; revision 23 persisted.
Active external execution: run `33603354170`, package job `100163016839`.
Unpersisted material reasoning: NONE.
Recovery: live-read master + revision 23 + run/job above.
Exact next action after recovery: resolve package job, then PR or evidence-backed repair.
