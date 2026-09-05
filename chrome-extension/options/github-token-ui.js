import {
  clearGithubToken,
  GITHUB_API_ORIGIN,
  githubCredentialKey,
  listGithubTokenRepositories,
  saveGithubToken,
  verifyGithubTokenAccess
} from "../background/github-actions.js";

let configuredRepositories = new Set();

void initializeGithubTokenUI();

async function initializeGithubTokenUI() {
  configuredRepositories = new Set(await listGithubTokenRepositories());
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
    ? "Token сохранён · оставьте пустым"
    : "Fine-grained PAT";
  clearButton.hidden = !configured;
  if (!status.dataset.result) {
    status.textContent = configured
      ? "Token сохранён локально для этого repository. Его значение не показывается и не экспортируется."
      : "Для public repository token не нужен. Для private repository используйте fine-grained PAT: repository access + Actions: Read-only.";
  }
}

function onInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
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
      `Доступ подтверждён: ${result.repository} · Actions: read · workflow runs доступны. Нажмите «Сохранить профиль», чтобы сохранить новый token локально.`,
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
    setStatus(status, `Token проверен и сохранён локально · ${result.repository} · Actions: read.`, "success");
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
  if (!confirm(`Удалить локально сохранённый GitHub token для ${repository}?`)) return;

  setRowTokenBusy(row, true);
  try {
    await clearGithubToken(repository);
    const key = githubCredentialKey(repository);
    if (key) configuredRepositories.delete(key);
    setStatus(status, "Сохранённый GitHub token удалён. Public repository продолжит работать без token; private repository станет недоступен watchdog до нового token.", "success");
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
