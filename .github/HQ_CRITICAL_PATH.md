---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 42
updated_at: 2026-09-06T09:57:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: refs/pull/29/merge
basis_sha: 7583fe5a0104bf9170cc4b9154ad4b9659e5d664
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.5 beta — eliminate the shipped watchdog auth race that can log `restart отложен: в профиле Chrome не выполнен вход` immediately after ChatPulse opens a fresh ChatGPT tab.

Release surface: bounded GitHub-watchdog auth-grace planner, focused regressions, 0.7.5 extension/package metadata and repository-native release CI.

Definition of RELEASED: whenever an eligible watchdog restart first observes `authenticated: false`, that restart episode receives exactly one non-extending 60-second warm-up from that first unauthenticated observation. Time already spent loading/hydrating the document cannot consume that minute. During grace no command is sent. The same `restartKey` cannot receive a second grace after expiry. At expiry the targeted watchdog path performs a fresh GitHub Actions read before send eligibility. If ChatGPT still reports unauthenticated, restart remains fail-closed. New workflow activity, successful restart, watcher reset and global Stop retain their existing invalidation behavior; at-most-once dispatch remains intact.

Mandatory release gates:
- [x] planner guarantees a full 60 seconds from first unauthenticated restart observation rather than from `documentStartedAt`;
- [x] focused regressions cover full-minute timing, document-age independence, non-extension, one grace per restart episode and authenticated bypass;
- [x] manifest/package/workflow metadata targets 0.7.5 beta;
- [x] frozen candidate five deterministic audit cycles are green;
- [x] frozen candidate Chromium MV3 E2E is green;
- [x] frozen candidate reproducible package/provenance is green;
- [ ] canonical PR exact merge-ref, reviews/threads, dependency routing and release CI are green;
- [ ] exact post-merge main release evidence is green.

Required release evidence: exact SHAs/run IDs, deterministic suite, Chromium MV3 E2E, reproducible package/provenance, PR review/thread state, mergeability and exact post-merge main CI.

Known explicit exclusions: do not weaken the authenticated send gate; do not change GitHub poll cadence, inactivity thresholds, scheduler behavior, credential boundaries, Telegram behavior, tab recovery or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state-only checkpoint: `da5de22f723d381e6d0575a1cad4a9bdf0f43d22`.
Product basis before 0.7.5 patch: `2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8`; intervening main commits are HQ state-only.
Frozen release branch: `release/0.7.5-post-open-auth-warmup`.
Frozen branch SHA: `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.
Canonical PR: #29.
Current PR merge ref: `7583fe5a0104bf9170cc4b9154ad4b9659e5d664`.
Relevant open PRs: canonical #29; unrelated draft #17 excluded.
Relevant Issues: retired #14 excluded.
Relevant CI / workflows: frozen run `34024655868` SUCCESS; PR release run `34026030803` in progress; dependency runner policy run `34026030922` SUCCESS.
Relevant release/deployment state: frozen candidate validated; canonical PR open and mergeable; merge not yet performed.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog.

Architecture / major components: watchdog restart in `service-worker-v2.js`; bounded grace planning in `github-restart-grace.js`; content snapshot exposes auth state; model persists grace key/deadline; Node and loaded-Chromium tests cover release behavior.

Build / packaging: Node static/test audit plus deterministic Python ZIP/source-manifest package.

Tests / validation: deterministic extension suite, focused `github-restart-grace.test.mjs`, service-worker integration and Chromium MV3 E2E.

CI: 0.7.5 release workflow has five deterministic audit cycles on `[self-hosted, fast]`, Chromium MV3 E2E on GitHub-hosted Ubuntu, then reproducible package/provenance. Workflow changes also trigger dependency-runner policy validation.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` is the sole working repository.

External release dependencies: GitHub Actions runner capacity.

Material findings: 0.7.4 had correct one-shot/non-extending machinery, but initial grace deadline was tied to document age. 0.7.5 keeps the existing alarm/revalidation/send path and starts the initial grace from the first unauthenticated watchdog observation for a restart key. Superseded candidate `30f0db2...` exposed a flaky integration upper bound (`60002 ms` against hard `<=60000`); the assertion was repaired test-only. Frozen candidate `1f400040...` then passed all release gates. Canonical PR #29 contains exactly eight expected release files and is cleanly mergeable against state-only-ahead main.

## 4. Release Gates

### GATE-1 — Behavior implementation
Status: SATISFIED
Evidence: frozen candidate `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`; runtime fix and focused regressions present; follow-up timing change is test-only.
Blocking items: none.

### GATE-2 — Frozen branch validation
Status: SATISFIED
Evidence: run `34024655868` completed SUCCESS on exact frozen head `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`. All five deterministic audit cycles SUCCESS, Chromium MV3 E2E SUCCESS, reproducible package/provenance SUCCESS. ZIP SHA-256 `b6d42cf0788fd9c6e20965cfae1c1a8890f8b1c9d859edde1270499fd9013b43`; source-manifest SHA-256 `f5ef775f60f4993617b78fc1267ace08dfbfd3b946ec0b525c75dc17de9d8d68`; file count 18; reproducible timestamp `2020-01-01T00:00:00`; artifact ID `9986673651`, outer artifact digest `sha256:e3900e98284ead99d0c8a0f66003804eeb279785bd0f5eef4af1ee64035141f8`.
Blocking items: none.

### GATE-3 — Canonical PR #29
Status: UNSATISFIED
Evidence: PR #29 open from exact frozen head `1f400040...` to `main`; raw GitHub state reports `mergeable: true`, `rebaseable: true`, `mergeable_state: unstable` while checks run. Reviews: none. Review threads: none. Changed files are exactly `.github/workflows/extension-ci.yml`, `chrome-extension/background/github-restart-grace.js`, `chrome-extension/manifest.json`, `package.json`, `scripts/package_extension.py`, `scripts/validate_extension_release.mjs`, `tests/chrome-extension/github-restart-grace.test.mjs`, `tests/chrome-extension/service-worker.test.mjs`. Dependency runner policy run `34026030922` SUCCESS. PR release run `34026030803` is in progress. Current merge ref is `7583fe5a0104bf9170cc4b9154ad4b9659e5d664`.
Blocking items: terminal green PR release run and exact merge-ref verification.

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
Exact scope: planner, focused tests, 0.7.5 manifest/package/workflow metadata and timing-robust service-worker integration assertion.
Acceptance condition: one 60-second non-extending grace per unauthenticated restart key; authenticated pages no grace; expiry remains fail-closed and fresh-revalidated.
Evidence: exact frozen branch head `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.

### CP-2 — Validate frozen release branch
Status: DONE
Release gate: GATE-2.
Why critical: exact candidate must pass repository-native release gates.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34024655868` on exact frozen head.
Acceptance condition: all five deterministic audits + Chromium E2E + reproducible package/provenance succeed.
Evidence: run `34024655868` SUCCESS and canonical hashes above.

### CP-3 — Validate and merge canonical PR #29
Status: VERIFYING
Release gate: GATE-3.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: validate exact PR head/base/diff, merge ref, reviews, threads, dependency routing, release CI and mergeability; merge only after all evidence is green.
Acceptance condition: PR #29 merged from exact frozen head only after green merge-context release validation.
Evidence: mergeable true; no reviews/threads; dependency policy SUCCESS; release run `34026030803` active.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact main 0.7.5 release CI and provenance.
Acceptance condition: mandatory main evidence green on exact product merge SHA with canonical package hashes.
Evidence: pending.

## 6. Active Execution Registry

HQ: canonical PR verification; no branch/product writes while PR gate is active.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: PR #29 release run `34026030803` in progress; dependency runner policy `34026030922` SUCCESS. Frozen branch run `34024655868` SUCCESS is durable release evidence.

## 7. Safe Parallel Work

NONE — PR release CI is the remaining pre-merge dependency. No independent release-critical slice is safe or useful before exact merge-context validation finishes.

## 8. Current Blockers

NONE. Current state is active PR CI, not `BLOCKED`.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — relevant planner, service-worker retry/alarm path, content auth gate, runtime state, tests, package metadata, release workflow, dependency routing and PR diff covered.

Evidence Audit: PASS — frozen exact-head run is fully green with canonical hashes; canonical PR exact identities, mergeability, reviews/threads and active checks are live-verified.

Release Alignment Audit: PASS — release contains only the requested auth warm-up correction plus required tests/release metadata and a test-only anti-flake repair.

Dependency & Ordering Audit: PASS — implementation → frozen branch CI → canonical PR merge-context CI → merge → exact main CI.

Execution & Parallelism Audit: PASS — no duplicate execution or premature merge; PR gate and dependency policy are the only active validation surfaces.

Adversarial Audit: PASS — no unauthorized delayed send; grace remains one-shot and non-extending; expiry fresh-revalidates GitHub Actions; true logout stays fail-closed; PR contains no unrelated product files.

Material findings and resolutions: frozen candidate is now fully validated. PR #29 is mergeable despite main being ahead by HQ state-only commits; GitHub generated merge ref `7583fe5a...`. Dependency runner policy passed. Remaining uncertainty is only the terminal PR release gate.

## 10. Next Action

Exact next action: live-reconcile PR release run `34026030803`; if terminal SUCCESS and exact merge-ref context is verified, re-check PR head/base/mergeability/reviews/threads, then merge PR #29 with expected head SHA `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`. After merge, validate exact main release CI and provenance.
Executor: HQ.
Expected evidence: terminal PR release run, exact merge ref, merge result SHA, then exact main run/hashes.
Acceptance condition: no merge before PR release gate is fully green and identities remain unchanged.

## 11. Last Material Revision

What changed: frozen candidate `1f400040...` passed all release validation; canonical PR #29 was opened; exact merge ref generated; dependency routing passed; PR release validation started.
Why the critical path changed: CP-2 is complete and execution advanced to canonical PR verification.
Evidence causing the change: run `34024655868` SUCCESS, artifact `9986673651`, PR #29, merge ref `7583fe5a...`, dependency run `34026030922` SUCCESS.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: opened and structurally verified canonical PR #29 after full frozen-candidate success.
Active external executions and exact refs: PR #29 release run `34026030803` against head `1f400040b4ca0c985f52f8dc2a5775dd8bba607e` / current merge ref `7583fe5a0104bf9170cc4b9154ad4b9659e5d664`; dependency policy `34026030922` SUCCESS.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + r42 + PR #29 + run `34026030803`.
Exact next action after recovery: inspect PR release gate; on exact green, revalidate PR identities and merge; otherwise diagnose exact red job only.
Rotation blockers: NONE.
