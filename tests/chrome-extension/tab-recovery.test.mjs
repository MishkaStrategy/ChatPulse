import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  replaceBackgroundTab,
  tabRecoveryMode
} from "../../chrome-extension/background/tab-recovery.js";

for (const reason of [
  "discarded-tab",
  "frozen-tab",
  "content-unreachable",
  "page-error",
  "stuck-generation"
]) {
  test(`${reason} uses replacement recovery`, () => {
    assert.equal(tabRecoveryMode(reason), "replace");
  });
}

test("periodic freshness remains a soft reload", () => {
  assert.equal(tabRecoveryMode("periodic-freshness"), "reload");
  assert.equal(tabRecoveryMode("unknown"), "reload");
});

test("background replacement opens the same chat inactive and then removes the old tab", async () => {
  const calls = [];
  const tabsApi = {
    async create(options) {
      calls.push(["create", options]);
      return { id: 22, windowId: options.windowId, url: options.url, active: options.active };
    },
    async remove(id) {
      calls.push(["remove", id]);
    }
  };

  const replacement = await replaceBackgroundTab(
    tabsApi,
    { id: 11, windowId: 7, active: false },
    "https://chatgpt.com/c/example"
  );

  assert.equal(replacement.id, 22);
  assert.deepEqual(calls, [
    ["create", {
      url: "https://chatgpt.com/c/example",
      active: false,
      pinned: false,
      windowId: 7
    }],
    ["remove", 11]
  ]);
});

test("active tab is protected before any destructive operation", async () => {
  let touched = false;
  const tabsApi = {
    async create() { touched = true; return { id: 22 }; },
    async remove() { touched = true; }
  };

  await assert.rejects(
    replaceBackgroundTab(tabsApi, { id: 11, active: true }, "https://chatgpt.com/c/example"),
    /Активная вкладка защищена/
  );
  assert.equal(touched, false);
});

test("replacement rolls back the new tab if the old tab cannot be removed", async () => {
  const removed = [];
  const tabsApi = {
    async create() { return { id: 22 }; },
    async remove(id) {
      removed.push(id);
      if (id === 11) throw new Error("old tab locked");
    }
  };

  await assert.rejects(
    replaceBackgroundTab(tabsApi, { id: 11, active: false }, "https://chatgpt.com/c/example"),
    /old tab locked/
  );
  assert.deepEqual(removed, [11, 22]);
});

test("service worker wires hard recovery through replacement while keeping reload fallback", async () => {
  const source = await readFile(
    new URL("../../chrome-extension/background/service-worker-v2.js", import.meta.url),
    "utf8"
  );
  assert.ok(source.includes('from "./tab-recovery.js"'));
  assert.ok(source.includes('tabRecoveryMode(reason) === "replace"'));
  assert.ok(source.includes("replaceBackgroundTab(chrome.tabs, tab, chatURL)"));
  assert.ok(source.includes("reloadTabAndWait(tab.id, TAB_LOAD_TIMEOUT_MS)"));
});
