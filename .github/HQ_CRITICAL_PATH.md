---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 25
updated_at: 2026-09-05T08:40:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: release/0.7.0-browser-e2e-hardening
basis_sha: 6f8f087bc11460a48da94edeeede62735472bddd
---

# HQ Critical Path

## 1. Current Release Contract

Release target: strengthen the already released ChatPulse 0.7.0 beta with a real Chromium/MV3 browser E2E release gate for the GitHub Actions watchdog, without changing the released extension behavior unless the E2E exposes a product defect.

Release surface: test harness and release workflow only unless a verified defect requires product repair.

Definition of RELEASED: the exact product bits pass existing 5x deterministic audit plus a loaded-extension Chromium E2E that exercises Control Center, per-chat GitHub watcher configuration, real optional host-permission state, public GitHub Actions observation, stale inactivity transition and exactly one same-chat restart dispatch against a deterministic ChatGPT-origin fixture; PR merge-tree and post-merge main evidence must pass.

Mandatory release gates:

- [ ] Existing deterministic audit remains green.
- [ ] Browser loads the unpacked production MV3 extension and service worker.
- [ ] GitHub host permission is absent before opt-in and present for the exercised watcher path.
- [ ] Control Center adds a ChatGPT-origin chat and saves watcher profile through production UI.
- [ ] Public GitHub Actions observation establishes a baseline without credentials.
- [ ] Synthetic elapsed inactivity through persisted runtime state triggers exactly one controlled restart against the production content script.
- [ ] A repeated watchdog check for the same activity marker does not send a second restart.
- [ ] PR merge-tree and post-merge main reproduce the browser E2E plus existing release checks.

Required release evidence: exact SHAs, workflow/job IDs, browser E2E log assertions, unchanged product package hash if no product files change.

Known explicit exclusions: storing ChatGPT or GitHub credentials in CI; automation against an authenticated live ChatGPT account; private GitHub repositories; changing PR #17 runner-policy scope.

## 2. Repository Basis

Default branch: main.
Default branch observed SHA: 6f8f087bc11460a48da94edeeede62735472bddd.
Critical-path basis ref: release/0.7.0-browser-e2e-hardening.
Critical-path basis SHA: 6f8f087bc11460a48da94edeeede62735472bddd.
Canonical integration branch: release/0.7.0-browser-e2e-hardening.
Canonical PR / RC: pending.
Relevant open PRs: #17 draft, explicitly excluded.
Relevant CI / workflows: .github/workflows/extension-ci.yml and docker-runner-policy.yml.
Relevant release/deployment state: 0.7.0 product basis remains 408d95ff256eb70e0442ae36f912d4a528fcbe35 beneath later HQ-only main state.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, ChatGPT content script, pure model helpers, optional Telegram and GitHub clients.
Build / packaging: deterministic Python package script, Node validation.
Tests / validation: Node test suite and static validator; no browser E2E existed before this wave.
CI: 5-cycle audit plus reproducible package on self-hosted fast runner.
Release / deployment: merge + exact CI evidence; no store publication required.
Governance: organizational HQ master 1.2 live-read on this wave; this file is project state.
External release dependencies: public GitHub API and Chromium download for browser E2E only.
Material findings: the existing watchdog tests are strong unit/static checks but do not prove loaded-extension browser integration; native Chrome permission prompt itself is a browser-owned UI boundary and may require a test-safe grant strategy without weakening production permissions.

## 4. Release Gates

### GATE-1 — Existing deterministic release checks
Status: UNSATISFIED
Evidence: pending branch run.
Blocking items: new harness not yet committed.

### GATE-2 — Loaded-extension Chromium watchdog E2E
Status: UNSATISFIED
Evidence: pending.
Blocking items: implement and run browser harness.

### GATE-3 — Canonical PR merge-tree
Status: UNSATISFIED
Evidence: no PR yet.
Blocking items: GATE-1 and GATE-2.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: not merged.
Blocking items: GATE-3.

## 5. Current Critical Path

### CP-1 — Implement Chromium/MV3 browser E2E and wire it into extension-ci
Status: ACTIVE
Release gate: GATE-2
Why critical: closes the browser integration evidence gap identified by owner.
Depends on: released 0.7.0 product.
Blocks: PR validation and release closure.
Execution plane: HQ_DIRECT
Exact scope: tests/browser browser harness plus release workflow wiring; product code untouched unless test proves a defect.
Acceptance condition: branch browser E2E passes and proves one-send idempotency using loaded extension.
Evidence: pending branch workflow.

### CP-2 — Validate canonical PR merge tree
Status: PENDING
Release gate: GATE-3
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Acceptance condition: exact merge-tree passes deterministic audits, browser E2E and dependency policy.

### CP-3 — Merge exact head and validate main
Status: PENDING
Release gate: GATE-4
Depends on: CP-2
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Acceptance condition: exact merged main reproduces gates; package hash remains canonical if product tree unchanged.

## 6. Active Execution Registry

HQ: CP-1 writer/integrator on release/0.7.0-browser-e2e-hardening.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: pending branch workflow.

## 7. Safe Parallel Work

NONE — workflow and browser harness are tightly coupled and should have one canonical writer.

## 8. Current Blockers

NONE. Native optional-permission confirmation is being treated as a browser-owned boundary; the E2E must prove permission state without adding permanent GitHub host permission or credentials.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — gap is explicit and new evidence requirement is concrete.
Release Alignment Audit: PASS — no product feature expansion.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS.
Adversarial Audit: PASS — test must not weaken production permission model, use secrets, or turn API failure into restart.

## 10. Next Action

Exact next action: commit browser E2E harness and release-gate workflow changes, then validate branch.
Executor: HQ_DIRECT.
Expected evidence: branch workflow exact SHA with browser E2E assertions.
Acceptance condition: GATE-1 and GATE-2 satisfied.

## 11. Last Material Revision

What changed: owner promoted browser E2E from recommendation to immediate release-hardening scope.
Why the critical path changed: existing unit/static tests do not prove loaded-extension Chrome integration.
Evidence causing the change: direct owner request plus live inspection of watchdog tests.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: NO.
Last completed atomic action: branch created from main state-only head.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: browser E2E implementation in progress.
Recovery entrypoint: live-read master, this revision and release/0.7.0-browser-e2e-hardening.
Exact next action after recovery: implement CP-1.
Rotation blockers: active release-hardening wave.
