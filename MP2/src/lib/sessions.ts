import type { PrepInputT } from "./prep.functions";
import type { PrepResult } from "./prep.functions";

const KEY = "ux-prep.sessions.v1";

export interface SavedSession {
  id: string;
  createdAt: string;
  input: PrepInputT;
  result: PrepResult;
}

export function loadSessions(): SavedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedSession[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveSession(s: SavedSession) {
  const all = loadSessions();
  all.unshift(s);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function deleteSession(id: string) {
  const all = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
