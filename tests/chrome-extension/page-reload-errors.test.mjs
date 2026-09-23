import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

import { planTabRecovery } from "../../chrome-extension/lib/model-v2.js";
import { tabRecoveryMode } from "../../chrome-extension/background/tab-recovery.js";

const contentScript = await readFile("chrome-extension/content/content-script.js", "utf8");
const pulse2Engine = await readFile("chrome-extension/background/pulse2-engine.js", "utf8");

function inspectWithUiText(parts, { insideMessage = false } = {}) {
  let listener = null;
  const root = {};
  const nodes = parts.map((nodeValue) => ({
    nodeValue,
    parentElement: {
      closest(selector) {
        if (insideMessage && String(selector).includes("data-message-author-role")) return {};
        return null;
      }
    }
  }));

  const context = {
    chrome: {
      runtime: {
        onMessage: {
          addListener(handler) {
            listener = handler;
          }
        }
      }
    },
    MutationObserver: class {
      observe() {}
    },
    NodeFilter: { SHOW_TEXT: 4 },
    document: {
      documentElement: {},
      body: root,
      readyState: "complete",
      title: "Test chat",
      querySelector(selector) {
        if (selector === "main, [role='main']") return root;
        return null;
      },
      querySelectorAll() {
        return [];
      },
      createTreeWalker() {
        let index = 0;
        return {
          nextNode() {
            return nodes[index++] || null;
          }
        };
      }
    },
    location: {
      href: "https://chatgpt.com/c/test-chat",
      pathname: "/c/test-chat"
    },
    performance: { timeOrigin: Date.now() },
    setTimeout,
    clearTimeout,
    Date,
    console
  };

  vm.runInNewContext(contentScript, context);
  assert.equal(typeof listener, "function");

  let response = null;
  listener({ type: "CHATPULSE_INSPECT", stopPhrase: "" }, {}, (value) => {
    response = value;
  });
  return response?.snapshot;
}

test("delivery timeout requests an immediate page reload", () => {
  const snapshot = inspectWithUiText([
    "Время доставки сообщения истекло.",
    "Попробуйте ещё раз."
  ]);

  assert.equal(snapshot.errorDetected, true);
  assert.equal(snapshot.reloadRequested, true);
});

test("connection interruption requests an immediate page reload", () => {
  const snapshot = inspectWithUiText([
    "Соединение прервано.",
    "Ожидание полного ответа"
  ]);

  assert.equal(snapshot.errorDetected, true);
  assert.equal(snapshot.reloadRequested, true);
});

test("the same words inside conversation messages do not trigger a reload", () => {
  const snapshot = inspectWithUiText([
    "Соединение прервано. Ожидание полного ответа"
  ], { insideMessage: true });

  assert.equal(snapshot.reloadRequested, false);
});

test("Pulse 1 reloads even an active chat for explicit delivery interruption errors", () => {
  const recovery = planTabRecovery({
    tab: { id: 7, active: true, discarded: false, frozen: false },
    snapshot: {
      errorDetected: true,
      reloadRequested: true,
      isGenerating: false,
      generationAgeMs: 0
    },
    chat: { lastHardRefreshAt: new Date().toISOString() },
    intervalMinutes: 5
  });

  assert.deepEqual(recovery, { refresh: true, reason: "page-reload-required" });
  assert.equal(tabRecoveryMode(recovery.reason), "reload");
});

test("Pulse 2 reloads the managed chat before normal observation", () => {
  assert.match(
    pulse2Engine,
    /if \(snapshot\?\.reloadRequested === true\) \{\s*return reloadAndInspectPulse2Tab\(tabId, expectedUrl\);\s*\}/
  );
  assert.match(
    pulse2Engine,
    /let snapshot = await inspectPulse2TabAfterHydration\(tab\.id\);\s*if \(snapshot\?\.reloadRequested === true\) \{\s*snapshot = await reloadAndInspectPulse2Tab\(tab\.id\);\s*\}/
  );
});
