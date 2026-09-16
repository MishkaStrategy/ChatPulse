---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 75
updated_at: 2026-09-16T11:03:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: aa1aadfbee6ef7887e2befde68d7567fb0152137
---

# HQ Critical Path

## Current Release Contract

Release target: ChatPulse 0.8.0 beta with a fully separate Pulse 2.0 mode: independent UI/state/scheduler, configurable current-chat + project URLs, configurable auto-response text/delay, configurable continuations per cycle, automatic project-chat rotation, permanent `/c/...` URL capture after a two-minute delay, and a finite cycle count.

Definition of DONE: canonical PR merged after candidate release/dependency gates; exact post-merge product `main` reproduces 5/5 audits, retained Pulse 1.0 Chromium E2E, Pulse 2.0 project-rotation Chromium E2E, reproducible package/provenance, and dependency-policy success.

## Repository Basis

- Previous release: ChatPulse 0.7.9 remains DONE and verified.
- Frozen 0.8.0 candidate head: `3e727dd4205414c1a84fae77945f4a7886ee025a`.
- Canonical PR: #34, merged.
- Exact product merge / release basis: `aa1aadfbee6ef7887e2befde68d7567fb0152137`.
- This file may advance `main` with state-only commits after the immutable product basis above; that does not alter release contents.

## Release Gates

### Candidate / PR evidence

- PR-context release run `35087859711`: SUCCESS.
- PR-context dependency run `35087859547`: SUCCESS.
- Five independent extension audit cycles: 5/5 SUCCESS.
- Loaded-extension Chromium MV3 retained Pulse 1.0 E2E: SUCCESS.
- Loaded-extension Pulse 2.0 project-rotation E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10442848372`, name `ChatPulse-Chrome-v0.8.0-beta`.

### Exact post-merge product-main evidence

- Product merge SHA `aa1aadfbee6ef7887e2befde68d7567fb0152137`.
- Exact-main release run `35088071054`: SUCCESS.
- Exact-main dependency run `35088070984`: SUCCESS.
- Five independent extension audit cycles: 5/5 SUCCESS.
- Loaded-extension Chromium MV3 retained Pulse 1.0 E2E: SUCCESS.
- Loaded-extension Pulse 2.0 project-rotation E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Exact-main artifact ID: `10442274217`, name `ChatPulse-Chrome-v0.8.0-beta`.

### Canonical package identity

Candidate and exact-main produced identical deterministic release payload hashes:

- `ChatPulse-Chrome-v0.8.0-beta.zip` SHA-256: `723566c0dd4badd863c10642e85f19e0b8d92564b36a182e76dab5f22fe0ebf3`.
- `ChatPulse-Chrome-v0.8.0-source-manifest.txt` SHA-256: `2a022c73fe38c0a75a1bc3db2457478472bba48e6ca27190c55e911a5d46f4a0`.
- Packaged extension file count: 27.
- Reproducible timestamp: `2020-01-01T00:00:00`.

## Delivered Pulse 2.0 Behavior

- Separate full-page UI and independent Start/Stop.
- Separate `chatpulse2State`, alarms, runtime channel, counters and managed tab.
- Pulse 1.0 remains on its existing engine; only collision protection reads Pulse 1.0 state.
- Current chat URL + ChatGPT project URL are configured independently.
- Auto-response command and delay are configurable.
- Continuations per cycle and total cycles are configurable.
- After the Nth continuation, Pulse 2.0 waits for the assistant's final response before rotation.
- Rotation opens the configured project in the managed tab, starts a new project chat, sends the configured start message, waits two minutes, then captures the real permanent `/c/...` URL.
- Permanent conversation URLs are never synthesized; bounded capture retries fail closed.
- The captured URL replaces the previous current-chat URL and begins the next cycle with reset per-cycle counters.
- The final configured cycle completes without creating an extra chat.
- Start messages do not increment ordinary continuation counts.
- Simultaneous Pulse 1.0 / Pulse 2.0 control of the same current chat is blocked.

## Material Validation Findings

The new browser gate found and closed two issues before release:

1. Start-time baseline was initially deferred by the scheduler freshness gate. Production logic was corrected so explicit Start establishes a safe baseline immediately while the first auto-response still respects the configured delay.
2. Headless Playwright did not reliably route the first extension-created `chrome.tabs.create()` request. The E2E harness was corrected to drive the actual Pulse 2.0 managed tab deterministically; production authentication guards were not weakened.

## Critical Work

- [x] Define isolated Pulse 2.0 state machine and safety boundaries.
- [x] Implement separate Pulse 2.0 UI/model/background/content helper.
- [x] Add version/package/CI wiring for 0.8.0.
- [x] Add focused model/runtime/static tests and documentation.
- [x] Add loaded-extension Pulse 2.0 project-rotation E2E.
- [x] Freeze and validate exact candidate.
- [x] Pass canonical PR release/dependency gates.
- [x] Merge PR #34 to `main`.
- [x] Verify exact post-merge product `main` and package identity.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.0 release contract is complete.

## Next Action

None for this release. Await a new owner request; do not reopen 0.8.0 without new live evidence.

## Recovery Note

Resume from the live organizational master prompt plus this document. Immutable product release basis is `aa1aadfbee6ef7887e2befde68d7567fb0152137`; PR #34 and exact-main evidence above satisfy the ChatPulse 0.8.0 Pulse 2.0 release contract.
