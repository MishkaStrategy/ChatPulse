export const GITHUB_RESTART_GRACE_MS = 60_000;
export const GITHUB_RESTART_GRACE_ALARM_PREFIX = "chatpulse-github-restart-grace:";

export function githubRestartGraceAlarmName(chatId) {
  const id = typeof chatId === "string" ? chatId.trim() : "";
  if (!id) throw new Error("Chat id is required for GitHub restart grace alarm.");
  return `${GITHUB_RESTART_GRACE_ALARM_PREFIX}${id}`;
}

export function chatIdFromGithubRestartGraceAlarm(name) {
  if (typeof name !== "string" || !name.startsWith(GITHUB_RESTART_GRACE_ALARM_PREFIX)) return null;
  const chatId = name.slice(GITHUB_RESTART_GRACE_ALARM_PREFIX.length);
  return chatId || null;
}

export function planGithubRestartAuthGrace({
  snapshot,
  restartKey,
  existingKey = null,
  existingUntil = null,
  now = Date.now()
} = {}) {
  const key = typeof restartKey === "string" && restartKey ? restartKey : null;
  if (!key || snapshot?.authenticated !== false) {
    return { defer: false, reason: "not-applicable", until: null, delayMs: 0 };
  }

  const priorKey = typeof existingKey === "string" && existingKey ? existingKey : null;
  const priorUntilMs = Date.parse(String(existingUntil || ""));
  if (priorKey === key && Number.isFinite(priorUntilMs)) {
    if (now < priorUntilMs) {
      return {
        defer: true,
        reason: "existing-grace",
        until: new Date(priorUntilMs).toISOString(),
        delayMs: Math.max(0, priorUntilMs - now)
      };
    }
    return {
      defer: false,
      reason: "grace-expired",
      until: new Date(priorUntilMs).toISOString(),
      delayMs: 0
    };
  }

  const documentStartedAtMs = Date.parse(String(snapshot?.documentStartedAt || ""));
  if (!Number.isFinite(documentStartedAtMs)) {
    return { defer: false, reason: "unknown-document-age", until: null, delayMs: 0 };
  }
  const safeStartedAtMs = Math.min(documentStartedAtMs, now);
  const ageMs = Math.max(0, now - safeStartedAtMs);
  if (ageMs >= GITHUB_RESTART_GRACE_MS) {
    return { defer: false, reason: "document-old", until: null, delayMs: 0 };
  }

  const untilMs = safeStartedAtMs + GITHUB_RESTART_GRACE_MS;
  return {
    defer: true,
    reason: "new-document",
    until: new Date(untilMs).toISOString(),
    delayMs: Math.max(0, untilMs - now)
  };
}
