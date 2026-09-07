---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 47
updated_at: 2026-09-07T10:22:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.6-global-github-pat
basis_sha: 9ed53d2d74b9cc20fb580d540e7d5ca3bb493597
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.6 beta — add one optional shared GitHub PAT that can be configured once and used by GitHub Actions watchdog across all chats.

Release surface: protected GitHub credential storage/resolution, Control Center token UI, focused credential/security/UI tests, 0.7.6 beta metadata, repository-native release CI and reproducible package.

Definition of RELEASED: one shared PAT can be saved once and used by all GitHub-watchdog chats. A repository-specific PAT remains the highest-priority override; otherwise the shared PAT is used; if neither exists, current unauthenticated public-repository behavior remains unchanged. Secrets remain only in trusted extension-local storage and are never exposed through chatpulseState, portable export, content script, logs or runtime messages. GitHub access remains read-only Actions GET only.

Mandatory release gates:
- [ ] shared PAT storage + repository-specific override + fallback resolution implemented with v1 credential-store compatibility and validated;
- [ ] Control Center can save/test/remove shared PAT and clearly shows precedence, validated by focused/static tests;
- [x] 0.7.6 beta release metadata/package/workflow updated;
- [ ] exact frozen release branch passes 5/5 deterministic audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR merge-context and dependency policy pass, then exact validated head is merged;
- [ ] exact post-merge main release gate and package/provenance are green.

Required release evidence: exact SHAs/run IDs, focused credential tests, UI/static assertions, five audit cycles, Chromium MV3 E2E, reproducible package hashes, canonical PR state and exact-main validation.

Known explicit exclusions: no GitHub write API; no workflow dispatch; no token in portable config/runtime state/content script; no watchdog polling/idle/restart changes; no Telegram/auth-grace/tab-recovery changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch checkpoint before r47: `05e130e13cd7923c9815eb773d50bdb7ead20c92`.
Critical-path basis ref: `release/0.7.6-global-github-pat`.
Critical-path basis SHA: `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`.
Canonical integration branch: `release/0.7.6-global-github-pat`.
Canonical PR / RC: candidate `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`; PR waits for frozen branch success.
Relevant open PRs: draft #17 only, unrelated.
Relevant CI / workflows: failed superseded run `34095691707`; replacement run `34110957235` on repaired candidate.
Relevant release/deployment state: 0.7.5 DONE; 0.7.6 validating.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.

Architecture / major components: credential boundary in `background/github-actions.js`; shared/individual token UI in `options/github-token-ui.js`; watchdog runtime remains outside credential storage.

Build / packaging: Node audit suite plus deterministic Python ZIP/source-manifest packaging.

Tests / validation: focused GitHub credential/UI tests, broader extension suite, static validator, loaded Chromium MV3 E2E.

CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance; dependency policy in PR/main contexts.

Release / deployment: frozen branch → canonical PR → merge → exact-main validation.

Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository.

External release dependencies: GitHub Actions runners only.

Material findings: first candidate `f8200811...` had no runtime/test failure: all 116 tests passed and Chromium E2E passed. Five audit jobs failed only because `scripts/validate_extension.mjs` retained a stale literal assertion `Token сохранён локально` after UI wording changed to `Отдельный token сохранён локально`. Repair commit `9ed53d2d...` changes exactly one line in the static validator; product/runtime behavior is unchanged.

## 4. Release Gates

### GATE-1 — Shared credential behavior
Status: UNSATISFIED
Evidence: implementation and focused tests passed on superseded run; exact repaired candidate still requires full frozen validation.
Blocking items: replacement run `34110957235`.

### GATE-2 — Control Center + security validation
Status: UNSATISFIED
Evidence: focused UI/security tests passed on superseded run; static wording assertion was repaired test-only.
Blocking items: replacement run `34110957235`.

### GATE-3 — Frozen candidate and canonical PR
Status: UNSATISFIED
Evidence: repaired candidate `9ed53d2d...`; replacement exact release run `34110957235` queued.
Blocking items: terminal frozen SUCCESS including package/provenance, then canonical PR validation/merge.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: no 0.7.6 product merge yet.
Blocking items: GATE-3.

## 5. Current Critical Path

### CP-1 — Implement shared PAT and 0.7.6 release candidate
Status: VERIFYING
Release gate: GATE-1 + GATE-2.
Why critical: requested capability requires credential fallback and UI with credential-boundary preservation.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: credential module, token UI, focused tests and 0.7.6 release metadata; validator repair is test-only.
Acceptance condition: repository PAT overrides shared PAT; shared PAT otherwise serves all repositories; absent tokens preserve public behavior; v1 store readable; secrets never escape protected storage; release metadata consistent.
Evidence: candidate `9ed53d2d...`; superseded run proved runtime/tests/E2E except stale static wording assertion.

### CP-2 — Validate frozen 0.7.6 branch
Status: VERIFYING
Release gate: GATE-3.
Why critical: exact repaired candidate must pass repository-native validation before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34110957235` on `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`.
Acceptance condition: 5/5 audit cycles + Chromium MV3 E2E + reproducible package/provenance SUCCESS.
Evidence: run queued at checkpoint.

### CP-3 — Validate and merge canonical 0.7.6 PR
Status: PENDING
Release gate: GATE-3.
Why critical: merge-context validation is required before integration.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: exact diff/head/base, PR CI, dependency policy, reviews/threads, mergeability and expected-head merge.
Acceptance condition: only validated frozen head merged.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Why critical: merge alone is not release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance.
Acceptance condition: exact product merge passes all jobs and reproduces candidate package hashes.
Evidence: pending.

## 6. Active Execution Registry

HQ: no active product write; repaired candidate frozen.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: run `34110957235` on branch `release/0.7.6-global-github-pat` at exact SHA `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`, queued at checkpoint. Superseded run `34095691707` FAILURE is diagnosed and will not be rerun.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE: repaired frozen candidate validation is the sole prerequisite; creating PR or duplicate CI before its result would weaken evidence discipline.

## 8. Current Blockers

NONE. Exact CI is active external execution, not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — credential storage/UI, runtime boundary, focused tests, validator, packaging, CI and PR surface covered.

Evidence Audit: PASS — failure diagnosis comes from exact audit log; repair diff is exactly one validator line; replacement run identity is exact.

Release Alignment Audit: PASS — test-only repair is required to validate the requested release and introduces no product scope creep.

Dependency & Ordering Audit: PASS — repaired candidate must validate before PR; PR before merge; merge before exact-main validation.

Execution & Parallelism Audit: PASS — no duplicate rerun; changed state is a new exact SHA with one-line repair and a new push-triggered run.

Adversarial Audit: PASS — strongest alternative hypothesis, a runtime/shared-PAT regression, is contradicted by 116/116 tests and Chromium E2E success on the superseded candidate; only stale static wording failed.

Material findings and resolutions: the repair changes only `scripts/validate_extension.mjs`, from legacy token wording to the current individual-token wording. Runtime candidate files are identical to `f8200811...`.

## 10. Next Action

Exact next action: live-reconcile run `34110957235`; on SUCCESS verify all jobs and package/provenance, then create canonical PR from exact head `9ed53d2d...`.
Executor: HQ.
Expected evidence: terminal run conclusions, artifact ID and canonical hashes.
Acceptance condition: frozen candidate fully green before PR creation.

## 11. Last Material Revision

What changed: superseded run failed only on one stale static UI string assertion; exact one-line validator repair produced new frozen candidate `9ed53d2d...` and run `34110957235`.
Why the critical path changed: evidence identified a test-only validation defect, not a product defect; CP-1/CP-2 remain VERIFYING on the new exact candidate.
Evidence causing the change: audit job `101658738358`, superseded run `34095691707`, compare `f8200811...` → `9ed53d2d...` showing only `scripts/validate_extension.mjs` 1-line replacement, new run `34110957235`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: repaired exact stale validator assertion and froze candidate `9ed53d2d...`.
Active external executions and exact refs: run `34110957235` at `9ed53d2d...`, queued at checkpoint.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r47 + branch `release/0.7.6-global-github-pat` + candidate `9ed53d2d...` + run `34110957235`.
Exact next action after recovery: live-check run `34110957235`; if fully green verify provenance and proceed to canonical PR; if failed inspect exact red job only.
Rotation blockers: NONE.
