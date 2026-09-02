---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 8
updated_at: 2026-09-02T01:37:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: INFERRED
handoff_status: READY
basis_ref: feature/stop-phrase-0.5.4
basis_sha: 2e6d79971ccd58619acac28551ddcf6d457c71a1
---

# HQ Critical Path

## 1. Current Release Contract

Primary release target remains ChatPulse 0.5.4 beta: add a per-chat stop phrase that stops monitoring only the matching chat while preserving the Chrome MV3 safety boundary.

Primary release surface:
- 0.5.4 product source integrated into `main`.
- GitHub Actions beta artifact `ChatPulse-Chrome-v0.5.4-beta.zip`.
- Required artifact SHA-256: `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.
- Required source payload SHA-256: `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`.

Definition of RELEASED:
- canonical pinned payload recovered and applied without weakening the source pin;
- exact candidate validation/package/security gates pass;
- expected beta artifact is published;
- canonical 0.5.4 PR is verified, merge-ready and merged into live `main`;
- post-merge `main` and retained artifact satisfy the contract.

Explicit exclusions from the current 0.5.4 release:
- Draft PR #17 runner-selector refactor unless proven prerequisite;
- verified Telegram notifications Draft PR #18 until the 0.5.4 product base is resolved/reconciled;
- legacy macOS cleanup, Chrome Web Store, GitHub Release/tag and native/Safari packaging unless separately proven required.

## 2. Owner Decision — Telegram Notifications

Owner request on 2026-09-02: `Добавь уведомления в тг`.

Implemented product decision:
- Telegram integration is optional and disabled by default;
- after an automatic continuation, ChatPulse may send a Telegram notification;
- settings UI contains enable toggle, chat ID, bot token and test-send action;
- permanent host access remains ChatGPT only;
- `https://api.telegram.org/*` exists only in `optional_host_permissions` and is requested by Chrome on a direct user gesture;
- Telegram bot token is stored in separate `chrome.storage.local` config, never returned in public runtime state and never intentionally written to logs;
- Telegram receives only tracked chat title + continuation outcome, not ChatGPT response text or conversation URL;
- Telegram delivery failure is non-critical and cannot change at-most-once continuation state or trigger a duplicate ChatGPT command;
- unrelated settings remain independent of Telegram permission even if the user later revokes access to `api.telegram.org`.

Integration ordering:
- branch: `feature/telegram-notifications`;
- Draft PR #18: `Добавить опциональные Telegram-уведомления`;
- exact verified head: `308f8e362f3c93a607f6a2bbc21ea11a74523959`;
- PR remains Draft until the canonical 0.5.4 product state is resolved/reconciled or the owner explicitly supersedes that ordering.

## 3. Repository Basis

Working repository: `MishkaStrategy/ChatPulse`.
Default branch: `main`.
Canonical 0.5.4 release branch: `feature/stop-phrase-0.5.4`.
Canonical 0.5.4 PR: #15 `Добавить стоп-фразу для остановки отдельного чата`.
Pinned 0.5.4 pre-integration head: `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
Issue payload source: #14 `Temporary verified payload for ChatPulse 0.5.4`.

Telegram feature:
- branch `feature/telegram-notifications`;
- Draft PR #18;
- exact head `308f8e362f3c93a607f6a2bbc21ea11a74523959`.

Temporary 0.5.4 execution bridge remains on `main`:
`.github/workflows/hq-0.5.4-release-bridge.yml`.
It is still required for bounded payload diagnostics/retry and must be removed after the 0.5.4 recovery path becomes terminal.

Telegram validation bridge `.github/workflows/hq-telegram-validation.yml` has been removed from `main` after successful exact-head validation.

## 4. Primary 0.5.4 Evidence

Exact-head execution route is proven:
- bridge run `33578907906`;
- job `100088820763`;
- runner `mac-MacBook-Pro-MishkaStrategy-02`;
- exact PR #15 head assertion PASS for `2e6d79971ccd58619acac28551ddcf6d457c71a1`;
- Node.js 22 PASS;
- payload integrity FAIL before extraction.

Exact primary blocker:
- live Issue #14 body + seven comments sorted by ID and whitespace-normalized decodes to SHA-256 `fe85f7384d7b8e1d85106ab4adae0f9d94cfb3a4e3c99a72cbf84c64a3d4753c`;
- release contract requires `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`;
- bridge rejected mismatch before extraction;
- no 0.5.4 product commit or release artifact was produced.

Issue #14 was created `2026-07-23T05:34:00Z` and last updated `2026-07-23T05:48:01Z`, matching the last payload comment time. Sample first/last comment metadata show `created_at == updated_at`; no later edit evidence has yet been found.

## 5. Telegram Feature Evidence — VERIFIED / PARKED

Implemented surfaces:
- `chrome-extension/background/telegram.js`;
- service-worker notification integration with non-critical failure handling;
- Telegram settings/test UI;
- Manifest optional host permission only;
- README / PRIVACY / SECURITY updates;
- `tests/chrome-extension/telegram.test.mjs`;
- syntax gate includes `telegram.js`;
- static validator enforces Telegram permission/security boundary.

Final exact-head validation:
- head `308f8e362f3c93a607f6a2bbc21ea11a74523959`;
- Actions run `33579882175`;
- job `100091700358`;
- runner `mac-MacBook-Pro-MishkaStrategy-20`;
- exact-head assertion PASS;
- `npm run audit:extension` PASS;
- syntax PASS;
- 25/25 tests PASS, 0 failures;
- `telegram_config_privacy` PASS;
- `telegram_send` PASS;
- `telegram_permission_gate` PASS;
- `unrelated_settings_isolation` PASS;
- Manifest V3 + optional Telegram permission boundary PASS.

PR #18 body has been updated with the final exact-head evidence. It remains Draft intentionally. No Telegram validation execution remains active and its temporary workflow was deleted from `main` in commit `c6c1cda5b71f1ff862342f249f7d5f8f4939fc74`.

TG-1 status: VERIFIED / PARKED.

## 6. Release Gates — Primary 0.5.4

### GATE-1 — Canonical release target/candidate
Status: SATISFIED.
Evidence: PR #15, branch/head pin, Issue #14 source reference and expected source/artifact hashes.

### GATE-2A — Executable exact-head release route
Status: SATISFIED.
Evidence: bridge run `33578907906` passed runner, checkout and exact-head assertion.

### GATE-2B — Canonical payload integrity/recovery
Status: UNSATISFIED.
Blocking item: recover the exact archive bytes or exact intended reconstruction producing pinned SHA `f1a702...`; never replace the pin with live `fe85f7...` by guess.

### GATE-2C — Product tests/package/security/artifact
Status: UNSATISFIED.
Depends on GATE-2B.

### GATE-3 — Final merge readiness
Status: UNSATISFIED.
Depends on GATE-2C and current-base reconciliation.

### GATE-4 — Merge/post-merge release verification
Status: UNSATISFIED.
Depends on GATE-3.

## 7. Current Critical Path

### CP-1 — Recover and prove the pinned 0.5.4 payload
Status: ACTIVE.

Why critical:
The execution plane is proven, but the live Issue #14 reconstruction fails the immutable source-integrity pin before product code can be trusted or applied.

Execution plane: HQ_DIRECT read/audit; bounded PROJECT_RUNNER diagnostics when repository reads cannot discriminate the canonical reconstruction.

Exact scope:
1. Inspect Issue #14 body/comment provenance, timestamps, IDs, lengths and chunk boundaries for edits, omissions, contamination or reconstruction semantics.
2. Search repository/PR/commit history for source hash, artifact hash, payload-generation provenance, alternate canonical source or prior exact product snapshot.
3. If needed, run a read-only diagnostic that never logs payload contents and computes only metadata/hashes for ordered subsets/permutations of the seven comment chunks plus the Issue body.
4. Validate archive member count/paths/types only after a candidate byte stream is decoded; never execute payload code unless the source SHA exactly matches `f1a702...`.
5. If authoritative live evidence cannot recover the pinned bytes, escalate only the minimal integrity decision rather than silently changing the source pin.

Acceptance:
Exact archive SHA `f1a702...` is reproducibly recovered from authoritative evidence with a documented reconstruction/source path.

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

Telegram PR #18: VERIFIED / PARKED. No active write or validation execution. Do not merge until 0.5.4 base reconciliation.

PR #17: Draft and non-critical unless proven prerequisite.

No other independent product slice should be opened while CP-1 integrity recovery is active.

## 9. Active Execution Registry

HQ primary:
- scope: 0.5.4 payload provenance/integrity recovery;
- ref: PR #15 / `feature/stop-phrase-0.5.4` / `2e6d79971ccd58619acac28551ddcf6d457c71a1`.

HQ follow-up:
- Telegram PR #18 is parked at verified exact head `308f8e...`; no active execution.

PROJECT_RUNNER: NONE active for product work at this checkpoint.
Workers: NONE — current integrity chain is single-source evidence correlation; handoff adds overhead without independent closure.
Codex: NONE.

## 10. Safety / Adversarial Controls

- Never weaken 0.5.4 source SHA to match the current Issue reconstruction.
- Never execute the 0.5.4 payload before exact source-hash match.
- Do not merge PR #15 before payload/test/artifact gates complete.
- Do not merge PR #18 before 0.5.4 product-base reconciliation.
- Telegram must remain optional host permission; never promote `api.telegram.org` into permanent host access without a new owner/security decision.
- Never expose Telegram bot token through runtime state, logs, PR text or test output.
- Telegram failure cannot affect at-most-once continuation semantics.
- PR #17 remains unrelated unless evidence proves otherwise.

## 11. Critical Path Audits

Repository Coverage Audit: PASS — active release, Issue #14, PR #15, PR #17, verified PR #18, execution bridges, runner evidence and security surfaces covered.
Evidence Audit: PASS — primary blocker is exact hash evidence; Telegram closure is exact-head Actions evidence, not inferred state.
Release Alignment Audit: PASS — Telegram owner request is implemented and parked without silently redefining the active 0.5.4 release contract.
Dependency & Ordering Audit: PASS — payload integrity precedes 0.5.4 execution/merge; Telegram merge waits for final product-base reconciliation.
Execution & Parallelism Audit: PASS — Telegram slice has no active writes; CP-1 is now the sole active product path.
Adversarial Audit: PASS — source-hash relaxation, premature merges, permanent Telegram permission, token exposure, stale validation evidence and unrelated PR #17 scope creep are all explicitly rejected.

## 12. Current Blocker / Unblock Condition

Primary blocker:
Live Issue #14 reconstruction SHA `fe85f738...` does not match required source SHA `f1a702c1...`.

Unblock:
Recover/prove the exact canonical byte stream or authoritative equivalent source that yields `f1a702...`.

Telegram blocker: NONE for implementation/validation. Integration remains intentionally PARKED by release ordering.

Project state: EXECUTING, not BLOCKED.
Human action: NOT REQUIRED.

## 13. Next Action

Run bounded payload-provenance diagnostics on Issue #14: correlate chunk metadata and compute safe subset/permutation hashes without logging payload contents; if a matching reconstruction exists, feed it into the existing exact-pinned 0.5.4 bridge. Otherwise continue provenance search before any integrity decision.

## 14. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: Telegram notifications reached exact-head PASS, temporary validation workflow was removed, PR #18 evidence was updated, and the feature was parked as Draft without changing the primary release contract.
Active external product execution: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-fetch revision 8, PR #15 head and Issue #14; confirm PR #18 remains Draft at `308f8e...`; resume CP-1 payload diagnostics.
