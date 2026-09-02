---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 3
updated_at: 2026-09-02T01:10:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: INFERRED
handoff_status: READY
basis_ref: feature/stop-phrase-0.5.4
basis_sha: 8228662758041478aaf17b4e490a4007dabb4f85
---

# HQ Critical Path

## 1. Current Release Contract

Release target:

ChatPulse 0.5.4 beta: add a per-chat stop phrase that stops monitoring only for the matching chat while preserving the existing Chrome MV3 safety boundaries.

Release surface:

- Chrome Manifest V3 product source integrated into `main`.
- GitHub Actions beta artifact `ChatPulse-Chrome-v0.5.4-beta.zip`.
- Expected artifact SHA-256: `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.

Definition of RELEASED:

The verified 0.5.4 payload from Issue #14 has been applied to PR #15, exact-head validation and packaging have succeeded, the expected beta ZIP artifact has been published, PR #15 has been merged into the live default branch, and post-merge live inspection confirms the 0.5.4 product state on `main`.

Mandatory release gates:

- [x] Canonical 0.5.4 candidate and payload source are live and unambiguous.
- [ ] Exact-head integration, validation, packaging and artifact publication succeed for PR #15.
- [ ] Final product diff is reviewed against current `main` and remains inside product/security/release scope.
- [ ] PR #15 is merged and post-merge `main` confirms the released 0.5.4 state.

Required release evidence:

- PR #15 current head and final product commit SHA.
- Successful exact-head integration workflow with completed validation steps.
- GitHub Actions artifact `ChatPulse-Chrome-v0.5.4-beta` and expected ZIP checksum.
- Final PR diff/changed-files, mergeability, reviews/threads and CI state.
- PR #15 merged state and merge SHA.
- Post-merge live `main` manifest/version and relevant release files.

Known explicit exclusions:

- PR #17 runner-selector policy refactor is not part of the 0.5.4 release unless proven required to unblock PR #15.
- Legacy macOS cleanup is not part of this release.
- Chrome Web Store publication, GitHub Release/tag creation, Safari packaging and native macOS packaging are not release surfaces for this local unpacked Chrome extension.

## 2. Repository Basis

Default branch:

`main`

Default branch observed SHA:

`9f39c6a7a41fdb15f4103d7ae9f260177c78cd08` before this state-only revision.

Critical-path basis ref:

`feature/stop-phrase-0.5.4`

Critical-path basis SHA:

`8228662758041478aaf17b4e490a4007dabb4f85`

Canonical integration branch, if any:

`feature/stop-phrase-0.5.4`

Canonical PR / RC, if any:

PR #15 — `Добавить стоп-фразу для остановки отдельного чата`.

Relevant open PRs:

- #15 — canonical 0.5.4 release candidate; open and non-draft. GitHub currently reports `mergeable: false`; this must be re-evaluated after product integration and current-base reconciliation.
- #17 — draft repository-wide runner-selector policy; non-critical unless proven prerequisite.

Relevant Issues:

- #14 — `Temporary verified payload for ChatPulse 0.5.4`; source payload consumed by the release workflow.

Relevant CI / workflows:

- `.github/workflows/extension-ci.yml` on PR #15 is the canonical 0.5.4 integration/validation/artifact workflow.
- Run `30872589019`, attempt 2, job `100082482958` completed `failure` on 2026-09-02.
- Runner assignment succeeded: `mac-MacBook-Pro-MishkaStrategy-04`; checkout and Node.js 22 setup succeeded.
- Failure occurred at step `Восстановление проверенного локального пакета` before payload reconstruction because `gh` is not installed: `gh: command not found`, exit code 127.

Relevant release/deployment state:

- No GitHub Releases are currently published.
- Project distribution is an unpacked local Chrome extension and GitHub Actions beta ZIP.
- No production deployment surface is required for this release.

## 3. Repository Scan Summary

Project purpose:

Local dependency-free Google Chrome Manifest V3 extension that safely continues selected ChatGPT conversations using the already authenticated Chrome profile.

Architecture / major components:

- MV3 manifest and permissions in `chrome-extension/manifest.json`.
- Background service worker scheduling/recovery in `chrome-extension/background/`.
- ChatGPT DOM interaction in `chrome-extension/content/`.
- Decision/state model in `chrome-extension/lib/`.
- Popup/options UI in `chrome-extension/popup/` and `chrome-extension/options/`.
- Local-only storage; no backend or telemetry.

Build / packaging:

Node.js >=20 for validation. The release workflow reconstructs the pinned Issue #14 payload, runs its `npm run audit:ci`, verifies the deterministic 0.5.4 ZIP checksum and uploads the artifact.

Tests / validation:

Main contains model, service-worker and stale-tab Node suites plus static/Manifest validation. The 0.5.4 contract additionally requires prepared unit, service-worker, DOM, UI, Manifest and packaging gates on exact head.

CI:

GitHub Actions on exact self-hosted selectors. The previously uncertain `[self-hosted, fast]` runner is now proven available. Current blocker is workflow portability, not runner availability or a product-test failure.

Release / deployment:

Artifact-based beta distribution. Historical merged 0.5.2 used GitHub Actions ZIP packaging. No current GitHub Release or production deployment is required.

Governance:

- Live organizational contract: `MishkaStrategy/.github/HQ_MASTER_PROMPT.md` v1.1 RELEASE.
- `CONTRIBUTING.md` requires local audit before PR and preserves minimal extension permissions.
- `SECURITY.md` fixes the boundary: no backend/telemetry and no broad/sensitive Chrome permissions.
- `main` is not branch-protected and no required status checks were observed.

External release dependencies:

A self-hosted runner matching `[self-hosted, fast]`; this dependency is currently available.

Material findings:

- `main` is still product version 0.5.2.
- PR #15 has not yet applied the product payload; its product integration did not begin because bootstrap failed at missing `gh`.
- The workflow also contains Linux-oriented CLI assumptions (`base64 --decode`, `sha256sum`, `python`) that should be removed or replaced in the same bounded portability fix to avoid serial failures on the actual macOS runner.
- Node.js 22 is successfully provisioned before the failing step and is therefore the most reliable portable runtime for GitHub API retrieval and checksum logic.
- PR #17 remains out of current release scope.

## 4. Release Gates

### GATE-1 — Canonical 0.5.4 candidate and payload source

Status: SATISFIED

Evidence:

PR #15 is live on `feature/stop-phrase-0.5.4` at `8228662758041478aaf17b4e490a4007dabb4f85`. Issue #14 is the payload source. The workflow pins payload SHA-256 `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5` and target artifact SHA-256 `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.

Blocking items:

None.

### GATE-2 — Exact-head integration, tests and beta artifact

Status: UNSATISFIED

Evidence:

Run `30872589019`, attempt 2, job `100082482958` received a matching runner and reached the bootstrap step, then failed with `gh: command not found` before payload reconstruction. Downstream validation, checksum, commit and artifact steps were skipped.

Blocking items:

Portable bootstrap workflow code is required on PR #15 before rerun. This is a bounded release-infrastructure defect, not a human or runner blocker.

### GATE-3 — Final merge-readiness

Status: UNSATISFIED

Evidence:

The final 0.5.4 product commit does not yet exist. GitHub currently reports PR #15 `mergeable: false`; final cause/reconciliation is downstream of successful product integration and must be checked on the new exact head.

Blocking items:

GATE-2.

### GATE-4 — Merge and post-merge release verification

Status: UNSATISFIED

Evidence:

PR #15 is not merged; live product state on `main` remains 0.5.2.

Blocking items:

GATE-3.

## 5. Current Critical Path

### CP-1 — Make the PR #15 release bootstrap portable and rerun exact-head integration

Status: ACTIVE

Release gate:

GATE-2.

Why critical:

The canonical integration cannot reconstruct or validate the verified 0.5.4 payload until the workflow stops depending on tools absent from the actual self-hosted macOS runner. Node.js 22 is already guaranteed by the preceding successful setup step and provides a portable bounded route.

Depends on:

GATE-1.

Blocks:

CP-2, CP-3 and CP-4.

Execution plane: HQ_DIRECT for exact workflow patch, then PROJECT_RUNNER for validation/integration.

Exact scope:

Patch only `.github/workflows/extension-ci.yml` on `feature/stop-phrase-0.5.4` to retrieve Issue #14 body/comments through authenticated GitHub REST using Node.js 22, decode and SHA-256 verify the pinned payload without `gh`, `base64 --decode`, `sha256sum` or `python`, validate archive paths/types before extraction, and verify the beta ZIP SHA-256 using Node.js. Preserve runner selector, source/artifact SHA pins, allowed roots, member count, validation, secret checks, single product commit and artifact publication. Touch only the existing `.release/apply-0.5.4` marker as necessary to trigger the path-filtered workflow. Then live-verify the resulting run on the new exact PR head.

Acceptance condition:

A new exact-head integration run starts on PR #15 and either succeeds through payload reconstruction, `npm run audit:ci`, checksum/security gates, product commit and artifact upload, or yields a new exact terminal failure that materially narrows CP-1.

Evidence:

Attempt 2 job `100082482958`: runner/checkout/Node setup PASS; bootstrap FAIL solely at `gh: command not found`; downstream steps skipped.

### CP-2 — Verify the integrated 0.5.4 product diff and release evidence

Status: PENDING

Release gate:

GATE-3.

Why critical:

The final product code cannot be approved for merge until the workflow-created commit exists and its exact diff, tests, permissions, packaging and artifact checksum are live-verified against current `main`.

Depends on:

CP-1 successful integration.

Blocks:

CP-3.

Execution plane: HQ_DIRECT

Exact scope:

Fetch the new PR #15 head; inspect changed files/diff and relevant manifest/package/README/changelog/test surfaces; verify workflow steps, artifact identity/checksum evidence, reviews/threads, mergeability and current base relationship; reject unrelated or security-boundary changes.

Acceptance condition:

All mandatory 0.5.4 release evidence is present, no unresolved release blocker remains, and PR #15 is merge-ready on its exact live head.

Evidence:

Pending CP-1.

### CP-3 — Merge PR #15 into `main`

Status: PENDING

Release gate:

GATE-4.

Why critical:

The release contract requires the verified 0.5.4 product state on the canonical default branch.

Depends on:

CP-2.

Blocks:

CP-4.

Execution plane: HQ_DIRECT or deterministic GitHub control only.

Exact scope:

Live-recheck exact PR #15 head/base/draft/mergeability/checks/reviews/threads and merge with exact expected head SHA through GitHub control. Never route merge through Codex.

Acceptance condition:

GitHub reports PR #15 merged and exposes the merge SHA.

Evidence:

Pending CP-2.

### CP-4 — Verify released 0.5.4 state and close release control state

Status: PENDING

Release gate:

GATE-4.

Why critical:

Merge alone is not release proof; default branch and artifact evidence must match the release contract.

Depends on:

CP-3.

Blocks:

Project DONE.

Execution plane: HQ_DIRECT

Exact scope:

Fetch live `main`, verify version/relevant product files and merge ancestry, confirm 0.5.4 artifact evidence remains available, ensure no unresolved critical execution remains, then update this file to `DONE` iff all gates are satisfied.

Acceptance condition:

Live evidence satisfies the complete release contract.

Evidence:

Pending CP-3.

## 6. Active Execution Registry

HQ:

- Owner: HQ.
- Scope: portable release-bootstrap patch on PR #15, then live validation/integration control.
- Ref: PR #15 / `feature/stop-phrase-0.5.4` at `8228662758041478aaf17b4e490a4007dabb4f85` before the patch.
- Write surface: `.github/workflows/extension-ci.yml` and, only if required to trigger the path-filtered workflow, `.release/apply-0.5.4`; `.github/HQ_CRITICAL_PATH.md` on `main` for HQ state.
- Expected evidence: new PR head, triggered workflow run, step-level result.

Workers:

NONE.

Codex:

NONE.

Zero-model control:

NONE active.

CI/runtime:

- Run `30872589019`, attempt 2, job `100082482958` — terminal `failure`.
- Actual runner: `mac-MacBook-Pro-MishkaStrategy-04`.
- Failure: bootstrap step, `gh: command not found`, exit 127.
- No active external write remains from that run.

## 7. Safe Parallel Work

Independent slices:

NONE — the shortest release path is a two-file maximum bounded bootstrap repair followed immediately by the canonical runner. Parallel product work would overlap the release branch or become stale when the payload integration commit is produced.

## 8. Current Blockers

Release blocker:

- Exact blocker: PR #15 bootstrap workflow depends on unavailable `gh` CLI and contains additional Linux-oriented CLI assumptions on the actual macOS runner.
- Affected release gate: GATE-2.
- Evidence: job `100082482958` terminal failure at `gh api`, exit 127; checkout and Node.js 22 succeeded.
- Attempted safe alternatives: runner availability was tested successfully; rerunning unchanged workflow would deterministically repeat the same defect. Node.js 22 is already installed by the workflow and can replace the missing/OS-specific tooling without weakening pinned hash/path checks.
- Unblock condition: portable workflow patch lands on the same PR branch and a new exact-head integration run reaches the release gates.

Project state remains `EXECUTING`, not `BLOCKED`, because HQ_DIRECT can repair the critical defect now.

## 9. Critical Path Audits

Repository Coverage Audit: PASS

Evidence Audit: PASS

Release Alignment Audit: PASS

Dependency & Ordering Audit: PASS

Execution & Parallelism Audit: PASS

Adversarial Audit: PASS

Material findings and resolutions:

- Runner-unavailability hypothesis is rejected by actual runner assignment and successful checkout/Node setup.
- Product-failure hypothesis is rejected: no product validation step ran; failure is bootstrap-only.
- Re-running unchanged workflow is rejected as non-progress because `gh` absence is deterministic.
- Installing `gh` on the runner is rejected as a longer and less reproducible prerequisite than removing the unnecessary dependency from the bounded workflow.
- Fixing only the first `gh` line is rejected because the same workflow also uses Linux-specific `base64 --decode`, `sha256sum` and `python`; a single bounded Node-based portability repair reduces serial failure risk without widening release scope.
- PR #17 remains unrelated to the bootstrap defect and stays excluded.
- Premature merge remains prevented by CP-2 exact-head product/security/artifact review.

## 10. Next Action

Exact next action:

Patch `.github/workflows/extension-ci.yml` on PR #15 head to use Node.js 22 for authenticated Issue #14 retrieval, base64 decoding and SHA-256 checks while preserving archive-safety validation, then touch the existing release marker only if necessary to trigger the path-filtered workflow and live-verify the new run.

Executor:

HQ_DIRECT, then PROJECT_RUNNER.

Expected evidence:

New exact PR head SHA, workflow run/job identity, and step-level execution beyond the previous bootstrap failure.

Acceptance condition:

CP-1 reaches the new-run acceptance condition and the path is recalculated from exact live evidence.

## 11. Last Material Revision

What changed:

Attempt 2 obtained a self-hosted runner and failed at bootstrap because `gh` is absent. Runner waiting is no longer the critical issue; workflow portability is.

Why the critical path changed:

The terminal run materially resolved the previous uncertainty and exposed a deterministic, directly repairable release-infrastructure defect.

Evidence causing the change:

Run `30872589019`, attempt 2, job `100082482958`: runner assigned; checkout PASS; Node.js 22 PASS; payload restore FAIL at `gh: command not found`; downstream steps skipped.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES

Last completed atomic action:

Integrated the terminal attempt-2 evidence, re-audited the affected path, and persisted revision 3 before modifying the release branch.

Active external executions and exact refs:

NONE active at checkpoint. PR #15 head remains `8228662758041478aaf17b4e490a4007dabb4f85` before the planned workflow patch.

Unpersisted material reasoning: NONE

Recovery entrypoint:

Live-fetch PR #15 head and `.github/workflows/extension-ci.yml`. If head is still `8228662758041478aaf17b4e490a4007dabb4f85`, apply the bounded portable-bootstrap patch. If it has moved, inspect the intervening diff before writing.

Exact next action after recovery:

Apply the portable workflow patch, trigger the path-filtered integration workflow on the resulting exact head, and integrate the new run result.

Rotation blockers, if any:

NONE.
