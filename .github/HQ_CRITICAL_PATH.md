---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 52
updated_at: 2026-09-07T11:25:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 67ca333b6ed270652fb45fd6aede641ca31b04d6
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.6 beta — one optional shared GitHub PAT configured once and usable by GitHub Actions watchdog across all chats.

Release surface: protected GitHub credential storage/resolution, Control Center shared/individual PAT UI, focused credential/security/UI tests, 0.7.6 beta metadata, repository-native release CI and reproducible package/provenance.

Definition of RELEASED: one shared PAT can be saved once and used by all GitHub-watchdog chats. A repository-specific PAT remains the highest-priority override; otherwise the shared PAT is used; if neither exists, unauthenticated public-repository behavior remains unchanged. Secrets stay only in trusted extension-local storage and never enter chatpulseState, portable export, content script, logs or runtime messages. GitHub access remains read-only Actions GET only.

Mandatory release gates:
- [x] shared PAT behavior + repository override + v1 compatibility validated;
- [x] Control Center shared-PAT UI/security validated;
- [x] 0.7.6 beta metadata/package/workflow updated;
- [x] exact frozen release branch passed 5/5 audits, Chromium MV3 E2E and finalized reproducible package/provenance;
- [x] canonical PR #30 release gate and dependency policy passed and exact validated head was merged;
- [x] exact post-merge main release gate and dependency policy passed and package/provenance reproduced frozen candidate hashes exactly.

Required release evidence: exact SHAs/run IDs, focused credential tests, UI/static assertions, five audit cycles, Chromium MV3 E2E, reproducible package hashes/artifacts, canonical PR state and exact-main validation.

Known explicit exclusions: no GitHub write API; no workflow dispatch; no token in portable config/runtime state/content script; no watchdog polling/idle/restart changes; no Telegram/auth-grace/tab-recovery changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch product SHA: `67ca333b6ed270652fb45fd6aede641ca31b04d6`; later HQ critical-path commits are state-only and do not change the release basis.
Default branch observed SHA before this terminal state-only write: `005367cab116c4591bf15e4ebb10ba1873490b7e`.
Critical-path basis ref: `main`.
Critical-path basis SHA: `67ca333b6ed270652fb45fd6aede641ca31b04d6`.
Canonical integration branch: `release/0.7.6-global-github-pat`.
Canonical PR / RC: PR #30 merged from exact head `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597` as merge commit `67ca333b6ed270652fb45fd6aede641ca31b04d6`.
Relevant open PRs: draft #17 only, unrelated/excluded; PR #30 closed/merged.
Relevant CI / workflows: frozen release run `34110957235` attempt 2 SUCCESS; PR release run `34113214516` SUCCESS; PR dependency run `34113214636` SUCCESS; exact-main dependency run `34115019009` SUCCESS; exact-main release run `34115019057` SUCCESS.
Relevant release/deployment state: ChatPulse 0.7.6 beta RELEASED under the explicit artifact/CI release contract.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture / major components: credential boundary in `background/github-actions.js`; shared/individual token UI in `options/github-token-ui.js`; watchdog runtime remains outside credential storage.
Build / packaging: Node audit suite plus deterministic Python ZIP/source-manifest packaging.
Tests / validation: focused GitHub credential/UI tests, broader extension suite, static validator, loaded Chromium MV3 E2E.
CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance; dependency policy in PR/main contexts.
Release / deployment: frozen branch -> canonical PR -> merge -> exact-main validation.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository.
External release dependencies: GitHub Actions runners and artifact service.
Material findings: exact-main run `34115019057` completed SUCCESS on product SHA `67ca333b...`; all five audit cycles, Chromium MV3 E2E, reproducible package and provenance upload are SUCCESS. Exact-main artifact ID `10015928795`, uploaded artifact digest `sha256:59b075a978dd4a117c8713ab0553aba4cfb63ecb197faa3297e1c3f8c6858fe0`. Exact-main inner ZIP SHA-256 `5872b5ef4a4ea88eaaca2a49d4b668cc7eabd596bcff41971d86ad529593bae0`; source-manifest SHA-256 `05af20c8c290a1c3425d4020895c168c37629543f86c1aaa723ee13235a4eabf`. Frozen candidate run `34110957235` independently produced the same two inner hashes and finalized artifact `10015153424`. The differing outer GitHub artifact-container digests are expected wrapper-level values; canonical inner release files match exactly.

## 4. Release Gates

### GATE-1 — Shared credential behavior
Status: SATISFIED
Evidence: frozen and exact-main 5/5 audits plus focused shared-PAT tests green.
Blocking items: NONE.

### GATE-2 — Control Center + security validation
Status: SATISFIED
Evidence: static validation and Chromium E2E green in branch, PR and exact-main release contexts.
Blocking items: NONE.

### GATE-3 — Frozen candidate and canonical PR
Status: SATISFIED
Evidence: frozen run `34110957235` SUCCESS; PR runs `34113214516` and `34113214636` SUCCESS; PR #30 expected-head merge produced `67ca333b...`.
Blocking items: NONE.

### GATE-4 — Post-merge main
Status: SATISFIED
Evidence: exact-main dependency run `34115019009` SUCCESS; exact-main release run `34115019057` SUCCESS; artifact `10015928795` finalized; ZIP/source-manifest hashes exactly equal frozen candidate.
Blocking items: NONE.

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
Evidence: frozen and exact-main validation.

### CP-2 — Validate frozen 0.7.6 branch
Status: DONE
Release gate: GATE-3.
Why critical: exact candidate required branch proof before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34110957235` attempt 2 on exact SHA `9ed53d2d...`.
Acceptance condition: 5/5 audits + Chromium E2E + reproducible finalized artifact.
Evidence: SUCCESS; artifact `10015153424`; canonical hashes recorded above.

### CP-3 — Validate and merge canonical 0.7.6 PR
Status: DONE
Release gate: GATE-3.
Why critical: integration into current main required independent PR-context validation.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: PR #30 exact 10-file diff/head/base, PR release CI, dependency policy, reviews/threads, mergeability and expected-head merge.
Acceptance condition: only head `9ed53d2d...` merged after all PR evidence green.
Evidence: PR runs SUCCESS; empty reviews/threads at merge-readiness; merge commit `67ca333b...` verified.

### CP-4 — Validate exact post-merge main
Status: DONE
Release gate: GATE-4.
Why critical: merge alone was not release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance on `67ca333b...`.
Acceptance condition: full release run + dependency policy SUCCESS and finalized main package hashes equal frozen candidate hashes.
Evidence: `34115019057` SUCCESS; `34115019009` SUCCESS; artifact `10015928795`; exact hash equality verified.

## 6. Active Execution Registry

HQ: NONE — release contract completed and terminal evidence integrated.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE critical active. All release-critical branch, PR and exact-main runs are terminal SUCCESS.

## 7. Safe Parallel Work

NONE — RELEASE CONTRACT COMPLETE. Any additional work belongs to a future release/backlog unless explicitly promoted by owner/governance.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — credential boundary, UI, tests, validators, package/provenance, PR/merge and exact-main surfaces all covered.
Evidence Audit: PASS — terminal exact branch/PR/main runs, exact SHAs, finalized artifacts and hashes are live-verified.
Release Alignment Audit: PASS — every mandatory release gate is satisfied; no extra gate is required by the explicit release contract.
Dependency & Ordering Audit: PASS — branch validation preceded PR, PR checks preceded merge, exact-main proof followed merge.
Execution & Parallelism Audit: PASS — no duplicate active executor remains; all critical execution is terminal.
Adversarial Audit: PASS — strongest remaining hypotheses (main-context regression, provenance mismatch, upload failure, product-basis drift) are contradicted by exact-main SUCCESS, exact hash equality, finalized artifact and state-only-only drift after the product merge.
Material findings and resolutions: outer GitHub artifact-container digest differs between frozen/main uploads because it is the wrapper archive; canonical inner ZIP and source-manifest hashes are identical and are the release reproducibility evidence.

## 10. Next Action

Exact next action: NONE for ChatPulse 0.7.6. Await a new explicit owner/project release objective; do not extend this release with unrelated backlog.
Executor: HQ when a new objective exists.
Expected evidence: new owner/governance release target or material live project event.
Acceptance condition: current 0.7.6 release remains terminal DONE unless a new release contract is opened.

## 11. Last Material Revision

What changed: exact-main release run `34115019057` completed SUCCESS; all seven jobs are green, artifact/provenance finalized, and exact-main ZIP/source-manifest hashes equal the frozen candidate exactly.
Why the critical path changed: CP-4 and GATE-4 are now satisfied; every mandatory gate in the explicit 0.7.6 release contract is complete.
Evidence causing the change: product merge `67ca333b...`; exact-main dependency run `34115019009`; exact-main release run `34115019057`; artifact `10015928795`; hashes `5872b5ef...` and `05af20c8...`; frozen comparison run `34110957235` and artifact `10015153424`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: final release-alignment verification and persistence of terminal ChatPulse 0.7.6 DONE state.
Active external executions and exact refs: NONE critical active.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r52 + product basis `67ca333b6ed270652fb45fd6aede641ca31b04d6`; verify later commits are state-only before relying on this terminal release evidence.
Exact next action after recovery: treat ChatPulse 0.7.6 as DONE; only open a new critical path when a new explicit release objective/material project event exists.
Rotation blockers: NONE.
