---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 88
updated_at: 2026-09-23T13:54:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: 2726a8c3f93c2d3fd82cc16093d1c05d0b1b7d52
---

# HQ Critical Path

## Current Release

ChatPulse 0.8.7 beta — reload recovery for explicit ChatGPT delivery interruption states in both Pulse 1.0 and Pulse 2.0.

This release preserves the verified 0.8.6 managed-tab/runtime hardening and adds a narrowly scoped recovery path for two owner-reported ChatGPT UI errors.

## Repository Basis

- Previous verified release: 0.8.6.
- Immutable 0.8.6 product merge / release basis: `8ee8977453ea2a4eb891d6d415810300f30433e9`.
- 0.8.7 frozen candidate: `b5a7c75962167de815a122a75effe216cc9f2035`.
- Canonical PR: #41, merged.
- Immutable 0.8.7 product merge / release basis: `2726a8c3f93c2d3fd82cc16093d1c05d0b1b7d52`.
- This state-only document may advance `main` after the immutable product basis without changing release payload.

## Owner-Reported Errors Covered

1. `Время доставки сообщения истекло. Попробуйте еще раз.`
2. `Соединение прервано. Ожидание полного ответа`

The detector also accepts the spelling `ещё`.

## Delivered Runtime Guarantees

- The two explicit ChatGPT UI errors are marked as `reloadRequested` instead of being treated as a normal completed assistant response.
- Pulse 1.0 reloads the affected chat even when its managed tab is active.
- The existing generic `page-error` recovery contract remains unchanged; only the two explicit owner-reported errors bypass the active-tab reload guard.
- Pulse 2.0 reloads the managed chat before normal monitoring continues.
- Pulse 2.0 applies the same reload path during post-send rotation recovery and permanent-URL capture.
- Normal conversation text and composer text are excluded from the explicit UI text scan, preventing ordinary discussion of those phrases from triggering recovery.
- ARIA live/error/status regions remain eligible so ChatGPT can surface the same interruption state inside status UI adjacent to a conversation.
- No auto-response or continuation command is sent while one of these reload-required errors is being handled.

## Candidate Evidence — PR #41

- Frozen candidate SHA: `b5a7c75962167de815a122a75effe216cc9f2035`.
- Release run `35869788871`: SUCCESS.
- Dependency run `35869789214`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Chromium MV3 browser E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10754163167`.
- Candidate ZIP SHA-256: `4d655166f823df7984b13188dcae52c448ea54fd7bdcef2902f42d945f349f34`.
- Candidate source-manifest SHA-256: `efc1a62ad0670df4bbb0c654ac5a8701211929fd0b754544dfd7f8ac4bbb880b`.

## Exact Post-Merge Main Evidence

- Product merge SHA: `2726a8c3f93c2d3fd82cc16093d1c05d0b1b7d52`.
- Release run `35870037937`: SUCCESS.
- Dependency run `35870037939`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Chromium MV3 browser E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Exact-main artifact ID: `10754338398`.
- Exact-main ZIP SHA-256: `4d655166f823df7984b13188dcae52c448ea54fd7bdcef2902f42d945f349f34`.
- Exact-main source-manifest SHA-256: `efc1a62ad0670df4bbb0c654ac5a8701211929fd0b754544dfd7f8ac4bbb880b`.
- Candidate and exact post-merge product `main` are byte-for-byte identical by canonical release hashes.

## Critical Work

- [x] Reproduce the requested behavior contract from the two owner-provided ChatGPT error strings.
- [x] Add explicit reload-required detection without treating ordinary conversation text as a page error.
- [x] Apply reload recovery to Pulse 1.0, including an active managed tab.
- [x] Apply reload recovery to Pulse 2.0 monitoring, rotation recovery and URL capture.
- [x] Add regression coverage for both error strings and both Pulse runtime paths.
- [x] Move release metadata and deterministic packaging to 0.8.7 beta.
- [x] Pass candidate dependency gate, 5/5 audits, Chromium E2E and reproducible package/provenance.
- [x] Merge PR #41 with exact-head guard.
- [x] Repeat material validation on exact post-merge `main`.
- [x] Verify candidate and post-merge package hashes are identical.
- [x] Persist DONE/VERIFIED evidence.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.7 release contract is complete.

## Next Action

Await owner runtime verification or the next requested bug/feature.

## Recovery Note

The explicit reload-required states are intentionally narrower than generic `page-error`. Do not broaden this rule to arbitrary assistant text or all page errors without new owner/runtime evidence.
