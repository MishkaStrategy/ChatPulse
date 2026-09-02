---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 6
updated_at: 2026-09-02T01:20:30Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: INFERRED
handoff_status: READY
basis_ref: feature/stop-phrase-0.5.4
basis_sha: 2e6d79971ccd58619acac28551ddcf6d457c71a1
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.5.4 beta with a per-chat stop phrase that stops monitoring only the matching chat while preserving the existing Chrome MV3 safety boundaries.

Release surface:
- 0.5.4 product source integrated into `main`.
- GitHub Actions beta artifact `ChatPulse-Chrome-v0.5.4-beta.zip`.
- Required artifact SHA-256: `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.
- Required source payload SHA-256: `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`.

Definition of RELEASED:
- Canonical pinned payload is recovered and applied without weakening the source pin.
- Exact candidate validation/package/security gates pass.
- Expected Actions artifact is published.
- Canonical 0.5.4 PR is verified, merge-ready and merged into live `main`.
- Post-merge live `main` and retained artifact satisfy the complete contract.

Explicit exclusions: PR #17 runner-policy refactor, legacy macOS cleanup, Chrome Web Store, GitHub Release/tag and native/Safari packaging unless separately proven required.

## 2. Repository Basis

Working repository: `MishkaStrategy/ChatPulse`.
Default branch: `main`.
Canonical release branch: `feature/stop-phrase-0.5.4`.
Canonical PR: #15 `Добавить стоп-фразу для остановки отдельного чата`.
Pinned pre-integration head: `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
Issue payload source: #14 `Temporary verified payload for ChatPulse 0.5.4`.

Temporary execution bridge on `main`:
- `.github/workflows/hq-0.5.4-release-bridge.yml`.
- Creation commit `ba1afbac9ca67cab23698238642fd12900d47ff0`.
- Exact upstream run guard: `30872588990`.
- Exact release head guard: `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
- Must be removed after terminal release execution/recovery.

## 3. Material Live Evidence

Historical PR-trigger execution defects are now superseded by a working repository-native execution route:
- Historical hosted runs #33/#34 failed at incompatible `gh --slurp --jq` usage.
- Historical self-hosted run #36 attempt 2 failed because `gh` was absent.
- Connector-created PR branch mutations did not emit a new `pull_request` run.
- A one-shot default-branch `workflow_run` bridge was created and triggered by rerunning existing `Dependency runner policy` run `30872588990`.

Bridge evidence:
- Bridge run: `33578907906`.
- Job: `100088820763`, `HQ pinned 0.5.4 integration`.
- Runner: `mac-MacBook-Pro-MishkaStrategy-02`.
- Checkout pinned release branch: PASS.
- Exact-head assertion: PASS; log confirms `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
- Node.js 22: PASS.
- Payload reconstruction/integrity step: FAIL.
- Downstream tests, artifact, product commit and upload: SKIPPED.

Exact new failure:
- Live Issue #14 body plus all seven comments sorted by comment ID, whitespace removed, base64 decoded, yields SHA-256 `fe85f7384d7b8e1d85106ab4adae0f9d94cfb3a4e3c99a72cbf84c64a3d4753c`.
- Release contract pins `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`.
- The bridge rejected the mismatch before extraction, exactly as required.

Issue #14 currently has seven comments with IDs, ascending:
`5054867088`, `5054889283`, `5054906569`, `5054911921`, `5054916671`, `5054921582`, `5054925524`.

No product source was written and no release artifact was produced by failed bridge run `33578907906`.

## 4. Release Gates

### GATE-1 — Canonical release target/candidate
Status: SATISFIED.
Evidence: PR #15, branch/head pin, Issue #14 source reference and expected source/artifact checksums remain unambiguous.

### GATE-2A — Executable exact-head release route
Status: SATISFIED.
Evidence: bridge run `33578907906` executed on the self-hosted runner, checked out the canonical branch and passed the exact-head assertion.

### GATE-2B — Canonical payload integrity/recovery
Status: UNSATISFIED.
Blocking item: recover the exact archive bytes or exact intended Issue #14 reconstruction that produces pinned SHA `f1a702...`; do not accept `fe85f7...` merely because it is live.

### GATE-2C — Product tests/package/security/artifact
Status: UNSATISFIED.
Blocks on GATE-2B.

### GATE-3 — Final merge readiness
Status: UNSATISFIED.
Blocks on GATE-2C and final exact-head diff/base reconciliation.

### GATE-4 — Merge/post-merge verification
Status: UNSATISFIED.
Blocks on GATE-3.

## 5. Current Critical Path

### CP-1 — Recover and prove the pinned 0.5.4 payload
Status: ACTIVE.

Why critical: the execution plane is now proven, but the current Issue #14 reconstruction fails the immutable source integrity pin before any product code can be trusted or applied.

Execution plane: HQ_DIRECT read/audit work; PROJECT_RUNNER only for deterministic diagnostics or final verified recovery.

Exact scope:
1. Inspect Issue #14 body and each payload comment metadata (`created_at`, `updated_at`, IDs, body lengths/boundaries) for edits, later contamination or ordering mistakes.
2. Search repository/PR/issue/commit history for the pinned source SHA `f1a702...`, artifact SHA `64b128...`, payload-generation provenance, alternate canonical archive/source or prior exact product snapshot.
3. If needed, use the existing exact-pinned bridge only for non-secret diagnostics: report chunk IDs/lengths/timestamps and SHA-256 of safe candidate reconstructions/subsets; never log payload contents.
4. Accept a reconstruction only if it independently yields exact pinned SHA `f1a702...` and passes the original member/path/type constraints.
5. If no canonical bytes can be recovered after exhausting live repository evidence, escalate the minimal integrity decision rather than changing the pin by guess.

Acceptance condition: exact archive SHA `f1a702...` is reproducibly recovered from authoritative live evidence, with a documented reconstruction/source path.

### CP-2 — Run full 0.5.4 gate and publish product commit/artifact
Status: PENDING.
Depends on CP-1.
Scope: exact-head execution, `npm run audit:ci`, deterministic ZIP SHA, security checks, single product commit, Actions artifact upload.

### CP-3 — Verify final product diff and merge readiness
Status: PENDING.
Depends on CP-2.
Scope: product behavior, manifest/permissions, package/version, tests/docs, artifact evidence, reviews/threads, mergeability and current-base relation.

### CP-4 — Merge canonical PR and verify released `main`
Status: PENDING.
Depends on CP-3.
Execution: deterministic GitHub control with exact expected head; then post-merge default-branch/artifact verification.

## 6. Active Execution Registry

HQ:
- Owner: HQ.
- Scope: payload provenance/integrity recovery.
- Product ref: PR #15 / `feature/stop-phrase-0.5.4` / `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
- Read surfaces: Issue #14/comments, PR #15 commit/history, repository history/branches/workflows.
- Temporary main write surface: bridge workflow retained for diagnostics/retry plus this state file.

Workers: NONE — current task is evidence correlation on a single integrity chain; worker handoff would duplicate context without independent write-safe closure.
Codex: NONE.
Active external execution: NONE; bridge run `33578907906` is terminal failure.

## 7. Safety / Adversarial Controls

- Never replace expected source SHA with live `fe85f7...` without independent provenance proving a deliberate new canonical payload.
- Never extract or execute an archive until its source SHA matches the release pin.
- Do not merge PR #15 while payload/test/artifact gates are incomplete.
- Do not treat the successful trigger bridge as product validation; it only proves GATE-2A.
- Do not install global runner tooling or broaden permissions.
- Do not pull PR #17 into the release unless evidence makes it a real dependency.
- Do not expose giant payload chunks in normal user-visible output.
- Remove temporary bridge after release execution/recovery is terminal.

## 8. Critical Path Audits

Repository Coverage Audit: PASS — candidate, issue payload, all relevant historical release runs, bridge execution, default-branch control state and release surface are covered.
Evidence Audit: PASS — new CP is driven by exact bridge log hashes and exact-head evidence; no payload-completion claim is inferred from chat memory.
Release Alignment Audit: PASS — integrity recovery is mandatory to the existing 0.5.4 contract and does not widen product scope.
Dependency & Ordering Audit: PASS — source integrity must precede extraction/tests/artifact/product commit, which precede final diff/merge/post-merge verification.
Execution & Parallelism Audit: PASS — current evidence-recovery chain is read-heavy and serialized; no independent product write should run in parallel.
Adversarial Audit: PASS — rejected hash-pin relaxation, stale historical workflow reruns, premature extraction, premature merge and unrelated infrastructure scope creep.

## 9. Current Blocker / Unblock Condition

Exact blocker: authoritative live Issue #14 reconstruction currently hashes to `fe85f738...`, not required `f1a702c1...`.
Affected gate: GATE-2B.

Safe alternatives already resolved:
- Runner availability: resolved.
- Exact-head execution route: resolved via one-shot bridge.
- Historical release reruns: rejected as deterministically defective.
- Updating the expected SHA to observed live bytes: rejected as integrity bypass.

Unblock condition: recover/prove a source or reconstruction yielding exact pinned SHA `f1a702...`.

Project state remains EXECUTING, not BLOCKED, because repository provenance search and deterministic diagnostics remain available.
Human action: NOT REQUIRED yet.

## 10. Next Action

Search live GitHub history and inspect Issue #14 chunk metadata/provenance to determine whether the mismatch comes from an edited/extra chunk, reconstruction semantics, or loss of the original pinned payload. Use a diagnostic bridge rerun only if repository reads cannot resolve which chunk set is canonical.

## 11. Last Material Revision

What changed: the one-shot execution bridge successfully crossed runner/checkout/exact-head/Node gates but rejected the live Issue #14 reconstruction at source SHA verification.
Why path changed: trigger/control is no longer the critical problem; payload integrity/provenance is.
Evidence: bridge run `33578907906`, job `100088820763`, expected `f1a702...`, observed `fe85f738...`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: persisted revision 6 after integrating terminal bridge evidence and re-running all six audits.
Active external executions: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: verify PR #15 remains at `2e6d7997...`, state revision 6 and bridge file still exist; then continue Issue #14 metadata/history and hash-provenance search before any new execution.
