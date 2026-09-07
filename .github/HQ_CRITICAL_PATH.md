---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 51
updated_at: 2026-09-07T11:09:00Z
project_state: RELEASING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 67ca333b6ed270652fb45fd6aede641ca31b04d6
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.6 beta — add one optional shared GitHub PAT that can be configured once and used by GitHub Actions watchdog across all chats.

Release surface: protected GitHub credential storage/resolution, Control Center token UI, focused credential/security/UI tests, 0.7.6 beta metadata, repository-native release CI and reproducible package.

Definition of RELEASED: one shared PAT can be saved once and used by all GitHub-watchdog chats. A repository-specific PAT remains the highest-priority override; otherwise the shared PAT is used; if neither exists, current unauthenticated public-repository behavior remains unchanged. Secrets remain only in trusted extension-local storage and are never exposed through chatpulseState, portable export, content script, logs or runtime messages. GitHub access remains read-only Actions GET only.

Mandatory release gates:
- [x] shared PAT behavior + v1 compatibility validated;
- [x] Control Center shared-PAT UI/security validated;
- [x] 0.7.6 beta metadata/package/workflow updated;
- [x] exact frozen release branch passed 5/5 audits, Chromium MV3 E2E and finalized reproducible package/provenance;
- [x] canonical PR #30 release gate and dependency policy passed and exact validated head was merged;
- [ ] exact post-merge main release gate and package/provenance are green and reproduce candidate hashes.

Required release evidence: exact SHAs/run IDs, focused credential tests, UI/static assertions, five audit cycles, Chromium MV3 E2E, reproducible package hashes/artifact, canonical PR state and exact-main validation.

Known explicit exclusions: no GitHub write API; no workflow dispatch; no token in portable config/runtime state/content script; no watchdog polling/idle/restart changes; no Telegram/auth-grace/tab-recovery changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch product SHA: `67ca333b6ed270652fb45fd6aede641ca31b04d6`; later HQ critical-path commits are state-only and do not change the release basis.
Critical-path basis ref: `main`.
Critical-path basis SHA: `67ca333b6ed270652fb45fd6aede641ca31b04d6`.
Canonical integration branch: `release/0.7.6-global-github-pat`.
Canonical PR / RC: PR #30 merged from exact head `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597` as merge commit `67ca333b6ed270652fb45fd6aede641ca31b04d6`.
Relevant open PRs: draft #17 unrelated/excluded; PR #30 closed/merged.
Relevant CI / workflows: frozen run `34110957235` attempt 2 SUCCESS; PR release run `34113214516` SUCCESS; PR dependency run `34113214636` SUCCESS; exact-main dependency run `34115019009` SUCCESS; exact-main release run `34115019057` IN_PROGRESS.
Relevant release/deployment state: product merge completed; exact-main release proof active.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture / major components: credential boundary in `background/github-actions.js`; shared/individual token UI in `options/github-token-ui.js`; watchdog runtime remains outside credential storage.
Build / packaging: Node audit suite plus deterministic Python ZIP/source-manifest packaging.
Tests / validation: focused GitHub credential/UI tests, broader extension suite, static validator, loaded Chromium MV3 E2E.
CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance; dependency policy in PR/main contexts.
Release / deployment: frozen branch -> canonical PR -> merge -> exact-main validation.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository.
External release dependencies: GitHub Actions runners and artifact service.
Material findings: frozen candidate inner ZIP SHA-256 is `5872b5ef4a4ea88eaaca2a49d4b668cc7eabd596bcff41971d86ad529593bae0`; source-manifest SHA-256 is `05af20c8c290a1c3425d4020895c168c37629543f86c1aaa723ee13235a4eabf`; frozen artifact ID `10015153424`. PR #30 had exactly the expected 10 files, both PR checks passed, reviews/threads remained empty and expected-head merge succeeded. Exact-main dependency policy `34115019009` is SUCCESS. Exact-main release run `34115019057` has Chromium MV3 E2E SUCCESS and audit cycles 3/5 SUCCESS; cycles 1/2 had completed their audit step and were finishing, cycle 4 remained active at checkpoint; package/provenance had not yet started.

## 4. Release Gates

### GATE-1 — Shared credential behavior
Status: SATISFIED
Evidence: frozen candidate 5/5 audits and focused shared-PAT tests green.
Blocking items: NONE.

### GATE-2 — Control Center + security validation
Status: SATISFIED
Evidence: frozen audits + Chromium E2E + static validation green.
Blocking items: NONE.

### GATE-3 — Frozen candidate and canonical PR
Status: SATISFIED
Evidence: frozen run `34110957235` SUCCESS; PR runs `34113214516` and `34113214636` SUCCESS; PR #30 merged as `67ca333b...` from expected head `9ed53d2d...`.
Blocking items: NONE.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: dependency run `34115019009` SUCCESS; release run `34115019057` IN_PROGRESS on exact product SHA `67ca333b...`.
Blocking items: terminal SUCCESS of exact-main release run plus finalized artifact/provenance matching frozen candidate hashes.

## 5. Current Critical Path

### CP-1 — Implement shared PAT and 0.7.6 release candidate
Status: DONE
Release gate: GATE-1 + GATE-2.
Why critical: requested feature implementation.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: credential module, token UI, focused tests, validators and 0.7.6 release metadata.
Acceptance condition: shared PAT fallback with repository override, v1 compatibility, protected secret boundary and consistent release metadata.
Evidence: frozen candidate and full branch validation.

### CP-2 — Validate frozen 0.7.6 branch
Status: DONE
Release gate: GATE-3.
Why critical: exact candidate required branch proof before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34110957235` attempt 2 on exact SHA `9ed53d2d...`.
Acceptance condition: 5/5 audits + Chromium E2E + reproducible finalized artifact.
Evidence: SUCCESS; artifact and hashes recorded above.

### CP-3 — Validate and merge canonical 0.7.6 PR
Status: DONE
Release gate: GATE-3.
Why critical: integration into current main required independent PR-context validation.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: PR #30 exact 10-file diff/head/base, PR release CI, dependency policy, reviews/threads, mergeability and expected-head merge.
Acceptance condition: only head `9ed53d2d...` merged after all PR evidence green.
Evidence: both PR runs SUCCESS; empty reviews/threads; expected-head merge commit `67ca333b...` verified on main.

### CP-4 — Validate exact post-merge main
Status: VERIFYING
Release gate: GATE-4.
Why critical: merge alone is not release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance on `67ca333b...`.
Acceptance condition: release run SUCCESS and finalized main package hashes equal frozen candidate hashes; dependency policy already SUCCESS.
Evidence: dependency run `34115019009` SUCCESS; release run `34115019057` IN_PROGRESS.

## 6. Active Execution Registry

HQ: exact-main release verification owner; no product writes.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: `34115019057` ChatPulse 0.7.6 beta release gate IN_PROGRESS on exact product main SHA `67ca333b6ed270652fb45fd6aede641ca31b04d6`; dependency run `34115019009` SUCCESS. State-only HQ commits after `67ca333b...` are not release-basis changes.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE: the sole remaining release prerequisite is already executing in exact-main CI; duplicate execution adds no evidence.

## 8. Current Blockers

NONE. Exact-main release CI is active external execution, not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — product, credential boundary, tests, validators, package/provenance, PR/merge and exact-main surfaces covered.
Evidence Audit: PASS — frozen, PR, merge and dependency evidence are exact and live-verified; remaining evidence is explicitly active exact-main release CI.
Release Alignment Audit: PASS — only exact-main release proof remains.
Dependency & Ordering Audit: PASS — branch validation preceded PR; PR checks preceded merge; exact-main proof follows merge.
Execution & Parallelism Audit: PASS — the remaining exact-main release run is active; no duplicate runner or code work is useful.
Adversarial Audit: PASS — strongest remaining failure modes are main-context CI failure, package/provenance mismatch or artifact finalization failure; CP-4 checks exactly these before DONE.
Material findings and resolutions: PR merge used `expected_head_sha`; current product basis was verified as `67ca333b...`; state-only HQ commits do not invalidate product release evidence.

## 10. Next Action

Exact next action: live-reconcile exact-main release run `34115019057`; on SUCCESS verify finalized artifact/provenance and compare main ZIP/source-manifest hashes with frozen candidate hashes.
Executor: HQ.
Expected evidence: terminal release-run conclusion, artifact ID/digest and canonical hashes.
Acceptance condition: GATE-4 SATISFIED only if exact product SHA is fully green and hashes match frozen candidate.

## 11. Last Material Revision

What changed: exact-main dependency policy completed SUCCESS while exact-main release validation continued; E2E and multiple audit cycles are already green.
Why the critical path changed: dependency-policy portion of CP-4 is satisfied; release run/provenance is the sole remaining prerequisite.
Evidence causing the change: run `34115019009` SUCCESS and current jobs of run `34115019057`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: verified exact-main dependency policy SUCCESS and current partial green evidence of release run `34115019057`.
Active external executions and exact refs: release run `34115019057` on exact product SHA `67ca333b6ed270652fb45fd6aede641ca31b04d6` IN_PROGRESS; dependency run `34115019009` SUCCESS.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r51 + product basis `67ca333b...` + release run `34115019057`.
Exact next action after recovery: live-check run `34115019057`; if green verify finalized artifact/provenance/hash equality and close release; if red inspect only exact failing job.
Rotation blockers: NONE.
