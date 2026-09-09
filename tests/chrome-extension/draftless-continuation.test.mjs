import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_COMMAND,
  applyPortableConfig,
  normalizeState,
  planTabRecovery
} from "../../chrome-extension/lib/model-v2.js";

const LEGACY_DEFAULT_COMMAND = "продолжай и не останавливайся до технического лимита";

test("legacy stock continuation command migrates to go without touching custom commands", () => {
  assert.equal(DEFAULT_COMMAND, "go");
  assert.equal(normalizeState({ commandText: LEGACY_DEFAULT_COMMAND }).commandText, "go");
  assert.equal(normalizeState({ commandText: "custom continue" }).commandText, "custom continue");

  const imported = applyPortableConfig({
    format: "chatpulse-config",
    version: 1,
    defaults: { commandText: LEGACY_DEFAULT_COMMAND },
    chats: []
  });
  assert.equal(imported.commandText, "go");
});

test("composer draft never blocks freshness recovery", () => {
  const recovery = planTabRecovery({
    tab: { id: 1, active: false, discarded: false, frozen: false },
    snapshot: {
      hasDraft: true,
      errorDetected: false,
      isGenerating: false,
      generationAgeMs: 0
    },
    chat: { lastHardRefreshAt: "2000-01-01T00:00:00.000Z" },
    intervalMinutes: 5,
    now: Date.parse("2026-09-09T05:00:00.000Z")
  });

  assert.deepEqual(recovery, { refresh: true, reason: "periodic-freshness" });
});

test("content script never reports or rejects a composer draft", async () => {
  const source = await readFile(
    new URL("../../chrome-extension/content/content-script.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /hasDraft:\s*false/);
  assert.doesNotMatch(source, /автоматическая отправка отменена/);
  assert.doesNotMatch(source, /if \(normalize\(readInputValue\(input\)\)\)/);
});