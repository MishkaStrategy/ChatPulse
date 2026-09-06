---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 41
updated_at: 2026-09-06T09:27:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.5-post-open-auth-warmup
basis_sha: 1f400040b4ca0c985f52f8dc2a5775dd8bba607e
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.5 beta — eliminate the shipped watchdog auth race that can log `restart отложен: в профиле Chrome не выполнен вход` immediately after ChatPulse opens a fresh ChatGPT tab.

Release surface: bounded GitHub-watchdog auth-grace planner, focused regressions, 0.7.5 extension/package metadata and repository-native release CI.

Definition of RELEASED: whenever an eligible watchdog restart first observes `authenticated: false`, that restart episode receives exactly one non-extending 60-second warm-up from that first unauthenticated observation. Time already spent loading/hydrating the document cannot consume that minute. During grace no command is sent. The same `restartKey` cannot receive a second grace after expiry. At expiry the targeted watchdog path performs a fresh GitHub Actions read before send eligibility. If ChatGPT still reports unauthenticated, restart remains fail-closed. New workflow activity, successful restart, watcher reset and global Stop retain their existing invalidation behavior; at-most-once dispatch remains intact.

Mandatory release gates:
- [x] planner guarantees a full 60 seconds from first unauthenticated restart observation rather than from `documentStartedAt`;
- [x] focused unit regression proves a 45-second-old document still receives 60 seconds, document age cannot consume the grace, same-episode grace cannot extend/restart, authenticated pages get no grace;
- [x] manifest/package/workflow metadata targets 0.7.5 beta;
- [ ] frozen candidate five deterministic audit cycles are green;
- [ ] frozen candidate Chromium MV3 E2E is green on the current exact candidate;
- [ ] frozen-candidate reproducible package/provenance is green;
- [ ] canonical PR exact merge-ref, reviews/threads and mergeability are green;
- [ ] exact post-merge main release evidence is green.

Required release evidence: exact SHAs/run IDs, deterministic suite, Chromium MV3 E2E, reproducible package/provenance, PR review/thread state and exact post-merge main CI.

Known explicit exclusions: do not weaken the authenticated send gate; do not change GitHub poll cadence, inactivity thresholds, scheduler behavior, credential boundaries, Telegram behavior, tab recovery or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state-only checkpoint: `1c51a9c43f2ac2099b20f1e0280291eb3ed08ca1`.
Product basis before 0.7.5 patch: `2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8`; intervening main commits are HQ state-only.
Critical-path basis ref: `release/0.7.5-post-open-auth-warmup`.
Critical-path basis SHA: `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.
Canonical integration branch: `release/0.7.5-post-open-auth-warmup`.
Canonical PR / RC: pending frozen branch validation.
Relevant open PRs: draft #17 excluded.
Relevant Issues: retired #14 excluded.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`; current exact branch run `34024655868`; superseded failed run `34022809958`.
Relevant release/deployment state: current candidate validation active; no merge performed.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog.

Architecture / major components: watchdog restart in `service-worker-v2.js`; bounded grace planning in `github-restart-grace.js`; content snapshot exposes auth state; model persists grace key/deadline; Node and loaded-Chromium tests cover release behavior.

Build / packaging: Node static/test audit plus deterministic Python ZIP/source-manifest package.

Tests / validation: deterministic extension suite, focused `github-restart-grace.test.mjs`, service-worker integration and Chromium MV3 E2E.

CI: 0.7.5 release workflow has five deterministic audit cycles on `[self-hosted, fast]`, Chromium MV3 E2E on GitHub-hosted Ubuntu, then reproducible package/provenance.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` is the sole working repository.

External release dependencies: GitHub Actions runner capacity.

Material findings: 0.7.4 had correct one-shot/non-extending machinery, but its initial deadline was tied to document age. The 0.7.5 runtime repair keeps the existing alarm/revalidation/send path and changes only the initial clock origin to the first unauthenticated watchdog observation for a restart key. The first frozen candidate `30f0db2532786b3e9d876d7a151afba3ba593ac7` passed Chromium E2E and one deterministic cycle, but four deterministic cycles failed the same integration assertion because the test measured the new alarm deadline against an earlier `documentStartedAt` and rejected normal 1-2 ms wall-clock delay (`60002 ms`). All focused planner tests passed. The test harness was repaired without changing runtime code: integration now measures from the start of unauthenticated detection and requires at least 60 seconds with a bounded 1-second scheduler tolerance. New exact candidate is `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.

## 4. Release Gates

### GATE-1 — Behavior implementation
Status: SATISFIED
Evidence: current exact candidate `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`; runtime files are unchanged from `30f0db2...`; only the flaky integration assertion changed. Focused unit tests in the superseded run passed the full-minute semantics.
Blocking items: none.

### GATE-2 — Frozen branch validation
Status: UNSATISFIED
Evidence: superseded run `34022809958` failed because four copies of `tests/chrome-extension/service-worker.test.mjs` rejected a `60002 ms` alarm delta; cycle 4 and Chromium E2E passed, demonstrating non-deterministic test timing rather than product divergence. Current run `34024655868` is active on exact candidate `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`; all five deterministic cycles and Chromium E2E have acquired runners.
Blocking items: terminal success of all current deterministic jobs, current Chromium E2E and downstream package/provenance.

### GATE-3 — Canonical PR
Status: UNSATISFIED
Evidence: PR intentionally not opened before frozen branch validation.
Blocking items: GATE-2.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: none yet.
Blocking items: GATE-3.

## 5. Current Critical Path

### CP-1 — Implement full restart auth warm-up
Status: DONE
Release gate: GATE-1.
Why critical: fixes the reported race without changing send authorization semantics.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: planner, focused tests, 0.7.5 manifest/package/workflow metadata and a timing-robust service-worker integration assertion.
Acceptance condition: one 60-second non-extending grace per unauthenticated restart key; authenticated pages no grace; expiry remains fail-closed and fresh-revalidated; integration test does not confuse scheduler jitter with product failure.
Evidence: exact branch head `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.

### CP-2 — Validate frozen release branch
Status: VERIFYING
Release gate: GATE-2.
Why critical: exact candidate must pass repository-native release gates.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34024655868` on exact head `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.
Acceptance condition: all five deterministic audits + Chromium E2E + reproducible package/provenance succeed.
Evidence: current run active; all six primary validation jobs have acquired runners.

### CP-3 — Validate and merge canonical PR
Status: PENDING
Release gate: GATE-3.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT.
Exact scope: open PR only after frozen-head success; verify exact head/base/diff/reviews/threads/CI/mergeability, then merge when ready.
Acceptance condition: merged only from validated exact candidate.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact main 0.7.5 release CI and provenance.
Acceptance condition: mandatory main evidence green on exact product merge SHA.
Evidence: pending.

## 6. Active Execution Registry

HQ: no overlapping product write after the test-harness repair; next action depends on current branch CI.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: GitHub Actions run `34024655868`, ref `release/0.7.5-post-open-auth-warmup`, SHA `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`. Five deterministic audit jobs and Chromium E2E are in progress. Expected next event: terminal primary validations followed by package/provenance if green.

## 7. Safe Parallel Work

NONE — opening/merging the canonical PR before the current frozen exact-head gate would violate release ordering. Runtime code is already complete; no independent release-critical slice remains while current validation is active.

## 8. Current Blockers

NONE. The superseded CI failure was diagnosed and repaired in the test harness; current state is active validation, not `BLOCKED`.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — relevant planner, service-worker retry/alarm path, content auth gate, runtime state, focused tests, integration test, package metadata and release workflow are covered.

Evidence Audit: PASS — owner runtime report identified the original race; exact superseded run logs isolate the later failure to a timing assertion; current candidate/ref/run are exact and live.

Release Alignment Audit: PASS — runtime patch remains limited to auth warm-up timing; follow-up change is test-only and directly removes false CI negatives.

Dependency & Ordering Audit: PASS — runtime implementation → timing-robust regression → exact frozen branch CI → PR → merge → exact main CI.

Execution & Parallelism Audit: PASS — no blind rerun of the known-bad test harness; exact evidenced test fix created a new candidate and one canonical validation run.

Adversarial Audit: PASS — test relaxation does not relax runtime authorization or deadline semantics; it still asserts at least 60 seconds from detection and bounds only test/scheduler measurement jitter. Same restart key cannot extend/restart grace, expiry still routes through fresh GitHub Actions check, and true logout remains fail-closed.

Material findings and resolutions: superseded run `34022809958` is not product evidence against the runtime repair. Four failures were the same `60002 ms` upper-bound assertion while the exact same code passed another deterministic cycle and browser E2E. The current test checks the intended contract instead of document-age coupling.

## 10. Next Action

Exact next action: live-reconcile run `34024655868`; if all five deterministic jobs, Chromium E2E and package/provenance are green, create the canonical 0.7.5 PR from exact head `1f400040b4ca0c985f52f8dc2a5775dd8bba607e` to current main. If any current job fails, inspect that exact failing job and repair only the evidenced cause.
Executor: HQ.
Expected evidence: terminal current-run job conclusions and package/provenance.
Acceptance condition: no PR created until current frozen candidate is fully green.

## 11. Last Material Revision

What changed: superseded frozen run failed on a flaky integration upper bound; exact failure was diagnosed; test-only repair committed as `1f400040...`; new release run `34024655868` started and all primary jobs acquired runners.
Why the critical path changed: candidate provenance advanced because the first frozen test harness was not deterministic under normal millisecond scheduling jitter.
Evidence causing the change: run `34022809958`, job `101458397552` log showing `AssertionError: 60002`; current run `34024655868` on `1f400040...`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: repaired the evidenced test-harness flake and launched exact-candidate release validation.
Active external executions and exact refs: run `34024655868` on `release/0.7.5-post-open-auth-warmup` at `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`; five deterministic audit jobs plus Chromium E2E are active.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + r41 + exact run `34024655868`.
Exact next action after recovery: inspect run `34024655868`; on full frozen-candidate success open canonical PR, otherwise diagnose exact red job only.
Rotation blockers: NONE.
