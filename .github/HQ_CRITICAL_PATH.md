---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 57
updated_at: 2026-09-07T11:57:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.7-edit-chat-url
basis_sha: 0fcb78f1149257bb7ea390e6d28e9d85a59e179c
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — edit/rebind the ChatGPT conversation URL of an already configured ChatPulse chat after recreation without configuring that chat again.

Release surface: model/state identity mutation, service-worker mutation/persistence, Control Center URL editor, focused safety tests, 0.7.7 metadata, release CI and reproducible package/provenance.

Definition of RELEASED: an existing configured chat can save a different valid concrete ChatGPT conversation URL while keeping the same ChatPulse chat ID, profile/configuration, task guards/counters and GitHub-watch state. An actual URL change clears only stale page-bound tab/fingerprint/dispatch/observation/recovery/error state and increments control revision. Invalid/non-chat URLs and URLs already owned by another configured chat are rejected. URL save goes through background mutation, not direct options-page storage writes.

Mandatory release gates:
- [ ] safe atomic URL mutation + runtime reset implemented/tested;
- [ ] Control Center URL editing preserves existing configuration;
- [ ] exact frozen 0.7.7 branch passes 5/5 audits, Chromium MV3 E2E and finalized reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and inner hashes reproduce frozen candidate.

Required release evidence: exact refs/SHAs/task/run IDs, focused URL tests, static/UI/background assertions, five audit cycles, Chromium E2E, reproducible hashes/artifacts, PR/merge and exact-main proof.

Known explicit exclusions: no ChatGPT content migration/cloning; no profile recreation; no task-limit reset; no GitHub credential/write/workflow-dispatch changes; no unrelated watchdog/Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`; HQ commits after branch creation are state-only.
Default branch observed SHA before this state write: `87b91f4f26795e17dfd125f7030875a081f07f0a`.
Critical-path basis ref: `release/0.7.7-edit-chat-url`.
Critical-path basis SHA: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only, unrelated/excluded.
Relevant CI / workflows: ai-control run `34117489614` attempt 2; coordinator job `101732616577` SUCCESS; ChatPulse model executor job `101732751791` IN_PROGRESS.
Relevant release/deployment state: 0.7.6 DONE; 0.7.7 CP-1 actively executing.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 local ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture / major components: `lib/model-v2.js` chat state; `background/service-worker-v2.js` identity mutations/persistence; `options/options.html`/`options.js` Control Center editing.
Build / packaging: Node audits + deterministic Python ZIP/source manifest.
Tests / validation: model/service-worker/profile/config tests, static validator, loaded Chromium E2E.
CI: five audit cycles + Chromium E2E + reproducible package/provenance and dependency policy.
Release / deployment: frozen branch -> canonical PR -> merge -> exact-main proof.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository; `MishkaStrategy/ai-control` authorized execution-control exception.
External release dependencies: current Codex executor, then GitHub Actions runners/artifact service.
Material findings: the prior capacity wait was caused by an orphaned NoDelete running record. Exact recovery was safe because its model job had ended, terminal persistence failed, and target branch remained unchanged. After freeing one slot and rerunning only the coordinator under changed state, ChatPulse task moved `queued -> running` while release source remained exactly `0fcb78f...`. The exact model executor job `101732751791` is now executing step 9; no competing writer exists.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: exact bounded implementation task is actively executing on source-fresh branch.
Blocking items: terminal implementation result and HQ diff/test verification.

### GATE-2 — Control Center URL editing
Status: UNSATISFIED
Evidence: same active task owns UI wiring.
Blocking items: terminal implementation result.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Evidence: release branch remains pre-implementation until executor writes/commits.
Blocking items: GATE-1/GATE-2, metadata and branch CI.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Evidence: no PR yet.
Blocking items: GATE-3.

### GATE-5 — Post-merge main proof
Status: UNSATISFIED
Evidence: no merge yet.
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Implement editable chat URL with safe identity mutation
Status: ACTIVE
Release gate: GATE-1 + GATE-2.
Why critical: requested feature and identity safety boundary.
Depends on: none.
Blocks: CP-2.
Execution plane: CODEX bounded existing-ref patch; placement gate passed.
Exact scope: model, service worker, options HTML/JS and one focused test; max 5 files/220 changed lines; no workflow/dependency changes.
Acceptance condition: preserved config/task/GitHub fields; page-bound runtime reset only on actual URL change; invalid/duplicate rejected; active check fails closed; unchanged URL does not reset; background-only persistence; syntax/focused/full tests/static validator pass.
Evidence: task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` RUNNING; ai-control run `34117489614` attempt 2; executor job `101732751791` IN_PROGRESS; source `release/0.7.7-edit-chat-url@0fcb78f...`.

### CP-2 — Advance release metadata and validate frozen branch
Status: PENDING
Release gate: GATE-3.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: deterministic 0.7.7 version/package/validator/workflow metadata and exact release CI.
Acceptance condition: 5/5 audits + Chromium E2E + finalized reproducible artifact.
Evidence: pending.

### CP-3 — Validate and merge canonical PR
Status: PENDING
Release gate: GATE-4.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: exact diff/head/base, PR CI/dependency policy, reviews/threads/mergeability, expected-head merge.
Acceptance condition: exact validated head merged only after all evidence green.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-5.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate/dependency policy/provenance.
Acceptance condition: all jobs green and inner hashes match frozen candidate.
Evidence: pending.

## 6. Active Execution Registry

HQ: release owner; no release-branch write while exact Codex executor owns source freshness.
Workers: NONE.
Codex: task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z`; job `101732751791` IN_PROGRESS; exact source `release/0.7.7-edit-chat-url@0fcb78f...`; expected existing-ref commit + tests + terminal task result.
Zero-model control: coordinator attempt 2 SUCCESS after one exact orphan recovery.
CI/runtime: ai-control run `34117489614` attempt 2 active. No ChatPulse project CI yet.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE. Any release-branch mutation would conflict with the active bounded writer; metadata work follows verified CP-1.

## 8. Current Blockers

NONE. Active Codex execution is not BLOCKED.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — source ref, state, pool recovery, claim, coordinator and exact executor job live-verified.
Release Alignment Audit: PASS — only requested patch-release work is active.
Dependency & Ordering Audit: PASS — implementation precedes metadata/CI/PR/main proof.
Execution & Parallelism Audit: PASS — exactly one ChatPulse writer; no duplicate task or competing branch write.
Adversarial Audit: PASS — stale dispatch inheritance, duplicate URL, task-limit bypass, direct storage mutation, concurrent identity mutation and stale-source risks are explicit acceptance/stop conditions.
Material findings and resolutions: external capacity wait was repaired without product mutation; CP-1 is now real active model execution.

## 10. Next Action

Exact next action: reconcile terminal state of executor job `101732751791`, task running/done/blocked path and release branch head. On DONE, independently inspect diff and test evidence before CP-2; on BLOCKED/FAILURE, repair only the evidence-proven cause.
Executor: HQ.
Expected evidence: terminal task result and exact release-branch SHA/diff.
Acceptance condition: no CP-1 completion claim until independent live verification passes.

## 11. Last Material Revision

What changed: ChatPulse moved from queued capacity wait to exact active model execution.
Why the critical path changed: one stale shared-pool claim was safely recovered, coordinator attempt 2 issued the ChatPulse claim, and executor step 9 started.
Evidence causing the change: recovery commits `41e716e7...`/`416d7f89...`; run `34117489614` attempt 2; coordinator job `101732616577`; running task path; executor job `101732751791`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: verified exact ChatPulse claim and active model executor, then persisted r57.
Active external executions and exact refs: ai-control run `34117489614` attempt 2 / executor job `101732751791`; task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z`; release branch source `0fcb78f...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r57 + task ID + run/job IDs + release branch.
Exact next action after recovery: reconcile terminal executor/task/branch state and independently verify result.
Rotation blockers: NONE.
