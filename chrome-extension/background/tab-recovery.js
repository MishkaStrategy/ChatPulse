const REPLACEMENT_RECOVERY_REASONS = new Set([
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
