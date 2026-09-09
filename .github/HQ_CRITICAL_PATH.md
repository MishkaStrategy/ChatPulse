---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 73
updated_at: 2026-09-09T20:23:00Z
project_state: DONE
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

Mandatory release gates:
- [x] same-stall cooldown/repeated retry behavior verified;
- [x] aggregate due-poll heartbeat verified;
- [x] frozen candidate 5/5 audits + Chromium MV3 E2E + reproducible package/provenance;
- [x] canonical PR #33 release/dependency/review/merge gates;
- [x] exact post-merge main release/dependency proof + canonical hash equality.

Required release evidence: exact candidate/main SHAs, release/dependency runs, artifact IDs and canonical inner ZIP/source-manifest hashes.
Known exclusions: GitHub write/dispatch, credential semantics, task/stop policy, Telegram/auth-grace/chat-URL behavior, unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Frozen release branch: `release/0.7.9-repeat-watchdog-restart`.
Frozen candidate: `3281d8790fc9126b9b65d9031bcc64ebe92b4727`.
Canonical PR: #33, merged.
Product merge commit / exact-main release basis: `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`.

Frozen candidate evidence:
- release run `34398935243` SUCCESS;
- PR-context release run `34399206877` SUCCESS;
- PR-context dependency run `34399206827` SUCCESS;
- artifact ID `10122696473`, name `ChatPulse-Chrome-v0.7.9-beta`;
- ZIP SHA-256 `6fc57a2add012ac7676af5a88bac2d254d32439dfabdacf53a32b45420d9f5b5`;
- source-manifest SHA-256 `e755cba9864ab2e09fdb1c2a68805067b143e70346a80c574ac523ae95a067a2`;
- file count 20; reproducible timestamp `2020-01-01T00:00:00`.

Exact-main evidence:
- release run `34400180523` SUCCESS on `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`;
- dependency run `34400180622` SUCCESS on the same SHA;
- all 5 audit cycles SUCCESS;
- Chromium MV3 browser E2E SUCCESS;
- reproducible package/provenance SUCCESS;
- artifact ID `10123278787`, name `ChatPulse-Chrome-v0.7.9-beta`;
- ZIP SHA-256 `6fc57a2add012ac7676af5a88bac2d254d32439dfabdacf53a32b45420d9f5b5`;
- source-manifest SHA-256 `e755cba9864ab2e09fdb1c2a68805067b143e70346a80c574ac523ae95a067a2`;
- exact-main hashes equal the frozen candidate byte-for-byte.

## 3. Repository Scan Summary

Implemented bounded fix:
- same restart key is suppressed only while `now - githubLastRestartAt < thresholdMs`;
- at/after the configured cooldown the same stalled workflow is restart-eligible again, allowing restart #2/#3+ while inactivity continues;
- active runs/new activity/API-error protections remain intact;
- one aggregate `GitHub Actions watchdog: poll` info heartbeat appears for each touched/due poll cycle, while not-due cycles remain quiet;
- existing continuation counters, task/run guards, draftless `go`, PAT behavior, Telegram, auth grace and chat URL behavior remain unchanged.

Frozen candidate changed exactly nine expected files: four runtime/test files plus manifest/package/package-script/release-validator/release-workflow metadata.

Two Codex attempts were terminalized as control failures with zero product mutation. Deterministic HQ fallback produced the accepted implementation and no Codex execution remains active.

After the product merge, `main` advanced only by HQ state-only `.github/HQ_CRITICAL_PATH.md` commits; exact release evidence remains pinned to immutable product merge SHA `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`.

## 4. Release Gates

### GATE-1 — Repeat same-stall recovery
Status: SATISFIED
Evidence: focused cooldown-boundary/repeated-retry tests plus frozen, PR-context and exact-main full validation.

### GATE-2 — Observable real due polls
Status: SATISFIED
Evidence: runtime/static heartbeat test plus frozen, PR-context and exact-main full validation.

### GATE-3 — Frozen 0.7.9 candidate
Status: SATISFIED
Evidence: candidate `3281d8790fc9126b9b65d9031bcc64ebe92b4727`; run `34398935243`; artifact/hashes above.

### GATE-4 — Canonical PR integration
Status: SATISFIED
Evidence: PR #33 passed release/dependency gates, had no review blockers, and merged with expected head to `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`.

### GATE-5 — Exact post-merge main proof
Status: SATISFIED
Evidence: release `34400180523` SUCCESS; dependency `34400180622` SUCCESS; 5/5 audits SUCCESS; Chromium E2E SUCCESS; package/provenance SUCCESS; exact-main ZIP and source-manifest hashes equal frozen candidate.

## 5. Current Critical Path

### CP-1 — Implement watchdog retry + heartbeat
Status: DONE

### CP-2 — Freeze candidate
Status: DONE

### CP-3 — Validate and merge PR #33
Status: DONE

### CP-4 — Exact post-merge main proof
Status: DONE

Release contract is complete. No remaining critical-path node.

## 6. Active Execution Registry

HQ: terminal release ownership complete.
Workers: NONE.
Codex: NONE ACTIVE.
Zero-model control: NONE ACTIVE.
CI/runtime: no remaining critical execution; exact-main release/dependency runs are terminal SUCCESS.

## 7. Safe Parallel Work

NONE — release complete.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS.
Release Alignment Audit: PASS.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS.
Adversarial Audit: PASS.

Material findings and resolutions:
- one-shot restart root cause was removed and repeated cooldown behavior is test-covered;
- due-poll observability was added without changing the 10-minute API throttle or GitHub write semantics;
- failed Codex executions were proven to have zero product mutation and were not retried identically;
- exact-main package provenance reproduces the frozen candidate hashes;
- later `main` movement is state-only and does not invalidate product evidence.

## 10. Next Action

Exact next action: none for this release; await a new owner request.
Executor: NONE.
Expected evidence: N/A.
Acceptance condition: N/A.

## 11. Last Material Revision

What changed: exact-main release run and dependency policy completed SUCCESS, package/provenance reproduced the frozen candidate hashes exactly, GATE-5 became SATISFIED, and the project transitioned to DONE.

Why the critical path changed: all mandatory 0.7.9 release gates are now proven complete.

Evidence causing the change: release run `34400180523`, dependency run `34400180622`, exact-main artifact `10123278787`, ZIP SHA-256 `6fc57a2add012ac7676af5a88bac2d254d32439dfabdacf53a32b45420d9f5b5`, source-manifest SHA-256 `e755cba9864ab2e09fdb1c2a68805067b143e70346a80c574ac523ae95a067a2`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact-main release/dependency/package proof accepted and 0.7.9 marked DONE.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r73 + exact product merge `91eb5c36e7affdc6bd9813f0a4ed487bc497e109` + terminal evidence above.
Exact next action after recovery: await a new owner request; do not reopen 0.7.9 without new live evidence.
Rotation blockers: NONE.
