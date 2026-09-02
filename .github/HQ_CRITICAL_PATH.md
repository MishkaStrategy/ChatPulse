---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 5
updated_at: 2026-09-02T01:17:53Z
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
- Artifact SHA-256 must equal `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.

Definition of RELEASED:
- Verified Issue #14 payload applied from its pinned archive.
- Exact candidate validation/package/security gates pass.
- Expected Actions artifact is published.
- Canonical 0.5.4 PR is merge-ready and merged into live `main`.
- Post-merge live `main` and retained artifact satisfy the contract.

Explicit exclusions: PR #17 runner-policy refactor, legacy macOS cleanup, Chrome Web Store, GitHub Release/tag and native/Safari packaging unless separately proven required.

## 2. Repository Basis

Working repository: `MishkaStrategy/ChatPulse`.
Default branch: `main`.
Canonical release branch: `feature/stop-phrase-0.5.4`.
Canonical PR: #15 `Добавить стоп-фразу для остановки отдельного чата`.
Exact release-candidate head before product integration: `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
Issue payload: #14.
Pinned source SHA-256: `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`.

Portable bootstrap commits on PR #15:
- `666138923d5d8925412ad600e541067175ae9e74` — Node.js 22 portable API/base64/SHA bootstrap.
- `2e6d79971ccd58619acac28551ddcf6d457c71a1` — path-filter marker retrigger.

Historical release runs:
- #33 / `29983313396` on hosted Ubuntu: checkout current release branch by name, but deterministic failure because historical workflow uses unsupported `gh api --paginate --slurp --jq` combination.
- #34 / `30871174014` on hosted Ubuntu: same deterministic `gh --slurp --jq` failure.
- #35 / `30871703893`: moved to self-hosted fast; cancelled while queued.
- #36 / `30872589019`, attempt 2, job `100082482958`: self-hosted runner assigned; checkout and Node 22 PASS; deterministic failure `gh: command not found`.

Trigger evidence:
- Connector-created commits and PR close/reopen produced no new `pull_request` Actions run for exact head `2e6d7997…`.
- Available GitHub connector controls can rerun existing jobs but expose no manual workflow-dispatch action.
- Existing `Dependency runner policy` workflow has historical PR #15 run `30872588990`, job `91877450201`, and can be rerun.
- GitHub documentation confirms `workflow_run: types: [completed]` fires when the named upstream workflow completes, including reruns; only the `requested` activity type is omitted on rerun. The listening workflow must exist on the default branch.

## 3. Release Gates

### GATE-1 — Canonical candidate/payload
Status: SATISFIED.
Evidence: PR #15 + Issue #14 + pinned source/artifact hashes.

### GATE-2 — Exact integration, validation and artifact
Status: UNSATISFIED.
Blocking item: execute the pinned candidate through a GitHub Actions route that uses the portable bootstrap and all mandatory gates.

### GATE-3 — Final merge readiness
Status: UNSATISFIED.
Blocks on GATE-2 and final exact-head diff/base reconciliation.

### GATE-4 — Merge/post-merge release verification
Status: UNSATISFIED.
Blocks on GATE-3.

## 4. Current Critical Path

### CP-1 — Execute a pinned one-shot `workflow_run` release bridge
Status: ACTIVE.

Why critical: direct connector mutations do not emit a new PR run, while historical release runs are known-bad. A default-branch `workflow_run` listener can be triggered by a native Actions completion event from a rerun of the existing `Dependency runner policy` run.

Execution plane: HQ_DIRECT creates/removes the temporary bridge; PROJECT_RUNNER executes it.

Exact route:
1. Create temporary `.github/workflows/hq-0.5.4-release-bridge.yml` on `main` listening only for `workflow_run` completion of `Dependency runner policy`.
2. Job-level guard requires upstream run ID `30872588990`, upstream head branch `feature/stop-phrase-0.5.4`, same repository, and current pinned release head `2e6d79971ccd58619acac28551ddcf6d457c71a1` after checkout.
3. The bridge runs on `[self-hosted, fast]`, sets up Node.js 22, retrieves Issue #14 through authenticated REST, validates/decodes the pinned archive, checks 26 regular-file members/roots/paths, extracts, runs `npm run audit:ci`, verifies the pinned beta ZIP SHA, performs the secret/permission checks, preserves the artifact, removes `.release`, creates the single product commit and pushes it to the canonical branch, then uploads the beta artifact.
4. Rerun historical policy job `91877450201` solely to create the native `workflow_run completed` event; its own result is not release evidence.
5. Observe the bridge exact run/steps. After terminal bridge result, remove the temporary bridge from `main` and recalculate.

Acceptance condition: bridge starts from pinned head `2e6d7997…` and either succeeds through product commit/artifact publication or produces a new exact terminal failure.

### CP-2 — Verify final 0.5.4 product diff and release evidence
Status: PENDING.
Depends on CP-1 success.
Scope: final changed files, product behavior, manifest/permissions, package/version, tests, docs, artifact/checksum, reviews/threads, mergeability and current-base relation.

### CP-3 — Merge canonical 0.5.4 PR
Status: PENDING.
Depends on CP-2.
Execution: deterministic GitHub control with exact expected head SHA only.

### CP-4 — Verify released `main` and close state
Status: PENDING.
Depends on CP-3.
Acceptance: live main + artifact satisfy full contract; then project state DONE.

## 5. Active Execution Registry

HQ:
- Owner: HQ.
- Scope: create one-shot bridge, rerun policy job, observe bridge, clean bridge.
- Release ref: `feature/stop-phrase-0.5.4` at `2e6d79971ccd58619acac28551ddcf6d457c71a1` before execution.
- Temporary main write surface: `.github/workflows/hq-0.5.4-release-bridge.yml` plus this state file.

Workers: NONE — the execution route is deterministic control work and product writes must stay serialized.
Codex: NONE.
Active external execution: NONE at checkpoint.

## 6. Safety / Adversarial Controls

- Bridge is one-shot in practice: exact upstream run ID + head branch + repository + exact release-head assertion.
- Upstream policy result is not trusted as release evidence; it is only a native completion-event source.
- Historical release reruns are rejected because their immutable historical definitions are deterministically defective.
- No runner-global installation or mutation is required.
- No checksum/path/member/test/security/artifact gate is removed.
- No unrelated PR #17 work is pulled into the release.
- Temporary bridge must be removed from `main` after its terminal result.
- Premature merge remains prohibited until CP-2.

## 7. Critical Path Audits

Repository Coverage Audit: PASS — current candidate, historical release runs, default-branch workflows, runner behavior and release surface covered.
Evidence Audit: PASS — bridge route is supported by live run history plus current official GitHub event semantics; completion still requires live run evidence.
Release Alignment Audit: PASS — bridge only restores execution of the existing 0.5.4 release gate and does not change the release target/surface.
Dependency & Ordering Audit: PASS — bridge execution precedes final diff approval, merge and post-merge verification.
Execution & Parallelism Audit: PASS — no parallel product writes; only deterministic trigger and runner execution.
Adversarial Audit: PASS — exact run/head/repository pins prevent a generic privileged `workflow_run` path; stale historical release definitions and weakened bypasses rejected.

## 8. Current Blocker / Unblock Condition

Current blocker: GATE-2 lacks an executable exact-head run because connector PR mutations do not emit the required PR event.

Unblock route: one-shot default-branch `workflow_run` bridge triggered by rerun completion of policy run `30872588990`.

Human action: NOT REQUIRED at this stage; an automated repository-native route exists.

## 9. Next Action

Create the exact-pinned one-shot bridge on `main`, rerun policy job `91877450201`, and capture the resulting bridge run/job identity and step-level evidence.

## 10. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last atomic action: persisted revision 5 selecting the audited `workflow_run` bridge route.
Active external executions: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: verify PR #15 remains at `2e6d7997…`; verify this state revision; create bridge if absent, otherwise inspect it before rerunning policy job.
