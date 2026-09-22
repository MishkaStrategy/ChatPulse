---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 83
updated_at: 2026-09-22T19:31:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: 05fa17ee3c61998ca5a2a302e16e9d19a87bd60a
---

# HQ Critical Path

## Current Release Contract

Release target: ChatPulse 0.8.4 beta — ensure Pulse 2.0 foregrounds the route-owned ChatGPT Project tab before creating the first or next project chat.

Definition of DONE: a deliberately backgrounded Project tab is made active by Pulse before composer discovery, normal and recovery rotation both pass in loaded Chromium, existing-chat monitoring remains background-capable, and exact post-merge `main` reproduces the frozen candidate package identity.

## Repository Basis

- Previous verified release: 0.8.3.
- 0.8.3 immutable product basis: `a3fb895bf5e89fe47faf9ede763be3c6a04b88b8`.
- 0.8.4 frozen candidate: `95704df3e305bce8f02e3ea1217ff27b06fd99dc`.
- Canonical PR: #38, merged.
- Immutable 0.8.4 product merge / release basis: `05fa17ee3c61998ca5a2a302e16e9d19a87bd60a`.
- This state document may advance `main` after the immutable product basis above without changing product release contents.

## Root Cause / Delivered Fix

Owner evidence showed **«Не найдено поле нового чата внутри проекта ChatGPT.»** while the newly opened Project tab remained in the background. Live 0.8.3 code confirmed that `performPulse2Rotation()` created, navigated and reused the Project tab with `active: false` before attempting composer discovery.

0.8.4 now:

- when a route starts without a current chat, opens its Project tab active instead of making project initialization purely background;
- before every first-chat or next-chat rotation, explicitly activates the route-owned managed tab;
- focuses the containing Chrome window when possible;
- keeps the Project tab foregrounded through page completion, settle/hydration wait, Project-composer discovery and start-message submission;
- applies the same foregrounding to 0.8.3 alarm-driven rotation recovery;
- leaves ordinary monitoring of already existing chats background-capable;
- preserves Pulse 1.0 isolation, multi-route serialization, auth/fail-closed behavior, durable rotation recovery and bounded permanent-URL capture.

## Validation Evidence

### Candidate / PR #38

- Candidate SHA: `95704df3e305bce8f02e3ea1217ff27b06fd99dc`.
- PR release run `35773734998`: SUCCESS.
- PR dependency run `35773735236`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 loaded-extension E2E:
  - unsaved settings draft: PASS;
  - optional current chat: PASS;
  - multi-route save: PASS;
  - rotation recovery: PASS;
  - **Project foreground switching: PASS**;
  - retained full rotation: PASS;
  - Pulse 1.0 isolation: PASS.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10714549563`, name `ChatPulse-Chrome-v0.8.4-beta`.
- Candidate ZIP SHA-256: `18fda3bc7715ae36c09497b01c022472365bb91aea64d86ba20c7638b6823435`.
- Candidate source manifest SHA-256: `78c4e93c26e16f2b68c7a4e8e584c5f86c6396192a45e89f0d70df180f7faaa0`.

### Exact post-merge product main

- Product merge SHA: `05fa17ee3c61998ca5a2a302e16e9d19a87bd60a`.
- Exact-main release run `35773934679`: SUCCESS.
- Exact-main dependency run `35773934916`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 loaded-extension E2E including `project_foreground=PASS`: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Exact-main artifact ID: `10714843621`, name `ChatPulse-Chrome-v0.8.4-beta`.
- Exact-main ZIP SHA-256: `18fda3bc7715ae36c09497b01c022472365bb91aea64d86ba20c7638b6823435`.
- Exact-main source manifest SHA-256: `78c4e93c26e16f2b68c7a4e8e584c5f86c6396192a45e89f0d70df180f7faaa0`.
- Candidate and exact post-merge product `main` are byte-for-byte identical by canonical release payload hashes.

## Adversarial Review

- Foreground switching is scoped to `rotating` / project-chat creation; ordinary existing-chat monitoring is not forced to the foreground.
- Multi-route rotations remain serialized by the existing engine queue, so only the route currently creating a chat is foregrounded at that moment.
- If alarm recovery resumes a route already on a newly created concrete `/c/...` URL, the same route-owned tab is activated before recovery adopts it.
- Window focus is best-effort; active-tab selection is the required behavior and remains available if window focusing fails.
- Composer/auth checks were not weakened.
- No blocker remained after exact-main loaded-browser validation.

## Critical Work

- [x] Confirm owner-reported failure corresponds to background Project-tab rotation.
- [x] Foreground the managed Project tab before composer lookup.
- [x] Focus the containing Chrome window when possible.
- [x] Keep ordinary monitoring background-capable.
- [x] Add static foreground-tab contract coverage.
- [x] Add loaded-Chromium regression beginning with an intentionally backgrounded Project tab.
- [x] Pass candidate dependency gate and 5/5 audits.
- [x] Pass candidate loaded Chromium foreground/recovery/rotation E2E.
- [x] Produce deterministic 0.8.4 candidate package.
- [x] Merge PR #38 with exact-head guard.
- [x] Repeat all material validation on exact post-merge `main`.
- [x] Verify exact-main package hashes equal candidate byte-for-byte.
- [x] Persist DONE/VERIFIED evidence.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.4 release contract is complete.

## Next Action

None for this release. Await owner runtime verification or next requested bug/feature.

## Recovery Note

Immutable 0.8.4 product release basis is `05fa17ee3c61998ca5a2a302e16e9d19a87bd60a`. The owner-requested behavior — switch to the managed Project tab before looking for the new-chat composer — is covered by loaded-Chromium foreground assertions on both PR and exact post-merge `main`.
