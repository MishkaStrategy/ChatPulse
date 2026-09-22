---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 76
updated_at: 2026-09-22T13:15:00Z
project_state: ACTIVE
critical_path_status: EXECUTING
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 6b0021f28a224c1246dfa254c616c3b85980ecd7
---

# HQ Critical Path

## Current Goal

Release ChatPulse 0.8.1 beta with Pulse 2.0 bug fixes and multi-route support requested by the owner.

## Release Contract

0.8.1 must:

- stop live background state updates from overwriting unsaved Pulse 2.0 form input;
- make current-chat URL optional for every route;
- when current chat is empty, create the first project chat, send the start message, capture its permanent `/c/...` URL after the existing two-minute delay, and continue it as cycle 1;
- support multiple independent ChatGPT project routes in one Pulse 2.0 session;
- keep per-route tabs, phases, current URLs, cycle counters, history and errors isolated;
- allow one route to fail/complete without stopping other active routes;
- retain Pulse 1.0 isolation and collision protection;
- preserve the existing bounded URL capture/fail-closed behavior;
- pass proportional regression/audit coverage including repeated full audits and loaded Chromium E2E before merge.

## Current State

- Previous release 0.8.0 remains DONE and verified; immutable product basis `aa1aadfbee6ef7887e2befde68d7567fb0152137`.
- `main` before this work: state-only head `6b0021f28a224c1246dfa254c616c3b85980ecd7`.
- Execution branch: `fix/pulse2-multiroute-0.8.1`.
- Root cause of settings reset identified: `pulse2.js::render()` rewrote form values on every background state push.
- Local focused model/runtime regression suite for the new design: 17/17 PASS before repository commit.

## Critical Work

- [x] Isolate editable UI draft from live runtime state.
- [x] Define schema-v2 multi-route model with legacy single-route migration.
- [x] Make current chat optional and define first-project-chat initialization as cycle 1.
- [x] Serialize background operations to prevent multi-route state clobbering.
- [x] Add route UI, independent runtime/history and regression tests.
- [ ] Commit exact candidate and open canonical PR.
- [ ] Resolve PR-context unit/static/browser/package/dependency gates.
- [ ] Perform adversarial regression review and any required additional audit cycles.
- [ ] Merge only after green evidence.
- [ ] Verify exact post-merge main and persist DONE evidence.

## Blockers

NONE currently known.

## Active Execution

HQ_DIRECT on `fix/pulse2-multiroute-0.8.1`. No parallel writer.

## Decisions / Evidence

- Multi-project means multiple independent routes, not a sequential list sharing one runtime object.
- Common response text/delay/cycle limits remain global; project URL, current chat and runtime are per route.
- One serialized engine operation queue is used to avoid lost updates while still keeping multiple project tabs/cycles active.
- A blank current-chat field is an explicit initialization mode, not a validation error.
- Unsaved form data is held in a UI draft and is never rehydrated from background pushes while dirty/focused.

## Next Action

Create the exact candidate commit on the feature branch, open the PR, and run the full 0.8.1 release gates.

## Recovery Note

Resume from live organizational master + this document. Do not reopen 0.8.0. Current release scope is exactly the three owner-requested Pulse 2.0 fixes plus tests/audits necessary to prove them safely.
