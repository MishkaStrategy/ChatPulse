#!/usr/bin/env python3
from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, got {count}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# Additive profile field must be reflected in strict legacy expected shapes.
replace_once(
    "tests/chrome-extension/profile-task.test.mjs",
    "    githubWatchEnabled: false,\n    githubRepository: null,\n    githubIdleMinutes: 30\n  });\n\n  const overridden = {",
    "    githubWatchEnabled: false,\n    githubWatchOnly: false,\n    githubRepository: null,\n    githubIdleMinutes: 30\n  });\n\n  const overridden = {",
)
replace_once(
    "tests/chrome-extension/profile-task.test.mjs",
    "    githubWatchEnabled: false,\n    githubRepository: null,\n    githubIdleMinutes: 30\n  });\n});\n\ntest(\"continuation limit allows exactly N dispatches and never requires N+1\", () => {",
    "    githubWatchEnabled: false,\n    githubWatchOnly: false,\n    githubRepository: null,\n    githubIdleMinutes: 30\n  });\n});\n\ntest(\"continuation limit allows exactly N dispatches and never requires N+1\", () => {",
)
replace_once(
    "tests/chrome-extension/profile-task.test.mjs",
    "  assert.equal(state.chats[0].profile.githubWatchEnabled, false);\n  assert.equal(state.chats[0].profile.githubRepository, null);\n",
    "  assert.equal(state.chats[0].profile.githubWatchEnabled, false);\n  assert.equal(state.chats[0].profile.githubWatchOnly, false);\n  assert.equal(state.chats[0].profile.githubRepository, null);\n",
)

# This unrelated service-worker harness now models the Chrome alarms read API used by idempotent synchronization.
replace_once(
    "tests/chrome-extension/task-service-worker.test.mjs",
    "    alarms: {\n      onAlarm: { addListener() {} },\n      async clear() { return true; },\n      async create() {}\n    },\n",
    "    alarms: {\n      onAlarm: { addListener() {} },\n      async get() { return undefined; },\n      async clear() { return true; },\n      async create() {}\n    },\n",
)
