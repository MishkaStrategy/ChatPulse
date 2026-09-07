import {
  clearGithubToken,
  clearGlobalGithubToken,
  GITHUB_API_ORIGIN,
  githubCredentialKey,
  hasGlobalGithubToken,
  listGithubTokenRepositories,
  saveGithubToken,
  saveGlobalGithubToken,
  verifyGithubTokenAccess,
  verifyGlobalGithubTokenAccess
} from "../background/github-actions.js";

let configuredRepositories = new Set();
let globalTokenConfigured = false;

void initializeGithubTokenUI();

async function initializeGithubTokenUI() {
  const [repositories, hasGlobalToken] = await Promise.all([
    listGithubTokenRepositories(),
    hasGlobalGithubToken()
  ]);
  configuredRepositories = new Set(repositories);
  globalTokenConfigured = hasGlobalToken;
  ensureGlobalTokenUI();
  hydrateGlobalTokenUI();
  hydrateRows(document);

  const chatTable = document.querySelector("#chatTable");
  if (chatTable) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(".chat-row")) hydrateRow(node);
          for (const row of node.querySelectorAll?.(".chat-row") || []) hydrateRow(row);
        }
      }
    });
    observer.observe(chatTable, { childList: true, subtree: true });
  }

  document.addEventListener("input", onInput, true);
  document.addEventListener("click", onClick, true);
}

function ensureGlobalTokenUI() {
  if (document.querySelector("#githubGlobalTokenBox")) return;
  const portable = document.querySelector('[aria-labelledby="portableHeading"]');
  if (!portable) return;

  const section = document.createElement("section");
  section.id = "githubGlobalTokenBox";
  section.className = "integration-box";
  section.setAttribute("aria-labelledby", "githubGlobalTokenHeading");
  section.innerHTML = `
    <div class="integration-heading">
      <div>
        <span class="eyebrow">GitHub credentials</span>
        <h3 id="githubGlobalTokenHeading">Общий GitHub PAT для всех чатов</h3>
      </div>
    </div>
    <label class="field">
      <span>Общий PAT</span>
      <input id="githubGlobalToken" type="password" autocomplete="new-password" spellcheck="false" placeholder="Fine-grained PAT">
      <small>Используется всеми GitHub Actions watchdog, если для конкретного repository не сохранён отдельный token. Отдельный token всегда имеет приоритет.</small>
    </label>
    <label class="field">
      <span>Repository для проверки PAT</span>
      <input id="githubGlobalTestRepository" type="text" autocomplete="off" spellcheck="false" placeholder="MishkaStrategy/ChatPulse">
      <small>Нужен только для кнопки «Проверить доступ» и не сохраняется как часть PAT. Формат: <code>owner/repo</code>.</small>
    </label>
    <div class="button-row">
      <button id="saveGlobalGithubToken" class="secondary-button" type="button">Сохранить общий PAT</button>
      <button id="testGlobalGithubToken" class="secondary-button" type="button">Проверить доступ</button>
      <button id="clearGlobalGithubToken" class="secondary-button danger-soft" type="button" hidden>Удалить общий PAT</button>
    </div>
    <small id="githubGlobalTokenStatus">Общий PAT не сохранён.</small>
    <p class="integration-note">PAT хранится только локально в защищённом хранилище расширения, не показывается после сохранения и не попадает в экспорт. ChatPulse отправляет его только в read-only GET-запрос последних GitHub Actions runs.</p>
  `;
  portable.before(section);
}

function hydrateGlobalTokenUI() {
  const input = document.querySelector("#githubGlobalToken");
  const clearButton = document.querySelector("#clearGlobalGithubToken");
  const status = document.querySelector("#githubGlobalTokenStatus");
  if (input) {
    input.placeholder = globalTokenConfigured
      ? "PAT сохранён · оставьте пустым"
      : "Fine-grained PAT";
  }
  if (clearButton) clearButton.hidden = !globalTokenConfigured;
  if (status && !status.dataset.result) {
    status.textContent = globalTokenConfigured
      ? "Общий PAT сохранён локально и будет использоваться как fallback для всех GitHub-watchdog чатов."
      : "Общий PAT не сохранён. Public repositories продолжат работать без credentials; для private repository можно сохранить общий или отдельный PAT.";
  }
}

function hydrateRows(root) {
  for (const row of root.querySelectorAll?.(".chat-row") || []) hydrateRow(row);
}

function hydrateRow(row) {
  const repositoryInput = row.querySelector(".profile-github-repository");
  const tokenInput = row.querySelector(".profile-github-token");
  const status = row.querySelector(".profile-github-token-status");
  const clearButton = row.querySelector(".clear-github-token");
  if (!repositoryInput || !tokenInput || !status || !clearButton) return;

  const key = githubCredentialKey(repositoryInput.value);
  const configured = Boolean(key && configuredRepositories.has(key));
  tokenInput.placeholder = configured
    ? "Отдельный token сохранён · оставьте пустым"
    : globalTokenConfigured
      ? "Отдельный PAT (необязательно)"
      : "Fine-grained PAT";
  clearButton.hidden = !configured;
  if (!status.dataset.result) {
    status.textContent = configured
      ? "Отдельный token сохранён локально для этого repository и имеет приоритет над общим PAT. Его значение не показывается и не экспортируется."
      : globalTokenConfigured
        ? "Для этого repository будет использован общий PAT. При необходимости можно сохранить отдельный token-override."
        : "Для public repository token не нужен. Для private repository используйте общий PAT либо fine-grained PAT этого repository с Actions: Read-only.";
  }
}

function onInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  if (input.matches("#githubGlobalToken, #githubGlobalTestRepository")) {
    const status = document.querySelector("#githubGlobalTokenStatus");
    if (status) delete status.dataset.result;
    hydrateGlobalTokenUI();
    return;
  }

  const row = input.closest(".chat-row");
  if (!row) return;
  if (!input.matches(".profile-github-repository, .profile-github-token")) return;
  const status = row.querySelector(".profile-github-token-status");
  if (status) delete status.dataset.result;
  hydrateRow(row);
}

function onClick(event) {
  const button = event.target instanceof Element ? event.target.closest("button") : null;
  if (!button) return;

  if (button.id === "saveGlobalGithubToken") {
    event.preventDefault();
    event.stopImmediatePropagation();
    void saveGlobalToken(button);
    return;
  }

  if (button.id === "testGlobalGithubToken") {
    event.preventDefault();
    event.stopImmediatePropagation();
    void testGlobalToken(button);
    return;
  }

  if (button.id === "clearGlobalGithubToken") {
    event.preventDefault();
    event.stopImmediatePropagation();
    void clearGlobalToken(button);
    return;
  }

  const row = button.closest(".chat-row");
  if (!row) return;

  if (button.matches(".test-github-token")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void testToken(row, button);
    return;
  }

  if (button.matches(".clear-github-token")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void clearToken(row, button);
    return;
  }

  if (button.matches(".save-profile") && button.dataset.githubTokenBypass !== "true") {
    const tokenInput = row.querySelector(".profile-github-token");
    if (!tokenInput?.value.trim()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void verifySaveTokenThenContinue(row, button);
  }
}

async function saveGlobalToken(button) {
  const input = document.querySelector("#githubGlobalToken");
  const status = document.querySelector("#githubGlobalTokenStatus");
  const token = input?.value.trim() || "";
  if (!token) return setStatus(status, "Вставьте общий GitHub PAT.", "error");
  if (!(await ensureGithubPermission(status))) return;

  setGlobalTokenBusy(true);
  try {
    await saveGlobalGithubToken(token);
    globalTokenConfigured = true;
    input.value = "";
    setStatus(status, "Общий PAT сохранён локально. Он будет применяться ко всем GitHub-watchdog чатам без отдельного token-override.", "success");
    hydrateGlobalTokenUI();
    hydrateRows(document);
  } catch (error) {
    setStatus(status, errorMessage(error), "error");
  } finally {
    setGlobalTokenBusy(false);
    button.disabled = false;
  }
}

async function testGlobalToken(button) {
  const repository = document.querySelector("#githubGlobalTestRepository")?.value.trim() || "";
  const input = document.querySelector("#githubGlobalToken");
  const token = input?.value.trim() || undefined;
  const status = document.querySelector("#githubGlobalTokenStatus");
  if (!repository) return setStatus(status, "Укажите repository для проверки в формате owner/repo.", "error");
  if (!(await ensureGithubPermission(status))) return;

  setGlobalTokenBusy(true);
  try {
    const result = await verifyGlobalGithubTokenAccess(repository, token);
    setStatus(status, `Доступ общего PAT подтверждён: ${result.repository} · Actions: read.`, "success");
  } catch (error) {
    setStatus(status, errorMessage(error), "error");
  } finally {
    setGlobalTokenBusy(false);
    button.disabled = false;
  }
}

async function clearGlobalToken(button) {
  const status = document.querySelector("#githubGlobalTokenStatus");
  if (!confirm("Удалить общий GitHub PAT для всех чатов? Отдельные repository tokens останутся без изменений.")) return;

  setGlobalTokenBusy(true);
  try {
    await clearGlobalGithubToken();
    globalTokenConfigured = false;
    setStatus(status, "Общий PAT удалён. Отдельные repository tokens сохранены; public repositories могут работать без token.", "success");
    hydrateGlobalTokenUI();
    hydrateRows(document);
  } catch (error) {
    setStatus(status, errorMessage(error), "error");
  } finally {
    setGlobalTokenBusy(false);
    button.disabled = false;
  }
}

async function testToken(row, button) {
  const repository = repositoryValue(row);
  const token = row.querySelector(".profile-github-token")?.value.trim() || undefined;
  const status = row.querySelector(".profile-github-token-status");
  if (!repository) return setStatus(status, "Сначала укажите repository в формате owner/repo.", "error");
  if (!(await ensureGithubPermission(status))) return;

  setRowTokenBusy(row, true);
  try {
    const result = await verifyGithubTokenAccess(repository, token);
    setStatus(
      status,
      `Доступ подтверждён: ${result.repository} · Actions: read · workflow runs доступны. Нажмите «Сохранить профиль», чтобы сохранить новый отдельный token локально.`,
      "success"
    );
  } catch (error) {
    setStatus(status, errorMessage(error), "error");
  } finally {
    setRowTokenBusy(row, false);
    button.disabled = false;
  }
}

async function verifySaveTokenThenContinue(row, saveButton) {
  const repository = repositoryValue(row);
  const tokenInput = row.querySelector(".profile-github-token");
  const token = tokenInput?.value.trim() || "";
  const status = row.querySelector(".profile-github-token-status");
  if (!repository) return setStatus(status, "Сначала укажите repository в формате owner/repo.", "error");
  if (!(await ensureGithubPermission(status))) return;

  setRowTokenBusy(row, true);
  try {
    const result = await verifyGithubTokenAccess(repository, token);
    await saveGithubToken(repository, token);
    const key = githubCredentialKey(repository);
    if (key) configuredRepositories.add(key);
    tokenInput.value = "";
    setStatus(status, `Отдельный token проверен и сохранён локально · ${result.repository} · Actions: read.`, "success");
    hydrateRow(row);

    saveButton.dataset.githubTokenBypass = "true";
    saveButton.disabled = false;
    saveButton.click();
    delete saveButton.dataset.githubTokenBypass;
  } catch (error) {
    setStatus(status, errorMessage(error), "error");
  } finally {
    setRowTokenBusy(row, false);
    saveButton.disabled = false;
  }
}

async function clearToken(row, button) {
  const repository = repositoryValue(row);
  const status = row.querySelector(".profile-github-token-status");
  if (!repository) return setStatus(status, "Укажите repository, для которого нужно удалить token.", "error");
  if (!confirm(`Удалить локально сохранённый отдельный GitHub token для ${repository}?`)) return;

  setRowTokenBusy(row, true);
  try {
    await clearGithubToken(repository);
    const key = githubCredentialKey(repository);
    if (key) configuredRepositories.delete(key);
    setStatus(
      status,
      globalTokenConfigured
        ? "Отдельный token удалён. Теперь этот repository будет использовать общий PAT."
        : "Сохранённый GitHub token удалён. Public repository продолжит работать без token; private repository станет недоступен watchdog до общего или нового отдельного PAT.",
      "success"
    );
    hydrateRow(row);
  } catch (error) {
    setStatus(status, errorMessage(error), "error");
  } finally {
    setRowTokenBusy(row, false);
    button.disabled = false;
  }
}

async function ensureGithubPermission(status) {
  try {
    const granted = await chrome.permissions.request({ origins: [GITHUB_API_ORIGIN] });
    if (!granted) {
      setStatus(status, "Chrome не выдал optional access к api.github.com.", "error");
      return false;
    }
    return true;
  } catch (error) {
    setStatus(status, errorMessage(error), "error");
    return false;
  }
}

function repositoryValue(row) {
  return row.querySelector(".profile-github-repository")?.value.trim() || "";
}

function setGlobalTokenBusy(busy) {
  for (const control of document.querySelectorAll("#githubGlobalToken, #githubGlobalTestRepository, #saveGlobalGithubToken, #testGlobalGithubToken, #clearGlobalGithubToken")) {
    control.disabled = busy;
  }
}

function setRowTokenBusy(row, busy) {
  for (const control of row.querySelectorAll(".profile-github-token, .test-github-token, .clear-github-token, .save-profile")) {
    control.disabled = busy;
  }
}

function setStatus(element, message, result) {
  if (!element) return;
  element.dataset.result = result;
  element.textContent = message;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
