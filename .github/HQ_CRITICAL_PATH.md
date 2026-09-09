---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 71
updated_at: 2026-09-09T20:09:00Z
project_state: RELEASING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.9-repeat-watchdog-restart
basis_sha: 3281d8790fc9126b9b65d9031bcc64ebe92b4727
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.9 beta — repeatedly recover the same stalled GitHub Actions chat after `githubIdleMinutes` cooldown and emit one aggregate heartbeat for each real due watchdog poll cycle.

Definition of RELEASED: exact frozen candidate merges through canonical PR after PR-context release/dependency gates, then exact post-merge main reproduces the frozen package hashes.

Mandatory gates:
- [x] same-stall cooldown/repeated retry behavior verified;
- [x] aggregate due-poll heartbeat verified;
- [x] frozen candidate 5/5 audits + Chromium MV3 E2E + reproducible package/provenance;
- [ ] canonical PR #33 release/dependency/review/merge gates;
- [ ] exact post-merge main release/dependency proof + hash equality.

Exclusions: GitHub write/dispatch, credential semantics, task/stop policy, Telegram/auth-grace/chat-URL behavior, unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Release branch: `release/0.7.9-repeat-watchdog-restart`.
Original release source: `17d714b5f3a4e44fc8f45dccf8df98435ced7f59`.
Frozen candidate: `3281d8790fc9126b9b65d9031bcc64ebe92b4727`.
Canonical PR: #33 `fix: repeat GitHub watchdog restart after cooldown`.
Candidate release run: `34398935243` SUCCESS by job evidence.
Candidate artifact: ID `10122696473`, name `ChatPulse-Chrome-v0.7.9-beta`.
Canonical ZIP SHA-256: `6fc57a2add012ac7676af5a88bac2d254d32439dfabdacf53a32b45420d9f5b5`.
Canonical source-manifest SHA-256: `e755cba9864ab2e09fdb1c2a68805067b143e70346a80c574ac523ae95a067a2`.
File count: 20. Reproducible timestamp: `2020-01-01T00:00:00`.

## 3. Repository Scan Summary

Proven defect: watchdog polling was periodic but `githubWatchdogDecision` permanently suppressed a previously restarted `restartKey`; old test encoded that one-shot policy. Due successful polls were invisible in logs.

Implemented bounded fix:
- same key is suppressed only while `now - githubLastRestartAt < thresholdMs`;
- exact cooldown boundary and repeated restart #2/#3 eligibility are tested;
- one aggregate `GitHub Actions watchdog: poll` info log appears only after a touched/due poll cycle;
- active runs/new activity/API-error protections and existing runtime safety remain unchanged.

Two failed Codex attempts were terminalized BLOCKED with zero product mutation; deterministic HQ fallback produced the accepted implementation. No Codex execution remains active.

Frozen candidate diff from original 0.7.9 source is exactly nine expected files: four runtime/test files plus manifest/package/package-script/release-validator/release-workflow metadata.

## 4. Release Gates

### GATE-1 — Repeat same-stall recovery
Status: SATISFIED
Evidence: `9b560c114af24d92aaf815e1afe59f64c3fda236`, `b51d3815e31f69597fe14caed0190b7523fd1d91`, focused boundary checks, full candidate audits.

### GATE-2 — Observable real due polls
Status: SATISFIED
Evidence: `add7628d08978ca4369193375dec8827397111d7`, `5a47d1c480267d0706c359cdbec543ce0c5779c2`, static focused check and full candidate validation.

### GATE-3 — Frozen 0.7.9 candidate
Status: SATISFIED
Evidence: exact head `3281d8790fc9126b9b65d9031bcc64ebe92b4727`; run `34398935243`; 5/5 audits SUCCESS; Chromium E2E SUCCESS; reproducible package/provenance SUCCESS; artifact/hashes recorded above.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Evidence: PR #33 on exact frozen head; dependency-policy run `34399206827` SUCCESS; release run `34399206877` still executing at checkpoint; reviews, review threads and comments empty.
Blocking items: exact PR-context release run must finish SUCCESS and PR must be mergeable on unchanged head.

### GATE-5 — Exact post-merge main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Implement watchdog retry + heartbeat
Status: DONE

### CP-2 — Freeze candidate
Status: DONE

### CP-3 — Validate and merge PR #33
Status: VERIFYING
Execution plane: PROJECT_RUNNER + HQ_DIRECT.
Exact head: `3281d8790fc9126b9b65d9031bcc64ebe92b4727`.
Acceptance: PR-context release `34399206877` SUCCESS, dependency `34399206827` SUCCESS, no blocking reviews/threads/comments, mergeable, expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Acceptance: exact-main release + dependency SUCCESS and package hashes equal candidate hashes above.

## 6. Active Execution Registry

HQ: owns PR merge and exact-main proof.
Workers: NONE.
Codex: NONE ACTIVE.
Zero-model control: NONE ACTIVE.
CI/runtime: PR-context release run `34399206877` active on frozen SHA; dependency run `34399206827` SUCCESS.

## 7. Safe Parallel Work

NONE — frozen head must remain immutable until PR-context validation and expected-head merge.

## 8. Current Blockers

NONE. PR-context CI is an active external gate, not BLOCKED.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS.
Release Alignment Audit: PASS.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS.
Adversarial Audit: PASS.

## 10. Next Action

Reconcile PR-context release run `34399206877`; when SUCCESS, re-fetch PR #33 head/mergeability/reviews/threads and merge with expected head `3281d8790fc9126b9b65d9031bcc64ebe92b4727`. Then validate exact post-merge main and hash equality.

## 11. Last Material Revision

Frozen candidate completed all release gates, canonical artifact/hashes were recorded, and PR #33 was opened on the immutable candidate. Dependency policy is already green; PR-context release validation remains active.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: frozen candidate and PR #33 recorded durably.
Active external execution: PR release run `34399206877` on exact frozen head.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r71 + PR #33 + frozen SHA/hashes.
Exact next action: reconcile PR release run, expected-head merge, then exact-main proof.
Rotation blockers: NONE.
