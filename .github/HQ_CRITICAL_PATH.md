---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 36
updated_at: 2026-09-05T15:44:30Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: release/0.7.4-independent-actions-watchdog
basis_sha: 0f8bac313191a52b4c4ea4c71941ac6c129d33e5
---

# HQ Critical Path

## 1. Current Release Contract
Release target: ChatPulse 0.7.4 beta — independent GitHub Actions scheduling, per-chat GitHub-only resume mode, lossless scheduler-trigger serialization, and a 60-second post-open ChatGPT authentication warm-up grace.

Definition of RELEASED: ordinary and GitHub alarms neither reset nor suppress each other; GitHub-only chats receive no automatic ordinary interval checks; concurrent triggers queue without losing source/parameters; a fresh unauthenticated ChatGPT document gets one non-extending 60-second grace per restart episode, followed by a targeted forced GitHub Actions revalidation before any restart send; true logout after the grace remains fail-closed; master Stop, active-run blocking, private token isolation, draft/active-tab safety and at-most-once dispatch remain intact; final branch/PR/main gates pass.

Mandatory gates:
- [x] independent alarm lifecycle + GitHub-only mode;
- [x] lossless simultaneous-trigger serialization;
- [x] >2 independent workflow inactivity episodes can restart;
- [x] one bounded 60-second post-open auth grace with no deadline extension;
- [x] grace retry performs a fresh targeted GitHub Actions read before send;
- [x] frozen branch exact head passed five deterministic audits, Chromium E2E and reproducible package/provenance;
- [ ] exact PR #28 merge-tree + dependency policy + review/thread/mergeability gates;
- [ ] exact post-merge main release + dependency gates.

Required evidence: exact SHAs/run IDs, 112/112 deterministic test count, Chromium E2E, package/source hashes, review/thread state and dependency policy.

Explicit exclusions: normal GitHub poll cadence remains ~10 minutes; only the explicit post-open grace retry may force one bounded extra repository read. Inactivity N, 20-minute stuck threshold, credential boundary and unrelated draft PR #17 are unchanged.

## 2. Repository Basis
Default branch: main.
Current main before this state-only commit: `4c44bd5b8cc2b0b5d353f9054e2078e9604714a6` (HQ state only; product parent lineage unchanged).
Canonical branch: `release/0.7.4-independent-actions-watchdog`.
Frozen branch head: `0f8bac313191a52b4c4ea4c71941ac6c129d33e5`.
Canonical PR: #28.
Current PR merge-tree before this state-only commit: `a72f3d753d655cd8a70b918761a362ee0c51379c`, generated as merge of `0f8bac31...` into `4c44bd5b...`; this merge-tree is superseded by this r36 state-only main commit and must be re-read/revalidated before merge.
Relevant workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.

## 3. Repository Scan Summary
Project: local Chrome MV3 ChatGPT task runner. Build: deterministic Python package + Node static/test audit. Tests: 112 deterministic extension tests plus loaded Chromium GitHub watchdog E2E on the frozen branch.

Material findings and implemented resolutions:
1. Dual alarm recreation starvation fixed by independent idempotent alarm synchronization.
2. `activeCheck` trigger dropping fixed by rejection-safe promise-tail serialization preserving every trigger source/parameters.
3. Per-chat `githubWatchOnly` provides GitHub-only automatic resume while manual check remains explicit.
4. Fresh-page false logout fixed by runtime-only `githubRestartGraceKey/Until` plus a one-shot Chrome alarm at `documentStartedAt + 60s`; same episode cannot extend/start another grace after expiry; new activity/run clears grace; global Stop clears grace alarms.
5. Grace expiry runs `github-watchdog-grace` targeted to the chat and force-polls the repository before restart eligibility is re-evaluated, preventing stale Actions state from causing a send.

## 4. Release Gates
### GATE-1 — Behavior implementation
Status: SATISFIED
Evidence: frozen branch exact head `0f8bac31...`; unit/service-worker regressions cover independent alarms, GitHub-only scheduler, simultaneous trigger serialization, >2 episodes, post-open grace and fresh revalidation.

### GATE-2 — Frozen branch
Status: SATISFIED
Evidence: release run `33975579796` SUCCESS on exact head `0f8bac31...`; five audit cycles each 112/112; Chromium E2E PASS; package/provenance PASS.
Package ZIP SHA-256: `489850034ccce208021c93b43196a6f4f7410d8309753d785c6caaececd1e66d`.
Source manifest SHA-256: `d70b24b683875893ff417a077f6f870cdda450574365ac8118731b0f53992a03`.
File count: 18; fixed timestamp `2020-01-01T00:00:00`.
Artifact ID: `9972230323`; outer artifact digest `e2b0acf8bd197d6309dc50b05b2c6afb0f95bec1f1bab28792f4608914ae5e03`; repository retention caps it to 1 day.

### GATE-3 — Canonical PR merge-tree
Status: UNSATISFIED
Blocking: state-only main commit r36 regenerates merge-tree; re-read PR #28 exact merge SHA, then require release gate + dependency policy + reviews/threads + mergeable.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Blocking: GATE-3.

## 5. Current Critical Path
### CP-1 — Revalidate PR #28 exact merge-tree after r36
Status: ACTIVE
Release gate: GATE-3
Execution plane: PROJECT_RUNNER + HQ_DIRECT.
Acceptance: current PR merge SHA built from frozen head into current main; five ×112/112, Chromium E2E, same package hashes, dependency policy PASS, no blocking reviews/threads, mergeable=true.

### CP-2 — Merge exact frozen head and validate main
Status: PENDING
Depends: CP-1.
Acceptance: exact post-merge product SHA has five ×112/112, Chromium E2E, matching hashes and dependency policy PASS.

### CP-3 — Persist DONE checkpoint
Status: PENDING
Depends: CP-2.

## 6. Active Execution Registry
HQ: PR #28 integrator and release evidence owner.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: PR merge-tree gates to be identified after r36 merge-ref regeneration.

## 7. Safe Parallel Work
NONE — next transition is exact-ref validation/merge and must remain serialized.

## 8. Current Blockers
NONE; PR merge-tree must simply be regenerated/revalidated after the material state checkpoint.

## 9. Critical Path Audits
Repository Coverage Audit: PASS — all scheduler/model/restart/auth-grace/test/package surfaces covered; temporary executor/script removed from final PR diff.
Evidence Audit: PASS — exact branch run `33975579796`; 112/112 counts, E2E and provenance independently logged.
Release Alignment Audit: PASS — only reported watchdog failures, requested GitHub-only mode and reported fresh-tab auth race plus necessary safety/release hardening.
Dependency & Ordering Audit: PASS — implementation → clean frozen branch → PR merge-tree → main.
Execution & Parallelism Audit: PASS — one canonical writer; CI only validates exact refs.
Adversarial Audit: PASS — grace cannot extend indefinitely, does not blindly send, fresh Actions revalidation precedes retry, Stop/activity/new run invalidate pending grace, old/true unauth remains fail-closed.

## 10. Next Action
Re-read PR #28 after r36, identify its new exact merge-tree, validate release/dependency/review/thread/mergeability gates, then merge exact head.

## 11. Last Material Revision
Frozen candidate `0f8bac31...` passed exact branch gate. The 60-second grace and targeted forced revalidation are now proven by deterministic service-worker integration tests. Release moved from implementation to canonical PR validation.

## 12. Chat Rotation Checkpoint
Safe to rotate: NO.
Last completed atomic action: frozen branch `0f8bac31...` fully validated and evidence persisted.
Active external executions: PR #28; merge-tree will regenerate after this r36 state-only main commit.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r36 + PR #28 + frozen branch head.
Exact next action after recovery: validate regenerated PR merge-tree.
Rotation blockers: release not yet merged/main-validated.
