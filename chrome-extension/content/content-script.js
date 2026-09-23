(() => {
  if (globalThis.__chatPulseContentScriptInstalled) return;
  globalThis.__chatPulseContentScriptInstalled = true;

  const CONTENT_SCRIPT_VERSION = "0.5.6";
  const MESSAGE_SELECTOR = "[data-message-author-role], article[data-testid^='conversation-turn-']";
  const INPUT_SELECTORS = [
    "#prompt-textarea",
    "textarea[placeholder]",
    "textarea",
    "[contenteditable='true'][data-virtualkeyboard]",
    "[contenteditable='true'][role='textbox']",
    "[contenteditable='true']"
  ];

  let lastDomMutationAt = Date.now();
  let lastRelevantMutationAt = Date.now();
  let generationStartedAt = null;

  installMutationObserver();
  updateGenerationClock();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;

    if (message.type === "CHATPULSE_PING") {
      sendResponse({
        ok: true,
        url: location.href,
        observedAt: new Date().toISOString(),
        lastDomMutationAt,
        lastRelevantMutationAt,
        visibilityState: document.visibilityState,
        wasDiscarded: Boolean(document.wasDiscarded),
        contentScriptVersion: CONTENT_SCRIPT_VERSION
      });
      return false;
    }

    if (message.type === "CHATPULSE_INSPECT") {
      sendResponse({ ok: true, snapshot: inspectPage(message.stopPhrase) });
      return false;
    }

    if (message.type === "CHATPULSE_SEND") {
      sendCommand(String(message.command || ""))
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((error) => sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      return true;
    }

    return false;
  });

  function installMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      const now = Date.now();
      lastDomMutationAt = now;
      if (mutations.some(isRelevantMutation)) lastRelevantMutationAt = now;
      updateGenerationClock(now);
    });
    const root = document.documentElement || document;
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "aria-disabled", "data-testid", "data-message-author-role"]
    });
  }

  function isRelevantMutation(mutation) {
    const target = mutation.target instanceof Element ? mutation.target : mutation.target?.parentElement;
    if (target?.closest?.(MESSAGE_SELECTOR)) return true;
    if (target?.closest?.("#prompt-textarea, button[data-testid='stop-button'], button[data-testid='send-button'], button[data-testid='composer-speech-button']")) {
      return true;
    }
    return [...(mutation.addedNodes || [])].some((node) => {
      if (!(node instanceof Element)) return false;
      return node.matches?.(MESSAGE_SELECTOR)
        || Boolean(node.querySelector?.(MESSAGE_SELECTOR))
        || Boolean(node.matches?.("button[data-testid='stop-button'], button[data-testid='send-button'], button[data-testid='composer-speech-button']"));
    });
  }

  function updateGenerationClock(now = Date.now()) {
    const generating = detectGenerating();
    if (generating && generationStartedAt === null) generationStartedAt = now;
    if (!generating) generationStartedAt = null;
    return generating;
  }

  function inspectPage(stopPhrase = "") {
    const messages = getMessages();
    const latest = messages.at(-1) || null;
    const latestRole = roleFor(latest);
    const latestText = normalizedText(latest);
    const latestId = latest?.getAttribute?.("data-message-id")
      || latest?.getAttribute?.("data-testid")
      || latest?.id
      || (latest ? `message-position-${Math.max(0, messages.length - 1)}` : "");
    const input = findInput();
    const now = Date.now();
    const generating = updateGenerationClock(now);
    const readyForNewInput = !generating && detectReadyForNewInput();
    const pageError = detectPageError();

    const title = (document.title || "Чат ChatGPT")
      .replace(/\s*[-|]\s*ChatGPT\s*$/i, "")
      .trim() || "Чат ChatGPT";

    return {
      title,
      url: location.href,
      latestRole,
      latestFingerprint: latest
        ? fnv1a(`${latestRole}|${latestId}|${latestText}`)
        : null,
      stopPhraseMatched: latestRole === "assistant"
        && !generating
        && phraseMatches(latestText, stopPhrase),
      isGenerating: generating,
      readyForNewInput,
      generationAgeMs: generating && generationStartedAt !== null ? now - generationStartedAt : 0,
      errorDetected: pageError.detected,
      reloadRequested: pageError.reloadRequested,
      pageReady: document.readyState === "interactive" || document.readyState === "complete",
      authenticated: isAuthenticated(),
      messageCount: messages.length,
      hasComposer: Boolean(input),
      hasDraft: false,
      observedAt: new Date(now).toISOString(),
      documentStartedAt: new Date(performance.timeOrigin || now).toISOString(),
      lastDomMutationAt,
      lastRelevantMutationAt,
      visibilityState: document.visibilityState,
      wasDiscarded: Boolean(document.wasDiscarded),
      contentScriptVersion: CONTENT_SCRIPT_VERSION
    };
  }

  async function sendCommand(command) {
    const normalizedCommand = normalize(command);
    if (!normalizedCommand) throw new Error("Команда продолжения пуста.");
    if (!isAuthenticated()) throw new Error("В профиле Chrome не выполнен вход в ChatGPT.");
    if (updateGenerationClock()) throw new Error("ChatGPT ещё создаёт ответ.");

    const input = findInput();
    if (!input) throw new Error("Поле ввода ChatGPT не найдено.");

    fillInput(input, command);
    const sendButton = await waitForSendButton(4_000);
    if (!sendButton) throw new Error("Кнопка отправки недоступна после заполнения поля.");

    sendButton.click();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await delay(500);
      if (latestUserMessageMatches(normalizedCommand)) {
        return { outcome: "confirmed" };
      }
    }

    return { outcome: "submitted-unconfirmed" };
  }

  function getMessages() {
    const elements = [...document.querySelectorAll(MESSAGE_SELECTOR)];
    return elements.filter((element, index) => {
      const parent = element.parentElement?.closest?.(MESSAGE_SELECTOR);
      if (parent && parent !== element) return false;
      return elements.indexOf(element) === index;
    });
  }

  function roleFor(element) {
    if (!element) return "unknown";
    const direct = element.getAttribute?.("data-message-author-role")?.toLowerCase();
    if (["assistant", "user", "system"].includes(direct)) return direct;

    const nested = element.querySelector?.("[data-message-author-role]");
    const nestedRole = nested?.getAttribute?.("data-message-author-role")?.toLowerCase();
    if (["assistant", "user", "system"].includes(nestedRole)) return nestedRole;

    const testId = element.getAttribute?.("data-testid") || "";
    if (/user/i.test(testId)) return "user";
    if (/assistant/i.test(testId)) return "assistant";
    return "unknown";
  }

  function normalizedText(element) {
    return normalize(element?.innerText || element?.textContent || "");
  }

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function phraseMatches(text, phrase) {
    const normalizedPhrase = normalizePhrase(phrase);
    if (!normalizedPhrase) return false;
    return normalizePhrase(text).includes(normalizedPhrase);
  }

  function normalizePhrase(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLocaleLowerCase("ru-RU")
      .replace(/\s+/g, " ")
      .trim();
  }

  function fnv1a(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function detectGenerating() {
    if (document.querySelector("button[data-testid='stop-button']")) return true;
    return [...document.querySelectorAll("button")].some((button) => {
      const label = normalize(button.getAttribute("aria-label") || button.innerText).toLowerCase();
      return /^(stop|остановить|停止|detener)/i.test(label);
    });
  }

  function detectReadyForNewInput() {
    const speechButton = document.querySelector("button[data-testid='composer-speech-button']");
    if (speechButton
      && isVisible(speechButton)
      && !speechButton.disabled
      && speechButton.getAttribute("aria-disabled") !== "true") {
      return true;
    }

    return [...document.querySelectorAll("button")].some((button) => {
      if (!isVisible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") {
        return false;
      }
      const label = normalize(button.getAttribute("aria-label") || button.innerText).toLowerCase();
      return /^(start voice|start voice mode|voice mode|начать голосовой режим|голосовой режим)$/iu.test(label);
    });
  }

  function detectPageError() {
    const alertText = [...document.querySelectorAll(
      "[role='alert'], [aria-live='assertive'], [data-testid*='error' i]"
    )]
      .map((element) => normalize(element.innerText || element.textContent).toLowerCase())
      .join("\n");

    const uiText = collectNonMessageUiText().toLowerCase();
    const explicitErrorText = `${alertText}\n${uiText}`;
    const reloadRequested = /(время доставки сообщения истекло\.?\s*попробуйте\s+ещ[её]\s+раз|соединение прервано\.?\s*ожидание полного ответа)/i.test(explicitErrorText);
    const detected = reloadRequested
      || /(something went wrong|network error|failed to load|произошла ошибка|ошибка сети|не удалось загрузить)/i.test(alertText);

    return { detected, reloadRequested };
  }

  function collectNonMessageUiText(maxLength = 50_000) {
    const root = document.querySelector("main, [role='main']") || document.body;
    if (!root) return "";

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const parts = [];
    let length = 0;
    let node = walker.nextNode();

    while (node && length < maxLength) {
      const parent = node.parentElement;
      if (parent
        && !parent.closest(MESSAGE_SELECTOR)
        && !parent.closest("#prompt-textarea, textarea, input, [contenteditable='true'], script, style, noscript")) {
        const value = normalize(node.nodeValue || "");
        if (value) {
          parts.push(value);
          length += value.length + 1;
        }
      }
      node = walker.nextNode();
    }

    return parts.join(" ").slice(0, maxLength);
  }

  function isAuthenticated() {
    if (location.pathname.startsWith("/auth") || /login|signin/i.test(location.pathname)) return false;
    return Boolean(
      findInput()
      || document.querySelector("[data-message-author-role]")
      || document.querySelector("[data-testid='profile-button']")
      || document.querySelector("nav a[href^='/c/']")
    );
  }

  function findInput() {
    for (const selector of INPUT_SELECTORS) {
      const candidate = document.querySelector(selector);
      if (candidate && isVisible(candidate)) return candidate;
    }
    return null;
  }

  function readInputValue(input) {
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      return input.value;
    }
    return input.innerText || input.textContent || "";
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0
      && rect.height > 0
      && style.visibility !== "hidden"
      && style.display !== "none";
  }

  function fillInput(input, command) {
    input.focus();

    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      const prototype = input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (!setter) throw new Error("Не удалось получить системный setter поля ввода.");
      setter.call(input, command);
      input.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: command
      }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    const selection = getSelection();
    const range = document.createRange();
    range.selectNodeContents(input);
    selection?.removeAllRanges();
    selection?.addRange(range);

    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, command);
    } catch {
      inserted = false;
    }

    if (!inserted) {
      input.replaceChildren();
      const paragraph = document.createElement("p");
      paragraph.textContent = command;
      input.appendChild(paragraph);
    }

    input.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: command
    }));
  }

  async function waitForSendButton(timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const button = findSendButton();
      if (button && !button.disabled && button.getAttribute("aria-disabled") !== "true") {
        return button;
      }
      await delay(100);
    }
    return null;
  }

  function findSendButton() {
    const direct = document.querySelector(
      "button[data-testid='send-button'], button[aria-label*='Send' i], button[aria-label*='Отправ' i]"
    );
    if (direct && isVisible(direct)) return direct;

    return [...document.querySelectorAll("button")].find((button) => {
      const label = normalize(button.getAttribute("aria-label") || button.innerText);
      return /^(send|отправить)$/i.test(label) && isVisible(button);
    }) || null;
  }

  function latestUserMessageMatches(normalizedCommand) {
    const userMessages = getMessages().filter((message) => roleFor(message) === "user");
    const latest = userMessages.at(-1);
    return latest ? normalizedText(latest) === normalizedCommand : false;
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
})();