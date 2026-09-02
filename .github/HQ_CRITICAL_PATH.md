---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 14
updated_at: 2026-09-02T02:22:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 4a8ec711a3adde13580e16351997621abe2a95fd
---

# HQ Critical Path

## 1. ChatPulse 0.5.4 beta — RELEASED

Owner decision `пересобирай 0.5.4 с новыми хэшами` has been fully executed. Historical Issue #14 source/artifact pins are retired and remain evidence only.

Canonical rebuilt release:
- branch head: `release/0.5.4-rebuild@641e60c2f95f151ded2c660a19b8e3c5df916843`;
- PR #19: merged with exact-head guard;
- merge/main release SHA: `4a8ec711a3adde13580e16351997621abe2a95fd`;
- Manifest: `0.5.4`, version name `0.5.4 beta`;
- product ZIP SHA-256: `c5751017ae42f3f37d1e6c333d31789df7d204335f2e5ff3a4f45f8cc32bf8d0`;
- source manifest SHA-256: `ee2aa2178707011c2d87ea9f4c0aa3195f1cf324590bd58401a77dfef54410a4`;
- packaged extension file count: 12.

Final branch exact-head evidence:
- run `33582428168` — 5/5 audit cycles PASS, 29/29 tests PASS, reproducible package/security PASS;
- artifact ID `9828902479`.

PR merge-tree evidence:
- run `33582421913` — 5/5 audit cycles PASS, reproducible package/security PASS;
- same product/source hashes;
- artifact ID `9828895644`.

Post-merge `main` evidence:
- run `33582724814` on exact merge SHA `4a8ec711...` — 5/5 audit cycles PASS;
- reproducible package built twice identically;
- static/security/version checks PASS;
- same canonical ZIP/source hashes;
- retained artifact ID `9828998086`, 32167 bytes, live until `2026-09-03T02:18:23Z` under repository one-day retention cap;
- Actions wrapper digest `e40f2013...` is transport metadata, not the product ZIP hash.

Material adversarial repair included before release:
- stale runtime state is fully rejected across a newer `controlRevision`, preserving fresh baseline after manual re-enable;
- dedicated regression plus two-chat stop isolation passed on final and post-merge heads.

Old PR #15 is CLOSED UNMERGED as superseded. Temporary semantic/patch/ref-cleanup workflows and accidental ref aliases were removed; only canonical release branch remains from the rebuild controls.

0.5.4 release gates: 6/6 SATISFIED. Release status: RELEASED.

## 2. Active Owner Request — Telegram notifications

Owner request: `Добавь уведомления в тг`.

Previously implemented/verified design on Draft PR #18:
- Telegram optional and disabled by default;
- optional host permission `https://api.telegram.org/*`, requested only from a direct user action;
- bot token stored separately in `chrome.storage.local` and never exposed in public runtime state/logs;
- notifications after successful/submitted-unconfirmed continuation only;
- no ChatGPT response text or conversation URL sent to Telegram;
- Telegram failure is non-critical and cannot alter at-most-once continuation semantics;
- unrelated settings remain independent of Telegram permission.

Historical PR #18 head `308f8e362f3c93a607f6a2bbc21ea11a74523959` passed its old exact-head audit, but is now 43 commits behind released `main`. Historical PASS is no longer merge evidence.

## 3. Current Critical Path

### TG-1 — Reconcile Telegram implementation onto released 0.5.4
Status: ACTIVE.
Execution plane: HQ_DIRECT on `feature/telegram-notifications`.
Exact scope:
1. rebuild/rebase the Draft PR from current released `main`, preserving the verified Telegram security model;
2. merge Telegram into the current stop-phrase/service-worker/options/package surfaces without losing 0.5.4 protections;
3. assign the next product version rather than silently changing released 0.5.4 bits;
4. add/retain Telegram permission/privacy tests plus all 0.5.4 regression tests.
Acceptance: clean diff from released main; no loss of stop-phrase, controlRevision, at-most-once or recovery guarantees.

### TG-2 — Exact-head Telegram validation and release provenance
Status: PENDING TG-1.
Required: syntax/unit/static/security, existing 0.5.4 tests, Telegram tests, deterministic package/provenance on exact head.

### TG-3 — PR #18 review/merge and post-merge verification
Status: PENDING TG-2.

## 4. Active Execution Registry

HQ: Telegram compatibility/rebuild from released `main`.
PROJECT_RUNNER: NONE active at this checkpoint.
Workers: NONE — Telegram touches the same worker/options/Manifest/package surfaces, so a single writer avoids conflicts.
Codex: NONE.

## 5. Safety Controls

- Preserve every released 0.5.4 stop-phrase/controlRevision/at-most-once/recovery regression.
- Telegram host access remains optional only; never add it to permanent `host_permissions`.
- Never expose/log bot token, response text or conversation URL.
- Telegram failure must never cause continuation retry or state rollback.
- Do not treat historical PR #18 PASS as current-head evidence after base reconciliation.
- Do not overwrite released 0.5.4 identity with Telegram changes; use the next product version.

## 6. Six Audits

Repository Coverage: PASS — released 0.5.4 and stale Telegram PR #18 compatibility surfaces identified.
Evidence: PASS — 0.5.4 has branch/PR/main exact evidence; Telegram historical evidence is explicitly marked stale for merge.
Release Alignment: PASS — 0.5.4 is closed; Telegram is now the sole active owner-requested product slice.
Dependency/Ordering: PASS — rebase/reconcile → exact-head validation → PR merge → post-merge verification.
Execution/Parallelism: PASS — single writer on overlapping product surfaces; no useful independent worker slice.
Adversarial: PASS — protects optional permission, token privacy, stop-phrase/controlRevision semantics and at-most-once behavior.

## 7. Next Action

Rebuild `feature/telegram-notifications` from released `main`, integrate the known verified Telegram module/tests into current 0.5.4 surfaces, bump to the next beta version, and run a fresh exact-head gate.

## 8. Rotation Checkpoint

Safe to rotate: YES.
Last completed atomic action: ChatPulse 0.5.4 beta released and post-merge verified; revision 14 persisted.
Active external execution: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read revision 14 and PR #18; start TG-1 from current `main` product state.
