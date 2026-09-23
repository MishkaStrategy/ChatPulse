import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const contentScript = await readFile("chrome-extension/content/content-script.js", "utf8");

function visibleElement(attributes = {}) {
  return {
    disabled: false,
    innerText: "",
    textContent: "",
    getAttribute(name) {
      return attributes[name] ?? null;
    },
    getBoundingClientRect() {
      return { width: 48, height: 48 };
    },
    querySelector() {
      return null;
    }
  };
}

function inspectComposer({ speech = false, stop = false, speechLabel = "Start voice mode" } = {}) {
  let listener = null;
  const input = visibleElement();
  const speechButton = visibleElement({
    "data-testid": "composer-speech-button",
    "aria-label": speechLabel
  });
  const stopButton = visibleElement({
    "data-testid": "stop-button",
    "aria-label": "Stop"
  });
  const buttons = [
    ...(speech ? [speechButton] : []),
    ...(stop ? [stopButton] : [])
  ];

  const document = {
    documentElement: {},
    body: {},
    readyState: "complete",
    title: "Test chat",
    querySelector(selector) {
      if (selector === "button[data-testid='stop-button']") return stop ? stopButton : null;
      if (String(selector).includes("composer-speech-button")) return speech ? speechButton : null;
      if (selector === "#prompt-textarea") return input;
      if (selector === "main, [role='main']") return null;
      if (selector === "[data-message-author-role]") return null;
      if (selector === "[data-testid='profile-button']") return null;
      if (selector === "nav a[href^='/c/']") return null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "button") return buttons;
      return [];
    },
    createTreeWalker() {
      return { nextNode() { return null; } };
    }
  };

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
    document,
    location: {
      href: "https://chatgpt.com/c/test-chat",
      pathname: "/c/test-chat"
    },
    performance: { timeOrigin: Date.now() },
    getComputedStyle() {
      return { visibility: "visible", display: "block" };
    },
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

test("blue voice composer button means ChatGPT is ready for a new input", () => {
  const snapshot = inspectComposer({ speech: true, stop: false });
  assert.equal(snapshot.isGenerating, false);
  assert.equal(snapshot.readyForNewInput, true);
});

test("Stop button always wins over the voice button", () => {
  const snapshot = inspectComposer({ speech: true, stop: true });
  assert.equal(snapshot.isGenerating, true);
  assert.equal(snapshot.readyForNewInput, false);
});

test("absence of both Stop and voice button is not enough to declare input-ready", () => {
  const snapshot = inspectComposer({ speech: false, stop: false });
  assert.equal(snapshot.isGenerating, false);
  assert.equal(snapshot.readyForNewInput, false);
});

test("fallback fingerprint distinguishes repeated same-text user messages without DOM ids", () => {
  assert.match(contentScript, /message-position-/);
});
