(() => {
  if (globalThis.__chatPulse2ContentInstalled) return;
  globalThis.__chatPulse2ContentInstalled = true;

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

    const existing = findInput();
    if (existing) return { ready: true, action: "project-composer-ready", url: location.href };

    const control = findProjectChatControl(projectUrl);
    if (!control) {
      throw new Error("Не найдено действие «Новый чат / Chat» внутри проекта ChatGPT.");
    }
    control.click();

    const input = await waitForInput(12_000);
    if (!input) throw new Error("После открытия нового чата поле ввода не появилось.");
    return {
      ready: true,
      action: "project-new-chat-opened",
      url: location.href
    };
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

  async function waitForInput(timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const input = findInput();
      if (input) return input;
      await delay(150);
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
