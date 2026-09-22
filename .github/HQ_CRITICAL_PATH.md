---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 79
updated_at: 2026-09-22T17:53:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: 9327e20daf6f19aead632424e9e9822d6b908e6e
---

# HQ Critical Path

## Current Release Contract

Release target: ChatPulse 0.8.2 beta — make Pulse 2.0 compatible with the current ChatGPT Project landing composer shown as `Новый чат в … / New chat in …` even when no separate New chat button exists.

Definition of DONE: the direct composer path must work in loaded Chromium, retain the legacy explicit New chat fallback and existing safety boundaries, pass the full PR release/dependency gates, merge through the canonical PR, then reproduce all material evidence on exact post-merge product `main`.

## Repository Basis

- Previous verified release: 0.8.1.
- 0.8.1 immutable product basis: `8d186a53a9764fa032f30d33c078f770a7c016d2`.
- State-only main head before 0.8.2: `c909d04fac4e2b8a19ad8bfc669ed064c7909ec5`.
- Frozen 0.8.2 candidate: `0d799f9691d48b9b80fd9be02c5e1d0d8a58c1ae`.
- Canonical PR: #36, merged.
- Immutable 0.8.2 product merge / release basis: `9327e20daf6f19aead632424e9e9822d6b908e6e`.
- This state document may advance `main` after the immutable product basis above without changing product release contents.

## Bug / Delivered Fix

Owner evidence showed a current ChatGPT Project page where the visible entry point is a large composer labelled `Новый чат в Модульная Стратегия`, with no separate `Новый чат / New chat` button.

0.8.1 performed a one-shot lookup for either an already materialized textarea/contenteditable or an explicit Chat/New chat/Create chat button, which caused the observed error.

0.8.2 now:

- waits up to 12 seconds for bounded Project UI hydration;
- recognizes visible direct project composer shells whose semantic label begins with `Новый чат в` or `New chat in`;
- limits that detection to the main content region, excludes nav/aside and requires a visible element;
- activates the composer shell and waits for the actual textarea/contenteditable before the start message is sent;
- retains the prior explicit `New chat / Chat` action path as fallback;
- preserves the existing auth checks, fail-closed sender, Pulse 1.0 isolation, multi-route runtime, permanent URL capture and bounded retry behavior.

## Validation / Audit Evidence

### Candidate / PR #36

- Candidate SHA: `0d799f9691d48b9b80fd9be02c5e1d0d8a58c1ae`.
- PR release run `35763058034`: SUCCESS.
- PR dependency run `35763058026`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 loaded Chromium screenshot-style Project composer regression: SUCCESS.
  - no legacy New chat button exists in the fixture;
  - visible `Новый чат в Модульная Стратегия` composer shell is activated exactly once;
  - real editor materializes after activation;
  - start message is sent;
  - normal project rotation and permanent `/c/...` URL capture continue successfully.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10710508085`, name `ChatPulse-Chrome-v0.8.2-beta`.
- Candidate ZIP SHA-256: `1ce410d4ffa7a5f5944d93e4f9052bf0afee82742d95a704bc01f89c178b68b5`.
- Candidate source manifest SHA-256: `b06f8f41efcbb4a7bab22fee84a02c6e2f0b80f3cfd1028fae8b68f6ea47f949`.

### Exact post-merge product main

- Product merge SHA: `9327e20daf6f19aead632424e9e9822d6b908e6e`.
- Exact-main release run `35763241468`: SUCCESS.
- Exact-main dependency run `35763241429`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 screenshot-style project-composer loaded Chromium E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Exact-main artifact ID: `10711401391`, name `ChatPulse-Chrome-v0.8.2-beta`.
- Exact-main ZIP SHA-256: `1ce410d4ffa7a5f5944d93e4f9052bf0afee82742d95a704bc01f89c178b68b5`.
- Exact-main source manifest SHA-256: `b06f8f41efcbb4a7bab22fee84a02c6e2f0b80f3cfd1028fae8b68f6ea47f949`.
- Candidate and exact post-merge product main are byte-for-byte identical by canonical release payload hashes.

## Adversarial Review

- Direct composer detection is scoped to `main/[role=main]`, excludes `nav/aside`, requires visibility and a specific `Новый чат в … / New chat in …` prefix.
- Legacy explicit New chat detection remains available as a fallback.
- No production authentication guard or send/capture safety check was relaxed.
- No new blocker remained after loaded-browser and post-merge validation.

## Critical Work

- [x] Root-cause current Project UI incompatibility.
- [x] Add direct project composer-shell detection.
- [x] Add bounded hydration wait and preserve legacy button fallback.
- [x] Add screenshot-style browser regression fixture with no New chat button.
- [x] Pass PR 5/5 full audits, loaded Chromium E2E, dependency and reproducible package gates.
- [x] Complete adversarial review.
- [x] Merge PR #36 with exact-head guard.
- [x] Repeat all material validation on exact post-merge main.
- [x] Verify candidate and exact-main package hashes are identical.
- [x] Persist DONE/VERIFIED evidence.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.2 release contract is complete.

## Next Action

None for this release. Await the next owner-requested bug/feature.

## Recovery Note

Immutable 0.8.2 product release basis is `9327e20daf6f19aead632424e9e9822d6b908e6e`. PR #36 plus candidate/exact-main evidence above satisfy the release contract. The key compatibility behavior is direct activation of current Project composer shells labelled `Новый чат в … / New chat in …` without requiring a separate New chat button.
