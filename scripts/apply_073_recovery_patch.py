#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}: {old[:80]!r}")
    write(path, text.replace(old, new, 1))


def replace_all(path, old, new, minimum=1):
    text = read(path)
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f"{path}: expected at least {minimum} matches, found {count}: {old!r}")
    write(path, text.replace(old, new))


TAB_RECOVERY = r'''const REPLACEMENT_RECOVERY_REASONS = new Set([
  "discarded-tab",
  "frozen-tab",
  "content-unreachable",
  "page-error",
  "stuck-generation"
]);

export function tabRecoveryMode(reason) {
  return REPLACEMENT_RECOVERY_REASONS.has(String(reason || "")) ? "replace" : "reload";
}

export async function replaceBackgroundTab(tabsApi, tab, chatURL) {
  if (!tabsApi || typeof tabsApi.create !== "function" || typeof tabsApi.remove !== "function") {
    throw new Error("Chrome tabs API не поддерживает безопасную замену вкладки.");
  }
  if (!Number.isInteger(tab?.id)) throw new Error("У зависшей вкладки отсутствует идентификатор.");
  if (tab.active === true) {
    throw new Error("Активная вкладка защищена: автоматическая замена отменена.");
  }
  if (typeof chatURL !== "string" || !chatURL.trim()) {
    throw new Error("Не удалось определить URL чата для новой вкладки.");
  }

  const createOptions = {
    url: chatURL,
    active: false,
    pinned: false
  };
  if (Number.isInteger(tab.windowId)) createOptions.windowId = tab.windowId;

  const replacement = await tabsApi.create(createOptions);
  if (!Number.isInteger(replacement?.id)) {
    throw new Error("Chrome не вернул идентификатор новой вкладки.");
  }

  try {
    await tabsApi.remove(tab.id);
  } catch (error) {
    try {
      await tabsApi.remove(replacement.id);
    } catch {
      // Best-effort rollback: не оставляем дубликат, если старую вкладку удалить не удалось.
    }
    throw error;
  }

  return replacement;
}
'''
write("chrome-extension/background/tab-recovery.js", TAB_RECOVERY)

TAB_RECOVERY_TEST = r'''import assert from "node:assert/strict";
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
'''
write("tests/chrome-extension/tab-recovery.test.mjs", TAB_RECOVERY_TEST)

# Service worker: import recovery policy, pass the canonical chat URL and replace hard-hung tabs.
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''import {\n  fetchLatestGithubWorkflowRun,\n  hasGithubApiPermission\n} from "./github-actions.js";\n''',
    '''import {\n  fetchLatestGithubWorkflowRun,\n  hasGithubApiPermission\n} from "./github-actions.js";\nimport {\n  replaceBackgroundTab,\n  tabRecoveryMode\n} from "./tab-recovery.js";\n'''
)
replace_all(
    "chrome-extension/background/service-worker-v2.js",
    "POST_RELOAD_SETTLE_MS",
    "POST_RECOVERY_SETTLE_MS"
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  if (currentTab.discarded === true || currentTab.frozen === true) {\n    const reason = currentTab.discarded === true ? "discarded-tab" : "frozen-tab";\n    return recoverAndInspect(currentTab.id, reason, stopPhrase);\n  }\n''',
    '''  if (currentTab.discarded === true || currentTab.frozen === true) {\n    const reason = currentTab.discarded === true ? "discarded-tab" : "frozen-tab";\n    return recoverAndInspect(currentTab, chat.url, reason, stopPhrase);\n  }\n'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  if (plan.refresh) return recoverAndInspect(currentTab.id, plan.reason, stopPhrase);\n''',
    '''  if (plan.refresh) return recoverAndInspect(currentTab, chat.url, plan.reason, stopPhrase);\n'''
)
replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''async function recoverAndInspect(tabId, reason, stopPhrase = "") {\n  await reloadTabAndWait(tabId, TAB_LOAD_TIMEOUT_MS);\n  await delay(POST_RECOVERY_SETTLE_MS);\n  const snapshot = await waitForHydratedSnapshot(tabId, HYDRATION_TIMEOUT_MS, stopPhrase);\n  return {\n    tab: await chrome.tabs.get(tabId),\n    snapshot,\n    recoveryReason: reason\n  };\n}\n''',
    '''async function recoverAndInspect(tab, chatURL, reason, stopPhrase = "") {\n  let targetTab = tab;\n  if (tabRecoveryMode(reason) === "replace" && typeof chrome.tabs.remove === "function") {\n    targetTab = await replaceBackgroundTab(chrome.tabs, tab, chatURL);\n    await protectManagedTab(targetTab.id);\n    await waitForTabComplete(targetTab.id, TAB_LOAD_TIMEOUT_MS);\n  } else {\n    await reloadTabAndWait(tab.id, TAB_LOAD_TIMEOUT_MS);\n    targetTab = await chrome.tabs.get(tab.id);\n  }\n\n  await delay(POST_RECOVERY_SETTLE_MS);\n  const snapshot = await waitForHydratedSnapshot(targetTab.id, HYDRATION_TIMEOUT_MS, stopPhrase);\n  return {\n    tab: await chrome.tabs.get(targetTab.id),\n    snapshot,\n    recoveryReason: reason\n  };\n}\n'''
)

# Version and syntax surface.
replace_once("package.json", '"version": "0.7.2-beta.1"', '"version": "0.7.3-beta.1"')
replace_once(
    "package.json",
    'node --check chrome-extension/background/service-worker-v2.js && node --check chrome-extension/background/github-actions.js',
    'node --check chrome-extension/background/service-worker-v2.js && node --check chrome-extension/background/tab-recovery.js && node --check chrome-extension/background/github-actions.js'
)
replace_once("chrome-extension/manifest.json", '"version": "0.7.2"', '"version": "0.7.3"')
replace_once("chrome-extension/manifest.json", '"version_name": "0.7.2 beta"', '"version_name": "0.7.3 beta"')
replace_once(
    "chrome-extension/manifest.json",
    '"description": "Локально продолжает выбранные чаты ChatGPT и может fail-closed отслеживать GitHub Actions activity публичных и приватных repositories."',
    '"description": "Локально продолжает выбранные чаты ChatGPT, восстанавливает зависшие фоновые вкладки и fail-closed отслеживает GitHub Actions."'
)
replace_all("scripts/package_extension.py", "0.7.2", "0.7.3")

# Release workflow.
replace_all(".github/workflows/extension-ci.yml", "0.7.2", "0.7.3")
replace_once(
    ".github/workflows/extension-ci.yml",
    "release/0.7.2-private-github-token",
    "release/0.7.3-replace-stuck-tab"
)

# Static validator: new version plus explicit recovery wiring/module/test assertions.
replace_once("scripts/validate_extension.mjs", 'assert.equal(manifest.version, "0.7.2");', 'assert.equal(manifest.version, "0.7.3");')
replace_once("scripts/validate_extension.mjs", 'assert.equal(manifest.version_name, "0.7.2 beta");', 'assert.equal(manifest.version_name, "0.7.3 beta");')
replace_once(
    "scripts/validate_extension.mjs",
    '  "background/service-worker-v2.js",\n  "background/github-actions.js",',
    '  "background/service-worker-v2.js",\n  "background/tab-recovery.js",\n  "background/github-actions.js",'
)
replace_once(
    "scripts/validate_extension.mjs",
    '  "service-worker.test.mjs",\n  "control-revision.test.mjs",',
    '  "service-worker.test.mjs",\n  "tab-recovery.test.mjs",\n  "control-revision.test.mjs",'
)
replace_once(
    "scripts/validate_extension.mjs",
    'const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");\nconst githubActions =',
    'const background = await readFile(path.join(extensionRoot, "background/service-worker-v2.js"), "utf8");\nconst tabRecovery = await readFile(path.join(extensionRoot, "background/tab-recovery.js"), "utf8");\nconst githubActions ='
)
replace_once(
    "scripts/validate_extension.mjs",
    'assert.ok(background.includes("chrome.tabs.reload"));\nassert.ok(background.includes("autoDiscardable: false"));',
    'assert.ok(background.includes("chrome.tabs.reload"));\nassert.ok(background.includes("replaceBackgroundTab(chrome.tabs, tab, chatURL)"));\nassert.ok(background.includes("tabRecoveryMode(reason)"));\nassert.ok(tabRecovery.includes("REPLACEMENT_RECOVERY_REASONS"));\nassert.ok(tabRecovery.includes("tabsApi.create"));\nassert.ok(tabRecovery.includes("tabsApi.remove"));\nassert.ok(tabRecovery.includes("active: false"));\nassert.ok(background.includes("autoDiscardable: false"));'
)
replace_all("scripts/validate_extension.mjs", "ChatPulse 0.7.2", "ChatPulse 0.7.3")

# User-facing release notes.
replace_once("README.md", "version-0.7.2_beta", "version-0.7.3_beta")
replace_once(
    "README.md",
    "В 0.7.x к per-chat профилям и guarded task mode добавлен GitHub Actions watchdog для project-чатов. В 0.7.2 он поддерживает private repositories через локальный read-only GitHub token.",
    "В 0.7.x к per-chat профилям и guarded task mode добавлен GitHub Actions watchdog для project-чатов. В 0.7.2 он получил private-repository read-only token support, а в 0.7.3 зависшая фоновая вкладка заменяется новым экземпляром того же чата вместо reload старой вкладки."
)
replace_once(
    "README.md",
    "- автоматическое восстановление discarded, frozen и неотвечающих вкладок;",
    "- автоматическое восстановление: hard-hang фоновой вкладки закрывает старый экземпляр и открывает новую вкладку того же чата, а periodic freshness остаётся мягким reload;"
)
replace_once("chrome-extension/README.md", "# ChatPulse 0.5.5 beta — расширение Google Chrome", "# ChatPulse 0.7.3 beta — расширение Google Chrome")

changelog = read("CHANGELOG.md")
marker = "# Changelog\n\n"
if not changelog.startswith(marker):
    raise SystemExit("CHANGELOG.md: unexpected header")
entry = '''## 0.7.3 beta — replace hung background tabs\n\n- replace hard-hung managed background ChatGPT tabs with a fresh inactive tab for the exact same conversation URL instead of reloading the broken tab;\n- classify discarded, frozen, content-unreachable, page-error and 20-minute stuck-generation recovery as replacement recovery;\n- keep active tabs and user drafts protected from destructive recovery;\n- keep normal generation untouched until the existing stuck threshold is reached;\n- keep periodic freshness as a soft reload rather than creating a new tab;\n- add rollback if the old tab cannot be removed after replacement creation;\n- preserve GitHub watchdog, private token isolation, continuation guards and at-most-once dispatch semantics;\n- move deterministic beta package/provenance output to ChatPulse 0.7.3.\n\n'''
write("CHANGELOG.md", marker + entry + changelog[len(marker):])

print("ChatPulse 0.7.3 recovery patch applied")
