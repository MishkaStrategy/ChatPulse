(() => {
  if (globalThis.__chatPulse2ContentInstalled) return;
  globalThis.__chatPulse2ContentInstalled = true;

  const PROJECT_ENTRY_TIMEOUT_MS = 12_000;
  const INPUT_SELECTORS = [
    "#prompt-textarea",
    "textarea[placeholder]",
    "textarea",
    "[contenteditable='true'][data-virtualkeyboard]",
    "[contenteditable='true'][role='textbox']",
    "[contenteditable='true']"
  ];

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "PULSE2_PREPARE_PROJECT_CHAT") return false;
    prepareProjectChat(message.projectUrl)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    return true;
  });

  async function prepareProjectChat(projectUrl) {
    if (!isProjectLocation(projectUrl)) {
      throw new Error("Открытая страница не соответствует проекту Pulse 2.0.");
    }

    const startedAt = Date.now();
    let activatedProjectComposer = false;
    let openedNewChatAction = false;

    while (Date.now() - startedAt < PROJECT_ENTRY_TIMEOUT_MS) {
      const input = findInput();
      if (input) {
        return {
          ready: true,
          action: activatedProjectComposer
            ? "project-composer-activated"
            : openedNewChatAction
              ? "project-new-chat-opened"
              : "project-composer-ready",
          url: location.href
        };
      }

      if (!activatedProjectComposer) {
        const composerSurface = findProjectComposerSurface();
        if (composerSurface) {
          composerSurface.click();
          activatedProjectComposer = true;
          await delay(200);
          continue;
        }
      }

      if (!openedNewChatAction) {
        const control = findProjectChatControl(projectUrl);
        if (control) {
          control.click();
          openedNewChatAction = true;
          await delay(200);
          continue;
        }
      }

      await delay(150);
    }

    throw new Error("Не найдено поле нового чата внутри проекта ChatGPT.");
  }

  function isProjectLocation(projectUrl) {
    try {
      const expected = new URL(projectUrl);
      const current = new URL(location.href);
      if (!["chatgpt.com", "chat.openai.com"].includes(current.hostname.toLowerCase())) return false;
      const expectedKey = projectKey(expected.pathname);
      const currentKey = projectKey(current.pathname);
      if (expectedKey && currentKey) return expectedKey === currentKey;
      return current.pathname.includes(expected.pathname.replace(/\/$/, ""));
    } catch {
      return false;
    }
  }

  function findProjectComposerSurface() {
    const roots = [
      document.querySelector("main"),
      document.querySelector("[role='main']")
    ].filter(Boolean);

    for (const root of roots) {
      const attributeCandidates = root.querySelectorAll(
        "[data-placeholder], [aria-placeholder], [placeholder], [aria-label], [data-testid*='composer' i]"
      );
      for (const element of attributeCandidates) {
        if (!isVisible(element) || element.closest("nav, aside")) continue;
        const label = normalize([
          element.getAttribute("data-placeholder"),
          element.getAttribute("aria-placeholder"),
          element.getAttribute("placeholder"),
          element.getAttribute("aria-label"),
          element.innerText,
          element.textContent
        ].filter(Boolean).join(" "));
        if (isProjectComposerLabel(label)) return element;
      }

      for (const element of root.querySelectorAll("span, p, div")) {
        if (!isVisible(element) || element.closest("nav, aside")) continue;
        const label = normalize(element.innerText || element.textContent);
        if (!isProjectComposerLabel(label)) continue;

        // Prefer the smallest visible node carrying the "New chat in …" label.
        const childWithSameLabel = [...element.children].some((child) =>
          isVisible(child) && isProjectComposerLabel(normalize(child.innerText || child.textContent))
        );
        if (!childWithSameLabel) return element;
      }
    }

    return null;
  }

  function isProjectComposerLabel(value) {
    const label = normalize(value).toLocaleLowerCase();
    return /^(?:новый чат в|new chat in)(?:\s|$)/iu.test(label);
  }

  function findProjectChatControl(projectUrl) {
    const project = safeURL(projectUrl);
    const key = project ? projectKey(project.pathname) : null;
    const roots = [
      document.querySelector("main"),
      document.querySelector("[role='main']"),
      document.body
    ].filter(Boolean);

    const candidates = [];
    for (const root of roots) {
      for (const element of root.querySelectorAll("button, a[href], [role='button']")) {
        if (!isVisible(element) || element.closest("nav, aside")) continue;
        const label = normalize(
          element.getAttribute("aria-label")
          || element.getAttribute("title")
          || element.innerText
          || element.textContent
        ).toLowerCase();
        if (!/^(chat|new chat|start chat|create chat|чат|новый чат|создать чат|начать чат)$/i.test(label)) continue;
        const href = element instanceof HTMLAnchorElement ? element.href : "";
        const hrefMatchesProject = Boolean(key && href.includes(key));
        const explicitNewChat = /new chat|start chat|create chat|новый чат|создать чат|начать чат/i.test(label);
        const score = (hrefMatchesProject ? 4 : 0) + (explicitNewChat ? 2 : 0) + (root === document.body ? 0 : 1);
        candidates.push({ element, score });
      }
      if (candidates.length) break;
    }

    candidates.sort((left, right) => right.score - left.score);
    return candidates[0]?.element || null;
  }

  function findInput() {
    for (const selector of INPUT_SELECTORS) {
      const candidate = document.querySelector(selector);
      if (candidate && isVisible(candidate)) return candidate;
    }
    return null;
  }

  function projectKey(pathname) {
    const parts = String(pathname || "").split("/").filter(Boolean);
    const explicit = parts.find((part) => /^g-p-[a-z0-9_-]+$/i.test(part));
    if (explicit) return explicit;
    const projectsIndex = parts.findIndex((part) => /^projects?$/i.test(part));
    return projectsIndex >= 0 && parts[projectsIndex + 1] ? parts[projectsIndex + 1] : null;
  }

  function safeURL(value) {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0
      && rect.height > 0
      && style.visibility !== "hidden"
      && style.display !== "none";
  }

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
})();
