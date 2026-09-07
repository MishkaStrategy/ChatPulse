---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 49
updated_at: 2026-09-07T10:49:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: pull/30/head
basis_sha: 9ed53d2d74b9cc20fb580d540e7d5ca3bb493597
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
- [ ] canonical PR #30 release gate and dependency policy pass, then exact validated head is merged;
- [ ] exact post-merge main release gate and package/provenance are green.

Required release evidence: exact SHAs/run IDs, focused credential tests, UI/static assertions, five audit cycles, Chromium MV3 E2E, reproducible package hashes/artifact, canonical PR state and exact-main validation.

Known explicit exclusions: no GitHub write API; no workflow dispatch; no token in portable config/runtime state/content script; no watchdog polling/idle/restart changes; no Telegram/auth-grace/tab-recovery changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state-only r49 write: `d405ef45ce373e460168e9c39e41da65fa54f5ae`.
Critical-path basis ref: `pull/30/head`.
Critical-path basis SHA: `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`.
Canonical integration branch: `release/0.7.6-global-github-pat`.
Canonical PR / RC: PR #30, head `9ed53d2d...`, base `main` at creation SHA `d405ef45...`, non-draft, mergeable=true.
Relevant open PRs: #30 canonical; draft #17 unrelated/excluded.
Relevant CI / workflows: frozen run `34110957235` attempt 2 SUCCESS; PR dependency policy `34113214636` SUCCESS; PR release gate `34113214516` IN_PROGRESS.
Relevant release/deployment state: frozen candidate fully validated; integration validation active.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.

Architecture / major components: credential boundary in `background/github-actions.js`; shared/individual token UI in `options/github-token-ui.js`; watchdog runtime remains outside credential storage.

Build / packaging: Node audit suite plus deterministic Python ZIP/source-manifest packaging.

Tests / validation: focused GitHub credential/UI tests, broader extension suite, static validator, loaded Chromium MV3 E2E.

CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance; dependency policy in PR/main contexts.

Release / deployment: frozen branch → canonical PR → merge → exact-main validation.

Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository.

External release dependencies: GitHub Actions runners and artifact service.

Material findings: frozen run `34110957235` attempt 2 is SUCCESS. Final artifact ID `10015153424`, uploaded artifact digest `sha256:e18d16d6cc48dcf0ae0f5f5f82d6f8e0a8d5de629d8331c3f42feea785ae520b`. Canonical inner ZIP SHA-256 `5872b5ef4a4ea88eaaca2a49d4b668cc7eabd596bcff41971d86ad529593bae0`; source-manifest SHA-256 `05af20c8c290a1c3425d4020895c168c37629543f86c1aaa723ee13235a4eabf`. PR #30 contains exactly 10 expected files: workflow, GitHub credential module, manifest, token UI, package metadata/scripts, validator adapter/base validator, and two focused tests. Reviews and review threads are empty; PR is mergeable.

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
Status: UNSATISFIED
Evidence: frozen candidate/provenance fully satisfied; PR #30 exact head/base/diff verified; dependency policy SUCCESS; release gate `34113214516` in progress.
Blocking items: terminal SUCCESS of PR release gate, then final merge-readiness recheck and expected-head merge.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: no 0.7.6 product merge yet.
Blocking items: GATE-3.

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
Evidence: SUCCESS; artifact ID/digests recorded above.

### CP-3 — Validate and merge canonical 0.7.6 PR
Status: VERIFYING
Release gate: GATE-3.
Why critical: integration into current main must be independently validated.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: PR #30 exact 10-file diff/head/base, PR release CI, dependency policy, reviews/threads, mergeability and expected-head merge.
Acceptance condition: only head `9ed53d2d...` merged after all PR evidence green.
Evidence: dependency policy `34113214636` SUCCESS; release gate `34113214516` IN_PROGRESS; reviews/threads empty; mergeable=true.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Why critical: merge alone is not release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance.
Acceptance condition: exact product merge passes all jobs and reproduces candidate hashes.
Evidence: pending.

## 6. Active Execution Registry

HQ: PR #30 merge-readiness owner; no product write while PR CI runs.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: PR release run `34113214516` at exact head `9ed53d2d...` IN_PROGRESS. PR dependency policy `34113214636` SUCCESS. Frozen branch run `34110957235` SUCCESS.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE: PR release gate is the only unsatisfied integration prerequisite; merge before it completes is forbidden.

## 8. Current Blockers

NONE. PR CI is active external execution, not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — product, credential boundary, tests, validators, package/provenance, PR/CI/review/merge surface covered.

Evidence Audit: PASS — frozen evidence, exact PR head/base/diff, review state and PR run identities are live-verified.

Release Alignment Audit: PASS — remaining actions are strictly PR validation/merge and exact-main proof.

Dependency & Ordering Audit: PASS — PR release gate must finish before merge; exact-main validation follows merge.

Execution & Parallelism Audit: PASS — PR CI is active; no duplicate execution or conflicting write is useful.

Adversarial Audit: PASS — strongest remaining failure modes are PR-context-only CI failure, head/base drift, review/thread emergence or mergeability change; each is explicitly rechecked before merge.

Material findings and resolutions: initial mergeable=false immediately after PR creation resolved to mergeable=true once GitHub computed mergeability; no conflict exists. Base-only HQ state commits do not alter product diff.

## 10. Next Action

Exact next action: live-reconcile PR release run `34113214516`. On SUCCESS, re-fetch PR #30 head/base/diff/reviews/threads/mergeability and merge with expected head `9ed53d2d...`; then immediately validate exact main.
Executor: HQ.
Expected evidence: terminal PR CI result, unchanged PR context and merge SHA.
Acceptance condition: CP-3 advances only after all PR evidence green and expected-head merge succeeds.

## 11. Last Material Revision

What changed: frozen provenance completed successfully; canonical PR #30 was created from exact frozen head; dependency policy passed and PR release gate is active.
Why the critical path changed: CP-2 is DONE and CP-3 is now the sole active integration node.
Evidence causing the change: run `34110957235` SUCCESS, artifact `10015153424`, PR #30 metadata/diff, dependency run `34113214636`, release run `34113214516`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: created and fully inspected canonical PR #30, verifying exact 10-file scope, mergeability and empty review/thread state.
Active external executions and exact refs: PR release run `34113214516` at head `9ed53d2d...` IN_PROGRESS; dependency run `34113214636` SUCCESS.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r49 + PR #30 + head `9ed53d2d...` + run `34113214516`.
Exact next action after recovery: live-check run `34113214516`; if SUCCESS perform full premerge revalidation and expected-head merge, otherwise diagnose exact failing PR job.
Rotation blockers: NONE.
