---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 12
updated_at: 2026-09-02T02:09:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.5.4-rebuild
basis_sha: b217c33fc53aa05d7fcd0dc710be3e6ff9e69b64
---

# HQ Critical Path

## 1. Explicit Rebuilt 0.5.4 Contract

Owner authorized rebuilding ChatPulse 0.5.4 beta from current `main` with new hashes: `пересобирай 0.5.4 с новыми хэшами`.

Retired historical requirements:
- old source SHA-256 `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5` — RETIRED;
- old artifact SHA-256 `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3` — RETIRED;
- Issue #14 is read-only diagnostic evidence, not a release source;
- old PR #15 is superseded by the fresh rebuild path.

Release behavior:
- optional global stop phrase, empty by default, max 500 characters;
- latest completed assistant response only;
- NFKC + case-insensitive + whitespace-normalized substring match;
- match disables only the matching tracked chat and prevents continuation dispatch;
- user messages and active generation never trigger stop;
- manual re-enable creates a fresh baseline and a newer manual control action wins over an in-flight stop decision;
- response text and stop phrase are never intentionally logged;
- existing at-most-once, tab recovery, local-only state and Chrome MV3 permission boundaries remain intact.

Release evidence required:
- exact Git candidate head;
- 5/5 exact-head audits;
- reproducible package built twice identically;
- canonical source-manifest SHA-256;
- `ChatPulse-Chrome-v0.5.4-beta.zip` SHA-256;
- retained Actions artifact;
- PR merge plus post-merge `main` gate.

Telegram PR #18 stays VERIFIED/PARKED until 0.5.4 is on `main`.

## 2. Rebuild Basis and Candidate

Fresh product base: `main@d3684d865abf1fd174d537933cca50d5aa0955e8`.
Canonical release branch: `release/0.5.4-rebuild`.
Current final candidate head: `b217c33fc53aa05d7fcd0dc710be3e6ff9e69b64`.

The only change after the fully passing `071ac396...` candidate is release-hardening in `.github/workflows/extension-ci.yml`: the same path-filtered read-only gate now also runs on relevant `main` pushes, enabling real post-merge verification without triggering on `.github/HQ_CRITICAL_PATH.md` state-only commits.

Product/release surfaces in candidate:
- stop phrase state/decision plus `controlRevision` race protection;
- content-script completed-assistant matching;
- service-worker propagation through initial/recovery/preflight inspections;
- options UI and stopped-by-phrase runtime status;
- model and two-chat service-worker tests;
- Manifest/package version `0.5.4 beta` / `0.5.4-beta.1`;
- deterministic `scripts/package_extension.py`;
- canonical source manifest + SHA files;
- five-cycle read-only Actions gate and artifact upload.

Temporary diagnostic/patch workflows are absent from the final candidate tree.

## 3. Proven Execution Evidence

Completed exact-head run `33581867810` on candidate `071ac396890716663085fe0a334b0bb645d55310`:
- cycles 1–5: SUCCESS;
- 28/28 tests per cycle, 0 failures;
- `stop_phrase_single_chat`: PASS;
- manual re-enable race coverage: PASS;
- existing at-most-once and recovery coverage: PASS;
- Manifest/static/security validation: PASS;
- reproducible packaging job `100097994545`: SUCCESS;
- beta package built twice with identical hashes;
- product ZIP SHA-256: `686a0df219c38c00623b4906c6b88395cb8ae1d19929927c6e8cfcdeba998357`;
- source manifest SHA-256: `9b677a711394f1c94e68a5315df439f19ca6a2e498f94446b814b6f88551a36f`;
- extension file count: 12;
- Actions artifact ID `9828699096`, name `ChatPulse-Chrome-v0.5.4-beta`, size 32022 bytes;
- artifact is live, expires `2026-09-03T02:04:55Z` because repository retention policy caps retention at one day;
- Actions wrapper archive digest `0b5b5e3764472f0a91b6fc4e3cf08b9ef8382ea1c10d6b9c4001ea1f2976d9b1` is transport metadata and is not the product ZIP hash.

Final head `b217c33f...` does not change extension/package contents; nevertheless the prior PASS is treated as historical evidence only for exact-head purposes.

Active final exact-head revalidation:
- run `33582114197`;
- head `b217c33fc53aa05d7fcd0dc710be3e6ff9e69b64`;
- expected outputs remain product ZIP `686a0df...` and source manifest `9b677a...` if reproducibility is preserved.

## 4. Release Gates

### GATE-1 — Explicit rebuild authority / fresh base
Status: SATISFIED.

### GATE-2 — Stop-phrase semantics and fresh implementation
Status: SATISFIED.
Evidence: bounded read-only semantic recovery plus fresh implementation/tests; no damaged historical product file copied wholesale.

### GATE-3 — Exact final-head 5-cycle validation/security
Status: ACTIVE.
Run: `33582114197` on `b217c33f...`.
Acceptance: all five audit cycles plus package/security job SUCCESS.

### GATE-4 — New final source/artifact provenance
Status: PROVISIONALLY SATISFIED, exact-head confirmation pending GATE-3.
Expected product hashes from the immediately preceding content-identical candidate:
- ZIP `686a0df219c38c00623b4906c6b88395cb8ae1d19929927c6e8cfcdeba998357`;
- source manifest `9b677a711394f1c94e68a5315df439f19ca6a2e498f94446b814b6f88551a36f`.

### GATE-5 — Canonical PR merge and post-merge main verification
Status: PENDING GATE-3/GATE-4.

## 5. Current Critical Path

### CP-1 — Recover bounded stop-phrase semantics
Status: DONE.

### CP-2 — Build fresh 0.5.4 candidate
Status: DONE.

### CP-3 — Final exact-head gate and provenance
Status: ACTIVE.
Executor: PROJECT_RUNNER / GitHub Actions run `33582114197`.
Acceptance: 5/5 + reproducibility/security PASS on `b217c33f...`; final hashes captured and artifact retained.

### CP-4 — Open canonical rebuilt PR, close superseded PR #15, verify diff/reviews/base, merge
Status: PENDING CP-3.

### CP-5 — Post-merge main 5-cycle gate and release verification
Status: PENDING CP-4.
The release workflow now has a path-filtered `main` push trigger specifically for this gate.

### CP-6 — Reconcile Telegram PR #18 with released 0.5.4
Status: PENDING FOLLOW-UP; outside current 0.5.4 release gate.

## 6. Active Execution Registry

PROJECT_RUNNER:
- workflow `ChatPulse 0.5.4 beta release gate`;
- run `33582114197`;
- event `push`;
- exact head `b217c33fc53aa05d7fcd0dc710be3e6ff9e69b64`;
- read-only contents permission.

HQ:
- observe final head gate;
- on PASS open canonical rebuilt PR and retire PR #15;
- on failure repair only the release branch and revalidate the new exact head.

Workers: NONE — one exact release branch owns product/CI changes and there is no independent closure slice.
Codex: NONE.

## 7. Safety / Adversarial Controls

- Never restore retired Issue #14 pins as current release requirements.
- Never execute the damaged Issue #14 payload.
- Never log response text or configured stop phrase.
- Stop match cannot dispatch continuation or affect another chat.
- Newer manual chat control must override stale in-flight stop state.
- Permanent host permissions remain only ChatGPT domains.
- Release CI has `contents: read`; no release gate publishes source commits.
- Temporary control workflows stay out of final tree.
- Do not merge Telegram PR #18 before 0.5.4 base reconciliation.

## 8. Critical Path Audits

Repository Coverage Audit: PASS — live main, rebuild branch, product model/content/worker/UI, tests, Manifest, package builder, release workflow, old PR #15 and parked PR #18 covered.
Evidence Audit: PASS — product semantics and first full gate have concrete exact-run evidence; final-head acceptance explicitly waits for `33582114197`.
Release Alignment Audit: PASS — only the owner-authorized 0.5.4 stop-phrase release plus required release infrastructure is in scope.
Dependency & Ordering Audit: PASS — semantics → fresh implementation → exact-head gate → PR → merge → post-merge main gate.
Execution & Parallelism Audit: PASS — single release writer, read-only runner, no competing worker/Codex writes.
Adversarial Audit: PASS — rejected stale hashes, damaged payload reuse, stale PASS after head movement, premature PR merge, cross-chat stop leakage, logging sensitive content and missing post-merge validation.

## 9. Next Action

Observe `33582114197`. If SUCCESS, confirm final hashes/artifact, open the canonical rebuilt PR against current `main`, close PR #15 as superseded, inspect the exact changed-file set/reviews/mergeability, and require the PR gate before merge.

## 10. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: post-merge main validation trigger added; final exact candidate is `b217c33f...`; revision 12 persisted.
Active external execution: `33582114197` on exact head `b217c33f...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read revision 12, validate release branch head and run `33582114197`, then continue CP-3/CP-4.
Rotation blockers: NONE.
