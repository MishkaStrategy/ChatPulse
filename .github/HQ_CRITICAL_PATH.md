---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 24
updated_at: 2026-09-02T07:40:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 408d95ff256eb70e0442ae36f912d4a528fcbe35
---

# HQ Critical Path

## 1. Released contract — ChatPulse 0.7.0 beta

ChatPulse 0.7.0 beta is **RELEASED**.

Owner scope delivered: per-chat GitHub Actions inactivity watchdog. A project chat can bind to a public GitHub repository in `owner/repo` form and a configured idle window `N`; if no new GitHub Actions workflow run appears for that repository for `N` minutes, ChatPulse may perform one controlled restart-send for that inactivity episode.

Repository activity is defined as creation of a new latest GitHub Actions workflow-run ID. Restart stays in the same ChatGPT conversation and uses the chat's effective continuation command.

## 2. Released product identity

Canonical release branch: `release/0.7.0-github-actions-watchdog`.
Frozen branch head: `0d5f8e941c04a2a231dc846c5d45180a7514f78b`.
Canonical PR: **#22**.
PR merge-tree SHA: `bd5a375ce4fb45b42c935086722bea8ebba33875`.
Released product merge on `main`: `408d95ff256eb70e0442ae36f912d4a528fcbe35`.
Manifest at released product: `0.7.0` / `0.7.0 beta`, Manifest V3, Chrome 120+.

Canonical product ZIP SHA-256:
`46b66e8dd951fd40625134f54661ed18fed180796ebd2e0c7d5b5b6c35f89f3d`

Canonical source-manifest SHA-256:
`32d6e9f1d1a2267e400fe2e0c55d245c2e624ec30753eb4f2cc6ebc2583f34bc`

Packaged extension file count: 15.
Reproducible timestamp: `2020-01-01T00:00:00`.

## 3. Delivered watchdog safety contract

- schema v5; watchdog disabled by default;
- strict `owner/repo` repository normalization;
- idle timeout bounded to 10–10080 minutes;
- GitHub public API polling no more often than every 10 minutes;
- repositories deduplicated per cycle and limited to eight unique active repositories;
- `https://api.github.com/*` exists only in `optional_host_permissions`;
- public client sends no GitHub token or `Authorization` header and performs no repository writes/workflow dispatches;
- first successful repository observation establishes a fresh baseline and can never immediately restart from an old historical run;
- a new workflow-run ID resets the inactivity episode and restart idempotency;
- a successful empty Actions run list creates a baseline at observation time;
- permission/network/403/404/rate-limit/malformed responses are errors only and never inactivity;
- restart selection requires a successful poll for that repository in the current watchdog cycle;
- each activity marker permits at most one submitted restart until a new workflow run appears;
- watchdog restart does not call `startChatRun()` and does not reset `runStartedAt` or `continuationCount`;
- live master engine/task scope/chat enabled state, `controlRevision`, global session, limits, stop phrase, authentication/page readiness, active generation, user draft and fresh DOM preflight are revalidated before send;
- watchdog can nudge an externally stalled already-commanded response only under its separate repository-episode idempotency; ordinary response-level at-most-once behavior is unchanged;
- a real watchdog restart performs `recordDispatch()` plus `recordGithubRestart()` and is durably checkpointed before optional notifications;
- top Stop remains the master stop for watchdog sending;
- portable JSON contains only non-secret watcher configuration and excludes workflow run IDs, activity/check timestamps, restart keys/counts/history and watchdog errors.

## 4. Released implementation surfaces

- `chrome-extension/lib/model-v2.js`: schema v5, watcher profile/runtime state, baseline/activity/restart/error/poll transitions.
- `chrome-extension/background/github-actions.js`: public read-only GitHub Actions API client.
- `chrome-extension/background/service-worker-v2.js`: serialized polling, fail-closed current-success gate and controlled same-chat restart.
- Control Center: per-chat GitHub enabled toggle, `owner/repo`, idle `N`, permission request and runtime status.
- portable configuration: watcher settings included, runtime excluded.
- manifest/package/static validator/release workflow/docs/privacy/security moved to 0.7.0.
- no temporary HQ helper workflows/scripts remain in the released product diff.
- unrelated PR #17 runner-policy scope was not incorporated.

## 5. Release evidence

### Frozen branch
Run `33603354170` on exact `0d5f8e94...`:
- five independent audit cycles: **5/5 PASS**;
- **80/80 tests PASS** per cycle;
- legacy recovery/active-tab/stop-phrase/confirmed and unconfirmed at-most-once regressions PASS;
- GitHub client/baseline/idempotency/polling/runtime/optional-permission/export tests PASS;
- static security/privacy watchdog boundary PASS;
- reproducible package/security/provenance PASS;
- canonical ZIP and source-manifest hashes reproduced twice;
- branch artifact ID `9836185628`.

### Canonical PR #22 merge tree
Exact merge-tree SHA `bd5a375ce4fb45b42c935086722bea8ebba33875`.
Release run `33603905456`:
- merge-ref checkout explicitly verified the merge-tree SHA;
- five audit cycles: **5/5 PASS**;
- **80/80 tests PASS**;
- static PASS;
- package/security/provenance PASS;
- ZIP/source-manifest hashes exactly equal the frozen branch values.
Dependency runner policy run `33603905391`: PASS.
Reviews: none.
Unresolved review threads: none.
Mergeability before merge: true.

### Post-merge main
Product commit `408d95ff256eb70e0442ae36f912d4a528fcbe35`.
Release run `33604290732`:
- five independent audit cycles: **5/5 PASS**;
- inspected main cycle verifies exact product SHA, `0.7.0-beta.1`, **80/80 PASS**, legacy safety regressions PASS and static watchdog audit PASS;
- reproducible package built twice identically;
- package/security/provenance PASS;
- ZIP SHA exactly `46b66e8d...`;
- source-manifest SHA exactly `32d6e9f1...`;
- main artifact ID `9836499086`.
Dependency runner policy run `33604290755`: PASS.
Released manifest confirms GitHub API is optional only; permanent host permissions remain ChatGPT domains.

## 6. Release gates

GATE-1 predecessor 0.6.0 release: SATISFIED.
GATE-2 schema/watchdog model/migration: SATISFIED.
GATE-3 GitHub client/runtime/fail-closed API handling: SATISFIED.
GATE-4 Control Center/config/docs/optional-permission/privacy: SATISFIED.
GATE-5 exact frozen branch regression/package/security: SATISFIED.
GATE-6 canonical PR merge-tree equality/reviews/threads: SATISFIED.
GATE-7 exact-head merge + post-merge main equality: SATISFIED.

## 7. Critical path

All release-critical work for owner-requested GitHub Actions watchdog is complete.

CP-1 branch implementation/validation: DONE.
CP-2 canonical PR merge-tree validation: DONE.
CP-3 exact-head merge/post-merge equality: DONE.
CP-4 release persistence: DONE by this state-only commit.

## 8. Active execution registry

HQ: DONE for ChatPulse 0.7.0 watchdog release.
PROJECT_RUNNER: no active release-critical execution.
Workers: NONE.
Codex: NONE.
Human gate: NONE.

## 9. Current blockers

NONE.

## 10. Six critical-path audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — branch, merge-tree and post-merge main are independently evidenced.
Release Alignment Audit: PASS — delivered requested public GitHub Actions inactivity watchdog only; private auth/GitHub writes/cloud/new-chat scope excluded.
Dependency & Ordering Audit: PASS — predecessor → model → runtime → UI → release surface → branch → PR → main.
Execution & Parallelism Audit: PASS — one canonical writer and exact-ref project runner validation avoided conflicting changes.
Adversarial Audit: PASS — API failure cannot cause restart; polling is bounded; optional permission remains opt-in; restart is one-per-activity-marker; counters/guards/session/control/draft/generation/master-stop are preserved; runtime data is excluded from export.

## 11. Next action

No release-critical action remains. Await the next owner scope or a new evidence-backed regression.

## 12. Chat rotation checkpoint

Safe to rotate: YES.
Last completed atomic action: product `408d95ff...` passed post-merge main 5/5 audit, 80/80 tests, static/dependency/package/security/provenance equality; revision 24 marks the release DONE.
Active external execution: NONE.
Unpersisted material reasoning: NONE.
Recovery: live-read master prompt, this revision and current main; treat `408d95ff...` as the released 0.7.0 product basis beneath later state-only HQ commits.
Rotation blockers: NONE.
