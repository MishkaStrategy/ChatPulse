---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 32
updated_at: 2026-09-05T11:47:30Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 800f6e9ead0fa119ed7cd7a82957ac058d4f2d97
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.3 beta — replace a genuinely hung background ChatGPT tab with a new tab for the same conversation instead of reloading the broken tab.

Release surface: tab-recovery policy/module, MV3 service-worker recovery wiring, deterministic recovery tests, loaded-Chromium regression gate, version/package/workflow metadata and reproducible packaging.

Definition of RELEASED: for managed background chats, hard recovery reasons (`discarded-tab`, `frozen-tab`, `content-unreachable`, `page-error`, `stuck-generation`) create a fresh inactive tab for the same canonical chat URL and remove the failed tab; ordinary periodic freshness remains a soft reload; active tabs and tabs with user drafts keep the existing non-destructive protection; continuation/watchdog/token safety semantics remain unchanged; frozen branch, canonical PR merge-tree and post-merge main evidence all pass.

Mandatory release gates:

- [x] Hard-hang recovery is explicitly classified separately from periodic freshness.
- [x] Hard-hang recovery creates a new inactive tab for the exact same ChatGPT conversation URL, then removes the failed tab, protects the replacement from auto-discard, waits for hydration and continues inspection on the replacement tab ID.
- [x] Active tabs are never auto-closed or auto-reloaded by the hard-recovery path.
- [x] A user draft still blocks destructive recovery.
- [x] Normal ongoing generation remains untouched until the existing 20-minute stuck-generation threshold is reached.
- [x] Periodic freshness remains a reload, not tab replacement.
- [x] Tests prove replacement-tab behavior and no regression in recovery counters, continuation at-most-once, GitHub watchdog, private-token isolation and UI behavior.
- [x] Five deterministic audit cycles, Chromium E2E and reproducible package/provenance pass on frozen branch, PR merge-tree and main; dependency policy passes on applicable PR/main triggers.

Required release evidence: satisfied below with exact branch/PR/main SHAs, workflow IDs, test counts, replacement assertions, browser E2E results, dependency-policy results and reproducible hashes.

Known explicit exclusions: changing the 20-minute stuck-generation threshold; closing an active tab; discarding user drafts; changing GitHub watchdog semantics; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Default branch validated product SHA: `800f6e9ead0fa119ed7cd7a82957ac058d4f2d97`.
Critical-path basis ref: main.
Critical-path basis SHA: `800f6e9ead0fa119ed7cd7a82957ac058d4f2d97`.
Canonical integration branch: `release/0.7.3-replace-stuck-tab`.
Frozen branch SHA: `62f1121c90813e88a4a3b43b359e01afef3d121f`.
Canonical PR / RC: #26.
Validated PR merge-tree SHA: `0720bc123bd249562217f4f899ad2682aab03a11`.
Validated main product SHA: `800f6e9ead0fa119ed7cd7a82957ac058d4f2d97`.
Relevant open PRs: #17 draft remains separate/excluded.
Relevant Issues: none required for this owner-direct patch.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.3 beta released to validated main; no Chrome Web Store publication required by current project policy.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, pure state/model helpers, ChatGPT content script, optional Telegram and GitHub Actions integrations.
Build / packaging: deterministic Python ZIP/source-manifest packaging plus Node validation.
Tests / validation: 102 deterministic extension tests plus loaded-Chromium E2E after this patch.
CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance and dependency runner policy.
Release / deployment: validated merge to main; CI artifact is the installable beta package.
Governance: organizational HQ master 1.2 live-read for this wave.
External release dependencies: Chromium download for E2E.
Material findings: hard recovery is isolated in `background/tab-recovery.js`; the replacement is created before old-tab removal so a failed create cannot lose the managed chat. If old-tab removal fails after creation, the replacement is removed as rollback. `periodic-freshness` retains the existing reload path.

## 4. Release Gates

### GATE-1 — Safe replacement-tab recovery
Status: SATISFIED
Evidence: `tabRecoveryMode` maps all five hard failure reasons to replacement; deterministic tests prove exact same-chat inactive creation, active-tab protection and rollback. Frozen, PR and main audits are green.
Blocking items: NONE.

### GATE-2 — Regression coverage
Status: SATISFIED
Evidence: deterministic suite increased from 92 to 102 tests. All five cycles passed on frozen branch, PR merge-tree and main; Chromium MV3 regression E2E passed on all three layers.
Blocking items: NONE.

### GATE-3 — Frozen branch validation
Status: SATISFIED
Evidence: exact SHA `62f1121c90813e88a4a3b43b359e01afef3d121f`; run `33963980756` SUCCESS; 5/5 x 102/102; Chromium E2E PASS; package/provenance PASS; artifact `9968836935`.
Blocking items: NONE.

### GATE-4 — Canonical PR merge-tree
Status: SATISFIED
Evidence: PR #26 head `62f1121c90813e88a4a3b43b359e01afef3d121f`; merge-tree `0720bc123bd249562217f4f899ad2682aab03a11`; release run `33964090373` SUCCESS; 5/5 x 102/102; Chromium E2E PASS; package/provenance PASS; artifact `9968871029`; dependency-policy run `33964090389` PASS; no reviews/comments/unresolved threads; mergeable true before merge.
Blocking items: NONE.

### GATE-5 — Post-merge main
Status: SATISFIED
Evidence: product merge commit `800f6e9ead0fa119ed7cd7a82957ac058d4f2d97`; release run `33964180630` SUCCESS; 5/5 x 102/102; Chromium E2E PASS; package/provenance PASS; artifact `9968898611`; dependency-policy run `33964180632` PASS.
Blocking items: NONE.

## 5. Current Critical Path

### CP-1 — Implement hard-hang close-and-reopen recovery
Status: DONE
Release gate: GATE-1, GATE-2
Why critical: implements the owner decision while preserving active-tab/draft safety.
Depends on: released 0.7.2 recovery behavior.
Blocks: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER mechanical patch application.
Exact scope: recovery classification/module, service-worker replacement wiring, deterministic tests, version/release metadata.
Acceptance condition: satisfied.
Evidence: 102-test suite and exact branch validation above.

### CP-2 — Validate frozen 0.7.3 branch
Status: DONE
Release gate: GATE-3
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Exact scope: five deterministic audits, Chromium E2E, reproducible package/provenance.
Acceptance condition: satisfied.
Evidence: run `33963980756`.

### CP-3 — Validate canonical PR merge-tree
Status: DONE
Release gate: GATE-4
Depends on: CP-2
Blocks: CP-4
Execution plane: PROJECT_RUNNER
Exact scope: exact PR merge ref plus dependency policy/review/thread/mergeability checks.
Acceptance condition: satisfied.
Evidence: release run `33964090373`, dependency-policy run `33964090389`, merge-tree `0720bc123bd249562217f4f899ad2682aab03a11`.

### CP-4 — Merge exact head and validate main
Status: DONE
Release gate: GATE-5
Depends on: CP-3
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Exact scope: merge only validated head, validate exact main product commit, persist final state.
Acceptance condition: satisfied.
Evidence: main product SHA `800f6e9ead0fa119ed7cd7a82957ac058d4f2d97`, release run `33964180630`, dependency-policy run `33964180632`.

## 6. Active Execution Registry

HQ: NONE — release closed.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE required for release closure.

## 7. Safe Parallel Work

NONE — no active critical-path work remains.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — recovery module/service worker/tests/release metadata/workflow/package surfaces validated.
Evidence Audit: PASS — exact frozen branch, PR merge-tree and main evidence recorded with run IDs and hashes.
Release Alignment Audit: PASS — scope remained limited to owner-requested hung-tab replacement plus necessary tests/version/release metadata.
Dependency & Ordering Audit: PASS — implementation -> frozen branch -> PR merge-tree -> exact merge -> main validation completed in order.
Execution & Parallelism Audit: PASS — one canonical product writer avoided conflicting tab-lifecycle changes; project runners used only for mechanical validation/application.
Adversarial Audit: PASS — active tabs and drafts remain protected; normal generation is not interrupted before 20 minutes; periodic freshness remains reload; replacement is create-first and rollback-protected; no new permissions/secrets/network surface introduced.

Material findings and resolutions: replacement close/open behavior is deterministically tested at the tab-API boundary and service-worker wiring is statically asserted; loaded Chromium E2E remains the established whole-extension regression gate and passed at branch/PR/main. No claim is made that that existing Chromium scenario itself induces an actual hung tab.

## 10. Next Action

Exact next action: await a new owner scope or evidence-backed regression.
Executor: HQ.
Expected evidence: owner decision or live regression evidence.
Acceptance condition: new scope is explicitly established before product mutation.

## 11. Last Material Revision

What changed: ChatPulse 0.7.3 beta was implemented, validated across all three release layers and merged to main.
Why the critical path changed: all release gates are satisfied; no active release work remains.
Evidence causing the change: frozen run `33963980756`, PR #26 merge-tree run `33964090373`, PR dependency policy `33964090389`, main release run `33964180630`, main dependency policy `33964180632`, and identical reproducible hashes across layers.

Canonical 0.7.3 package hashes:
- ZIP SHA-256: `9d37f74795c19014a631e25e821a6d535e4eec88b55d64bd96df72a36f3eb876`
- source manifest SHA-256: `1915b14e00be4d3289d704ff53d702fa609bc736f022e96d4389016b0ac35a63`
- packaged file count: 17
- reproducible timestamp: `2020-01-01T00:00:00`

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: post-merge main and dependency policy validated; 0.7.3 release state persisted.
Active external executions and exact refs: NONE required for release closure.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read organizational master, this revision and current main.
Exact next action after recovery: await owner scope or evidence-backed regression.
Rotation blockers: NONE.
