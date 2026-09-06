---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 38
updated_at: 2026-09-06T08:43:40Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.5 beta — fix the post-open ChatGPT authentication race reported by the owner.

Release surface: Chrome MV3 extension watchdog restart path, focused auth-grace tests, version/package metadata and ordinary release CI.

Definition of RELEASED: when ChatPulse itself creates or replaces a managed ChatGPT tab for a GitHub-watchdog restart, a transient unauthenticated snapshot cannot consume most of the intended warm-up merely because the document spent time loading; the restart receives a full non-extending 60-second grace from the ChatPulse open/replacement event when that event is known. Existing safety remains intact: no blind send, no grace extension for the same restart episode, a true logout after grace remains fail-closed, grace expiry revalidates GitHub Actions before eligibility/send, new workflow activity and global Stop invalidate pending grace, and at-most-once dispatch is preserved.

Mandatory release gates:
- [ ] bounded implementation uses the ChatPulse open/replacement timestamp when available while retaining document-start fallback for legacy/non-opened paths;
- [ ] focused unit/service-worker regressions prove a slow-loading newly opened tab still receives a full 60 seconds and same-episode grace cannot extend;
- [ ] version/package/release metadata is 0.7.5 beta and reproducible packaging remains deterministic;
- [ ] frozen release branch exact-head CI is green;
- [ ] canonical PR exact merge-ref, reviews/threads and mergeability are green;
- [ ] exact post-merge main release evidence is green.

Required release evidence: exact SHAs/run IDs, deterministic tests, loaded Chromium MV3 E2E, reproducible package hashes, PR review/thread state and post-merge main CI.

Known explicit exclusions: do not broaden authentication detection, do not weaken fail-closed behavior for genuinely logged-out profiles, do not change GitHub polling cadence, inactivity thresholds, credential boundaries, ordinary scheduler behavior, Telegram behavior or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA: `2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8`.
Critical-path basis ref: `main`.
Critical-path basis SHA: `2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8`.
Canonical integration branch: `release/0.7.5-post-open-auth-warmup`.
Canonical PR / RC: not opened yet.
Relevant open PRs: draft #17 is unrelated and excluded.
Relevant Issues: retired #14 is unrelated and excluded.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.4 beta is closed; 0.7.5 beta patch release is now active due to owner-reported regression.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog.

Architecture / major components: `service-worker-v2.js` owns watchdog restart/recovery, `github-restart-grace.js` plans bounded auth grace, `content-script.js` reports auth/document timing, model helpers persist watchdog runtime state, Node tests and Chromium E2E validate behavior.

Build / packaging: Node validation plus reproducible Python ZIP/source-manifest packaging.

Tests / validation: deterministic extension suite plus loaded Chromium MV3 GitHub-watchdog E2E.

CI: five deterministic audit cycles, browser E2E and reproducible package/provenance jobs.

Release / deployment: beta artifact validated by exact branch, PR merge-ref and post-merge main CI.

Governance: organizational HQ master v1.2; project repository is `MishkaStrategy/ChatPulse`.

External release dependencies: GitHub Actions self-hosted runners and GitHub-hosted Chromium job.

Material findings: current 0.7.4 planner defines `GITHUB_RESTART_GRACE_MS = 60_000` but calculates a new grace deadline from `snapshot.documentStartedAt`. The service-worker test explicitly asserts the alarm is approximately `documentStartedAt + 60s`. Therefore time spent loading before first useful inspection consumes the user-intended post-open minute. The actual ChatPulse tab creation/replacement event is not currently passed into the grace planner.

## 4. Release Gates

### GATE-1 — Correct post-open grace semantics
Status: UNSATISFIED
Evidence: `github-restart-grace.js`, `service-worker-v2.js`, `service-worker.test.mjs` on main.
Blocking items: bounded patch and regressions.

### GATE-2 — Frozen branch validation
Status: UNSATISFIED
Evidence: release branch exists from exact main basis.
Blocking items: implementation and exact-head CI.

### GATE-3 — Canonical PR
Status: UNSATISFIED
Evidence: none yet.
Blocking items: frozen branch green first.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: none yet.
Blocking items: PR merge first.

## 5. Current Critical Path

### CP-1 — Implement full 60-second grace from ChatPulse open/replacement event
Status: ACTIVE
Release gate: GATE-1.
Why critical: owner regression is caused by the current clock origin, not by absence of a nominal 60-second constant.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: auth-grace planner, service-worker propagation of a bounded open/replacement timestamp, focused tests, 0.7.5 release metadata only.
Acceptance condition: a newly created/replaced tab that spent substantial time loading still gets a non-extending 60 seconds from the ChatPulse open event when unauthenticated; old/non-opened tabs do not gain a fresh arbitrary delay; all existing safety invariants remain.
Evidence: pending patch/test diff.

### CP-2 — Validate frozen release branch
Status: PENDING
Release gate: GATE-2.
Why critical: exact branch must pass deterministic, browser and package gates.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: repository-native release CI on exact branch head.
Acceptance condition: all required jobs succeed with reproducible 0.7.5 artifacts.
Evidence: pending workflow run.

### CP-3 — Validate and merge canonical PR
Status: PENDING
Release gate: GATE-3.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT.
Exact scope: exact PR head/base/diff/reviews/threads/CI/mergeability, then merge if ready.
Acceptance condition: merged only from validated exact head.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact main release CI and reproducible provenance.
Acceptance condition: all mandatory release evidence green on exact product merge SHA.
Evidence: pending.

## 6. Active Execution Registry

HQ: CP-1 — write scope limited to `release/0.7.5-post-open-auth-warmup` product/tests/release metadata and this HQ control file on main.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE active at this checkpoint.

## 7. Safe Parallel Work

NONE — the planner/service-worker/test/version changes are one tightly coupled small patch; parallel writers would add conflict and integration risk without material wall-clock benefit.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — inspected current main, grace planner, service-worker restart/recovery paths, content auth snapshot, model runtime merge, focused unit/service-worker tests, package metadata and release workflow.

Evidence Audit: PASS — regression mechanism is proven by live main code and the existing test assertion using `documentStartedAt + 60s`; owner report supplies runtime evidence that the shipped behavior is insufficient.

Release Alignment Audit: PASS — only the clock-origin defect, focused regressions and necessary 0.7.5 release metadata are in scope.

Dependency & Ordering Audit: PASS — implementation/tests precede exact branch CI, then PR, merge and exact main validation.

Execution & Parallelism Audit: PASS — bounded HQ_DIRECT patch, repository-native CI validation, no overlapping writer and no Codex capability gap.

Adversarial Audit: PASS — chosen design does not grant arbitrary grace to old tabs, does not extend a same-episode deadline, retains fresh GitHub revalidation before send and retains fail-closed true logout behavior.

Material findings and resolutions: replace document-age-only semantics with `max(documentStartedAt, known ChatPulse open/replacement time)` as the grace origin; if no trusted open/replacement time is available, retain the current document-start fallback.

## 10. Next Action

Exact next action: patch the release branch and focused regressions, including 0.7.5 metadata.
Executor: HQ_DIRECT.
Expected evidence: branch diff and resulting exact branch head.
Acceptance condition: bounded diff matches the release contract with no unrelated changes.

## 11. Last Material Revision

What changed: r37 DONE for 0.7.4 reopened into r38 EXECUTING for 0.7.5 due to owner-reported shipped regression.
Why the critical path changed: 0.7.4 warm-up uses document-start timing and does not guarantee a full minute after ChatPulse opens a new tab.
Evidence causing the change: owner runtime report plus live main planner/service-worker/test inspection.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: created `release/0.7.5-post-open-auth-warmup` from exact main `2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8` and verified the bounded design.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r38 + release branch.
Exact next action after recovery: implement CP-1 on `release/0.7.5-post-open-auth-warmup`.
Rotation blockers: NONE.
