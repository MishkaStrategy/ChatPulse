---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 74
updated_at: 2026-09-16T09:33:00Z
project_state: ACTIVE
critical_path_status: EXECUTING
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: feature/pulse-2-autonomous-rotation
basis_sha: 8999a3ac885ccf019301b66c8003710b999b549e
---

# HQ Critical Path

## Current Goal

Release ChatPulse 0.8.0 beta with a fully separate Pulse 2.0 mode: independent UI/state/scheduler, configurable chat + project URL, configurable auto-response delay/text, configurable auto-responses per cycle, automatic creation/capture of the next project chat, and a configurable finite cycle count.

## Current State

- Previous ChatPulse 0.7.9 release remains DONE and verified; immutable product merge basis: `91eb5c36e7affdc6bd9813f0a4ed487bc497e109`.
- New work starts from current `main` `8999a3ac885ccf019301b66c8003710b999b549e`.
- Execution branch: `feature/pulse-2-autonomous-rotation`.
- Pulse 2.0 is intentionally isolated from Pulse 1.0; only collision protection may read Pulse 1.0 state.

## Release Contract

Pulse 2.0 must provide:

- separate full-page extension UI and separate Start/Stop;
- separate storage, scheduler alarms, runtime channel and counters;
- current chat URL + ChatGPT project URL;
- configurable continuation text/delay;
- configurable continuations per cycle and total cycle count;
- after the Nth continuation, wait for the final assistant response before rotating;
- create the next chat through the configured project, send a start message, then wait 2 minutes before capturing the permanent `/c/...` URL;
- replace the current URL with the captured URL and continue the next cycle;
- stop after the configured final cycle without creating an extra chat;
- fail closed on ambiguous URL/auth/project-composer/capture failures;
- prevent simultaneous control of the same current chat by Pulse 1.0 and Pulse 2.0;
- retain all 0.7.9 Pulse 1.0 behavior and existing release/security gates.

Definition of DONE: implementation merged through PR, 5/5 extension audits + retained Chromium MV3 E2E + reproducible 0.8.0 package/provenance pass on the candidate/PR, followed by exact-main validation or equivalent release evidence.

## Critical Work

- [x] Define isolated Pulse 2.0 state machine and safety boundaries.
- [x] Implement separate Pulse 2.0 UI/model/background/content helper.
- [x] Add version/package/CI wiring for 0.8.0.
- [x] Add focused Pulse 2.0 unit/static tests and documentation.
- [ ] Commit exact candidate to feature branch.
- [ ] Run PR-context release/dependency gates and resolve failures.
- [ ] Merge canonical PR after gates are satisfied.
- [ ] Verify exact post-merge main and mark release DONE.

## Blockers

NONE currently known.

## Active Execution

HQ_DIRECT on `feature/pulse-2-autonomous-rotation`. No parallel worker writes.

## Decisions / Evidence

- New chat URL is never synthesized; capture begins only after a 2-minute delay after the first message and then retries boundedly.
- The initial chat is cycle 1; `maxCycles` counts total chats/cycles, not number of rotations.
- New-chat start message is separate from and does not increment the ordinary continuation count.
- Rotation starts only after the assistant finishes responding to the Nth continuation.

## Next Action

Create the exact feature commit, open the canonical PR to `main`, and inspect PR-context CI.

## Recovery Note

Resume from live master + this document. Do not reopen 0.7.9. Current change is a new 0.8.0 release scope on `feature/pulse-2-autonomous-rotation` based on `8999a3ac885ccf019301b66c8003710b999b549e`.
