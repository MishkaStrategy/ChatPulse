---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 89
updated_at: 2026-09-23T14:45:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: 110ed24ed369fe0b703c0de17d913556c7e4de0d
---

# HQ Critical Path

## Current Release

ChatPulse 0.8.8 beta — continue safely when ChatGPT returns to an idle composer without producing an assistant reply.

This release preserves the verified 0.8.7 delivery-error reload recovery and fixes the owner-reported deadlock where the Stop control disappears, the blue Voice composer control returns, but no assistant message was created.

## Repository Basis

- Previous verified release: 0.8.7.
- Immutable 0.8.7 product merge / release basis: `2726a8c3f93c2d3fd82cc16093d1c05d0b1b7d52`.
- 0.8.8 frozen candidate: `4354cc9036fe538d14fc2d75567416185b51351e`.
- Product PR: #42, merged.
- Immutable 0.8.8 product merge / release basis: `10fa22809c92b5dab5b517e5dc7a5b4f4780238c`.
- Test-harness stabilization PR: #43, merged.
- Verified main test-state basis before this state-only update: `110ed24ed369fe0b703c0de17d913556c7e4de0d`.
- PR #43 changes only browser E2E timing; it does not change extension/package payload.
- This state-only document may advance `main` without changing release payload.

## Owner-Reported Deadlock Fixed

The failing runtime state was:

1. the latest conversation item is a user message;
2. ChatGPT never creates an assistant reply;
3. the Stop button disappears;
4. the blue Voice/composer button returns, showing that ChatGPT accepts new input again;
5. older ChatPulse logic remained in `waiting-for-assistant` forever.

0.8.8 removes that deadlock.

## Delivered Runtime Guarantees

- The shared content script exposes `readyForNewInput` when a visible enabled Voice composer control is present and generation is not active.
- Supported positive signals include current `composer-speech-button`, `voice-mode-button`, the speech-button container, and bounded Voice aria-label fallbacks.
- The Stop control remains authoritative: while Stop is present, `readyForNewInput` is false and no continuation can be sent.
- Absence of Stop alone is not considered enough evidence; a positive ready-for-input signal is required.
- Pulse 1.0 may continue from a stable latest user message when `readyForNewInput=true`, even when no assistant message exists.
- Pulse 1.0 still performs baseline/fingerprint stabilization first and preserves at-most-once dispatch.
- Pulse 2.0 records an idle user state, applies the normal configured auto-response delay, and then may send the next auto-response.
- Pulse 2.0 can enter rotation from the same idle no-response state when the per-cycle continuation limit is already reached, instead of waiting forever for an assistant reply.
- Repeated same-text commands remain distinct through the real DOM message id and a message-position fallback when an id is absent.
- Existing explicit delivery-error reload handling from 0.8.7 remains unchanged.

## Candidate Evidence — PR #42

- Frozen candidate SHA: `4354cc9036fe538d14fc2d75567416185b51351e`.
- Release run `35874857010`: SUCCESS.
- Dependency run `35874857009`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Chromium MV3 browser E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10756277377`.
- Candidate ZIP SHA-256: `de5b129d21b02ab6c464c976d45b97175ed072fdc70f40bbee5f94e7832d8d47`.
- Candidate source-manifest SHA-256: `232c628fd2028bd4ea2cf02c719eba36456e5a2e7702e373d1584541f26ab770`.

## Post-Merge Validation and Harness Finding

- Product merge SHA: `10fa22809c92b5dab5b517e5dc7a5b4f4780238c`.
- The first product-merge release run `35875198461` reproduced one false-negative browser assertion in the pre-existing alarm-recovery scenario.
- Root cause: the immediately preceding focus-safety scenario can intentionally arm `monitorFocusSuppressedUntil` for 10 seconds; the next test sometimes triggered its alarm inside that grace window, where the product correctly ignored it.
- No product/runtime code was changed to address this.
- PR #43 changed only the browser E2E harness to wait 10.5 seconds before that explicit alarm trigger.
- Test-harness merge SHA: `110ed24ed369fe0b703c0de17d913556c7e4de0d`.

## Verified Main Evidence

- Release run `35876191005`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Chromium MV3 browser E2E: SUCCESS with the focus-grace race removed.
- Reproducible package/provenance: SUCCESS.
- Verified-main artifact ID: `10758011699`.
- Verified-main ZIP SHA-256: `de5b129d21b02ab6c464c976d45b97175ed072fdc70f40bbee5f94e7832d8d47`.
- Verified-main source-manifest SHA-256: `232c628fd2028bd4ea2cf02c719eba36456e5a2e7702e373d1584541f26ab770`.
- Candidate and verified-main package hashes are identical, proving the test-only PR did not change the extension payload.

## Critical Work

- [x] Identify why latest-user-message chats could remain in `waiting-for-assistant` forever.
- [x] Add a positive idle composer / Voice readiness signal.
- [x] Keep Stop authoritative and reject absence-of-Stop as a standalone readiness signal.
- [x] Apply no-assistant-reply progression to Pulse 1.0.
- [x] Apply configured-delay progression and rotation recovery to Pulse 2.0.
- [x] Preserve at-most-once behavior and repeated-message fingerprint distinction.
- [x] Add unit/runtime regression tests for Voice-ready, Stop precedence, delay, duplicate protection and rotation.
- [x] Pass candidate dependency gate, 5/5 audits, Chromium E2E and reproducible package/provenance.
- [x] Merge PR #42 with exact-head guard.
- [x] Diagnose the post-merge E2E false negative without weakening product safety.
- [x] Stabilize only the test harness in PR #43.
- [x] Repeat the full release gate on verified `main`.
- [x] Verify candidate and verified-main package hashes are identical.
- [x] Persist DONE/VERIFIED evidence.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.8 release contract is complete.

## Next Action

Await owner runtime verification or the next requested bug/feature.

## Recovery Note

Do not broaden `readyForNewInput` to mean merely “Stop is absent.” The positive composer-ready signal is the safety boundary that permits no-assistant-reply progression.
