#!/usr/bin/env python3
from pathlib import Path

path = Path("chrome-extension/lib/model-v2.js")
text = path.read_text(encoding="utf-8")
old = '''      return {
        ...latestChat,
        enabled: observed.enabled,
        runStartedAt: observed.runStartedAt,
        continuationCount: observed.continuationCount,
        taskActive: observed.taskActive,
        taskStartedAt: observed.taskStartedAt,
        taskCompletedAt: observed.taskCompletedAt,
        taskCompletionReason: observed.taskCompletionReason,
        lastDecision: observed.lastDecision,
        nextEligibleAt: observed.nextEligibleAt,
        lastTelegramErrorKey: observed.lastTelegramErrorKey,
        tabId: observed.tabId,
        lastObservedFingerprint: observed.lastObservedFingerprint,
        lastCommandedFingerprint: observed.lastCommandedFingerprint,
        lastObservedAt: observed.lastObservedAt,
        lastCommandAt: observed.lastCommandAt,
        lastDispatchOutcome: observed.lastDispatchOutcome,
        lastObservedSessionId: observed.lastObservedSessionId,
        lastSnapshotAt: observed.lastSnapshotAt,
        lastHardRefreshAt: observed.lastHardRefreshAt,
        lastRecoveryAt: observed.lastRecoveryAt,
        lastRecoveryReason: observed.lastRecoveryReason,
        staleRecoveries: observed.staleRecoveries,
        lastStoppedAt: observed.lastStoppedAt,
        lastStopReason: observed.lastStopReason,
        lastError: observed.lastError
      };'''
new = '''      const runtimeAutoStop = observed.enabled === false
        && ["stop-phrase", "continuation-limit", "runtime-limit"].includes(observed.lastStopReason);
      return {
        ...latestChat,
        enabled: runtimeAutoStop ? false : latestChat.enabled,
        runStartedAt: observed.runStartedAt,
        continuationCount: observed.continuationCount,
        taskActive: runtimeAutoStop ? false : observed.taskActive,
        taskStartedAt: observed.taskStartedAt,
        taskCompletedAt: runtimeAutoStop ? observed.taskCompletedAt : latestChat.taskCompletedAt,
        taskCompletionReason: runtimeAutoStop ? observed.taskCompletionReason : latestChat.taskCompletionReason,
        lastDecision: observed.lastDecision,
        nextEligibleAt: runtimeAutoStop ? null : observed.nextEligibleAt,
        lastTelegramErrorKey: observed.lastTelegramErrorKey,
        tabId: observed.tabId,
        lastObservedFingerprint: observed.lastObservedFingerprint,
        lastCommandedFingerprint: observed.lastCommandedFingerprint,
        lastObservedAt: observed.lastObservedAt,
        lastCommandAt: observed.lastCommandAt,
        lastDispatchOutcome: observed.lastDispatchOutcome,
        lastObservedSessionId: observed.lastObservedSessionId,
        lastSnapshotAt: observed.lastSnapshotAt,
        lastHardRefreshAt: observed.lastHardRefreshAt,
        lastRecoveryAt: observed.lastRecoveryAt,
        lastRecoveryReason: observed.lastRecoveryReason,
        staleRecoveries: observed.staleRecoveries,
        lastStoppedAt: runtimeAutoStop ? observed.lastStoppedAt : latestChat.lastStoppedAt,
        lastStopReason: runtimeAutoStop ? observed.lastStopReason : latestChat.lastStopReason,
        lastError: observed.lastError
      };'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"Expected exactly one merge block, found {count}")
path.write_text(text.replace(old, new), encoding="utf-8")
print("runtime merge block patched exactly once")
