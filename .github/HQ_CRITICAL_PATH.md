---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 61
updated_at: 2026-09-07T12:45:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.7-edit-chat-url
basis_sha: ff93a7d96f92dd14ee8760e9243c05ba07624a84
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — (1) edit/rebind the concrete ChatGPT conversation URL of an already configured ChatPulse chat without reconfiguration, and (2) make one shared GitHub PAT transparently verifiable across all configured GitHub-watch repositories with explicit per-repository credential-source diagnostics.

Release surface: safe chat-URL identity mutation; background persistence; Control Center URL editor; shared PAT multi-repository verification/diagnostics; focused tests; 0.7.7 release metadata; CI; reproducible package/provenance.

Definition of RELEASED:
- existing chat URL can be replaced while preserving ChatPulse identity/configuration/task guards/GitHub-watch state and clearing only page-bound runtime;
- shared PAT remains one extension-local credential and verification covers every unique configured watchdog repository plus an optional explicit test repository;
- per-repository result shows shared-PAT success/failure and whether watchdog runtime will use shared PAT or a repository-specific override;
- watchdog polling remains independent per unique repository and read-only;
- invalid/duplicate chat URLs are rejected; secrets never enter state/export/messages/logs.

Mandatory release gates:
- [ ] safe atomic URL mutation + runtime reset implemented/tested;
- [ ] Control Center URL editing preserves existing configuration;
- [ ] shared PAT multi-repository verification/diagnostics implemented/tested;
- [ ] frozen 0.7.7 branch passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and hashes reproduce frozen candidate.

Required release evidence: exact refs/SHAs; URL mutation behavior/wiring tests; shared-PAT multi-repository UI tests; full audit/E2E/package provenance; PR/merge; exact-main proof.

Known explicit exclusions: no content migration/cloning; no task-limit reset; no GitHub write/workflow dispatch; no automatic token generation/permission escalation; no unrelated Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Critical-path basis ref: `release/0.7.7-edit-chat-url`.
Critical-path basis SHA before active writer: `ff93a7d96f92dd14ee8760e9243c05ba07624a84`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR: NONE yet.
Relevant control execution: ai-control run `34123228608`; coordinator job `101745838567` SUCCESS; exact one-file executor job `101745976673` IN_PROGRESS.
Relevant release state: 0.7.6 DONE; 0.7.7 CP-1B product patch present; CP-1A service-worker wiring actively executing.

## 3. Repository Scan Summary

Architecture relevant to release: `lib/chat-url-mutation.js` pure identity mutation; `background/service-worker-v2.js` persistence/message boundary; `options/chat-url-ui.js` URL editor; `options/github-token-ui.js` shared PAT UI; existing GitHub watchdog remains per-repository read-only polling.

Material findings:
- Prior broad Codex task was safely terminalized as `ORPHANED_EXECUTOR_TERMINAL_PERSISTENCE_FAILED`; target branch had zero product mutation from that attempt.
- CP-1B direct commits now change only `chrome-extension/options/github-token-ui.js` and `tests/chrome-extension/github-watchdog-ui.test.mjs`: shared-PAT save/test enumerates enabled watchdog repositories, reports each result, and labels runtime credential source (`общий PAT` vs `отдельный override`).
- CP-1A supporting product code is already on the release branch: new pure `chat-url-mutation.js`, new `chat-url-ui.js`, focused `chat-url-update.test.mjs`, and Control Center dynamic import. The only missing product wiring is `UPDATE_CHAT_URL` handling in the large service worker.
- The active Codex retry is materially reduced to one existing file / <=60 changed lines, explicitly shell-only, source-fresh at `ff93a7d...`.
- No ChatPulse project CI runs on direct release-branch pushes; branch implementation therefore remains VERIFYING until focused/full validation is obtained through the canonical validation path.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: pure mutation + UI + focused test exist; service-worker message/persistence wiring is active in executor `101745976673`.
Blocking items: exact one-file terminal commit + independent test verification.

### GATE-2 — Shared PAT multi-repository verification and diagnostics
Status: UNSATISFIED
Evidence: product diff exists at commits `3741bc16...` / `c7c899c1...` and is included in current release history; exact diff is limited to PAT UI + focused UI test.
Blocking items: independent focused/full validation before SATISFIED claim.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Blocking items: GATE-1/GATE-2 + 0.7.7 metadata and branch validation.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: GATE-3.

### GATE-5 — Post-merge main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1A — Editable chat URL with safe identity mutation
Status: ACTIVE
Release gate: GATE-1.
Depends on: none.
Blocks: CP-2.
Execution plane: CODEX one-file last-resort wiring after HQ_DIRECT supporting files.
Exact scope: active writer may modify only `chrome-extension/background/service-worker-v2.js`; supporting helper/UI/test are already present.
Acceptance condition: `UPDATE_CHAT_URL` is identity-safe, background-mediated, preserves config/task/GitHub state, resets page runtime only on actual change, rejects invalid/duplicate, no-op leaves runtime intact, focused/full validation green.
Evidence: ai-control task `chatpulse-0-7-7-url-service-worker-wire-20260907T1238Z`; run `34123228608`; job `101745976673` IN_PROGRESS; source `ff93a7d...`.

### CP-1B — Shared PAT all-repository verification
Status: VERIFYING
Release gate: GATE-2.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: `options/github-token-ui.js` + `github-watchdog-ui.test.mjs`.
Acceptance condition: unique enabled watchdog repos automatically tested; optional extra repo supported; per-repo shared-PAT result + runtime source visible; no secret/runtime-message leakage; legacy override compatibility retained.
Evidence: exact two-file implementation diff from `0fcb78f...` through `c7c899c1...`, then dynamic URL-editor import at `ff93a7d...`.

### CP-2 — Freeze 0.7.7 metadata and validate candidate
Status: PENDING
Depends on: CP-1A + CP-1B.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance: 0.7.7 version/package/validator/workflow metadata; 5/5 audits + Chromium E2E + reproducible artifact/provenance.

### CP-3 — Canonical PR integration
Status: PENDING
Depends on: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance: exact validated head merge after checks/reviews/mergeability pass.

### CP-4 — Exact post-merge main proof
Status: PENDING
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance: exact-main release/dependency gates green and package hashes match frozen candidate.

## 6. Active Execution Registry

HQ: release owner; no release-branch mutation while exact service-worker executor owns source freshness.
Workers: NONE.
Codex: task `chatpulse-0-7-7-url-service-worker-wire-20260907T1238Z`; run `34123228608`; job `101745976673`; one-file write surface; expected commit + test evidence + terminal task transition.
Zero-model control: coordinator `101745838567` SUCCESS and exact claim persisted.
CI/runtime: no ChatPulse product CI active yet.

## 7. Safe Parallel Work

NONE — remaining implementation is one active source writer. Release metadata/CI follows verified CP-1 completion.

## 8. Current Blockers

NONE. Active executor is not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — exact commits, diffs, task, run/job and source SHA live-verified.
Release Alignment Audit: PASS — changes map only to owner-requested URL rebind and shared-PAT diagnostics.
Dependency & Ordering Audit: PASS — implementation precedes release metadata/freeze/PR/main proof.
Execution & Parallelism Audit: PASS — one active product writer; prior orphan terminalized; no duplicate execution.
Adversarial Audit: PASS — duplicate URL, stale page dispatch inheritance, active-check race, shared-PAT false-positive semantics, override shadowing and secret leakage all have explicit acceptance checks.

## 10. Next Action

Exact next action: reconcile executor `101745976673` terminal state and release-branch head. On product commit, independently inspect one-file diff and focused/full test evidence; if valid, satisfy GATE-1/GATE-2 and advance CP-2. If executor fails without branch mutation, use an exact manual one-file fallback rather than another broad retry.
Executor: HQ.
Expected evidence: exact service-worker commit, terminal task result, focused/full tests.
Acceptance condition: no release freeze until both feature gates are independently verified.

## 11. Last Material Revision

What changed: old orphaned Codex task terminalized; CP-1B implemented directly; CP-1A decomposed into pure helper/UI/test plus one active service-worker wiring task.
Why: broad executor had failed; smaller source-fresh scope minimizes risk and avoids duplicate work.
Evidence: ai-control terminal recovery commits; ChatPulse commits through `ff93a7d...`; active run/job IDs above.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: persisted exact active one-file executor after direct supporting implementation.
Active external executions and exact refs: ai-control run `34123228608` / executor `101745976673`; task `chatpulse-0-7-7-url-service-worker-wire-20260907T1238Z`; product source `release/0.7.7-edit-chat-url@ff93a7d...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r61 + exact task/run/job + release branch.
Exact next action after recovery: reconcile terminal executor, verify diff/tests, then CP-2.
Rotation blockers: NONE.
