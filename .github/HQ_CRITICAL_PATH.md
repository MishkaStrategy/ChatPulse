---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 55
updated_at: 2026-09-07T11:42:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.7-edit-chat-url
basis_sha: 0fcb78f1149257bb7ea390e6d28e9d85a59e179c
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — edit/rebind the ChatGPT conversation URL of an already configured ChatPulse chat after recreation without configuring the chat again.

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

Default branch: `main`; HQ state-only commits after release branch creation do not alter product source.
Critical-path basis ref: `release/0.7.7-edit-chat-url`.
Critical-path basis SHA: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only, unrelated/excluded.
Relevant Issues: none required.
Relevant CI / workflows: no ChatPulse 0.7.7 CI yet. `ai-control` coordinator run `34117489614` completed SUCCESS for enqueue commit `023e5f5e...`, route decision `allow`, `CODEX_MODEL_INVOCATION=false`, no claim emitted.
Relevant release/deployment state: 0.7.6 DONE; 0.7.7 CP-1 queued for bounded implementation.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 local ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture / major components: `lib/model-v2.js` chat state; `background/service-worker-v2.js` identity mutations/persistence; `options/options.html`/`options.js` Control Center editing.
Build / packaging: Node audits + deterministic Python ZIP/source manifest.
Tests / validation: model/service-worker/profile/config tests, static validator, loaded Chromium E2E.
CI: five audit cycles + Chromium E2E + reproducible package/provenance and dependency policy.
Release / deployment: frozen branch -> canonical PR -> merge -> exact-main proof.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository.
External release dependencies: event-driven `MishkaStrategy/ai-control` Codex pool, then GitHub Actions runners/artifact service.
Material findings: URL is chat identity separate from profile. Safe replacement must preserve configuration/task/GitHub runtime and reset only page-bound state. `assertIdentityMutationSafe` already protects remove/import and must cover actual URL changes. Codex pool currently contains two other `tasks/running` entries (`MishkaStrategy__NoDelete` and `MishkaStrategy__cp`); our task remains persisted under queued after coordinator allowed the route but emitted no claim.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: exact bounded task queued; no branch patch yet.
Blocking items: terminal implementation result and HQ diff/test verification.

### GATE-2 — Control Center URL editing
Status: UNSATISFIED
Evidence: same task owns UI wiring; no branch patch yet.
Blocking items: GATE-1 implementation result.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Evidence: branch is still pre-implementation at `0fcb78f...`.
Blocking items: GATE-1/GATE-2, metadata and branch release CI.

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
Evidence: task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` QUEUED on `release/0.7.7-edit-chat-url@0fcb78f...`.

### CP-2 — Advance release metadata and validate frozen branch
Status: PENDING
Release gate: GATE-3.
Why critical: exact 0.7.7 artifact/provenance required.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: deterministic version/package/validator/workflow metadata and exact release CI.
Acceptance condition: 5/5 audits + Chromium E2E + finalized reproducible 0.7.7 artifact.
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

HQ: release owner; release branch write-frozen until Codex task resolves source freshness.
Workers: NONE.
Codex: `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` — QUEUED; exact source `release/0.7.7-edit-chat-url@0fcb78f...`; expected existing-ref commit/test evidence. Coordinator run `34117489614` allowed route but made zero model invocation/claim.
Zero-model control: ai-control preflight completed SUCCESS; task remains queued.
CI/runtime: two unrelated Codex tasks are currently in ai-control `tasks/running`; no ChatPulse project CI active.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE. Mutating the release branch would invalidate the queued task's immutable observed SHA. Metadata work follows immediately after verified CP-1.

## 8. Current Blockers

NONE. Current condition is external executor capacity wait, not a project blocker. Unblock event: an ai-control running task completes and the event-driven coordinator claims the queued ChatPulse task, or equivalent changed execution state appears.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — source refs, r54, queued task, coordinator run/logs and current running-task directories live-verified.
Release Alignment Audit: PASS — only requested patch-release work remains.
Dependency & Ordering Audit: PASS — release branch must stay immutable until task claim/result; metadata/CI follow CP-1.
Execution & Parallelism Audit: PASS — duplicate task/retry/branch mutation is forbidden while equivalent queued work exists.
Adversarial Audit: PASS — stale dispatch inheritance, duplicate URL, task-limit bypass, direct storage mutation and concurrent identity mutation are explicit fail-closed acceptance constraints.
Material findings and resolutions: coordinator success does not mean product work completed; `CODEX_MODEL_INVOCATION=false` and persisted queued task correctly remain ACTIVE/WAITING_EXTERNAL_EVENT.

## 10. Next Action

Exact next action: on the next invocation/relevant ai-control event, live-check the task across queued/running/done/blocked plus the release branch head. If claimed/DONE, verify exact result; if BLOCKED/STALE, diagnose changed evidence; if still queued with the same two running tasks, do not duplicate or rerun.
Executor: HQ.
Expected evidence: a material task-state/branch-state transition.
Acceptance condition: CP-1 changes state only from live terminal/execution evidence.

## 11. Last Material Revision

What changed: ai-control coordinator processed the enqueue, allowed CODEX route but emitted no persisted claim/model invocation; two unrelated code tasks occupy current running slots and ChatPulse remains queued.
Why critical path changed: execution state is now precisely WAITING_EXTERNAL_EVENT rather than merely newly queued.
Evidence causing the change: run `34117489614`, job `101727590311`, queued task path, `tasks/running/MishkaStrategy__NoDelete` and `tasks/running/MishkaStrategy__cp`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: verified coordinator outcome and current external execution registry, then persisted this exact wait checkpoint.
Active external executions and exact refs: ChatPulse task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` QUEUED at source SHA `0fcb78f...`; coordinator `34117489614` SUCCESS/no claim; two unrelated running tasks currently present in ai-control.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r55 + exact ChatPulse task ID + release branch `0fcb78f...`.
Exact next action after recovery: reconcile task state and branch head; never create a duplicate implementation task while this queued task remains equivalent.
Rotation blockers: NONE.
