---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 63
updated_at: 2026-09-07T13:08:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: c3a6d682dd9a7e8e1013e2c15edd3ee442bb6b79
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — editable/rebindable saved ChatGPT conversation URL plus transparent shared-GitHub-PAT verification across every configured watchdog repository.

Release surface: safe URL identity mutation/background persistence/Control Center editor; shared PAT multi-repository verification and credential-source diagnostics; 0.7.7 metadata; full audits; Chromium E2E; reproducible package/provenance; canonical PR/merge; exact-main proof.

Definition of RELEASED: SATISFIED.
- existing ChatPulse chat can replace its concrete ChatGPT URL while preserving identity/profile/task guards/counters/GitHub-watch state and clearing only stale page-bound runtime;
- invalid/duplicate URLs are rejected; unchanged normalized URL is a no-op;
- one protected extension-local shared PAT can be tested against every unique configured watchdog repository, with per-repository result and actual watchdog credential source (shared PAT vs repository override);
- secrets do not enter state/export/runtime messages/logs; GitHub watchdog access remains read-only;
- exact frozen candidate, canonical PR and exact merged main all passed mandatory release evidence.

Mandatory release gates:
- [x] URL mutation/editor implementation independently passed focused/full validation;
- [x] shared PAT multi-repository diagnostics independently passed focused/full validation;
- [x] exact frozen 0.7.7 candidate passed 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [x] canonical PR checks/reviews/merge safety passed and exact validated head merged;
- [x] exact post-merge main release/dependency gates passed and inner package hashes reproduced frozen candidate exactly.

Known exclusions: no content migration/cloning; no task-limit reset; no GitHub write/workflow dispatch; no automatic credential generation/escalation; no unrelated Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Product release basis / merge commit: `c3a6d682dd9a7e8e1013e2c15edd3ee442bb6b79`.
Frozen candidate head: `ed9f9f83c3b06525d23ba115be3be7f63351d4a8`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR: #31 `feat: edit chat URLs and verify shared PAT across repositories`, merged expected-head from exact `ed9f9f83...`.
Relevant open PRs after release: draft #17 remains unrelated/excluded.

Frozen branch release evidence:
- run `34124935100`, exact head `ed9f9f83...`, SUCCESS;
- 5/5 full extension audits SUCCESS;
- Chromium MV3 browser E2E SUCCESS;
- reproducible package/provenance SUCCESS;
- artifact ID `10019736756`, name `ChatPulse-Chrome-v0.7.7-beta`, size 65739 bytes;
- ZIP SHA-256 `63306dbc386fc4ac7f689c90fc29bc2a37f854d8256242ffb44d9a47028cc161`;
- source manifest SHA-256 `fafdaf2ba803eee6b2b89db5b73fbeefd6397159edc3cbaa3ec163a8c125a7db`;
- file_count 20; reproducible timestamp `2020-01-01T00:00:00`.

PR-context evidence:
- release run `34125258715`, exact head `ed9f9f83...`, SUCCESS;
- 5/5 audits SUCCESS; Chromium E2E SUCCESS; reproducible package/provenance SUCCESS;
- dependency runner policy for the PR head SUCCESS;
- no reviews, review threads or comments blocking merge; PR mergeable=true before merge.

Exact-main evidence:
- release run `34125467975`, event push, exact head `c3a6d682...`, SUCCESS;
- 5/5 audits SUCCESS; Chromium MV3 browser E2E SUCCESS; reproducible package/provenance SUCCESS;
- dependency runner policy run `34125468037`, exact head `c3a6d682...`, SUCCESS;
- artifact ID `10019936761`, name `ChatPulse-Chrome-v0.7.7-beta`, size 65739 bytes, outer artifact digest `sha256:01f1a78fdb3bf27806d45430587b8955ab938f02f9b935627ee647e27de9e048`;
- exact-main ZIP SHA-256 `63306dbc386fc4ac7f689c90fc29bc2a37f854d8256242ffb44d9a47028cc161`;
- exact-main source manifest SHA-256 `fafdaf2ba803eee6b2b89db5b73fbeefd6397159edc3cbaa3ec163a8c125a7db`;
- canonical inner hashes match frozen candidate exactly.

## 3. Repository Scan Summary

Relevant architecture delivered:
- `chrome-extension/lib/chat-url-mutation.js` — pure validated URL rebind mutation;
- `chrome-extension/background/service-worker-v2.js` — safe background identity-mutation/persistence boundary;
- `chrome-extension/options/chat-url-ui.js` — Control Center URL editor;
- `chrome-extension/options/github-token-ui.js` — all-repository shared PAT verification and credential-source diagnostics;
- existing GitHub watchdog remains independently grouped/polled per unique repository using read-only Actions GET.

Material findings resolved:
- owner-reported successful PAT test on one repository did not imply access to every configured repository; 0.7.7 now tests all configured watchdog repositories explicitly;
- repository-specific token overrides remain backward-compatible and are now visible as runtime source diagnostics;
- two Codex attempts failed tool/runtime loops and produced zero product mutation; both were terminalized safely; final product implementation used deterministic HQ fallback plus independent CI evidence;
- one static release-validator wording regression on intermediate candidate `e73d698...` was repaired without functional change; final frozen candidate is `ed9f9f83...`.

## 4. Release Gates

### GATE-1 — Safe chat URL rebind
Status: SATISFIED
Evidence: focused URL mutation/wiring tests plus frozen/PR/main full audits and browser validation green.
Blocking items: NONE.

### GATE-2 — Shared PAT multi-repository verification/diagnostics
Status: SATISFIED
Evidence: focused UI tests plus frozen/PR/main full audits green; runtime source explicitly distinguishes shared PAT from repository override.
Blocking items: NONE.

### GATE-3 — Frozen 0.7.7 candidate
Status: SATISFIED
Evidence: `ed9f9f83...`, run `34124935100`, artifact `10019736756`, canonical hashes above.
Blocking items: NONE.

### GATE-4 — Canonical PR integration
Status: SATISFIED
Evidence: PR #31; PR-context release/dependency checks green; expected-head merge produced `c3a6d682...`.
Blocking items: NONE.

### GATE-5 — Post-merge exact-main proof
Status: SATISFIED
Evidence: runs `34125467975` and `34125468037` SUCCESS on exact `c3a6d682...`; main artifact `10019936761`; inner hashes exactly match frozen candidate.
Blocking items: NONE.

## 5. Current Critical Path

### CP-1A — Editable chat URL
Status: DONE
Release gate: GATE-1.
Evidence: implementation, focused tests, full frozen/PR/main validation.

### CP-1B — Shared PAT all-repository verification
Status: DONE
Release gate: GATE-2.
Evidence: implementation, focused tests, full frozen/PR/main validation.

### CP-2 — Freeze and validate 0.7.7 candidate
Status: DONE
Release gate: GATE-3.
Evidence: `ed9f9f83...`, `34124935100`, `10019736756`, canonical hashes.

### CP-3 — Canonical PR integration
Status: DONE
Release gate: GATE-4.
Evidence: PR #31 merged exact validated head as `c3a6d682...`.

### CP-4 — Exact post-merge main proof
Status: DONE
Release gate: GATE-5.
Evidence: exact-main release/dependency runs and matching canonical inner hashes.

## 6. Active Execution Registry

HQ: release complete; no active critical execution.
Workers: NONE.
Codex: NONE; failed claims terminalized and excluded from product evidence.
Zero-model control: NONE active.
CI/runtime: no critical release execution pending.

## 7. Safe Parallel Work

NONE — release complete. Do not manufacture unrelated work into the closed 0.7.7 release.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — frozen, PR-context, merge and exact-main evidence all exact-SHA grounded.
Release Alignment Audit: PASS — release contains only owner-requested URL rebind and shared-PAT diagnostics plus required metadata/tests.
Dependency & Ordering Audit: PASS — implementation -> freeze -> PR checks -> expected-head merge -> exact-main proof completed in order.
Execution & Parallelism Audit: PASS — no competing product writer at freeze/merge/main verification; failed Codex tasks terminalized safely.
Adversarial Audit: PASS — stale page runtime inheritance, duplicate/invalid URL, active-check race, PAT single-repo false confidence, override shadowing, secret leakage and non-reproducible package risks all covered and green.
Material findings and resolutions: all release-critical findings resolved; no residual release blocker.

## 10. Next Action

Exact next action: NONE for ChatPulse 0.7.7. Await a new explicit owner/project release objective; do not extend this release with unrelated backlog.
Executor: HQ only when a new material objective/event exists.
Expected evidence: new owner objective or material live project event.
Acceptance condition: open a new release contract/critical path only when justified by live state or owner direction.

## 11. Last Material Revision

What changed: PR #31 merged exact validated candidate and exact-main release/dependency/provenance evidence completed successfully with inner package hashes matching the frozen candidate.
Why the critical path changed: all five mandatory release gates are satisfied; ChatPulse 0.7.7 is factually released under the project contract.
Evidence causing the change: frozen run `34124935100`; PR-context run `34125258715`; merge `c3a6d682...`; exact-main runs `34125467975`/`34125468037`; artifacts/hashes above.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact-main package/provenance and dependency proof verified, then terminal r63 persisted.
Active external critical executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r63 + product basis `c3a6d682dd9a7e8e1013e2c15edd3ee442bb6b79`; verify future commits after basis are state-only before relying on terminal evidence.
Exact next action after recovery: treat 0.7.7 as DONE; only open a new critical path for a new explicit owner objective or material project event.
Rotation blockers: NONE.
