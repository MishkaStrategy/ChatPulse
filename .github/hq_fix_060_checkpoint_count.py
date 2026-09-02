#!/usr/bin/env python3
from pathlib import Path

path = Path("chrome-extension/lib/model-v2.js")
text = path.read_text(encoding="utf-8")
old = '''  const merged = {
    ...latestChat,
    ...(sameControlRevision ? {
      runStartedAt: canAdoptRunStart ? runtimeRunStartedAt : latestChat.runStartedAt,
      continuationCount: sameRun
        ? Math.max(nonNegativeInteger(latestChat?.continuationCount), nonNegativeInteger(runtimeChat?.continuationCount))
        : nonNegativeInteger(latestChat?.continuationCount),
      tabId: runtimeChat.tabId,
      lastObservedFingerprint: runtimeChat.lastObservedFingerprint,'''
new = '''  const merged = {
    ...latestChat,
    continuationCount: sameRun
      ? Math.max(nonNegativeInteger(latestChat?.continuationCount), nonNegativeInteger(runtimeChat?.continuationCount))
      : nonNegativeInteger(latestChat?.continuationCount),
    ...(sameControlRevision ? {
      runStartedAt: canAdoptRunStart ? runtimeRunStartedAt : latestChat.runStartedAt,
      tabId: runtimeChat.tabId,
      lastObservedFingerprint: runtimeChat.lastObservedFingerprint,'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"Expected one dispatch checkpoint counter block, found {count}")
path.write_text(text.replace(old, new), encoding="utf-8")
print("same-run dispatch counter now survives profile/control revision changes")
