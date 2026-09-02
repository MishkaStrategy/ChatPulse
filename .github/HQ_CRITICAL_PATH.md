---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 9
updated_at: 2026-09-02T01:43:00Z
project_state: BLOCKED
critical_path_status: VERIFIED
release_contract_status: INFERRED
handoff_status: READY
basis_ref: feature/stop-phrase-0.5.4
basis_sha: 2e6d79971ccd58619acac28551ddcf6d457c71a1
---

# HQ Critical Path

## 1. Current Release Contract

Primary release target remains ChatPulse 0.5.4 beta: add a per-chat stop phrase that stops monitoring only the matching chat while preserving the Chrome MV3 safety boundary.

Required release evidence remains:
- source archive SHA-256 `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`;
- source archive member count 26, all regular files inside approved roots;
- exact-head product/test/security/package gates;
- beta ZIP `ChatPulse-Chrome-v0.5.4-beta.zip` with SHA-256 `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`;
- merge of canonical PR #15 into `main` and post-merge verification.

No source or artifact hash may be changed silently. Replacing the pinned release source with a different payload requires an explicit owner integrity decision and a new verified release contract.

## 2. Owner Decision — Telegram Notifications

Owner request on 2026-09-02: `Добавь уведомления в тг`.

Status: IMPLEMENTED, EXACT-HEAD VERIFIED, PARKED AS DRAFT PR #18.

Implementation:
- optional Telegram integration, disabled by default;
- notification after an automatic ChatPulse continuation;
- settings UI with enable toggle, chat ID, bot token and test send;
- `https://api.telegram.org/*` only in `optional_host_permissions`, requested by Chrome from a direct user gesture;
- bot token stored separately in `chrome.storage.local`, never returned in public runtime state and never intentionally logged;
- Telegram receives tracked chat title + continuation outcome only, never ChatGPT response text or conversation URL;
- Telegram delivery failure is non-critical and cannot modify at-most-once continuation state or cause a duplicate ChatGPT command;
- unrelated settings remain independent of Telegram permission after permission revocation.

Feature branch: `feature/telegram-notifications`.
Draft PR: #18 `Добавить опциональные Telegram-уведомления`.
Exact verified head: `308f8e362f3c93a607f6a2bbc21ea11a74523959`.
Final validation: run `33579882175`, job `100091700358`, 25/25 tests PASS, syntax PASS, Telegram privacy/send/permission/isolation PASS, Manifest optional-host boundary PASS.

PR #18 remains Draft only because the canonical 0.5.4 product base is unresolved. No Telegram implementation or validation blocker remains.

## 3. Repository Basis

Working repository: `MishkaStrategy/ChatPulse`.
Default branch: `main`.
Canonical release branch: `feature/stop-phrase-0.5.4`.
Canonical release PR: #15, open/non-draft, exact head still `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
Telegram PR #18: open Draft, exact head still `308f8e362f3c93a607f6a2bbc21ea11a74523959`.

Temporary control workflows have been cleaned from `main`:
- Telegram validation bridge deleted after PASS;
- payload diagnostics workflow deleted after terminal diagnostics;
- write-capable 0.5.4 release bridge deleted in commit `61b346cb912742bd3ec819dc4d4fc5515597914e` after recovery channels were exhausted.

## 4. Primary 0.5.4 Integrity Evidence

### 4.1 Exact-head execution route was proven

Historical recovery bridge run `33578907906`, job `100088820763`:
- self-hosted runner assigned;
- canonical branch checkout PASS;
- exact-head assertion PASS for `2e6d7997...`;
- Node.js 22 PASS;
- source integrity gate rejected the payload before extraction.

### 4.2 Live Issue #14 is a different valid archive

Authoritative Issue #14 body + its seven comments, ordered by comment ID and whitespace-normalized, decodes to:
- observed SHA-256 `fe85f7384d7b8e1d85106ab4adae0f9d94cfb3a4e3c99a72cbf84c64a3d4753c`;
- size 54,444 bytes;
- valid gzip magic `1f8b08`;
- structurally valid tar;
- 12 members, all 12 regular files, safe paths/approved roots only.

The release contract requires a different SHA `f1a702...` and exactly 26 members.

Bounded diagnostics proved:
- `ordered_subset_matches=[]` for all ordered subsets of the seven comments plus Issue body;
- `full_comment_permutation_matches=[]` for all full comment permutations;
- result `NO_SIMPLE_RECONSTRUCTION_MATCH`.

Therefore the mismatch is not explainable by comment ordering or by merely adding/removing one of the live comment chunks. The live Issue source is a different 12-file archive, not the pinned 26-file release payload.

### 4.3 Git history cannot recover the intended product snapshot

Read-only history diagnostic fetched complete branch history plus retained `refs/pull/*/head` and scanned 305 reachable commits against hashes of the observed archive files.

Results:
- `exact_12_file_matches=[]`;
- `exact_3_product_file_matches=[]` for the archived service-worker, content-script and model-v2 files;
- result `NO_REACHABLE_PRODUCT_SNAPSHOT`.

No reachable commit or retained PR head contains the observed product-core snapshot, much less the missing 26-file intended release candidate.

### 4.4 Historical release artifacts cannot recover it

Artifact lists are empty for all known historical 0.5.4 workflow runs:
- `29983313396` — no artifacts;
- `30871174014` — no artifacts;
- `30871703893` — no artifacts;
- `30872589019` — no artifacts.

Repository searches found no alternate authoritative occurrence of the expected source hash, expected beta ZIP hash, or published 0.5.4 beta artifact. There is no GitHub Release/tag recovery surface.

## 5. Release Gates

### GATE-1 — Canonical target and historical contract
Status: SATISFIED.

### GATE-2A — Exact-head execution route
Status: SATISFIED.

### GATE-2B — Canonical 26-file source integrity
Status: BLOCKED — HUMAN INTEGRITY GATE.

Exact blocker:
The only live Issue source is a different valid 12-file archive with SHA `fe85f738...`; the required 26-file source with SHA `f1a702...` is absent from Issue data, reachable Git history, retained PR refs and historical Actions artifacts.

### GATE-2C — Product tests/package/security/artifact
Status: BLOCKED by GATE-2B.

### GATE-3 — Final merge readiness
Status: BLOCKED by GATE-2B/GATE-2C.

### GATE-4 — Merge/post-merge release verification
Status: BLOCKED by GATE-3.

## 6. Current Critical Path

### CP-1 — Resolve the 0.5.4 release-source integrity decision
Status: BLOCKED — HUMAN_GATE_REQUIRED.

Safe unblock option A — preserve the current contract:
Provide/recover the original locally verified 26-file archive whose SHA-256 is exactly `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`.

Safe unblock option B — explicitly supersede the irrecoverable contract:
Owner authorizes HQ to derive/rebuild a new 0.5.4 candidate from the product requirements, establish new source/artifact hashes, re-run all security/test/package gates, and persist a new release contract before merge.

Rejected unsafe route:
Changing the expected source SHA to the observed `fe85f738...` or treating its 12 files as the intended release without explicit owner approval and requalification.

### CP-2 — Execute the verified 0.5.4 candidate and publish artifact
Status: PENDING after CP-1.

### CP-3 — Verify final diff and merge readiness
Status: PENDING after CP-2.

### CP-4 — Merge and verify released `main`
Status: PENDING after CP-3.

## 7. Safe Parallel / Follow-up Work

Telegram PR #18: VERIFIED / PARKED, no active execution. It can be rebased/reconciled and revalidated after the 0.5.4 product-base decision.

PR #17: Draft/non-critical.

No other independent critical-path work can close the current release integrity gate without inventing or weakening release evidence.

## 8. Active Execution Registry

HQ: no active write execution.
PROJECT_RUNNER: no active product execution.
Workers: NONE — no independent useful task can resolve missing authoritative release bytes.
Codex: NONE.

Repository governance/status workflows triggered by state-only `main` commits are not product execution and do not change this blocker.

## 9. Safety / Adversarial Controls

- Never weaken or silently replace the pinned 0.5.4 source SHA.
- Never execute or merge the observed 12-file Issue payload as though it were the intended 26-file candidate.
- Do not merge PR #15 while release source/test/artifact gates are incomplete.
- Do not merge Telegram PR #18 before 0.5.4 base reconciliation unless the owner explicitly changes release ordering.
- Telegram must remain optional host permission; bot token must remain out of public runtime state/logs.
- No temporary HQ release/diagnostic workflows remain on `main`.

## 10. Critical Path Audits

Repository Coverage Audit: PASS — Issue source, branch/PR refs, 305 reachable commits, retained PR heads, historical release runs/artifacts and open follow-up PRs were checked.

Evidence Audit: PASS — BLOCKED state is backed by exact hashes, exact archive member count, exhaustive simple reconstruction checks, full reachable-history hash scan and artifact queries.

Release Alignment Audit: PASS — the integrity gate protects the existing release contract; Telegram is isolated/verified without silently redefining 0.5.4.

Dependency & Ordering Audit: PASS — source integrity must precede test/package/artifact evidence, merge readiness and release merge.

Execution & Parallelism Audit: PASS — all safe automated recovery routes are exhausted; no meaningful independent critical-path execution remains.

Adversarial Audit: PASS — rejected hash relaxation, treating the wrong 12-file archive as canonical, premature merge, unrelated PR #17 scope creep and premature Telegram integration.

## 11. Human Gate

Required owner input — choose one:

1. Supply the original 26-file archive that hashes to `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`; or
2. Explicitly authorize a rebuilt 0.5.4 candidate with new source/artifact hashes and a new persisted release contract.

No other owner action is needed for Telegram itself; its implementation is already verified in Draft PR #18.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.

Last completed atomic action:
Exhausted GitHub recovery channels for the missing 0.5.4 source, removed all temporary release/diagnostic control workflows, and persisted the resulting human integrity gate while retaining Telegram PR #18 as exact-head verified.

Active external product executions: NONE.
Unpersisted material reasoning: NONE.

Recovery entrypoint:
Live-read this revision, PR #15 and PR #18. If owner supplies the original archive, verify SHA/member count before any extraction. If owner authorizes rebuild, first persist a new release contract and only then derive/validate the replacement candidate.
