---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 70
updated_at: 2026-09-09T20:06:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.9-repeat-watchdog-restart
basis_sha: 3281d8790fc9126b9b65d9031bcc64ebe92b4727
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.9 beta — GitHub Actions watchdog repeatedly recovers the same stalled chat after a cooldown equal to configured `githubIdleMinutes`, and each real due watchdog poll cycle is visible through one aggregate info heartbeat.

Release surface:
- retain dedicated GitHub alarm and 10-minute API poll throttle;
- same stalled restart key may restart again only after `githubIdleMinutes` from the most recent successful restart;
- active runs suppress restart; new run/activity starts a fresh inactivity episode; API failures never create restart eligibility;
- exactly one aggregate heartbeat per touched/due GitHub poll cycle; skipped not-due cycles do not log;
- preserve 0.7.8 continuation counters, run/task guards, draftless `go`, PAT isolation, Telegram, auth grace and chat URL behavior;
- ship through frozen candidate, canonical PR and exact-main reproducibility proof.

Definition of RELEASED: frozen candidate, PR and exact post-merge main all pass established release/dependency gates and exact-main package hashes reproduce frozen candidate.

Mandatory release gates:
- [x] repeated same-stall cooldown behavior implemented and independently bounded;
- [x] aggregate due-poll heartbeat implemented and independently bounded;
- [ ] exact 0.7.9 candidate passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and canonical hashes reproduce candidate.

Known exclusions: GitHub write/dispatch, credential semantics, task/stop policy changes, Telegram/auth-grace/chat-URL changes and unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Release branch: `release/0.7.9-repeat-watchdog-restart`.
Original 0.7.9 product source: `17d714b5f3a4e44fc8f45dccf8df98435ced7f59`.
Current exact candidate head: `3281d8790fc9126b9b65d9031bcc64ebe92b4727`.
Canonical PR: NONE yet.
Relevant open PRs: unrelated draft #17 only.
Active release run: `34398935243` on exact candidate head.

## 3. Repository Scan Summary

Root cause proven: previous `githubWatchdogDecision` permanently suppressed an already restarted `restartKey`, while periodic GitHub alarm/polling itself remained active. Existing unit test encoded the one-shot behavior. Successful due poll cycles had no aggregate heartbeat.

Execution recovery: two Codex attempts were independently proven to have zero ChatPulse product mutation and were terminalized BLOCKED with `CODEX_EXECUTOR_TOOL_LOOP_NO_PRODUCT_MUTATION`; no further Codex retry is permitted for this release absent a materially new capability state.

Deterministic HQ implementation:
- `model-v2.js`: same key is `already-restarted` only while `now - githubLastRestartAt < thresholdMs`; at exact threshold it is restart-eligible again;
- focused unit test proves first cooldown boundary, second restart and later retry boundary;
- `service-worker-v2.js`: one aggregate `GitHub Actions watchdog: poll` info entry after a real touched/due cycle, with repository/success/error counts;
- runtime static test proves exactly one heartbeat literal and placement after the not-touched early return.

Exact product/test diff from original source through `5a47d1c480267d0706c359cdbec543ce0c5779c2` is only four files: service worker +7, model +5/-2, runtime test +13, model test +12/-3. No credential/write/task policy changes.

Release metadata was advanced to 0.7.9 in manifest, package metadata, package filenames, release validator and release workflow.

## 4. Release Gates

### GATE-1 — Repeat recovery for the same stalled workflow
Status: SATISFIED
Evidence: commits `9b560c114af24d92aaf815e1afe59f64c3fda236` and `b51d3815e31f69597fe14caed0190b7523fd1d91`; focused boundary behavior independently executed; candidate audit cycles 1-3 already SUCCESS.
Blocking items: NONE.

### GATE-2 — Observable watchdog polling
Status: SATISFIED
Evidence: commits `add7628d08978ca4369193375dec8827397111d7` and `5a47d1c480267d0706c359cdbec543ce0c5779c2`; local static heartbeat check passed; candidate Chromium MV3 E2E SUCCESS.
Blocking items: NONE.

### GATE-3 — Frozen 0.7.9 candidate
Status: UNSATISFIED
Evidence in progress: run `34398935243` on `3281d8790fc9126b9b65d9031bcc64ebe92b4727`; audit cycles 1-3 SUCCESS, Chromium E2E SUCCESS, cycles 4-5 still executing at checkpoint.
Blocking items: remaining audit cycles and package/provenance.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: GATE-3.

### GATE-5 — Exact post-merge main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Implement repeated recovery + poll heartbeat
Status: DONE
Release gates: GATE-1, GATE-2.
Execution plane: HQ_DIRECT deterministic fallback after Codex control failures.
Evidence: four bounded commits and focused checks above.

### CP-2 — Freeze exact 0.7.9 candidate
Status: VERIFYING
Release gate: GATE-3.
Execution plane: PROJECT_RUNNER.
Exact scope: candidate `3281d8790fc9126b9b65d9031bcc64ebe92b4727`, run `34398935243`.
Acceptance: 5/5 audits + Chromium E2E + reproducible package/provenance SUCCESS; record artifact ID and canonical inner hashes.

### CP-3 — Canonical PR integration
Status: PENDING
Release gate: GATE-4.
Depends on: CP-2.
Acceptance: exact frozen-head PR, PR-context release/dependency gates green, no blocking review/thread, mergeable, expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Release gate: GATE-5.
Depends on: CP-3.
Acceptance: exact-main release/dependency gates SUCCESS and package hashes exactly equal frozen candidate.

## 6. Active Execution Registry

HQ: owns CI reconciliation, candidate freeze, PR/merge and exact-main proof.
Workers: NONE.
Codex: NONE ACTIVE. Both 0.7.9 model/tool-loop attempts terminalized BLOCKED with zero product mutation.
Zero-model control: NONE ACTIVE for ChatPulse.
CI/runtime: release run `34398935243` on exact head `3281d8790fc9126b9b65d9031bcc64ebe92b4727`.

## 7. Safe Parallel Work

NONE — candidate is intentionally frozen while release CI validates exact head.

## 8. Current Blockers

NONE. Remaining work is active release validation, not BLOCKED.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS.
Release Alignment Audit: PASS.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS — failed Codex routes were terminalized and deterministic fallback is bounded; no competing writer remains.
Adversarial Audit: PASS — cooldown exact boundary, repeated retries, active runs, new activity, API failures, not-due logging suppression and preservation of existing runtime safety are covered.

## 10. Next Action

Exact next action: reconcile terminal jobs of run `34398935243`; if all audits/E2E/package pass, freeze `3281d8790fc9126b9b65d9031bcc64ebe92b4727` with artifact ID/hashes and open canonical PR. Repair only an evidence-proven CI failure.
Executor: HQ + PROJECT_RUNNER.
Expected evidence: run conclusions, package artifact and canonical hashes.
Acceptance: no PR/merge before exact candidate release proof is complete.

## 11. Last Material Revision

What changed: CP-1 was completed by deterministic HQ fallback after both Codex attempts produced zero product mutation; 0.7.9 metadata is complete and exact candidate CI is active.
Evidence causing the change: bounded product/test commits through `5a47d1c...`, metadata/workflow commits through `3281d879...`, release run `34398935243` with first three audits and Chromium E2E already green.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact 0.7.9 candidate head launched full release validation; r70 persisted on main.
Active external execution: ChatPulse run `34398935243` at candidate `3281d8790fc9126b9b65d9031bcc64ebe92b4727`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r70 + release branch + run `34398935243`.
Exact next action after recovery: reconcile remaining audits/package, freeze candidate, then canonical PR.
Rotation blockers: NONE.
