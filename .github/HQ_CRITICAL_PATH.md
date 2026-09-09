---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 72
updated_at: 2026-09-09T20:18:00Z
project_state: RELEASING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 91eb5c36e7affdc6bd9813f0a4ed487bc497e109
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.9 beta — repeatedly recover the same stalled GitHub Actions chat after `githubIdleMinutes` cooldown and emit one aggregate heartbeat for each real due watchdog poll cycle.

Definition of RELEASED: exact frozen candidate merges through canonical PR after PR-context release/dependency gates, then exact post-merge main reproduces the frozen package hashes.

Mandatory gates:
- [x] same-stall cooldown/repeated retry behavior verified;
- [x] aggregate due-poll heartbeat verified;
- [x] frozen candidate 5/5 audits + Chromium MV3 E2E + reproducible package/provenance;
- [x] canonical PR #33 release/dependency/review/merge gates;
- [ ] exact post-merge main release/dependency proof + hash equality.

Required release evidence: exact candidate/main SHAs, release/dependency runs, artifact IDs and canonical inner ZIP/source-manifest hashes.
Known exclusions: GitHub write/dispatch, credential semantics, task/stop policy, Telegram/auth-grace/chat-URL behavior, unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Frozen release branch: `release/0.7.9-repeat-watchdog-restart`.
Frozen candidate: `3281d8790fc9126b9b65d9031bcc64ebe92b4727`.
Canonical PR: #33, merged.
Merge commit / exact product main basis: `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`.
Candidate release run: `34398935243` SUCCESS.
PR-context release run: `34399206877` SUCCESS.
PR-context dependency run: `34399206827` SUCCESS.
Candidate artifact: ID `10122696473`, name `ChatPulse-Chrome-v0.7.9-beta`.
Canonical ZIP SHA-256: `6fc57a2add012ac7676af5a88bac2d254d32439dfabdacf53a32b45420d9f5b5`.
Canonical source-manifest SHA-256: `e755cba9864ab2e09fdb1c2a68805067b143e70346a80c574ac523ae95a067a2`.
File count: 20. Reproducible timestamp: `2020-01-01T00:00:00`.

## 3. Repository Scan Summary

Implemented bounded fix:
- same restart key is suppressed only while `now - githubLastRestartAt < thresholdMs`;
- exact cooldown boundary and repeated restart eligibility are tested;
- one aggregate `GitHub Actions watchdog: poll` info log appears only for a touched/due poll cycle;
- active runs/new activity/API-error protections and existing runtime safety remain unchanged.

Frozen candidate changed exactly nine expected files: four runtime/test files plus manifest/package/package-script/release-validator/release-workflow metadata.

PR #33 live merge-readiness evidence before merge:
- exact frozen head unchanged;
- PR-context release and dependency workflows SUCCESS;
- mergeable true;
- reviews, review threads and comments empty;
- repository rulesets empty; branch protection disabled;
- established previous release convention uses merge commit.

PR #33 merged with `expected_head_sha=3281d8790fc9126b9b65d9031bcc64ebe92b4727`; live main became signed merge commit `91eb5c36e7affdc6bd9813f0a4ed487bc497e109` with parents previous state-only main `a728a4331ac83da6bc302b7441d18c1cdb9a1fe2` and frozen candidate.

## 4. Release Gates

### GATE-1 — Repeat same-stall recovery
Status: SATISFIED
Evidence: focused boundary/retry tests and frozen/PR-context full validation.

### GATE-2 — Observable real due polls
Status: SATISFIED
Evidence: runtime/static heartbeat test and frozen/PR-context full validation.

### GATE-3 — Frozen 0.7.9 candidate
Status: SATISFIED
Evidence: candidate `3281d879...`; run `34398935243`; artifact/hashes above.

### GATE-4 — Canonical PR integration
Status: SATISFIED
Evidence: PR #33 release `34399206877` SUCCESS; dependency `34399206827` SUCCESS; no review blockers; merge commit `91eb5c36e7affdc6bd9813f0a4ed487bc497e109` live on main.

### GATE-5 — Exact post-merge main proof
Status: UNSATISFIED
Evidence: main release run `34400180523` and dependency run `34400180622` started on exact merge SHA.
Blocking items: both runs must complete SUCCESS and post-merge package hashes must equal frozen candidate hashes.

## 5. Current Critical Path

### CP-1 — Implement watchdog retry + heartbeat
Status: DONE

### CP-2 — Freeze candidate
Status: DONE

### CP-3 — Validate and merge PR #33
Status: DONE

### CP-4 — Exact post-merge main proof
Status: VERIFYING
Execution plane: PROJECT_RUNNER + HQ_DIRECT.
Exact product main SHA: `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`.
Acceptance: release run `34400180523` SUCCESS; dependency run `34400180622` SUCCESS; main package ZIP SHA-256 `6fc57a2add012ac7676af5a88bac2d254d32439dfabdacf53a32b45420d9f5b5`; source-manifest SHA-256 `e755cba9864ab2e09fdb1c2a68805067b143e70346a80c574ac523ae95a067a2`.

## 6. Active Execution Registry

HQ: owns exact-main proof and terminal DONE transition.
Workers: NONE.
Codex: NONE ACTIVE.
Zero-model control: NONE ACTIVE.
CI/runtime:
- main release run `34400180523` active on `91eb5c36...`;
- main dependency run `34400180622` active on `91eb5c36...`.

## 7. Safe Parallel Work

NONE — only already-running exact-main validation remains.

## 8. Current Blockers

NONE. Exact-main CI is active external validation, not BLOCKED.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS.
Release Alignment Audit: PASS.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS.
Adversarial Audit: PASS.

Material finding resolved: `main` advanced before merge only by HQ state-only commits; merge provenance explicitly includes the frozen candidate as second parent, and post-merge workflows are pinned to exact merge SHA.

## 10. Next Action

Reconcile exact-main runs `34400180523` and `34400180622`; on SUCCESS read package/provenance evidence and compare canonical hashes byte-for-byte with frozen candidate. If equal, mark GATE-5 SATISFIED and project DONE.

## 11. Last Material Revision

PR #33 passed all PR-context gates and was expected-head merged. Exact-main release and dependency validation started on merge SHA `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact frozen PR #33 merged and live main verified.
Active external executions: main release `34400180523`; main dependency `34400180622`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r72 + merge SHA + the two main run IDs + frozen hashes.
Exact next action: reconcile main runs and hash equality, then persist terminal DONE if proven.
Rotation blockers: NONE.
