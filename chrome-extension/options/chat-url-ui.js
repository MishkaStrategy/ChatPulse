void initializeChatUrlUI();

function initializeChatUrlUI() {
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
  const details = row.querySelector(".profile-details");
  const display = row.querySelector(".chat-url");
  if (!details || !display) return;

  let field = details.querySelector(".chat-url-editor-field");
  if (!field) {
    field = document.createElement("label");
    field.className = "field chat-url-editor-field";
    field.innerHTML = `
      <span>Ссылка чата ChatGPT</span>
      <input class="profile-chat-url" type="url" autocomplete="off" spellcheck="false" placeholder="https://chatgpt.com/c/...">
      <small>После пересоздания чата замените только ссылку. ChatPulse сохранит настройки, лимиты задачи и GitHub-watchdog этого профиля.</small>
      <div class="button-row">
        <button class="save-chat-url secondary-button" type="button">Сохранить новую ссылку</button>
      </div>
      <small class="profile-chat-url-status">Текущая ссылка сохранена в этом профиле ChatPulse.</small>
    `;
    const summary = details.querySelector("summary");
    if (summary) summary.after(field);
    else details.prepend(field);
  }

  const input = field.querySelector(".profile-chat-url");
  if (input && document.activeElement !== input) input.value = display.textContent?.trim() || "";
}

function onInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.matches(".profile-chat-url")) return;
  const row = input.closest(".chat-row");
  const status = row?.querySelector(".profile-chat-url-status");
  if (status) {
    status.dataset.result = "pending";
    status.textContent = "Новая ссылка ещё не сохранена.";
  }
}

function onClick(event) {
  const button = event.target instanceof Element ? event.target.closest(".save-chat-url") : null;
  if (!button) return;
  const row = button.closest(".chat-row");
  if (!row) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  void saveChatURL(row, button);
}

async function saveChatURL(row, button) {
  const chatId = row.dataset.chatId || "";
  const input = row.querySelector(".profile-chat-url");
  const status = row.querySelector(".profile-chat-url-status");
  const url = input?.value.trim() || "";
  if (!chatId || !url) return setStatus(status, "Укажите ссылку на конкретный чат ChatGPT.", "error");

  button.disabled = true;
  if (input) input.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      type: "UPDATE_CHAT_URL",
      chatId,
      url
    });
    if (!response?.ok) throw new Error(response?.error || "Фоновый процесс ChatPulse не сохранил ссылку.");
    const updated = response.state?.chats?.find((chat) => chat.id === chatId);
    if (updated?.url) {
      if (input) input.value = updated.url;
      const display = row.querySelector(".chat-url");
      if (display) display.textContent = updated.url;
    }
    setStatus(
      status,
      response.changed === false
        ? "Ссылка не изменилась; настройки и runtime оставлены без сброса."
        : "Новая ссылка сохранена. Настройки, лимиты задачи и GitHub-watchdog сохранены; состояние старой страницы сброшено.",
      "success"
    );
  } catch (error) {
    setStatus(status, error instanceof Error ? error.message : String(error), "error");
  } finally {
    button.disabled = false;
    if (input) input.disabled = false;
  }
}

function setStatus(element, message, result) {
  if (!element) return;
  element.dataset.result = result;
  element.textContent = message;
}
