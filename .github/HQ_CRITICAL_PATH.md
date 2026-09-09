---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 66
updated_at: 2026-09-09T05:39:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: cfca9058f27e1ba960e4713f906bebec12f9dbc4
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.8 beta — composer text never blocks continuation/restart, and the stock continuation command is `go`.

Release surface:
- remove all composer-draft cancellation/deferral paths from ordinary continuation, GitHub watchdog restart and freshness recovery;
- automatic continuation may replace existing composer text with the configured continuation command;
- default global continuation command is exactly `go`;
- exact legacy stock command `продолжай и не останавливайся до технического лимита` migrates to `go` on state/portable-config normalization;
- genuine custom global/per-chat commands remain supported;
- 0.7.8 metadata, tests, Chromium E2E, reproducible package/provenance, canonical PR/merge and exact-main proof.

Definition of RELEASED: SATISFIED.
- composer content is not a continuation/restart blocker;
- the content script does not reject a non-empty composer and reports draft as non-blocking;
- GitHub watchdog contains no composer-draft restart guard, including preflight;
- background recovery ignores legacy `hasDraft=true` evidence;
- new/default and exact legacy-stock global state resolve to `go` without overwriting custom commands;
- frozen candidate, PR context and exact merged main passed all mandatory evidence.

Mandatory release gates:
- [x] draftless continuation behavior passed focused/full validation;
- [x] `go` default + legacy migration passed focused/full validation;
- [x] exact frozen 0.7.8 candidate passed 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [x] canonical PR checks/reviews/merge safety passed and exact validated head merged;
- [x] exact post-merge main release/dependency gates passed and canonical inner hashes reproduced frozen candidate exactly.

Required release evidence: exact SHAs/runs/artifacts/hashes recorded below.
Known explicit exclusions: no changes to stop-phrase/task completion guards, GitHub PAT credential semantics, Telegram, auth grace, chat URL rebind semantics or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Product release basis / merge commit: `cfca9058f27e1ba960e4713f906bebec12f9dbc4`.
Frozen candidate: `9c78378f8027e5019b1fcf60eeaa578ab4d996e4`.
Canonical integration branch: `release/0.7.8-draftless-go`.
Canonical PR: #32 `fix: continue through composer drafts and default to go`, merged expected-head from exact `9c78378f...`.
Relevant open PRs after release: draft #17 remains unrelated/excluded.

Frozen branch evidence:
- release run `34315005605`, exact head `9c78378f...`, SUCCESS;
- 5/5 full audits SUCCESS; Chromium MV3 browser E2E SUCCESS; reproducible package/provenance SUCCESS;
- artifact ID `10089770382`, `ChatPulse-Chrome-v0.7.8-beta`, size 65588 bytes;
- inner ZIP SHA-256 `96671fd6898927323c91901f6d0319e6e906ff60cec938d5d2740627445396c9`;
- source-manifest SHA-256 `0d61b956b426b14940907885fc28e018fbcf754a309d93314d46a4637892f383`;
- file_count 20; reproducible timestamp `2020-01-01T00:00:00`.

PR-context evidence:
- release run `34315228805`, exact product head `9c78378f...`, SUCCESS;
- dependency policy run `34315228853`, SUCCESS;
- 5/5 audits SUCCESS; Chromium E2E SUCCESS; package/provenance SUCCESS;
- PR artifact ID `10089863448` reproduced the same inner ZIP/source-manifest hashes exactly;
- PR mergeable=true; reviews, review threads and comments had no blockers.

Exact-main evidence:
- merge commit / product basis `cfca9058f27e1ba960e4713f906bebec12f9dbc4`;
- release run `34315492774`, exact head `cfca9058...`, SUCCESS;
- dependency policy run `34315492755`, exact head `cfca9058...`, SUCCESS;
- 5/5 audits SUCCESS; Chromium MV3 E2E SUCCESS; package/provenance SUCCESS;
- exact-main artifact ID `10089950864`, name `ChatPulse-Chrome-v0.7.8-beta`, size 65588 bytes;
- exact-main inner ZIP SHA-256 `96671fd6898927323c91901f6d0319e6e906ff60cec938d5d2740627445396c9`;
- exact-main source-manifest SHA-256 `0d61b956b426b14940907885fc28e018fbcf754a309d93314d46a4637892f383`;
- canonical inner hashes match frozen candidate exactly.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 continuation/watchdog control for configured ChatGPT chats.

Material behavior delivered:
- `content/content-script.js`: `CHATPULSE_SEND` overwrites current composer content with the configured command instead of cancelling; snapshot uses non-blocking draft state;
- `lib/model-v2.js`: default command is `go`; exact old stock phrase migrates to `go`; freshness recovery ignores draft evidence; custom commands remain intact;
- `background/service-worker-v2.js`: both direct watchdog `hasDraft` deferral paths that emitted `restart отложен: в поле ввода есть пользовательский черновик` are removed;
- regression tests explicitly forbid restoration of these draft guards and assert continuation-wins semantics.

Build / packaging: deterministic Chrome MV3 ZIP.
Tests / validation: Node syntax/unit/integration/static audits, five audit cycles, loaded-extension Chromium E2E, reproducible package/provenance.
CI: release gate plus dependency runner policy.
Governance: live organizational HQ master v1.2; terminal project state persisted here.

## 4. Release Gates

### GATE-1 — Draftless continuation
Status: SATISFIED
Evidence: focused regression coverage + frozen/PR/main full audits and Chromium E2E.
Blocking items: NONE.

### GATE-2 — Default `go` and legacy migration
Status: SATISFIED
Evidence: focused migration/custom-command tests + frozen/PR/main full audits.
Blocking items: NONE.

### GATE-3 — Frozen 0.7.8 candidate
Status: SATISFIED
Evidence: `9c78378f...`, run `34315005605`, artifact `10089770382`, canonical hashes above.
Blocking items: NONE.

### GATE-4 — Canonical PR integration
Status: SATISFIED
Evidence: PR #32, PR-context release/dependency proof, expected-head merge to `cfca9058...`.
Blocking items: NONE.

### GATE-5 — Post-merge exact-main proof
Status: SATISFIED
Evidence: runs `34315492774` and `34315492755`, exact-main artifact `10089950864`, canonical inner hashes equal frozen candidate.
Blocking items: NONE.

## 5. Current Critical Path

### CP-1 — Draftless continuation + `go`
Status: DONE
Release gate: GATE-1, GATE-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Evidence: product implementation and focused/full validation.

### CP-2 — Freeze 0.7.8 candidate
Status: DONE
Release gate: GATE-3.
Execution plane: PROJECT_RUNNER.
Evidence: exact frozen run/artifact/hashes above.

### CP-3 — Canonical PR integration
Status: DONE
Release gate: GATE-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Evidence: PR #32 merged exact validated head as `cfca9058...`.

### CP-4 — Exact post-merge main proof
Status: DONE
Release gate: GATE-5.
Execution plane: PROJECT_RUNNER.
Evidence: exact-main release/dependency runs and matching canonical inner hashes.

## 6. Active Execution Registry

HQ: release complete; no active critical execution.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: no critical release execution pending.

## 7. Safe Parallel Work

NONE — 0.7.8 release complete. Do not manufacture unrelated work into the closed release.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — owner runtime report, source-level root cause, exact candidate/PR/main runs and hashes align.
Release Alignment Audit: PASS — only owner-requested draftless continuation/`go` plus required release evidence.
Dependency & Ordering Audit: PASS — implementation → freeze → PR validation → expected-head merge → exact-main proof.
Execution & Parallelism Audit: PASS — candidate remained immutable; no competing product writer.
Adversarial Audit: PASS — self-authored composer text, genuine user draft, legacy `hasDraft=true`, watchdog first-pass/preflight, recovery, old-stock migration and custom-command preservation are covered.
Material finding resolved: continuation intentionally wins over existing composer text per owner decision.

## 10. Next Action

Exact next action: NONE for ChatPulse 0.7.8. Await a new explicit owner objective or material live event.
Executor: HQ only when a new objective/event exists.
Expected evidence: new owner objective or material project change.
Acceptance condition: do not reopen this completed release without new evidence.

## 11. Last Material Revision

What changed: PR #32 merged exact frozen candidate; exact-main release/dependency/provenance all passed and reproduced frozen hashes exactly.
Why the critical path changed: all five mandatory 0.7.8 gates are satisfied.
Evidence causing the change: `9c78378f...`; runs `34315005605`, `34315228805`, `34315228853`; merge `cfca9058...`; runs `34315492774`, `34315492755`; artifact `10089950864` and canonical hashes.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact-main package/dependency proof verified and terminal r66 persisted.
Active external critical executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r66 + product basis `cfca9058f27e1ba960e4713f906bebec12f9dbc4`; verify later commits after basis are state-only before reusing terminal evidence.
Exact next action after recovery: treat 0.7.8 as DONE; open a new release contract only for a new explicit owner objective/material project event.
Rotation blockers: NONE.
