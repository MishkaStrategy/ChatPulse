---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 48
updated_at: 2026-09-07T10:46:00Z
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
- [x] shared PAT storage + repository-specific override + fallback resolution implemented with v1 credential-store compatibility and validated by 5/5 audit cycles;
- [x] Control Center can save/test/remove shared PAT and clearly shows precedence, validated by focused/static tests and Chromium MV3 E2E;
- [x] 0.7.6 beta release metadata/package/workflow updated;
- [ ] exact frozen release branch has complete reproducible package/provenance artifact upload evidence;
- [ ] canonical PR merge-context and dependency policy pass, then exact validated head is merged;
- [ ] exact post-merge main release gate and package/provenance are green.

Required release evidence: exact SHAs/run IDs, focused credential tests, UI/static assertions, five audit cycles, Chromium MV3 E2E, reproducible package hashes and successfully finalized artifact, canonical PR state and exact-main validation.

Known explicit exclusions: no GitHub write API; no workflow dispatch; no token in portable config/runtime state/content script; no watchdog polling/idle/restart changes; no Telegram/auth-grace/tab-recovery changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state-only r48 write: `d3d486589614695897ab8fa93025552731072131`.
Critical-path basis ref: `release/0.7.6-global-github-pat`.
Critical-path basis SHA: `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`.
Canonical integration branch: `release/0.7.6-global-github-pat`.
Canonical PR / RC: frozen candidate `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`; PR waits for finalized branch provenance artifact.
Relevant open PRs: draft #17 only, unrelated and excluded.
Relevant CI / workflows: superseded product-validation failure run `34095691707`; repaired candidate run `34110957235`, attempt 1 completed with all product/audit/package validation green but artifact finalization failed transiently; attempt 2 is queued after targeted package-job rerun.
Relevant release/deployment state: 0.7.5 DONE; 0.7.6 frozen candidate product validation is green and provenance upload is being retried.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.

Architecture / major components: credential boundary in `background/github-actions.js`; shared/individual token UI in `options/github-token-ui.js`; watchdog runtime remains outside credential storage.

Build / packaging: Node audit suite plus deterministic Python ZIP/source-manifest packaging.

Tests / validation: focused GitHub credential/UI tests, broader extension suite, static validator, loaded Chromium MV3 E2E.

CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance; dependency policy in PR/main contexts.

Release / deployment: frozen branch → canonical PR → merge → exact-main validation.

Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository.

External release dependencies: GitHub Actions runners and GitHub artifact service.

Material findings: repaired candidate `9ed53d2d...` passed 5/5 audit cycles, Chromium MV3 E2E, reproducible package generation twice, static/security validation and local hash verification. Canonical candidate hashes are ZIP `5872b5ef4a4ea88eaaca2a49d4b668cc7eabd596bcff41971d86ad529593bae0` and source manifest `05af20c8c290a1c3425d4020895c168c37629543f86c1aaa723ee13235a4eabf`. Run `34110957235` failed only after artifact bytes uploaded, when `actions/upload-artifact@v4` finalization returned `ECONNRESET`. This is external transport failure, not product/package failure. The exact failed package job `101711262356` was rerun; run attempt 2 is queued on the unchanged frozen SHA.

## 4. Release Gates

### GATE-1 — Shared credential behavior
Status: SATISFIED
Evidence: exact repaired candidate passed all five full extension audits; focused shared-PAT, repository override and v1 compatibility tests are green.
Blocking items: NONE.

### GATE-2 — Control Center + security validation
Status: SATISFIED
Evidence: all five audits and Chromium MV3 E2E succeeded on `9ed53d2d...`; static validator also succeeded in package job.
Blocking items: NONE.

### GATE-3 — Frozen candidate and canonical PR
Status: UNSATISFIED
Evidence: product validation and reproducible hashes are green; artifact upload attempt 1 failed only at FinalizeArtifact with `ECONNRESET`. Exact package job rerun is queued as run attempt 2.
Blocking items: successful finalized provenance artifact, then canonical PR validation/merge.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: no 0.7.6 product merge yet.
Blocking items: GATE-3.

## 5. Current Critical Path

### CP-1 — Implement shared PAT and 0.7.6 release candidate
Status: DONE
Release gate: GATE-1 + GATE-2.
Why critical: requested capability requires credential fallback and UI with credential-boundary preservation.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: credential module, token UI, focused tests and 0.7.6 release metadata; validator repair was test-only.
Acceptance condition: repository PAT overrides shared PAT; shared PAT otherwise serves all repositories; absent tokens preserve public behavior; v1 store readable; secrets never escape protected storage; release metadata consistent.
Evidence: candidate `9ed53d2d...`; 5/5 audits + Chromium E2E + package/static/hash validation green.

### CP-2 — Complete frozen 0.7.6 provenance validation
Status: VERIFYING
Release gate: GATE-3.
Why critical: release contract requires finalized reproducible provenance artifact before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: targeted rerun of package job from run `34110957235` on exact SHA `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`.
Acceptance condition: reproducible package/provenance job succeeds and artifact is finalized with candidate hashes recorded.
Evidence: attempt 1 generated/verified exact hashes but FinalizeArtifact failed with `ECONNRESET`; targeted rerun accepted and run attempt 2 queued.

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

HQ: no product write; candidate remains frozen at `9ed53d2d...`.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: run `34110957235`, attempt 2, targeted package-job rerun on exact branch `release/0.7.6-global-github-pat` SHA `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`; queued after successful rerun request. Successful attempt-1 jobs remain evidence: Chromium E2E and audit cycles 1–5 all SUCCESS.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE: finalized provenance artifact is the sole prerequisite before canonical PR creation; no product change is justified and duplicate CI is forbidden.

## 8. Current Blockers

NONE. The artifact upload retry is active external execution, not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — credential storage/UI, runtime boundary, focused tests, static validator, packaging, artifact upload, CI and PR surface covered.

Evidence Audit: PASS — all product/test/package claims come from exact run/job logs on the frozen SHA; artifact finalization failure is explicit `ECONNRESET` after byte upload.

Release Alignment Audit: PASS — no code change is needed for a transport-only artifact finalization failure; only exact provenance upload remains before PR.

Dependency & Ordering Audit: PASS — finalized branch provenance must precede canonical PR; PR precedes merge; merge precedes exact-main validation.

Execution & Parallelism Audit: PASS — targeted rerun of the single failed package job is the cheapest reliable route; it preserves successful prior jobs and exact candidate identity.

Adversarial Audit: PASS — strongest alternative hypothesis, a product/package defect, is contradicted by 5/5 audits, Chromium E2E, two identical deterministic package builds, static validation and exact hash verification; only GitHub artifact finalization transport failed.

Material findings and resolutions: candidate remains unchanged; retry is justified by changed execution condition/evidence — the failed action is an external transient `ECONNRESET`, not a deterministic project failure.

## 10. Next Action

Exact next action: live-reconcile run `34110957235` attempt 2. On successful package/provenance finalization, verify artifact metadata and create canonical PR from exact frozen head `9ed53d2d...`; if artifact upload fails again, reassess runner/artifact transport route without changing product code.
Executor: HQ.
Expected evidence: terminal package-job conclusion, artifact ID/digest and candidate hashes.
Acceptance condition: CP-2 DONE only after finalized artifact exists for the exact frozen candidate.

## 11. Last Material Revision

What changed: run `34110957235` attempt 1 proved all product/test/package gates green but failed only in `actions/upload-artifact` finalization with `ECONNRESET`; HQ issued targeted rerun of exact failed package job, creating run attempt 2 without changing candidate SHA.
Why the critical path changed: CP-1 is now proven DONE; CP-2 narrows to provenance artifact finalization only.
Evidence causing the change: jobs from run `34110957235`, package job `101711262356`, reproducible hashes and FinalizeArtifact transport error.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: classified attempt-1 failure as external artifact-finalization transport failure and successfully requested targeted package-job rerun.
Active external executions and exact refs: run `34110957235`, attempt 2, exact SHA `9ed53d2d74b9cc20fb580d540e7d5ca3bb493597`, queued at checkpoint.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r48 + branch `release/0.7.6-global-github-pat` + frozen candidate `9ed53d2d...` + run `34110957235` attempt 2.
Exact next action after recovery: live-check attempt 2 package job; if successful verify artifact then create canonical PR; if failed inspect exact transport failure and choose a non-product retry/route change only with new evidence.
Rotation blockers: NONE.
