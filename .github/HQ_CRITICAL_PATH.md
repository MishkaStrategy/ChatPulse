---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 87
updated_at: 2026-09-23T05:46:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: 8ee8977453ea2a4eb891d6d415810300f30433e9
---

# HQ Critical Path

## Current Release

ChatPulse 0.8.6 beta — adversarial Pulse 2.0 runtime hardening after the verified 0.8.5 overnight-monitoring release.

The requested additional testing is complete. The expanded suite intentionally exercised tab loss, SPA URL races, manual focus changes, recovery after worker interruption, duplicate-tab risks, capture isolation, unconfirmed sends and Stop → Start lifecycle behavior.

## Repository Basis

- Previous verified release: 0.8.5.
- 0.8.5 immutable product basis: `aad546080ebac191e424e05c4e583b2678ea30e4`.
- 0.8.6 frozen candidate: `447fc4498ff05157abf4aee99d4d19e2494eb693`.
- Canonical PR: #40, merged.
- Immutable 0.8.6 product merge / release basis: `8ee8977453ea2a4eb891d6d415810300f30433e9`.
- This state-only document may advance `main` after the immutable product basis without changing release payload.

## Adversarial Findings Fixed

The additional audit found and fixed these product/runtime defects or races:

1. Stop → Start could open duplicate managed ChatGPT tabs instead of reusing a valid route-owned tab.
2. **Open Current Chat** bypassed the background engine and created an unmanaged duplicate.
3. Unexpected monitoring failures could re-foreground a broken route every 30 seconds without bounded backoff.
4. A replacement tab could report `complete` before it had reached the expected ChatGPT target URL.
5. Correct URL load could precede ChatGPT profile/composer DOM hydration and cause a false auth failure.
6. A readiness event could occur between the initial tab read and `tabs.onUpdated` subscription, causing a false 45-second timeout.
7. **Open Current Chat** during `rotating/capture-wait` could replace the in-flight new-chat managed tab with the old chat.
8. Rotation recovery could adopt an unrelated ChatGPT chat.
9. Capture-wait could persist an unrelated ChatGPT chat as the next cycle.
10. Lost managed-tab recovery could hijack a user-owned tab showing the same chat; recovery now creates a fresh route-owned replacement instead.
11. Permanent-URL capture could inspect a background tab before ChatGPT hydrated it.
12. A transient unauthenticated snapshot could survive one hydration window; recovery now performs one bounded foreground reload + retry.
13. `submitted-unconfirmed` auto-responses could advance counters/rotation without proven DOM delivery; only confirmed delivery counts immediately, with later assistant continuation allowed to confirm the prior send.
14. A different chat inside the same Project could be mistaken for the new chat during recovery.
15. Post-send recovery trusted potentially stale `chrome.tabs.Tab.url`; it now prefers page-authoritative `location.href`, does not create a duplicate while a checkpointed URL is pending, and fails explicitly after a bounded 5-minute window.
16. A user tab switch between first inspection and the second send/rotate verification could be overwritten by a second forced foreground.
17. An already queued monitor alarm could immediately undo a respected manual focus switch; a bounded focus grace now suppresses that alarm.
18. SPA `history.replaceState()` could move the real page URL before Chrome tab metadata caught up during capture; capture now uses content snapshot URL as authoritative and re-validates Project ownership.
19. Focus grace could fail to arm when the initial `previousFocus` snapshot was unavailable; the active-tab mismatch is now detected before the optional prior-tab restore check.

A test-harness defect was also found: the manual-focus regression used non-unique `about:blank` tabs and could compare against the wrong tab ID. The test now uses a unique URL, while retaining the product focus assertion.

## Delivered Runtime Guarantees

- Route-owned managed tabs are reused only when their saved `tabId` and target still match.
- User-owned matching ChatGPT tabs are never opportunistically hijacked after managed-tab loss.
- Replacement tabs wait for both target URL and page readiness before inspection.
- ChatGPT auth/DOM hydration has bounded retry and one bounded reload recovery.
- Monitoring, project rotation and URL capture explicitly foreground ChatGPT where rendering is required.
- Manual user focus changes are respected; follow-up work is deferred instead of repeatedly stealing focus.
- **Open Current Chat** uses the engine-managed tab and is disabled/rejected during rotation/capture.
- Recovery and capture require Project ownership; post-send recovery additionally requires a persisted dispatch checkpoint and rejects route-history URLs.
- SPA navigation uses authoritative content `location.href` where Chrome tab metadata can lag.
- Unconfirmed auto-responses do not advance counters or rotation thresholds.
- Unexpected monitor failures use bounded retry rather than 30-second focus hammering.
- Pulse 1.0 state remains isolated and is not written by Pulse 2.0.

## Candidate Evidence — PR #40

- Frozen candidate SHA: `447fc4498ff05157abf4aee99d4d19e2494eb693`.
- Release run `35823379598`: SUCCESS.
- Dependency run `35823379365`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension browser E2E: SUCCESS.
- Expanded Pulse 2.0 loaded-Chromium E2E: SUCCESS, including:
  - form draft preservation;
  - optional current chat;
  - multi-route save;
  - rotation recovery;
  - same-project untrusted recovery guard;
  - post-send checkpoint recovery;
  - unrelated-chat recovery guard;
  - Project foreground;
  - overnight monitor alarm;
  - monitor focus restore;
  - foreground URL capture + focus restore;
  - closed managed-tab recovery;
  - user-owned matching-tab isolation;
  - manual focus guard;
  - Stop → Start managed-tab reuse;
  - Open Current Chat rotation guard + reuse;
  - unrelated capture guard;
  - full rotation and Pulse 1 isolation.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10734225957`.
- Candidate canonical ZIP SHA-256: `c8eefb63596c32fa12c5c4055de86842023e0cd6351806a9f7f8bd737842c0f5`.
- Candidate source-manifest SHA-256: `f4bb8f7cf61fea49c609bb362eb41d3c598ec2051ff04e9ec29fd8af9ab32131`.

## Exact Post-Merge Main Evidence

- Product merge SHA: `8ee8977453ea2a4eb891d6d415810300f30433e9`.
- Release run `35823589766`: SUCCESS.
- Dependency run `35823589764`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 browser E2E: SUCCESS.
- Expanded Pulse 2.0 adversarial browser E2E: SUCCESS with all candidate markers reproduced.
- Reproducible package/provenance: SUCCESS.
- Exact-main artifact ID: `10734490580`.
- Exact-main canonical ZIP SHA-256: `c8eefb63596c32fa12c5c4055de86842023e0cd6351806a9f7f8bd737842c0f5`.
- Exact-main source-manifest SHA-256: `f4bb8f7cf61fea49c609bb362eb41d3c598ec2051ff04e9ec29fd8af9ab32131`.
- Candidate and exact post-merge product `main` are byte-for-byte identical by canonical release hashes.

## Critical Work

- [x] Perform adversarial testing beyond the 0.8.5 release gate.
- [x] Expand unit/static and loaded-Chromium coverage for tab lifecycle, focus, capture and recovery.
- [x] Fix every product defect exposed by the new tests without weakening the acceptance criteria.
- [x] Correct the one ambiguous focus-test harness condition without weakening the product assertion.
- [x] Pass candidate dependency gate, 5/5 audits, expanded browser E2E and reproducible package gate.
- [x] Merge PR #40 with exact-head guard.
- [x] Repeat all material validation on exact post-merge `main`.
- [x] Verify candidate and exact-main package hashes are identical.
- [x] Persist DONE/VERIFIED evidence.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.6 adversarial hardening release is complete.

## Next Action

Await owner runtime verification or the next requested bug/feature.

## Recovery Note

Immutable 0.8.6 product release basis is `8ee8977453ea2a4eb891d6d415810300f30433e9`. Do not reopen this release based on the old 0.8.5 lifecycle assumptions without new runtime evidence.
