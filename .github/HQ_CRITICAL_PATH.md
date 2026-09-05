---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 26
updated_at: 2026-09-05T09:05:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 7e2e73483eac7c5452ff35a8bff3c2ef2e0410b8
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.0 beta browser-E2E hardening for the GitHub Actions inactivity watchdog.

Release surface: release workflow plus loaded Chromium/MV3 E2E harness. Extension/product source did not change.

Definition of RELEASED: the existing 0.7.0 product bits pass the prior deterministic safety suite plus a loaded-extension Chromium E2E covering Control Center configuration, optional GitHub permission state, real public GitHub Actions observation, stale inactivity transition, one same-chat restart dispatch and no duplicate restart for the same activity marker; exact branch, PR merge-tree and post-merge main evidence all pass.

Mandatory release gates:

- [x] Existing deterministic audit remains green.
- [x] Browser loads the unpacked production MV3 extension and service worker.
- [x] GitHub host permission is absent at install time and active for the accepted optional-permission profile.
- [x] Control Center adds a ChatGPT-origin chat and saves watcher profile through production UI.
- [x] Production service worker establishes a real public GitHub Actions baseline.
- [x] Synthetic elapsed inactivity triggers exactly one controlled restart through the production content script.
- [x] A repeated watchdog check for the same activity marker does not send a second restart.
- [x] PR merge-tree and post-merge main reproduce the browser E2E and existing release checks.

Required release evidence: exact SHAs, workflow/job IDs, browser E2E assertions and unchanged product package hashes.

Known explicit exclusions: authenticated live ChatGPT account automation; native Chrome permission confirmation-bubble click automation; private GitHub repositories/tokens; product UI redesign; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Validated product/test-hardening main commit: `7e2e73483eac7c5452ff35a8bff3c2ef2e0410b8`.
Canonical hardening branch: `release/0.7.0-browser-e2e-hardening`.
Frozen branch head: `271531133543a171a4576375124ad4c8dafb5cbb`.
Canonical PR: #23.
PR merge-tree SHA: `5327eaf54e9dd62e9799a9358fcc4a5ffc15397b`.
Relevant open PRs after release: #17 draft remains separate/excluded.
Relevant CI: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Original 0.7.0 product source basis remains `408d95ff256eb70e0442ae36f912d4a528fcbe35`; this wave changed no extension/product file.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture: popup/options UI, MV3 service worker, ChatGPT content script, pure model helpers, optional Telegram and public GitHub clients.
Build / packaging: deterministic Python package script plus Node validation.
Tests / validation: 80-test deterministic extension suite plus new Playwright loaded-Chromium E2E.
CI: five independent deterministic audit cycles, browser E2E, reproducible package/provenance and dependency runner policy.
Release / deployment: validated merge to main; no Chrome Web Store publication required by this release contract.
Governance: organizational HQ master 1.2 live-read for this wave; this file records the verified final state.
External release dependencies: public GitHub API and Chromium download for E2E only.
Material finding resolved: previous watchdog coverage was strong unit/static evidence but not loaded-browser integration evidence. The new gate closes that gap without changing product permissions or product code.

## 4. Release Gates

### GATE-1 — Existing deterministic release checks
Status: SATISFIED
Evidence: branch run `33956655114`, PR run `33956770498`, main run `33956878784`; five audit cycles green at every stage, 80/80 tests per inspected cycle, static validator PASS.
Blocking items: NONE.

### GATE-2 — Loaded-extension Chromium watchdog E2E
Status: SATISFIED
Evidence: browser E2E PASS on branch, PR merge tree and main. Main job `101281689140` ran at exact SHA `7e2e73483eac7c5452ff35a8bff3c2ef2e0410b8`, observed live GitHub workflow run `33956878787` created `2026-09-05T09:02:10Z`, used restart key `run:33956878787`, and completed `browser_e2e_result=PASS`. Temporary Playwright 1.62.1 harness audit found 0 vulnerabilities.
Blocking items: NONE.

### GATE-3 — Canonical PR merge tree
Status: SATISFIED
Evidence: PR #23 merge tree `5327eaf54e9dd62e9799a9358fcc4a5ffc15397b`; release run `33956770498` completed SUCCESS with exact merge-ref checkout, 5/5 deterministic audit, browser E2E PASS and reproducible package equality. Dependency runner policy `33956769811` PASS. Reviews: none. Review threads: none. PR mergeable before merge.
Blocking items: NONE.

### GATE-4 — Post-merge main
Status: SATISFIED
Evidence: merge commit `7e2e73483eac7c5452ff35a8bff3c2ef2e0410b8`; release run `33956878784` completed SUCCESS; dependency policy run `33956878787` SUCCESS; five audit cycles SUCCESS; browser E2E SUCCESS; package/provenance job `101281843172` SUCCESS.
Blocking items: NONE.

## 5. Current Critical Path

CP-1 — implement Chromium/MV3 browser E2E and workflow gate: DONE.
CP-2 — validate canonical PR #23 merge tree: DONE.
CP-3 — merge exact head and validate main: DONE.
CP-4 — persist verified browser-E2E hardening release state: DONE by this state-only revision.

## 6. Active Execution Registry

HQ: DONE for browser-E2E hardening wave.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: no active release-critical execution.

## 7. Safe Parallel Work

NONE — release-hardening wave is complete.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — only HQ state, release workflow and browser E2E harness changed; no extension/product source changed.
Evidence Audit: PASS — independent exact branch, PR merge-tree and post-merge main evidence exists, including loaded-browser runtime proof.
Release Alignment Audit: PASS — closes the requested testing gap without feature or UI scope expansion.
Dependency & Ordering Audit: PASS — branch E2E → PR merge-tree → exact merge → post-merge main → persistence.
Execution & Parallelism Audit: PASS — one canonical writer; deterministic CI used for exact-ref verification.
Adversarial Audit: PASS — production manifest still does not grant GitHub at install time; no GitHub/ChatGPT credentials are stored in CI; native permission acceptance is represented only inside a disposable Chromium profile; production Control Center/service worker/content script/live GitHub path is exercised; one-send idempotency is proven in browser; protocol-level GET/credentials-omit/no-Authorization and fail-closed API behavior remain covered by deterministic tests.

## 10. Release Evidence Summary

Frozen branch head: `271531133543a171a4576375124ad4c8dafb5cbb`.
Branch release run: `33956655114` — SUCCESS; 5/5 × 80/80; browser E2E PASS; package/provenance PASS; artifact ID `9966599448`.

PR #23 merge-tree SHA: `5327eaf54e9dd62e9799a9358fcc4a5ffc15397b`.
PR release run: `33956770498` — SUCCESS; exact merge-ref; 5/5 × 80/80; browser E2E PASS; package/provenance PASS; artifact ID `9966628907`.
PR dependency policy: `33956769811` — PASS.

Post-merge main commit: `7e2e73483eac7c5452ff35a8bff3c2ef2e0410b8`.
Main release run: `33956878784` — SUCCESS; exact main SHA; 5/5 deterministic cycles; inspected cycle 80/80 PASS; browser E2E PASS; package/provenance PASS.
Main dependency policy: `33956878787` — PASS.
Main artifact ID: `9966664068`.

Canonical product ZIP SHA-256 remains unchanged:
`46b66e8dd951fd40625134f54661ed18fed180796ebd2e0c7d5b5b6c35f89f3d`

Canonical source-manifest SHA-256 remains unchanged:
`32d6e9f1d1a2267e400fe2e0c55d245c2e624ec30753eb4f2cc6ebc2583f34bc`

Packaged extension file count remains 15; reproducible timestamp remains `2020-01-01T00:00:00`.

## 11. Browser E2E Boundary

The E2E does not click Chrome's native optional-permission confirmation bubble because that browser-owned UI is outside Playwright page automation. Instead, the disposable CI Chromium profile is seeded to the exact accepted host-permission state after separately proving the permission is absent on initial extension install. The test then runs the production Control Center save path, production `chrome.permissions.request()` state, production service worker, production content script, real public GitHub Actions observation, inactivity restart and duplicate-send protection.

No production permission was widened to make the test pass.

## 12. Next Action

Exact next action: await next owner scope or evidence-backed regression.
Executor: NONE until new scope.
Expected evidence: N/A.
Acceptance condition: N/A.

## 13. Last Material Revision

What changed: browser E2E became a permanent release gate and passed at branch, PR merge-tree and post-merge main.
Why the critical path changed: owner requested immediate closure of the real-browser validation gap.
Evidence causing closure: runs `33956655114`, `33956770498`, `33956878784`, dependency-policy runs, exact SHAs and unchanged reproducible product hashes.

## 14. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: post-merge main `7e2e73483eac7c5452ff35a8bff3c2ef2e0410b8` passed browser E2E, 5/5 deterministic audit, dependency policy and reproducible package/provenance equality.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read organizational master prompt, this revision and current main; treat `7e2e7348...` as the validated browser-E2E hardening merge beneath this later HQ-only state commit.
Exact next action after recovery: await owner scope or evidence-backed regression.
Rotation blockers: NONE.
