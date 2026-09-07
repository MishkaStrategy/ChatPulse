---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 45
updated_at: 2026-09-07T07:15:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 03ed036ef58437f8474eaaf9e1e0aa761b469605
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.6 beta — add one optional shared GitHub PAT that can be configured once and used by GitHub Actions watchdog across all chats.

Release surface: protected GitHub credential storage/resolution, Control Center token UI, focused credential/security/UI tests, 0.7.6 beta metadata, repository-native release CI and reproducible package.

Definition of RELEASED: the user can save one shared GitHub PAT once in Control Center. For every GitHub Actions watchdog request, an existing repository-specific token remains the highest-priority override; otherwise the shared PAT is used; if neither exists, current unauthenticated public-repository behavior remains unchanged. The shared PAT is stored only in trusted extension-local credential storage, is never returned to UI/state as plaintext, never enters `chatpulseState`, portable export, content script, logs or runtime messages, and is sent only as Bearer auth to the existing read-only `api.github.com/repos/<owner>/<repo>/actions/runs` GET endpoint. The user can remove the shared PAT and can test it against an explicit `owner/repo` without exposing its value.

Mandatory release gates:
- [ ] shared PAT storage + repository-specific override + fallback resolution implemented with v1 credential-store compatibility;
- [ ] Control Center can save/test/remove shared PAT and clearly shows shared-vs-repository token precedence;
- [ ] credential/privacy/read-only invariants covered by focused tests and static validation;
- [ ] 0.7.6 beta release metadata/package/workflow updated;
- [ ] exact frozen release branch passes 5/5 deterministic audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR merge-context and dependency policy pass, then exact validated head is merged;
- [ ] exact post-merge main release gate and package/provenance are green.

Required release evidence: exact SHAs/run IDs, focused token-store/fallback tests, UI/static assertions, five deterministic audit cycles, Chromium MV3 E2E, reproducible package hashes, canonical PR review/thread/mergeability state and exact-main validation.

Known explicit exclusions: no GitHub write API; no workflow dispatch; no token in portable config/runtime state/content script; no change to watchdog polling/idle/restart semantics; no Telegram/auth-grace/tab-recovery change; unrelated draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA: `03ed036ef58437f8474eaaf9e1e0aa761b469605` before this state-only r45 write.
Critical-path basis ref: `main`.
Critical-path basis SHA: `03ed036ef58437f8474eaaf9e1e0aa761b469605`.
Canonical integration branch, if any: planned `release/0.7.6-global-github-pat` from the current main product/state checkpoint.
Canonical PR / RC, if any: none yet.
Relevant open PRs: draft #17 only; unrelated and excluded.
Relevant Issues: no issue required for the explicit owner request.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, dependency runner policy, five audit cycles, Chromium MV3 E2E, reproducible package/provenance.
Relevant release/deployment state: 0.7.5 beta is closed and verified; this owner decision opens the next bounded release.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.

Architecture / major components: GitHub credential boundary in `background/github-actions.js`; per-chat Control Center token UI in `options/github-token-ui.js`; watchdog runtime consumes only repository identity/profile settings through `service-worker-v2.js`; secrets remain outside model/chat state.

Build / packaging: Node audit suite plus deterministic Python extension ZIP/source-manifest packaging.

Tests / validation: `github-actions-client.test.mjs`, `github-token-security.test.mjs`, `github-watchdog-ui.test.mjs`, broader extension tests, loaded Chromium MV3 watchdog E2E and static validator.

CI: release gate has five deterministic audit cycles, Chromium MV3 E2E and downstream reproducible package/provenance; workflow changes also trigger dependency-runner policy.

Release / deployment: established beta flow is frozen release branch → canonical PR merge-context validation → merge → exact-main validation.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` is the sole working repository. State-only HQ commits do not invalidate product basis.

External release dependencies: GitHub Actions runners only.

Material findings: current credential store is version 1 and repository-keyed (`tokens[owner/repo]`); token values are protected via `TRUSTED_CONTEXTS`, omitted from portable/runtime state and sent only to the read-only Actions endpoint. Current UI duplicates a PAT field inside every chat profile. A schema-compatible v2 store can preserve repository tokens while adding a shared token fallback without touching service-worker runtime state.

## 4. Release Gates

### GATE-1 — Shared credential behavior
Status: UNSATISFIED
Evidence: live main currently supports only repository-keyed tokens.
Blocking items: implement shared token storage/resolution, override precedence and backward compatibility.

### GATE-2 — Control Center + security tests
Status: UNSATISFIED
Evidence: current UI has only per-chat token controls; existing tests assert repository-keyed storage and privacy boundary.
Blocking items: shared PAT UI, focused tests and static validation.

### GATE-3 — Frozen candidate and canonical PR
Status: UNSATISFIED
Evidence: no 0.7.6 release branch/PR exists yet.
Blocking items: CP-1/CP-2 completion and exact candidate CI.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: no 0.7.6 product merge exists yet.
Blocking items: GATE-3.

## 5. Current Critical Path

### CP-1 — Implement shared PAT and 0.7.6 release candidate
Status: ACTIVE
Release gate: GATE-1 + GATE-2.
Why critical: the requested capability cannot exist without credential resolution and UI while preserving the credential boundary.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: `github-actions.js`, `github-token-ui.js`, focused token/security/UI tests, and required 0.7.6 manifest/package/workflow metadata only.
Acceptance condition: repository token overrides shared PAT; shared PAT otherwise serves all repositories; absent tokens preserve unauthenticated behavior; v1 credentials remain readable; shared PAT can be saved/tested/removed without plaintext exposure; no secret enters model/export/content/runtime messages; release metadata is internally consistent.
Evidence: pending branch commits and repository-native tests.

### CP-2 — Validate frozen 0.7.6 branch
Status: PENDING
Release gate: GATE-3.
Why critical: exact candidate must pass repository-native deterministic/browser/package gates before integration.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: one exact push run on `release/0.7.6-global-github-pat`.
Acceptance condition: 5/5 audit cycles + Chromium MV3 E2E + reproducible package/provenance SUCCESS.
Evidence: pending.

### CP-3 — Validate and merge canonical 0.7.6 PR
Status: PENDING
Release gate: GATE-3.
Why critical: integration into current main must be independently validated before merge.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: exact diff/head/base, PR CI, dependency policy, reviews/threads, mergeability and expected-head merge.
Acceptance condition: only the frozen validated head is merged after all required evidence is green.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Why critical: merge alone is not release evidence.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance.
Acceptance condition: exact product merge passes all release jobs and reproduces canonical candidate package hashes.
Evidence: pending.

## 6. Active Execution Registry

HQ: implementing CP-1 on planned branch `release/0.7.6-global-github-pat`; write surface limited to credential/UI/tests/release metadata.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: none active yet.

## 7. Safe Parallel Work

NONE — COORDINATION_OVERHEAD_EXCEEDS_BENEFIT: credential schema, UI semantics and focused tests are a tightly coupled bounded slice; release metadata follows the same candidate and independent worker work would not shorten the critical path materially.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — credential storage, token UI, watchdog consumer boundary, model/export/content isolation, focused tests, static validator, packaging, release CI and open PR surface were inspected.

Evidence Audit: PASS — current repository-keyed store, protected storage, per-chat UI and release machinery are verified from live main files; owner request is explicit.

Release Alignment Audit: PASS — shared PAT behavior, safety tests and release packaging are the minimum work required; unrelated watchdog/Telegram/tab behavior and draft PR #17 are excluded.

Dependency & Ordering Audit: PASS — credential/UI implementation must precede frozen validation; frozen candidate must precede PR integration; merge must precede exact-main validation.

Execution & Parallelism Audit: PASS — CP-1 has exact files/acceptance and HQ_DIRECT is supported; later deterministic validation belongs to PROJECT_RUNNER; no useful non-overlapping worker slice exists.

Adversarial Audit: PASS — strongest failure modes are secret leakage, replacing least-privilege repository override semantics, breaking legacy v1 store, sending PAT outside GitHub API, or weakening unauthenticated public behavior; release contract explicitly tests/forbids each.

Material findings and resolutions: shared PAT will be a fallback, not a replacement for per-repository tokens; stored plaintext remains inaccessible to normal UI/state surfaces; no service-worker model schema change is required.

## 10. Next Action

Exact next action: create `release/0.7.6-global-github-pat` from the live main checkpoint, implement CP-1, then live-verify exact branch diff and allow repository-native release CI to validate it.
Executor: HQ.
Expected evidence: bounded branch commits, focused tests/static validation and exact release-run identity.
Acceptance condition: CP-1 acceptance satisfied with no out-of-scope changes.

## 11. Last Material Revision

What changed: owner explicitly requested one PAT configurable once for all chats, opening ChatPulse 0.7.6 beta.
Why the critical path changed: previous 0.7.5 release was DONE; new owner feature request creates a new bounded release contract.
Evidence causing the change: live current credential/UI implementation plus explicit owner request.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: reconstructed live 0.7.5 DONE state, inspected credential/UI/test/release surfaces, defined and audited the 0.7.6 critical path.
Active external executions and exact refs: NONE yet.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + r45 + main basis `03ed036e...` + owner shared-PAT release contract.
Exact next action after recovery: create/live-check `release/0.7.6-global-github-pat` from the current main state checkpoint and implement CP-1.
Rotation blockers: NONE.
