---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 44
updated_at: 2026-09-06T12:44:00Z
project_state: DONE
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
- [x] exact post-merge main release gate and reproducible provenance are green with canonical hashes.

Required release evidence: exact SHAs/run IDs, five deterministic audit cycles, Chromium MV3 E2E, reproducible package/provenance, PR review/thread state and exact post-merge main evidence.

Known explicit exclusions: no weakening of authenticated send gate; no GitHub poll cadence, inactivity threshold, scheduler, credential boundary, Telegram, tab-recovery or unrelated draft PR #17 changes.

## 2. Repository Basis

Default branch: `main`.
Release product SHA: `8cff97b4651ed32810ef7783815b49175432ad66`.
Current default-branch HEAD before this final state-only checkpoint: `01751e0b9eb6b8a18069f78074651082875b3451`; the only commit after the release product SHA is r43 updating `.github/HQ_CRITICAL_PATH.md`, so product release evidence remains current.
Validated frozen branch: `release/0.7.5-post-open-auth-warmup` at `1f400040b4ca0c985f52f8dc2a5775dd8bba607e`.
Frozen branch run: `34024655868` SUCCESS.
Canonical PR: #29, merged from exact frozen head as product merge `8cff97b4651ed32810ef7783815b49175432ad66`.
Validated PR merge-ref: `7583fe5a0104bf9170cc4b9154ad4b9659e5d664`.
PR release run: `34026030803` SUCCESS; dependency policy run `34026030922` SUCCESS.
Exact post-merge release run: `34026201623` SUCCESS on product merge SHA.
Exact post-merge dependency policy run: `34026201698` SUCCESS on product merge SHA.
Exact post-merge artifact: `9987139589`, outer upload digest `sha256:c5fba1783e567a2c312f606fe2ff043a2578549a92c690b625356d7242dfebab`.
Relevant open PRs: unrelated draft #17 excluded.
Relevant Issues: retired #14 excluded.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog.

Architecture / major components: watchdog restart in `service-worker-v2.js`; bounded grace planning in `github-restart-grace.js`; auth state from content snapshot; durable runtime state; Node and loaded-Chromium validation.

Build / packaging: Node static/test audit plus deterministic Python ZIP/source-manifest packaging.

Tests / validation: deterministic extension suite, focused auth-grace regressions, service-worker integration and Chromium MV3 browser E2E.

CI: five deterministic audit cycles, Chromium MV3 E2E, reproducible package/provenance; workflow changes also trigger dependency-runner policy validation.

Release / deployment: ChatPulse 0.7.5 beta release contract completed on exact merged main product SHA `8cff97b4...`.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository. State-only HQ commits after product merge do not invalidate release evidence.

External release dependencies: none remaining for the current release contract.

Material findings: 0.7.4 anchored grace to document age; 0.7.5 starts the existing bounded one-shot grace at first unauthenticated watchdog observation. A superseded candidate exposed a 2 ms timing-test jitter and was repaired test-only. Frozen branch, PR merge context and exact-main validation all passed. Exact-main package hashes match the frozen canonical package hashes.

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
Evidence: exact 8 expected files; clean mergeability; reviews none; review threads none; dependency run `34026030922` SUCCESS; release run `34026030803` SUCCESS with 5/5 audits, Chromium E2E and package/provenance on exact merge-ref `7583fe5a...`; merged from expected head `1f400040...` as product merge `8cff97b4...`.
Blocking items: none.

### GATE-4 — Post-merge main
Status: SATISFIED
Evidence: exact release run `34026201623` completed SUCCESS on product SHA `8cff97b4651ed32810ef7783815b49175432ad66`. All five deterministic audit cycles SUCCESS, Chromium MV3 E2E SUCCESS, reproducible beta package/provenance SUCCESS. ZIP SHA-256 `b6d42cf0788fd9c6e20965cfae1c1a8890f8b1c9d859edde1270499fd9013b43` and source-manifest SHA-256 `f5ef775f60f4993617b78fc1267ace08dfbfd3b946ec0b525c75dc17de9d8d68` exactly match frozen canonical hashes; file count 18 and timestamp `2020-01-01T00:00:00` also match. Artifact ID `9987139589`; dependency policy run `34026201698` SUCCESS.
Blocking items: none.

## 5. Current Critical Path

### CP-1 — Implement full restart auth warm-up
Status: DONE
Release gate: GATE-1.
Why critical: fixed the reported fresh-tab auth race without changing authorization semantics.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: planner, focused tests and required 0.7.5 release metadata.
Acceptance condition: one full, non-extending minute per unauthenticated restart episode; authenticated pages bypass; expiry remains fresh-revalidated and fail-closed.
Evidence: frozen head `1f400040...`.

### CP-2 — Validate frozen release branch
Status: DONE
Release gate: GATE-2.
Why critical: exact candidate required repository-native validation before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34024655868`.
Acceptance condition: full branch gate success and reproducible provenance.
Evidence: SUCCESS and canonical hashes above.

### CP-3 — Validate and merge canonical PR #29
Status: DONE
Release gate: GATE-3.
Why critical: validated integration into main context before merge.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: head/base/diff/merge-ref/reviews/threads/dependency/release CI/mergeability and expected-head merge.
Acceptance condition: merge only from validated frozen head.
Evidence: PR #29 merged; product merge `8cff97b4...`.

### CP-4 — Validate exact post-merge main
Status: DONE
Release gate: GATE-4.
Why critical: independent exact-main evidence was required instead of treating merge as release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34026201623` on `8cff97b4...`, reproducible provenance and dependency run `34026201698`.
Acceptance condition: 5/5 audits + Chromium E2E + package/provenance SUCCESS with canonical package hashes.
Evidence: all acceptance evidence satisfied exactly.

## 6. Active Execution Registry

HQ: current release closed; no active product write or release-critical action.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: no unresolved critical execution. Exact-main release run `34026201623` SUCCESS; exact-main dependency policy `34026201698` SUCCESS.

## 7. Safe Parallel Work

NONE — CURRENT RELEASE CONTRACT is complete; additional work would belong to a future release/backlog, not this critical path.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — planner, service-worker alarm/revalidation path, auth/send boundary, tests, packaging, release CI, dependency routing and PR integration are covered.

Evidence Audit: PASS — branch, PR merge-ref and exact-main release evidence are independently green with exact SHAs, run IDs and hashes.

Release Alignment Audit: PASS — every mandatory gate in the explicit 0.7.5 release contract is satisfied; no new gates are added after completion.

Dependency & Ordering Audit: PASS — implementation → frozen validation → PR merge-context validation → merge → exact-main validation completed in order.

Execution & Parallelism Audit: PASS — no duplicate execution or overlapping product writes; repository-native runners provided final deterministic evidence.

Adversarial Audit: PASS — final exact-main evidence confirms the intended bounded semantics; grace remains one-shot/non-extending, expiry fresh-revalidates, true logout remains fail-closed and credential/at-most-once boundaries remain unchanged.

Material findings and resolutions: final post-merge run reproduced the exact frozen package hashes, eliminating the last release-evidence uncertainty. Main drift after the product merge was verified state-only (`.github/HQ_CRITICAL_PATH.md`) and does not invalidate the product release.

## 10. Next Action

Exact next action: NONE for ChatPulse 0.7.5 beta — CURRENT RELEASE CONTRACT is complete. A future invocation should establish the next release target only when new owner/project evidence creates one.
Executor: HQ.
Expected evidence: none for this closed release.
Acceptance condition: already satisfied; project state remains DONE until a new release contract is established.

## 11. Last Material Revision

What changed: exact post-merge release run `34026201623` completed SUCCESS on product SHA `8cff97b4...`; all five audits, Chromium E2E and reproducible provenance are green; exact-main package hashes match frozen canonical hashes; dependency policy `34026201698` is green.
Why the critical path changed: CP-4 and GATE-4 closed, completing every mandatory release gate.
Evidence causing the change: run `34026201623`, package job `101467610196`, artifact `9987139589`, canonical matching hashes and dependency run `34026201698`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: verified final exact-main release evidence and persisted ChatPulse 0.7.5 beta as DONE.
Active external executions and exact refs: NONE release-critical.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + r44 + release product SHA `8cff97b4651ed32810ef7783815b49175432ad66`.
Exact next action after recovery: confirm DONE remains current; if a new owner/project signal establishes another release target, begin a new release contract and critical path.
Rotation blockers: NONE.
