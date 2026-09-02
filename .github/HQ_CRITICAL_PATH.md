---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 11
updated_at: 2026-09-02T02:05:30Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.5.4-rebuild
basis_sha: 071ac396890716663085fe0a334b0bb645d55310
---

# HQ Critical Path

## 1. Current Release Contract

Owner-authorized target: rebuild ChatPulse 0.5.4 beta from current `main` with new source/artifact hashes and the per-chat stop-phrase feature.

Owner decision: `пересобирай 0.5.4 с новыми хэшами`.

Historical pins are retired as requirements:
- source `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5` — RETIRED;
- artifact `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3` — RETIRED.

New release identity is the exact rebuilt Git head plus reproducible source-manifest SHA-256 and `ChatPulse-Chrome-v0.5.4-beta.zip` SHA-256 produced by the exact-head gate.

Definition of RELEASED:
- configurable stop phrase is disabled by default and capped at 500 characters;
- only the latest completed assistant response is eligible;
- matching uses NFKC + case folding + collapsed whitespace + substring semantics;
- a match disables only that tracked chat and sends no continuation for that response;
- re-enabling creates a fresh baseline and a newer manual control action wins over an in-flight check;
- at-most-once, stale-tab recovery, local-only storage and Manifest V3 permission boundaries remain intact;
- five exact-head audits pass;
- reproducible beta package is built twice identically and retained with source/artifact hashes;
- rebuilt PR is verified, merged, and post-merge `main` satisfies the release contract.

Telegram PR #18 remains VERIFIED/PARKED and is not part of this 0.5.4 release gate.

## 2. Semantic Reconstruction Evidence

Read-only diagnostic run `33581319517`, job `100096027803` verified the live diagnostic Issue #14 archive SHA `fe85f738...` before reading text. The archive was not executed and is not a release source.

Recovered stop-phrase semantics:
- global optional phrase; empty means disabled;
- max 500 characters;
- latest completed assistant response only;
- NFKC, case-insensitive, whitespace-normalized substring matching;
- match disables only that chat, records `lastStopReason=stop-phrase`, and prevents dispatch;
- user messages and active generation are ignored;
- manual re-enable requires a new safe baseline.

The historical `model-v2.js` contained UTF-8 corruption, so no historical product-core file was copied wholesale. Only bounded semantics were used. Temporary semantic workflow was removed from `main` in `d3684d865abf1fd174d537933cca50d5aa0955e8`.

## 3. Rebuilt Candidate

Fresh base: live `main` SHA `d3684d865abf1fd174d537933cca50d5aa0955e8`.
Canonical rebuilt branch: `release/0.5.4-rebuild`.
Current exact candidate head: `071ac396890716663085fe0a334b0bb645d55310`.

Implemented surfaces:
- model state/decision: stop phrase, stop metadata and `controlRevision` race protection;
- content script: NFKC/case/whitespace matching on completed assistant response only;
- service worker: stop phrase passed through initial, recovery and preflight inspections; stop match never reaches send;
- options UI: stop phrase field, save behavior and stopped-by-phrase status;
- tests: model exclusions/race behavior plus two-chat service-worker isolation;
- Manifest/package version 0.5.4 beta;
- deterministic `scripts/package_extension.py` with sorted members, fixed ZIP metadata, canonical source manifest and SHA-256 outputs;
- release workflow replaced with read-only `[self-hosted, fast]` five-cycle audit plus reproducibility/package provenance job.

Temporary write-capable service-worker patch workflow completed successfully and was deleted from the release branch. It is not part of the candidate tree.

## 4. Release Gates

### GATE-1 — Explicit rebuilt contract / fresh base
Status: SATISFIED.

### GATE-2 — Stop-phrase semantics and fresh implementation
Status: SATISFIED PENDING EXECUTION EVIDENCE.
Evidence: bounded semantic recovery plus exact candidate code/tests at `071ac396...`.

### GATE-3 — Exact-head five-cycle validation/security
Status: ACTIVE.
Active run: `33581867810` on exact head `071ac396890716663085fe0a334b0bb645d55310`.
Required: all five audit jobs PASS plus package/security job PASS.

### GATE-4 — New source/artifact hashes and retained beta artifact
Status: PENDING GATE-3.
Required outputs: source-manifest SHA-256, beta ZIP SHA-256, retained Actions artifact.

### GATE-5 — PR merge and post-merge verification
Status: PENDING GATE-4.

## 5. Current Critical Path

### CP-1 — Recover bounded stop-phrase semantics
Status: DONE.

### CP-2 — Build fresh 0.5.4 candidate from current main
Status: DONE at candidate head `071ac396...` subject to exact-head validation.

### CP-3 — Run exact-head release gate and capture new provenance
Status: ACTIVE.
Execution plane: PROJECT_RUNNER via GitHub Actions run `33581867810`.
Acceptance: 5/5 audits PASS, reproducibility PASS, security/version PASS, artifact uploaded, new hashes captured.

### CP-4 — Open/verify rebuilt PR, retire old PR #15, merge and post-merge verify
Status: PENDING CP-3.

### CP-5 — Reconcile Telegram PR #18 with released 0.5.4
Status: PENDING FOLLOW-UP; not part of 0.5.4 gate.

## 6. Active Execution Registry

PROJECT_RUNNER:
- workflow: `ChatPulse 0.5.4 beta release gate`;
- run `33581867810`;
- event `push`;
- exact head `071ac396890716663085fe0a334b0bb645d55310`;
- expected jobs: audit rounds 1–5 and reproducible package/provenance after audits.

HQ: observe terminal evidence, repair only on candidate branch if a gate fails, then open canonical rebuilt PR.
Workers: NONE — release code/CI share one exact-head gate and delegation would create overlapping ownership.
Codex: NONE.

## 7. Safety / Adversarial Controls

- Never restore old Issue #14 source/artifact pins as current requirements.
- Never execute the damaged historical payload.
- Never log response text or the configured stop phrase.
- A stop match must not dispatch a continuation.
- Stop handling must not disable any non-matching chat.
- A more recent manual toggle must win over an in-flight stop decision.
- Keep permanent host permissions restricted to ChatGPT domains.
- Release workflow remains read-only; no CI job may publish source commits.
- Do not merge PR #18 before 0.5.4 base reconciliation.

## 8. Critical Path Audits

Repository Coverage Audit: PASS — live main, semantic evidence, fresh branch, model/content/worker/UI/tests, Manifest, package builder and release workflow covered.
Evidence Audit: PASS — semantics are traceable to bounded diagnostic evidence; final acceptance is reserved for exact-head execution and artifact hashes.
Release Alignment Audit: PASS — candidate contains the owner-requested 0.5.4 stop phrase only plus required release infrastructure; Telegram stays separate.
Dependency & Ordering Audit: PASS — semantics → fresh candidate → exact-head audits → hashes/artifact → PR merge/post-merge.
Execution & Parallelism Audit: PASS — one release branch owns product writes; current runner is read-only; no independent worker slice is useful.
Adversarial Audit: PASS — rejected damaged-payload reuse, stale old pins, whole-file historical copy, premature merge, stop-phrase logging, cross-chat stop leakage and stale background override of manual re-enable.

## 9. Next Action

Live-observe run `33581867810`. On failure, capture exact failing step and repair the same release branch, producing a new head and new exact-head run. On PASS, capture new source/artifact hashes and retained artifact, open the canonical rebuilt PR against `main`, and verify its exact diff/base before merge.

## 10. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: rebuilt candidate `071ac396...` created and exact-head release run accepted by GitHub.
Active external execution: run `33581867810` on `release/0.5.4-rebuild@071ac396...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read revision 11, validate branch head and run `33581867810`, then continue CP-3.
Rotation blockers: NONE.
