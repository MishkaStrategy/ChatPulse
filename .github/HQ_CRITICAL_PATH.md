---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 13
updated_at: 2026-09-02T02:14:15Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.5.4-rebuild
basis_sha: 641e60c2f95f151ded2c660a19b8e3c5df916843
---

# HQ Critical Path

## Release Contract

Owner-authorized ChatPulse 0.5.4 beta rebuild from fresh `main` with new hashes and per-chat stop phrase. Historical Issue #14 pins `f1a702...` / `64b128...` are RETIRED and must never be restored as current requirements.

Release acceptance:
- stop phrase optional/empty by default/max 500;
- latest completed assistant response only;
- NFKC + case-insensitive + collapsed-whitespace substring match;
- match disables only the matching chat and never dispatches continuation;
- user messages/generating responses never trigger stop;
- manual re-enable creates a fresh baseline and must win over any in-flight stale runtime state;
- at-most-once, stale-tab recovery, local storage and Chrome MV3 permission boundaries remain intact;
- five exact-head audits, reproducible package/provenance, canonical PR merge and post-merge `main` gate must pass.

Telegram PR #18 remains VERIFIED/PARKED until 0.5.4 is released to `main`.

## Canonical Candidate / PR

Fresh product base: `d3684d865abf1fd174d537933cca50d5aa0955e8`.
Canonical branch: `release/0.5.4-rebuild`.
Current head: `641e60c2f95f151ded2c660a19b8e3c5df916843`.
Canonical rebuilt PR: #19 `Пересобрать ChatPulse 0.5.4 beta со стоп-фразой`.
Superseded old PR #15: CLOSED UNMERGED with pointer to #19.

PR #19 diff before final race fix was exactly the expected 15 release files; final head additionally adds `tests/chrome-extension/control-revision.test.mjs`, so expected final set is 16 files. No temporary diagnostic/patch workflows belong in the final tree.

## Material Adversarial Finding and Repair

Final PR diff review found a real race at `b217c33f...`: `controlRevision` prevented stale `enabled=false` from overriding a manual re-enable, but `mergeRuntimeState()` still copied stale runtime fields such as `lastObservedSessionId` into the newer chat revision. That could silently undo the required fresh baseline and allow an immediate continuation.

Repair:
- commit `0906d150f3b69d84600ae36ce987b83baf1c3a69`: if observed/latest `controlRevision` differ, return the latest chat without merging any stale runtime snapshot;
- commit `641e60c2f95f151ded2c660a19b8e3c5df916843`: regression test asserts tab ID, fingerprints, session ID, snapshot/recovery/stop fields all remain from the newer revision.

Because packaged `model-v2.js` changed, all prior product hashes are now historical. Final hashes must come from `641e60c2...` gates.

## Historical Passing Evidence

`b217c33fc53aa05d7fcd0dc710be3e6ff9e69b64` run `33582114197` passed 5/5 audit cycles plus package/security. At that historical head:
- ZIP SHA `686a0df219c38c00623b4906c6b88395cb8ae1d19929927c6e8cfcdeba998357`;
- source manifest SHA `9b677a711394f1c94e68a5315df439f19ca6a2e498f94446b814b6f88551a36f`;
- artifact ID `9828782332`.
These hashes are NOT final after the race fix.

## Release Gates

GATE-1 explicit rebuild authority/fresh base: SATISFIED.
GATE-2 stop-phrase semantics/fresh implementation: SATISFIED.
GATE-3 final exact-head branch validation: ACTIVE on push run `33582428168` for `641e60c2...`.
GATE-4 PR/merge-tree validation: ACTIVE on PR run `33582421913` for PR #19 head `641e60c2...`.
GATE-5 final source/artifact hashes: PENDING successful final package job; old hashes invalidated by model change.
GATE-6 merge/post-merge main verification: PENDING GATE-3/4/5.

## Critical Path

CP-1 bounded semantic recovery: DONE.
CP-2 fresh candidate implementation: DONE.
CP-3 adversarial diff review: DONE; race found and repaired.
CP-4 final branch + PR gates and new provenance: ACTIVE.
CP-5 verify PR #19 reviews/threads/mergeability, merge exact head, run post-merge main gate: PENDING CP-4.
CP-6 reconcile Telegram PR #18 onto released 0.5.4: PENDING FOLLOW-UP.

## Active Execution Registry

PROJECT_RUNNER push: run `33582428168`, exact head `641e60c2...`, five-cycle + package gate.
PROJECT_RUNNER PR: run `33582421913`, PR #19 merge-tree gate.
HQ: observe both, capture final hashes/artifact, re-run diff/review/mergeability checks, merge only exact head after green evidence.
Workers: NONE — single release writer and read-only validation are already optimal.
Codex: NONE.

## Safety Controls

Never execute damaged Issue #14 payload. Never log response text or configured stop phrase. Never dispatch on stop match or disable another chat. Never merge stale runtime state across a control revision. Permanent host permissions remain only ChatGPT domains. Release CI is read-only. Telegram #18 stays separate until 0.5.4 base is final.

## Six Audits

Repository Coverage: PASS — main, PR #19, final 16-file surface, tests, packaging and release workflow covered.
Evidence: PASS — stale hashes explicitly invalidated; final acceptance waits for `641e60c2...` runs.
Release Alignment: PASS — only 0.5.4 stop phrase + necessary release infrastructure.
Dependency/Ordering: PASS — race repair → final gates → hashes → merge → post-merge gate.
Execution/Parallelism: PASS — single release branch; runner read-only; no conflicting writers.
Adversarial: PASS — race was discovered before merge and now has explicit regression coverage.

## Next Action

Wait for `33582428168` and `33582421913`. On green: capture new ZIP/source-manifest SHA and artifact, verify PR #19 has only expected 16 files/no reviews/no unresolved threads/mergeable exact head, merge with expected head `641e60c2...`, then require the path-filtered `main` push gate before declaring 0.5.4 released.

## Rotation Checkpoint

Safe to rotate: YES.
Persistence: revision 13 saved.
Active external refs: push `33582428168`; PR `33582421913`; head `641e60c2f95f151ded2c660a19b8e3c5df916843`.
Unpersisted material reasoning: NONE.
