/**
 * Client-side chat session store (localStorage-backed).
 * Each session has an id, a title (derived from first user message), and a timestamp.
 */

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
};

const STORAGE_KEY = "jarvis-chat-sessions";

function readSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSessions(): ChatSession[] {
  return readSessions().sort((a, b) => b.createdAt - a.createdAt);
}

export function createSession(title?: string): ChatSession {
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: title ?? "New chat",
    createdAt: Date.now(),
  };
  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);
  return session;
}

export function updateSessionTitle(id: string, title: string) {
  const sessions = readSessions();
  const session = sessions.find((s) => s.id === id);
  if (session) {
    session.title = title;
    writeSessions(sessions);
  }
}

export function deleteSession(id: string) {
  const sessions = readSessions().filter((s) => s.id !== id);
  writeSessions(sessions);
}

/** Derive a short title from the first user message */
export function deriveTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.slice(0, 47) + "…";
}
