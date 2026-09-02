---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 7
updated_at: 2026-09-02T01:32:30Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: INFERRED
handoff_status: READY
basis_ref: feature/stop-phrase-0.5.4
basis_sha: 2e6d79971ccd58619acac28551ddcf6d457c71a1
---

# HQ Critical Path

## 1. Current Release Contract

Primary release target remains ChatPulse 0.5.4 beta: per-chat stop phrase that stops monitoring only the matching chat while preserving the Chrome MV3 safety boundary.

Primary release surface:
- 0.5.4 product source integrated into `main`.
- GitHub Actions beta artifact `ChatPulse-Chrome-v0.5.4-beta.zip`.
- Required artifact SHA-256: `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.
- Required source payload SHA-256: `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`.

Definition of RELEASED for the current primary release is unchanged:
- canonical pinned payload recovered and applied without weakening the source pin;
- exact candidate validation/package/security gates pass;
- expected Actions artifact is published;
- canonical 0.5.4 PR is verified, merge-ready and merged into live `main`;
- post-merge live `main` and retained artifact satisfy the contract.

Explicit exclusions from the current 0.5.4 release:
- Draft PR #17 runner-selector refactor unless proven prerequisite;
- owner-requested Telegram notifications in Draft PR #18 until the 0.5.4 product base is resolved/reconciled;
- legacy macOS cleanup, Chrome Web Store, GitHub Release/tag, native/Safari packaging unless separately proven required.

## 2. Owner Decisions

### Telegram notifications — ACTIVE OWNER REQUEST

On 2026-09-02 the owner explicitly requested: `Добавь уведомления в тг`.

HQ interpretation implemented as the smallest safe product slice:
- Telegram is optional and disabled by default;
- notification is sent after ChatPulse performs an automatic continuation;
- settings UI includes enable toggle, chat ID, bot token and test-send action;
- permanent host access remains only ChatGPT; `https://api.telegram.org/*` is declared only in `optional_host_permissions` and requested by Chrome from a direct user gesture;
- Telegram bot token is stored only in a separate `chrome.storage.local` config and is never returned in public runtime state or intentionally written to action logs;
- Telegram receives tracked chat title + continuation outcome only, not ChatGPT response text or conversation URL;
- Telegram delivery failure is non-critical and must not alter the at-most-once continuation state or trigger a duplicate ChatGPT command.

Integration decision:
- Telegram work is intentionally isolated on `feature/telegram-notifications` and PR #18 is Draft.
- It does not supersede the current 0.5.4 release contract.
- Merge is deferred until the canonical 0.5.4 product state is resolved or the owner explicitly supersedes that release ordering.

## 3. Repository Basis

Working repository: `MishkaStrategy/ChatPulse`.
Default branch: `main`.
Canonical 0.5.4 release branch: `feature/stop-phrase-0.5.4`.
Canonical 0.5.4 PR: #15 `Добавить стоп-фразу для остановки отдельного чата`.
Pinned 0.5.4 pre-integration head: `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
Issue payload source: #14 `Temporary verified payload for ChatPulse 0.5.4`.

Telegram feature branch: `feature/telegram-notifications`.
Telegram Draft PR: #18 `Добавить опциональные Telegram-уведомления`.
Current Telegram head: `308f8e362f3c93a607f6a2bbc21ea11a74523959`.

Temporary 0.5.4 execution bridge on `main` remains present and required for payload recovery/retry:
`.github/workflows/hq-0.5.4-release-bridge.yml`.

Temporary Telegram validation bridge currently present during exact-head revalidation:
`.github/workflows/hq-telegram-validation.yml`.
It must be deleted immediately after the terminal validation result is captured.

## 4. Primary 0.5.4 Live Evidence

The exact-head 0.5.4 execution route is proven:
- bridge run `33578907906`;
- job `100088820763`;
- runner `mac-MacBook-Pro-MishkaStrategy-02`;
- exact PR #15 head assertion PASS for `2e6d79971ccd58619acac28551ddcf6d457c71a1`;
- Node.js 22 PASS;
- payload integrity FAIL before extraction.

Exact payload blocker:
- current live Issue #14 body + seven comments sorted by ID and whitespace-normalized decodes to SHA-256 `fe85f7384d7b8e1d85106ab4adae0f9d94cfb3a4e3c99a72cbf84c64a3d4753c`;
- release contract requires `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`;
- bridge rejected mismatch before extraction;
- no 0.5.4 product source or release artifact was produced.

PR #15 remains open, non-draft, head unchanged at `2e6d7997...`.

## 5. Telegram Feature Evidence

Implementation branch was created from live `main` and currently contains:
- `chrome-extension/background/telegram.js` separate Telegram config/send module;
- service-worker integration after continuation with non-critical notification failure handling;
- Telegram settings/test UI;
- Manifest optional host permission only;
- README, PRIVACY and SECURITY updates;
- `tests/chrome-extension/telegram.test.mjs`;
- syntax gate extended to include `telegram.js`;
- static validator extended to enforce the optional-permission boundary.

First exact-head validation evidence:
- feature head `963f1cdb543d4aff29319ec922a41b6457766a4b`;
- Actions run `33579566937`, job `100090766183`;
- exact-head assertion PASS;
- `npm run audit:extension` PASS;
- syntax PASS;
- 25/25 tests PASS;
- Telegram privacy/send/permission tests PASS;
- Manifest V3 + optional Telegram permission boundary PASS.

Post-audit adversarial review found one UX isolation edge case: if Telegram remained enabled after permission revocation, an unrelated settings save could revalidate Telegram and fail. This was repaired by making `updateTelegramConfig()` a no-op for patches without Telegram keys and covered by a new `unrelated_settings_isolation` test.

Current exact head after repair: `308f8e362f3c93a607f6a2bbc21ea11a74523959`.
Because the head changed, the previous PASS is historical evidence only; exact-head revalidation is active.

Draft PR #18 is open against `main` and intentionally not merge-ready until exact-head revalidation finishes and 0.5.4 integration ordering is reconciled.

## 6. Release Gates — Primary 0.5.4

### GATE-1 — Canonical release target/candidate
Status: SATISFIED.
Evidence: PR #15, branch/head pin, Issue #14 source reference and expected source/artifact hashes.

### GATE-2A — Executable exact-head release route
Status: SATISFIED.
Evidence: bridge run `33578907906` executed on self-hosted runner and passed exact-head assertion.

### GATE-2B — Canonical payload integrity/recovery
Status: UNSATISFIED.
Blocking item: recover the exact archive bytes or intended reconstruction producing pinned SHA `f1a702...`; do not accept live `fe85f7...` by changing the pin.

### GATE-2C — Product tests/package/security/artifact
Status: UNSATISFIED.
Blocks on GATE-2B.

### GATE-3 — Final merge readiness
Status: UNSATISFIED.
Blocks on GATE-2C and final exact-head diff/base reconciliation.

### GATE-4 — Merge/post-merge verification
Status: UNSATISFIED.
Blocks on GATE-3.

## 7. Current Critical Path

### CP-1 — Recover and prove the pinned 0.5.4 payload
Status: ACTIVE.

Why critical: the execution plane is proven, but the live Issue #14 reconstruction fails the immutable source-integrity pin before product code can be trusted or applied.

Execution plane: HQ_DIRECT read/audit; PROJECT_RUNNER for deterministic diagnostics or final verified recovery.

Exact scope:
1. Inspect Issue #14 body/comment provenance, timestamps, IDs and boundaries for reconstruction errors or contamination.
2. Search repository/PR/issue/commit history for the source SHA, artifact SHA, payload-generation provenance, alternate canonical archive/source or prior exact product snapshot.
3. If repository reads cannot discriminate the canonical chunk set, use the existing exact-pinned bridge for non-secret hash diagnostics only.
4. Accept a source only when it reproducibly yields exact pinned SHA `f1a702...` and passes member/path/type checks.
5. If canonical bytes are unrecoverable after exhausting live evidence, escalate the minimal integrity decision rather than changing the pin by guess.

Acceptance: exact archive SHA `f1a702...` reproducibly recovered from authoritative evidence.

### CP-2 — Run full 0.5.4 gate and publish product commit/artifact
Status: PENDING.
Depends on CP-1.

### CP-3 — Verify final 0.5.4 diff and merge readiness
Status: PENDING.
Depends on CP-2.

### CP-4 — Merge canonical 0.5.4 PR and verify released `main`
Status: PENDING.
Depends on CP-3.

## 8. Safe Parallel / Follow-up Work

### TG-1 — Validate and park Telegram feature PR
Status: ACTIVE NON-CRITICAL PARALLEL WORK.

Why safe: Telegram product writes are isolated to `feature/telegram-notifications`; PR #18 is Draft and no writes overlap PR #15. The one-shot validation runner is read-only against the feature branch.

Current exact head: `308f8e362f3c93a607f6a2bbc21ea11a74523959`.

Current validation trigger:
- upstream `Dependency runner policy` run `33578876592`, attempt 3, accepted by GitHub and last observed `pending` before job materialization;
- once it completes, `.github/workflows/hq-telegram-validation.yml` should emit the exact-head audit;
- validation bridge must then be removed from `main`.

Acceptance:
- exact-head `npm run audit:extension` PASS on `308f8e...`;
- PR #18 body updated to current evidence;
- temporary Telegram validation workflow removed;
- PR remains Draft until 0.5.4 product-base reconciliation.

## 9. Active Execution Registry

HQ primary:
- Scope: 0.5.4 payload provenance/integrity recovery.
- Ref: PR #15 / `feature/stop-phrase-0.5.4` / `2e6d7997...`.

HQ parallel:
- Scope: exact-head Telegram revalidation and Draft PR parking.
- Ref: PR #18 / `feature/telegram-notifications` / `308f8e362f3c93a607f6a2bbc21ea11a74523959`.
- Temporary main write: `.github/workflows/hq-telegram-validation.yml` only until terminal validation.

PROJECT_RUNNER:
- Upstream trigger run `33578876592`, attempt 3, currently pending materialization.
- Expected downstream validation target: Telegram feature `308f8e...`.

Workers: NONE — product branches are already isolated and deterministic HQ control is cheaper than handoff.
Codex: NONE.

## 10. Safety / Adversarial Controls

- Never weaken 0.5.4 source SHA to match the current Issue reconstruction.
- Never extract or execute the 0.5.4 archive before exact source hash match.
- Do not merge PR #15 before payload/test/artifact gates complete.
- Do not merge PR #18 into `main` before exact-head revalidation and 0.5.4 product-base reconciliation.
- Telegram must remain optional host permission; do not add permanent `api.telegram.org` host access.
- Do not expose Telegram bot token through runtime state, logs, PR text or test output.
- Telegram notification failure cannot be allowed to affect at-most-once continuation semantics.
- Temporary validation workflows must be deleted after their terminal purpose.
- PR #17 remains unrelated unless evidence proves otherwise.

## 11. Critical Path Audits

Repository Coverage Audit: PASS — primary release, payload provenance, open PRs #15/#17/#18, execution bridges, current runner evidence and product/security surfaces are covered.
Evidence Audit: PASS — primary blocker is tied to exact hashes/run logs; Telegram implementation is tied to exact branch heads and runner evidence, with current-head PASS still pending after the edge-case fix.
Release Alignment Audit: PASS — owner requested Telegram, but it is explicitly isolated as non-critical follow-up so it does not silently mutate the active 0.5.4 release contract.
Dependency & Ordering Audit: PASS — 0.5.4 integrity precedes its product integration; Telegram merge waits for exact-head validation and base reconciliation.
Execution & Parallelism Audit: PASS — PR #15 and PR #18 have non-overlapping write ownership; Telegram validation is read-only; no competing product writes exist.
Adversarial Audit: PASS — rejected source-hash relaxation, premature Telegram merge, permanent Telegram host permission, token exposure, notification-to-continuation coupling, stale validation evidence and unrelated PR #17 scope creep.

## 12. Current Blockers / Unblock Conditions

Primary release blocker:
- live Issue #14 reconstruction SHA `fe85f738...` does not match required `f1a702c1...`.
- Unblock: recover/prove exact canonical source.

Telegram follow-up blocker:
- current head `308f8e...` requires a fresh exact-head audit because the prior PASS covered `963f1cdb...`.
- Unblock: current one-shot validation run completes PASS; then remove validation workflow and park Draft PR #18.

Project remains EXECUTING, not BLOCKED.
Human action: NOT REQUIRED.

## 13. Next Action

1. Observe `33578876592` attempt 3 until completion and capture downstream Telegram exact-head validation result.
2. If PASS, remove `.github/workflows/hq-telegram-validation.yml`, update PR #18 evidence and mark TG-1 VERIFIED/PARKED.
3. Immediately resume CP-1 Issue #14 provenance/reconstruction search.

## 14. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: persisted owner-requested Telegram feature, Draft PR #18 and active exact-head revalidation while preserving the primary 0.5.4 contract.
Active external execution: `Dependency runner policy` run `33578876592`, attempt 3, pending; expected downstream Telegram validation on `308f8e...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-fetch HQ state revision 7, PR #15 head, PR #18 head and run `33578876592`; if Telegram validation workflow is still present, remove it only after terminal validation evidence is captured.
