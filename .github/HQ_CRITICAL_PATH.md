---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 43
updated_at: 2026-09-06T10:01:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 8cff97b4651ed32810ef7783815b49175432ad66
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.5 beta — eliminate the shipped watchdog auth race that can log `restart отложен: в профиле Chrome не выполнен вход` immediately after ChatPulse opens a fresh ChatGPT tab.

Release surface: bounded GitHub-watchdog auth-grace planner, focused regressions, 0.7.5 extension/package metadata and repository-native release CI.

Definition of RELEASED: whenever an eligible watchdog restart first observes `authenticated: false`, that restart episode receives exactly one non-extending 60-second warm-up from that first unauthenticated observation. Time already spent loading/hydrating cannot consume that minute. During grace no command is sent. The same `restartKey` cannot receive a second grace after expiry. At expiry the targeted watchdog performs a fresh GitHub Actions read before send eligibility. If ChatGPT still reports unauthenticated, restart remains fail-closed. New workflow activity, successful restart, watcher reset and global Stop retain existing invalidation behavior; at-most-once dispatch remains intact.

Mandatory release gates:
- [x] full 60 seconds from first unauthenticated watchdog observation;
- [x] focused timing/non-extension/authenticated-bypass regressions;
- [x] 0.7.5 beta release metadata;
- [x] exact frozen branch release gate;
- [x] canonical PR #29 merge-ref/reviews/threads/dependency/release gates;
- [x] canonical PR #29 merged from exact frozen head;
- [ ] exact post-merge main release gate and reproducible provenance are green.

Required release evidence: exact SHAs/run IDs, five deterministic audit cycles, Chromium MV3 E2E, reproducible package/provenance, PR review/thread state and exact post-merge main evidence.

Known explicit exclusions: no weakening of authenticated send gate; no GitHub poll cadence, inactivity threshold, scheduler, credential boundary, Telegram, tab-recovery or unrelated draft PR #17 changes.

## 2. Repository Basis

Default branch: `main`.
Validated frozen branch: `release/0.7.5-post-open-auth-warmup` at `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.
Frozen branch run: `34024655868` SUCCESS.
Canonical PR: #29, merged.
Validated PR merge-ref: `7583fe5a0104bf9170cc4b9154ad4b9659e5d664` (merged frozen head into pre-r42 state `da5de22f...`).
PR release run: `34026030803` SUCCESS on exact merge-ref; dependency policy run `34026030922` SUCCESS.
Product merge commit: `8cff97b4651ed32810ef7783815b49175432ad66`, parents `196ba641358ad3e1701e790e92a42974fea606e4` (r42 state-only) and frozen head `1f400040...`.
Exact post-merge release run: `34026201623` on product merge SHA, active.
Exact post-merge dependency policy run: `34026201698`, SUCCESS.
Relevant open PRs: unrelated draft #17 excluded.
Relevant Issues: retired #14 excluded.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog.

Architecture / major components: watchdog restart in `service-worker-v2.js`; bounded grace planning in `github-restart-grace.js`; auth state from content snapshot; durable runtime state; Node and loaded-Chromium validation.

Build / packaging: Node static/test audit plus deterministic Python ZIP/source-manifest packaging.

Tests / validation: 113 deterministic extension tests in merge context, focused auth-grace regressions, service-worker integration and Chromium MV3 browser E2E.

CI: five deterministic audit cycles, Chromium MV3 E2E, reproducible package/provenance; workflow changes also trigger dependency-runner policy validation.

Release / deployment: PR #29 merged; final exact-main evidence active.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository. State-only HQ commits do not invalidate product critical-path evidence.

External release dependencies: GitHub Actions runners.

Material findings: 0.7.4 anchored grace to document age; 0.7.5 starts the existing bounded one-shot grace at first unauthenticated watchdog observation. A superseded candidate exposed only a 2 ms timing-test jitter and was repaired test-only. Frozen and PR merge-context gates are fully green. Final product merge `8cff97b4...` is now under exact-main validation.

## 4. Release Gates

### GATE-1 — Behavior implementation
Status: SATISFIED
Evidence: frozen head `1f400040...`; runtime planner fix plus focused regressions; authenticated send path unchanged.
Blocking items: none.

### GATE-2 — Frozen branch validation
Status: SATISFIED
Evidence: run `34024655868` SUCCESS; 5/5 audits, Chromium E2E and package/provenance. Canonical ZIP SHA-256 `b6d42cf0788fd9c6e20965cfae1c1a8890f8b1c9d859edde1270499fd9013b43`; source-manifest SHA-256 `f5ef775f60f4993617b78fc1267ace08dfbfd3b946ec0b525c75dc17de9d8d68`; artifact `9986673651`; file count 18; timestamp `2020-01-01T00:00:00`.
Blocking items: none.

### GATE-3 — Canonical PR #29
Status: SATISFIED
Evidence: exact 8 expected files; `mergeable_state: clean`; reviews none; review threads none; dependency run `34026030922` SUCCESS; release run `34026030803` SUCCESS with 5/5 audits, Chromium E2E and package/provenance on exact merge-ref `7583fe5a...`; merged with expected head `1f400040...` into product merge `8cff97b4...`.
Blocking items: none.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: exact main product merge `8cff97b4651ed32810ef7783815b49175432ad66`; release run `34026201623` is in progress with all six primary jobs on runners; dependency policy `34026201698` SUCCESS.
Blocking items: terminal success of five audits + Chromium E2E + downstream reproducible package/provenance, with canonical hashes.

## 5. Current Critical Path

### CP-1 — Implement full restart auth warm-up
Status: DONE
Release gate: GATE-1.
Why critical: fixes reported fresh-tab auth race without changing authorization semantics.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: planner, focused tests and required 0.7.5 release metadata.
Acceptance condition: one full, non-extending minute per unauthenticated restart episode; authenticated pages bypass; expiry remains fresh-revalidated and fail-closed.
Evidence: frozen head `1f400040...`.

### CP-2 — Validate frozen release branch
Status: DONE
Release gate: GATE-2.
Why critical: exact candidate must pass repository-native gates before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34024655868`.
Acceptance condition: full branch gate success and reproducible provenance.
Evidence: SUCCESS and canonical hashes above.

### CP-3 — Validate and merge canonical PR #29
Status: DONE
Release gate: GATE-3.
Why critical: validates integration into main context before merge.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: head/base/diff/merge-ref/reviews/threads/dependency/release CI/mergeability and expected-head merge.
Acceptance condition: merge only from validated frozen head.
Evidence: PR #29 merged; product merge `8cff97b4...`.

### CP-4 — Validate exact post-merge main
Status: VERIFYING
Release gate: GATE-4.
Why critical: RELEASED requires independent exact-main evidence, not merge alone.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34026201623` on `8cff97b4...`, plus reproducible provenance; dependency run `34026201698` already green.
Acceptance condition: 5/5 audits + Chromium E2E + package/provenance SUCCESS with canonical package hashes.
Evidence: active exact-main run.

## 6. Active Execution Registry

HQ: no product writes; live-reconcile exact-main validation and close release only after full evidence.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: release run `34026201623` on `main` at `8cff97b4651ed32810ef7783815b49175432ad66` active; dependency policy `34026201698` SUCCESS.

## 7. Safe Parallel Work

NONE — exact post-merge main validation is the sole remaining release-critical dependency; duplicate execution or additional product/state changes cannot improve evidence.

## 8. Current Blockers

NONE. Current state is active final CI, not `BLOCKED`.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — planner, service-worker alarm/revalidation path, auth/send boundary, tests, packaging, release CI, dependency routing and PR integration covered.

Evidence Audit: PASS — frozen branch and PR merge-context are independently green with exact identities/hashes; final main run is exact and live.

Release Alignment Audit: PASS — only requested auth warm-up semantics plus tests/release metadata and test-only anti-flake repair are in product diff.

Dependency & Ordering Audit: PASS — implementation → frozen validation → PR merge-context validation → merge → exact-main validation.

Execution & Parallelism Audit: PASS — no premature merge, duplicate CI or overlapping product write; final CI owns remaining gate.

Adversarial Audit: PASS — no blind delayed send; grace non-extending and one-shot; expiry fresh-revalidates; true logout fail-closed; credential/at-most-once boundaries unchanged.

Material findings and resolutions: all pre-merge release gates are closed; exact product merge is confirmed as main and has started its own release validation.

## 10. Next Action

Exact next action: live-reconcile run `34026201623`; on terminal SUCCESS verify package/provenance hashes match frozen/PR canonical hashes, then persist DONE and close the wave. On any failure inspect only the exact red job and repair only evidenced cause.
Executor: HQ.
Expected evidence: final job conclusions, artifact/provenance hashes and exact product merge identity.
Acceptance condition: DONE only after exact-main release evidence is fully green.

## 11. Last Material Revision

What changed: canonical PR #29 passed all merge-context gates and was merged from frozen head into main as `8cff97b4...`; exact post-merge release validation started; dependency policy is already green.
Why the critical path changed: CP-3 completed and CP-4 became the sole active release node.
Evidence causing the change: PR #29 merge result, main branch identity, run `34026201623`, dependency run `34026201698`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: merged validated PR #29 and started exact-main reconciliation.
Active external executions and exact refs: release run `34026201623` on `main` product SHA `8cff97b4651ed32810ef7783815b49175432ad66`; dependency run `34026201698` SUCCESS.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + r43 + exact product merge `8cff97b4...` + run `34026201623`.
Exact next action after recovery: inspect run `34026201623`; on full success verify provenance and persist DONE, otherwise diagnose exact failing job only.
Rotation blockers: NONE.
