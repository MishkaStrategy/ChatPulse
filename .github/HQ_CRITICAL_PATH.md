---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 56
updated_at: 2026-09-07T11:56:00Z
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

Default branch: `main`.
Default branch observed SHA before this state write: `d32cb225f413330275ddd542ab89cf35dbbb0efc`; state-only.
Critical-path basis ref: `release/0.7.7-edit-chat-url`.
Critical-path basis SHA: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only, unrelated/excluded.
Relevant CI / workflows: ai-control Codex executor run `34117489614`, attempt 2, coordinator job `101732616577` in progress after exact capacity recovery.
Relevant release/deployment state: 0.7.6 DONE; 0.7.7 CP-1 active.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 local ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture / major components: `lib/model-v2.js` chat state; `background/service-worker-v2.js` identity mutations/persistence; `options/options.html`/`options.js` Control Center editing.
Build / packaging: Node audits + deterministic Python ZIP/source manifest.
Tests / validation: model/service-worker/profile/config tests, static validator, loaded Chromium E2E.
CI: five audit cycles + Chromium E2E + reproducible package/provenance and dependency policy.
Release / deployment: frozen branch -> canonical PR -> merge -> exact-main proof.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository; `MishkaStrategy/ai-control` used only as authorized execution-control exception.
External release dependencies: ai-control Codex pool, then GitHub Actions runners/artifact service.
Material findings: the previous pool-capacity wait was caused by stale `tasks/running` records, not active executors. NoDelete task `nodely-phase-a-core-20260906-1400` had executor run `34038126279` / job `101499907240` complete FAILURE after model invocation, with terminal persistence failing (`CODEX_POOL_FAIL_CLOSED`) and live target branch still exactly `b08eb458...`, proving zero product commits. HQ recovered that exact orphan into a BLOCKED terminal record and removed its stale running claim. One slot is now free; ChatPulse coordinator attempt 2 is active. The unrelated cp orphan remains untouched because one recovered slot is sufficient.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: exact bounded task remains source-fresh; coordinator attempt 2 is active after capacity recovery.
Blocking items: terminal implementation result and HQ diff/test verification.

### GATE-2 — Control Center URL editing
Status: UNSATISFIED
Evidence: same bounded task owns UI wiring; no branch patch yet.
Blocking items: GATE-1 implementation result.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Evidence: branch remains pre-implementation at `0fcb78f...`.
Blocking items: GATE-1/GATE-2, release metadata and branch CI.

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
Evidence: task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z`; source `release/0.7.7-edit-chat-url@0fcb78f...`; run `34117489614` attempt 2 / coordinator job `101732616577` active.

### CP-2 — Advance release metadata and validate frozen branch
Status: PENDING
Release gate: GATE-3.
Why critical: exact 0.7.7 artifact/provenance required.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: deterministic 0.7.7 version/package/validator/workflow metadata and exact release CI.
Acceptance condition: 5/5 audits + Chromium E2E + finalized reproducible artifact.
Evidence: pending.

### CP-3 — Validate and merge canonical PR
Status: PENDING
Release gate: GATE-4.
Why critical: integration proof required.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: exact diff/head/base, PR CI/dependency policy, reviews/threads/mergeability, expected-head merge.
Acceptance condition: exact validated head merged only after all evidence green.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-5.
Why critical: merge is not release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate/dependency policy/provenance.
Acceptance condition: all jobs green and inner hashes match frozen candidate.
Evidence: pending.

## 6. Active Execution Registry

HQ: release owner; release branch write-frozen while exact Codex task owns source SHA.
Workers: NONE.
Codex: task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z`; exact source `release/0.7.7-edit-chat-url@0fcb78f...`; coordinator attempt 2 active.
Zero-model control: recovered one proven orphaned NoDelete running record to terminal BLOCKED after verifying zero target commits; coordinator job `101732616577` now re-evaluates live pool state.
CI/runtime: ai-control run `34117489614` attempt 2 active; unrelated cp stale running record still present but no longer consumes all capacity.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE. Release-branch mutation would invalidate Codex source freshness; metadata follows verified CP-1.

## 8. Current Blockers

NONE. Active coordinator execution is not BLOCKED. If coordinator claims ChatPulse, model execution proceeds. If it rejects/blocks, HQ diagnoses exact changed evidence.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — branch, r55, queued task, pool source, stale executor runs/logs, zero target drift and coordinator attempt 2 are live-verified.
Release Alignment Audit: PASS — orphan recovery changes only shared execution control and is necessary to advance requested release.
Dependency & Ordering Audit: PASS — branch remains immutable until CP-1 resolves; metadata/CI follow implementation.
Execution & Parallelism Audit: PASS — no duplicate ChatPulse task/model execution; one stale shared-pool claim recovered from exact terminal evidence.
Adversarial Audit: PASS — stale dispatch inheritance, duplicate URL, task-limit bypass, direct storage mutation, concurrent identity mutation and duplicate executor risk remain fail-closed acceptance constraints.
Material findings and resolutions: prior capacity diagnosis was incomplete; NoDelete `running` state was an orphan after terminal workflow failure. Exact orphan recovery freed one slot without touching target product code.

## 10. Next Action

Exact next action: reconcile ai-control run `34117489614` attempt 2 and ChatPulse task path. On claim/DONE, verify branch diff and test evidence; on BLOCKED, diagnose exact cause; never create duplicate implementation work.
Executor: HQ.
Expected evidence: task moves queued -> running -> done/blocked and/or release branch advances from exact source SHA.
Acceptance condition: CP-1 state changes only from live execution evidence.

## 11. Last Material Revision

What changed: one proven orphaned shared-pool running claim was terminalized safely, freeing executor capacity; coordinator run `34117489614` attempt 2 is now active against live pool state.
Why the critical path changed: external capacity wait became active execution after exact recovery.
Evidence causing the change: NoDelete run `34038126279`, job `101499907240`, target branch `b08eb458...`, ai-control recovery commits `41e716e7...` and `416d7f89...`, coordinator job `101732616577`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: recovered one exact orphaned pool claim and started live coordinator attempt 2.
Active external executions and exact refs: ai-control run `34117489614` attempt 2 / job `101732616577`; ChatPulse task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z`; release branch `0fcb78f...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r56 + task ID + run `34117489614` attempt 2 + release branch `0fcb78f...`.
Exact next action after recovery: reconcile current task/run/branch state; integrate only verified result.
Rotation blockers: NONE.
