---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 46
updated_at: 2026-09-07T07:31:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.6-global-github-pat
basis_sha: f82008114d705baa95f145a5c2e569a2e1cc5800
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.6 beta — add one optional shared GitHub PAT that can be configured once and used by GitHub Actions watchdog across all chats.

Release surface: protected GitHub credential storage/resolution, Control Center token UI, focused credential/security/UI tests, 0.7.6 beta metadata, repository-native release CI and reproducible package.

Definition of RELEASED: the user can save one shared GitHub PAT once in Control Center. For every GitHub Actions watchdog request, an existing repository-specific token remains the highest-priority override; otherwise the shared PAT is used; if neither exists, current unauthenticated public-repository behavior remains unchanged. The shared PAT is stored only in trusted extension-local credential storage, is never returned to UI/state as plaintext, never enters `chatpulseState`, portable export, content script, logs or runtime messages, and is sent only as Bearer auth to the existing read-only `api.github.com/repos/<owner>/<repo>/actions/runs` GET endpoint. The user can remove the shared PAT and can test it against an explicit `owner/repo` without exposing its value.

Mandatory release gates:
- [ ] shared PAT storage + repository-specific override + fallback resolution implemented with v1 credential-store compatibility and validated;
- [ ] Control Center can save/test/remove shared PAT and clearly shows shared-vs-repository token precedence, validated by focused/static tests;
- [x] 0.7.6 beta release metadata/package/workflow updated on frozen candidate;
- [ ] exact frozen release branch passes 5/5 deterministic audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR merge-context and dependency policy pass, then exact validated head is merged;
- [ ] exact post-merge main release gate and package/provenance are green.

Required release evidence: exact SHAs/run IDs, focused token-store/fallback tests, UI/static assertions, five deterministic audit cycles, Chromium MV3 E2E, reproducible package hashes, canonical PR review/thread/mergeability state and exact-main validation.

Known explicit exclusions: no GitHub write API; no workflow dispatch; no token in portable config/runtime state/content script; no change to watchdog polling/idle/restart semantics; no Telegram/auth-grace/tab-recovery change; unrelated draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch state-only checkpoint before this revision: `b14dae7fb239f70c18d69681338463d6ef77ca0d`.
Critical-path basis ref: `release/0.7.6-global-github-pat`.
Critical-path basis SHA: `f82008114d705baa95f145a5c2e569a2e1cc5800`.
Canonical integration branch: `release/0.7.6-global-github-pat`.
Canonical PR / RC: frozen branch candidate `f82008114d705baa95f145a5c2e569a2e1cc5800`; PR not yet created.
Relevant open PRs: draft #17 only; unrelated and excluded.
Relevant Issues: no issue required for the explicit owner request.
Relevant CI / workflows: exact branch release run `34095691707`; `.github/workflows/extension-ci.yml`; dependency runner policy will also validate workflow changes in PR/main contexts.
Relevant release/deployment state: 0.7.5 beta is closed and verified; 0.7.6 candidate is frozen and under first exact release validation.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.

Architecture / major components: GitHub credential boundary in `background/github-actions.js`; Control Center credential UI in `options/github-token-ui.js`; watchdog runtime consumes repository identity/profile settings through `service-worker-v2.js`; secrets remain outside model/chat state.

Build / packaging: Node audit suite plus deterministic Python extension ZIP/source-manifest packaging.

Tests / validation: `github-actions-client.test.mjs`, expanded `github-token-security.test.mjs`, expanded `github-watchdog-ui.test.mjs`, broader extension tests, loaded Chromium MV3 watchdog E2E and static validator.

CI: five deterministic audit cycles, Chromium MV3 E2E and downstream reproducible package/provenance; workflow changes also trigger dependency-runner policy in integration/main contexts.

Release / deployment: established beta flow is frozen release branch → canonical PR merge-context validation → merge → exact-main validation.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` is the sole working repository. State-only HQ commits do not invalidate the frozen release branch basis.

External release dependencies: GitHub Actions runners only.

Material findings: candidate keeps credential key `chatpulseGithubCredentialsV1` but normalizes storage to schema v2 with optional `globalToken` plus existing repository-keyed `tokens`; old v1 stores remain readable. Token resolution is repository override → shared PAT → no credentials. Shared PAT UI is injected into the existing Control Center module and does not require model/runtime schema changes. Candidate diff is exactly nine expected files and contains no unrelated feature surfaces.

## 4. Release Gates

### GATE-1 — Shared credential behavior
Status: UNSATISFIED
Evidence: implemented on frozen candidate `f82008114d705baa95f145a5c2e569a2e1cc5800`: shared token storage, v1 compatibility, repository override and fallback resolution, focused security tests.
Blocking items: exact frozen release run `34095691707` must validate behavior/tests.

### GATE-2 — Control Center + security validation
Status: UNSATISFIED
Evidence: implemented on frozen candidate: one shared PAT UI with save/test/remove, explicit repository override precedence, masked secret handling and no runtime-message path; focused UI/security tests updated.
Blocking items: exact frozen release run `34095691707` must pass deterministic/static/browser validation.

### GATE-3 — Frozen candidate and canonical PR
Status: UNSATISFIED
Evidence: frozen candidate `f82008114d705baa95f145a5c2e569a2e1cc5800`; exact push run `34095691707` is in progress. No PR created prematurely.
Blocking items: terminal successful frozen run including downstream reproducible provenance, then canonical PR validation/merge.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: no 0.7.6 product merge exists yet.
Blocking items: GATE-3.

## 5. Current Critical Path

### CP-1 — Implement shared PAT and 0.7.6 release candidate
Status: VERIFYING
Release gate: GATE-1 + GATE-2.
Why critical: requested capability requires credential resolution and UI while preserving the credential boundary.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: `github-actions.js`, `github-token-ui.js`, focused token/security/UI tests and required 0.7.6 manifest/package/workflow metadata only.
Acceptance condition: repository token overrides shared PAT; shared PAT otherwise serves all repositories; absent tokens preserve unauthenticated behavior; v1 credentials remain readable; shared PAT can be saved/tested/removed without plaintext exposure; no secret enters model/export/content/runtime messages; release metadata is internally consistent.
Evidence: exact frozen candidate `f8200811...`; nine-file bounded diff; exact CI run `34095691707` active.

### CP-2 — Validate frozen 0.7.6 branch
Status: VERIFYING
Release gate: GATE-3.
Why critical: exact candidate must pass repository-native deterministic/browser/package gates before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34095691707` on `release/0.7.6-global-github-pat` at `f82008114d705baa95f145a5c2e569a2e1cc5800`.
Acceptance condition: 5/5 audit cycles + Chromium MV3 E2E + reproducible package/provenance SUCCESS, with exact candidate identity and package hashes recorded.
Evidence: run active; six primary jobs are on runners, package waits on them.

### CP-3 — Validate and merge canonical 0.7.6 PR
Status: PENDING
Release gate: GATE-3.
Why critical: integration into current main must be independently validated before merge.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: exact diff/head/base, PR CI, dependency policy, reviews/threads, mergeability and expected-head merge.
Acceptance condition: only the frozen validated head is merged after all required evidence is green.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Why critical: merge alone is not release evidence.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance.
Acceptance condition: exact product merge passes all release jobs and reproduces canonical candidate package hashes.
Evidence: pending.

## 6. Active Execution Registry

HQ: no active product write while frozen candidate validation is running; next action depends on exact CI result.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: release run `34095691707` on branch `release/0.7.6-global-github-pat` at exact SHA `f82008114d705baa95f145a5c2e569a2e1cc5800` is IN_PROGRESS. Active jobs at checkpoint: Chromium MV3 browser E2E `101658738053`; audit cycle 1 `101658738358`; cycle 2 `101658738212`; cycle 3 `101658738257`; cycle 4 `101658738250`; cycle 5 `101658738298`. Downstream package/provenance waits on primary success.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE: frozen exact candidate validation is the sole current dependency; creating another runner/branch/PR before its result would duplicate or weaken evidence.

## 8. Current Blockers

NONE. Active exact CI is an external execution, not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — credential storage, token UI, watchdog consumer boundary, model/export/content isolation, focused tests, static validator, packaging, release CI and open PR surface are covered.

Evidence Audit: PASS — candidate implementation and exact nine-file diff are live-verified; active run identity/head are exact; no claims of validation success are made before CI completes.

Release Alignment Audit: PASS — shared PAT behavior, safety tests and release packaging are the minimum requested release work; unrelated watchdog/Telegram/tab behavior and draft PR #17 are excluded.

Dependency & Ordering Audit: PASS — implementation/frozen candidate precedes frozen validation; frozen success precedes PR integration; merge precedes exact-main validation.

Execution & Parallelism Audit: PASS — candidate is frozen while one exact release run owns validation; no duplicate CI/PR/product write is started; no useful independent worker slice remains.

Adversarial Audit: PASS — strongest failure modes remain secret leakage, override inversion, legacy-store breakage, PAT transmission outside GitHub Actions GET, or accidental public-repo regression; candidate tests/design explicitly cover these and frozen CI is now attempting to falsify them.

Material findings and resolutions: shared PAT is a fallback rather than replacement for least-privilege repository tokens; v1 store is readable; secret values remain outside runtime/model/export surfaces; release metadata is 0.7.6-consistent on the frozen candidate.

## 10. Next Action

Exact next action: live-reconcile exact run `34095691707`. On terminal SUCCESS, verify all jobs and reproducible package/provenance hashes/artifact before creating the canonical PR. On failure, inspect only the exact red job and repair only evidenced cause; any repair creates a new frozen candidate SHA and validation run.
Executor: HQ.
Expected evidence: terminal run/job conclusions, exact candidate SHA and package/provenance identity/hashes.
Acceptance condition: CP-1/CP-2 advance to DONE only after exact frozen candidate release evidence is fully green.

## 11. Last Material Revision

What changed: shared PAT fallback, UI, security/UI tests and 0.7.6 release metadata were implemented on `release/0.7.6-global-github-pat`; exact nine-file candidate frozen at `f82008114d705baa95f145a5c2e569a2e1cc5800`; release run `34095691707` started.
Why the critical path changed: CP-1 moved from implementation to verification and CP-2 became active external validation.
Evidence causing the change: branch head, compare diff and exact GitHub Actions run/job identities.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: froze exact 0.7.6 candidate and live-confirmed its release run/job set.
Active external executions and exact refs: release run `34095691707` on `release/0.7.6-global-github-pat` at `f82008114d705baa95f145a5c2e569a2e1cc5800`, IN_PROGRESS; six primary jobs listed in Active Execution Registry.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + r46 + frozen candidate `f8200811...` + run `34095691707`.
Exact next action after recovery: live-check candidate branch head and run `34095691707`; if fully green, record provenance and proceed to canonical PR; if failed, diagnose exact failing job only.
Rotation blockers: NONE.
