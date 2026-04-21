import type { StateCheckHistoryEntryV1 } from "./types";

const STORAGE_KEY = "stateCheckHistory:v1";

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadStateCheckHistory(): StateCheckHistoryEntryV1[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse<unknown>(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(Boolean) as StateCheckHistoryEntryV1[];
}

export function saveStateCheckHistory(entries: StateCheckHistoryEntryV1[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function prependHistoryEntry(entry: StateCheckHistoryEntryV1) {
  const prev = loadStateCheckHistory();
  const next = [entry, ...prev].slice(0, 100); // 初期版は上限を設ける（将来DB化で解除可）
  saveStateCheckHistory(next);
  return next;
}

