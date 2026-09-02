---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 15
updated_at: 2026-09-02T02:39:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: bf4ee1aaf0802ff852f12392ed46aa6c8bec4e67
---

# HQ Critical Path

## 1. Owner Requests — COMPLETE

Owner request `пересобирай 0.5.4 с новыми хэшами` — DONE.
Owner request `Добавь уведомления в тг` — DONE as a separate ChatPulse 0.5.5 beta release on top of the rebuilt 0.5.4.

No active owner-requested product work remains on the critical path.

## 2. ChatPulse 0.5.4 beta — RELEASED

Canonical release:
- rebuilt branch head `641e60c2f95f151ded2c660a19b8e3c5df916843`;
- PR #19 merged exact-head guarded;
- release/main SHA `4a8ec711a3adde13580e16351997621abe2a95fd`;
- product ZIP SHA-256 `c5751017ae42f3f37d1e6c333d31789df7d204335f2e5ff3a4f45f8cc32bf8d0`;
- source manifest SHA-256 `ee2aa2178707011c2d87ea9f4c0aa3195f1cf324590bd58401a77dfef54410a4`;
- post-merge run `33582724814`: 5/5 audit cycles + reproducible package/security PASS;
- post-merge artifact ID `9828998086`.

The historical incomplete Issue #14 hashes are RETIRED and remain evidence only. PR #15 is CLOSED UNMERGED as superseded.

Released 0.5.4 guarantees preserved by all later work:
- optional stop phrase, empty by default, max 500 chars;
- latest completed assistant response only;
- NFKC/case-insensitive/collapsed-whitespace substring match;
- match disables only the matching chat and never dispatches continuation;
- newer manual `controlRevision` fully rejects stale in-flight runtime state and preserves a fresh baseline;
- existing at-most-once and stale-tab recovery protections remain intact.

## 3. ChatPulse 0.5.5 beta — TELEGRAM RELEASED

Canonical implementation branch head:
`feature/telegram-notifications@63bf67191c94e823ec1d76991505f45b7e1616ff`.

Canonical merge PR:
- PR #20 `Выпустить ChatPulse 0.5.5 beta с Telegram-уведомлениями`;
- merged with exact-head guard;
- release/main product SHA `bf4ee1aaf0802ff852f12392ed46aa6c8bec4e67`.

Historical Draft PR #18 was closed unmerged after the current GitHub connector could not transition Draft→Ready; it is implementation history only. PR #20 received a fresh independent merge-tree gate and is the canonical release PR.

### Telegram product/security contract

- Telegram notifications are optional and disabled by default.
- Permanent `host_permissions` remain only `https://chatgpt.com/*` and `https://chat.openai.com/*`.
- `https://api.telegram.org/*` is the only `optional_host_permissions` entry.
- Chrome requests Telegram access only from a direct settings/test user gesture.
- Telegram chat ID and bot token are stored in a separate `chrome.storage.local` config.
- Public runtime state exposes only `enabled`, `chatId`, `tokenConfigured` and `permissionGranted`; it never exposes the bot token.
- After saving, the bot token is not rendered back into the UI.
- Telegram receives only the tracked chat title and continuation outcome; ChatGPT response text, conversation URL, stop phrase and continuation command are not sent.
- Notification execution occurs only after `recordDispatch()` has fixed the at-most-once outcome.
- Telegram timeout/API error/permission revocation is non-critical and cannot retry a ChatGPT command or roll back continuation state.
- Unrelated command/stop-phrase/interval/theme saves do not validate or rewrite Telegram config if Telegram controls were not changed.

### Exact-head branch evidence

Run `33583428604` on exact head `63bf67191c94e823ec1d76991505f45b7e1616ff`:
- 5/5 audit cycles PASS;
- 30/30 tests PASS per cycle, 0 failures;
- 0.5.4 stop/controlRevision/recovery/at-most-once regressions PASS;
- `telegram_config_privacy` PASS;
- `telegram_send` PASS;
- `telegram_permission_gate` PASS;
- `unrelated_settings_isolation` PASS;
- combined Manifest/static/security validation PASS;
- reproducible package built twice identically;
- artifact ID `9829225115`.

### Canonical PR merge-tree evidence

PR #20 run `33583710223`, merge-tree SHA `5d479e795247634d942b69daface89224461b477`:
- 5/5 audit cycles PASS;
- package/security/provenance PASS;
- exact same product/source hashes as branch run;
- artifact ID `9829317327`.

### Post-merge main evidence

Run `33583864833` on exact merge/main SHA `bf4ee1aaf0802ff852f12392ed46aa6c8bec4e67`:
- 5/5 audit cycles PASS;
- reproducible package built twice identically;
- combined stop-phrase + Telegram optional-permission static/security validation PASS;
- secret scan PASS;
- canonical hashes repeated bit-for-bit;
- final retained artifact ID `9829371323`, 36481 bytes, live until `2026-09-03T02:36:49Z` under repository one-day retention cap.

Canonical 0.5.5 provenance:
- product ZIP `ChatPulse-Chrome-v0.5.5-beta.zip` SHA-256 `4d7f8a0ca3941e69841ad2a69256ccd85f6da354e6093c118ba26047a0b454c8`;
- source manifest `ChatPulse-Chrome-v0.5.5-source-manifest.txt` SHA-256 `00df7a22a1eeb19b86e4b1f57e4189b02e521a329ebb7ff0190b08cc50b63779`;
- packaged extension file count 13.

The Actions wrapper artifact digest is transport metadata and is not the product ZIP hash.

Live `main` Manifest after merge confirms:
- version `0.5.5` / `0.5.5 beta`;
- permanent permissions `alarms`, `scripting`, `storage`, `tabs`;
- permanent hosts ChatGPT only;
- Telegram only in `optional_host_permissions`.

## 4. Release Gates

0.5.4 rebuilt release: 6/6 SATISFIED — RELEASED.
0.5.5 Telegram release:
- fresh 0.5.4 base reconciliation: SATISFIED;
- Telegram implementation/security boundary: SATISFIED;
- exact branch 5-cycle validation: SATISFIED;
- canonical PR merge-tree validation: SATISFIED;
- reproducible source/artifact provenance: SATISFIED;
- exact-head merge + post-merge main validation: SATISFIED.

0.5.5 status: RELEASED.

## 5. Current Critical Path

Status: DONE.

There is no remaining executable owner-requested critical-path item. Draft PR #17 runner-selector refactor and other historical branches remain explicitly outside this completed product release scope unless a future owner decision promotes them.

## 6. Active Execution Registry

HQ: NONE active.
PROJECT_RUNNER: NONE active.
Workers: NONE.
Codex: NONE.
Human gate: NONE.

## 7. Safety / Adversarial Controls Verified

- damaged historical Issue #14 payload was never executed as a release source;
- old source/artifact hashes were not silently reused;
- 0.5.4 fresh-baseline race was found before release and permanently regression-tested;
- Telegram never became a permanent host permission;
- bot token is absent from public runtime state and intentional logs;
- response text/URL/stop phrase/command are not Telegram payload fields;
- Telegram failure cannot alter at-most-once continuation behavior;
- ordinary settings remain isolated from Telegram permission state;
- branch, PR merge-tree and post-merge main all independently reproduced the same final 0.5.5 hashes.

## 8. Six Critical Path Audits

Repository Coverage Audit: PASS — rebuilt 0.5.4, Telegram 0.5.5, canonical PRs, post-merge main, tests, permissions and provenance surfaces covered.
Evidence Audit: PASS — each final release is supported by exact-head branch, merge-tree and post-merge evidence with reproducible product/source hashes.
Release Alignment Audit: PASS — 0.5.4 rebuild and Telegram owner requests are both fully delivered; unrelated PR #17 is not silently included.
Dependency & Ordering Audit: PASS — rebuild → post-merge verification → Telegram rebase → exact-head/merge-tree gates → merge → post-merge verification.
Execution & Parallelism Audit: PASS — product writes stayed on one canonical branch per release; validation runners were read-only; temporary control workflows were removed.
Adversarial Audit: PASS — stale payload reuse, stale validation evidence, cross-chat stop leakage, baseline race, permanent Telegram permission, token exposure, notification-triggered retries and premature merges were all rejected or regression-tested.

## 9. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: ChatPulse 0.5.5 beta post-merge main gate completed successfully and canonical terminal state revision 15 was persisted.
Active external executions: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read this revision; no recovery action is required unless a new owner request changes project scope.
