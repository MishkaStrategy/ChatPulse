---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 65
updated_at: 2026-09-09T05:31:00Z
project_state: RELEASE_READY
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.8-draftless-go
basis_sha: 9c78378f8027e5019b1fcf60eeaa578ab4d996e4
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.8 beta — composer text never blocks continuation/restart, and the stock continuation command is `go`.

Release surface:
- remove all composer-draft cancellation/deferral paths from ordinary continuation, GitHub watchdog restart and freshness recovery;
- automatic continuation is allowed to replace existing composer text with the configured continuation command;
- default global continuation command is exactly `go`;
- exact legacy stock command `продолжай и не останавливайся до технического лимита` migrates to `go` on state/portable-config normalization;
- genuine custom global/per-chat commands remain supported;
- 0.7.8 metadata, tests, Chromium E2E, reproducible package/provenance, canonical PR/merge and exact-main proof.

Definition of RELEASED:
- no runtime path cancels or defers continuation merely because the composer contains text;
- content snapshot reports draft as non-blocking and background watchdog contains no `hasDraft` restart guard;
- background tab recovery ignores legacy `hasDraft=true` evidence;
- default/new and exact-legacy-stock state resolve to `go` without overwriting custom commands;
- frozen candidate and exact merged main satisfy all mandatory release evidence.

Mandatory release gates:
- [x] draftless continuation behavior passes focused/full validation;
- [x] `go` default + legacy migration passes focused/full validation;
- [x] exact frozen 0.7.8 candidate passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and canonical inner hashes reproduce frozen candidate.

Known explicit exclusions: no changes to stop-phrase/task completion guards, GitHub PAT credential semantics, Telegram, auth grace, chat URL rebind semantics or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Critical-path basis ref: `release/0.7.8-draftless-go`.
Frozen candidate: `9c78378f8027e5019b1fcf60eeaa578ab4d996e4`.
Canonical integration branch: `release/0.7.8-draftless-go`.
Canonical PR: NONE yet.
Relevant prior release: 0.7.7 beta DONE under r63.

Frozen candidate evidence:
- release run `34315005605`, exact head `9c78378f...`, SUCCESS;
- 5/5 full extension audits SUCCESS;
- Chromium MV3 browser E2E SUCCESS;
- reproducible package/provenance SUCCESS;
- artifact ID `10089770382`, name `ChatPulse-Chrome-v0.7.8-beta`, size 65588 bytes;
- inner ZIP SHA-256 `96671fd6898927323c91901f6d0319e6e906ff60cec938d5d2740627445396c9`;
- source-manifest SHA-256 `0d61b956b426b14940907885fc28e018fbcf754a309d93314d46a4637892f383`;
- file_count 20; reproducible timestamp `2020-01-01T00:00:00`.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 continuation/watchdog control for configured ChatGPT chats.

Architecture/material findings:
- `content/content-script.js` previously reported composer content as `hasDraft` and refused `CHATPULSE_SEND` when non-empty; 0.7.8 reports `hasDraft:false` and overwrites/sends configured command;
- `lib/model-v2.js` previously suppressed tab recovery for drafts and used the long Russian stock command; 0.7.8 removes recovery suppression, defaults to `go`, and migrates only the exact legacy stock command;
- `background/service-worker-v2.js` contained two direct GitHub restart draft guards producing the owner-observed `restart отложен...` messages; both are physically removed;
- old tests defending draft protection were intentionally updated to the owner-selected continuation-wins policy;
- focused regression tests explicitly forbid watchdog draft guards and preserve custom-command behavior.

Build/tests/CI: deterministic Chrome ZIP; Node syntax/unit/integration/static audits; five audit cycles; loaded-extension Chromium E2E; reproducible package/provenance.

## 4. Release Gates

### GATE-1 — Draftless continuation
Status: SATISFIED
Evidence: focused draftless tests plus exact candidate 5/5 full audits and Chromium E2E green; no watchdog `hasDraft` restart path remains.
Blocking items: NONE.

### GATE-2 — Default `go` and legacy migration
Status: SATISFIED
Evidence: default/migration/custom-command tests and exact candidate full audits green.
Blocking items: NONE.

### GATE-3 — Frozen 0.7.8 candidate
Status: SATISFIED
Evidence: `9c78378f...`, run `34315005605`, artifact `10089770382`, canonical hashes above.
Blocking items: NONE.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: create canonical PR, validate PR-context release/dependency checks, reviews/threads and mergeability, then expected-head merge.

### GATE-5 — Post-merge exact-main proof
Status: UNSATISFIED
Blocking items: GATE-4 then exact-main release/dependency/provenance proof.

## 5. Current Critical Path

### CP-1 — Draftless continuation + `go`
Status: DONE
Release gate: GATE-1, GATE-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Evidence: implementation/focused tests and run `34315005605`.

### CP-2 — Freeze 0.7.8 candidate
Status: DONE
Release gate: GATE-3.
Execution plane: PROJECT_RUNNER.
Evidence: `9c78378f...`, run/artifact/hashes above.

### CP-3 — Canonical PR integration
Status: ACTIVE
Release gate: GATE-4.
Depends on: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance condition: exact candidate PR; release/dependency checks green; no blocking reviews/threads; mergeable; expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Release gate: GATE-5.
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance condition: exact-main release/dependency runs green and inner ZIP/source-manifest hashes match frozen candidate exactly.

## 6. Active Execution Registry

HQ: opening/validating canonical PR and owning merge/main proof.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: frozen candidate run complete; PR-context CI not yet started.

## 7. Safe Parallel Work

NONE — frozen candidate is immutable through PR validation/merge.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — owner runtime evidence, exact source guards, candidate CI and package hashes align.
Release Alignment Audit: PASS — only draftless continuation/`go` plus required release evidence.
Dependency & Ordering Audit: PASS — implementation → frozen proof → PR → exact-main proof.
Execution & Parallelism Audit: PASS — candidate frozen; no competing writer.
Adversarial Audit: PASS — self-authored composer text, genuine user draft, legacy snapshot draft flag, watchdog preflight, stale-tab recovery, old-stock migration and custom-command preservation covered.
Material resolution: continuation intentionally wins over existing composer content per owner decision.

## 10. Next Action

Exact next action: open canonical PR from `release/0.7.8-draftless-go@9c78378f...` to `main`, validate PR-context release/dependency checks, reviews/threads and mergeability, then expected-head merge.
Executor: HQ.
Expected evidence: canonical PR with exact head and green required checks.
Acceptance condition: no merge before PR-context evidence is green.

## 11. Last Material Revision

What changed: remaining old test policy and two physical watchdog draft guards were removed/updated; exact candidate `9c78378f...` completed full release validation successfully.
Why the critical path changed: GATE-1/2/3 are now independently satisfied; integration is next.
Evidence causing the change: run `34315005605`, artifact `10089770382`, hashes above.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact 0.7.8 candidate frozen and r65 persisted.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r65 + `release/0.7.8-draftless-go@9c78378f8027e5019b1fcf60eeaa578ab4d996e4`.
Exact next action after recovery: canonical PR validation/merge then exact-main proof.
Rotation blockers: NONE.
