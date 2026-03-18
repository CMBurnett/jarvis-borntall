"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChatThread } from "@/components/chat/chat-thread";
import {
  getSessions,
  createSession,
  deleteSession,
  updateSessionTitle,
  deriveTitle,
} from "@/lib/chat-sessions";
import type { ChatSession } from "@/lib/chat-sessions";
import {
  MessagesSquare,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load sessions and set active from URL param
  useEffect(() => {
    const loaded = getSessions();
    setSessions(loaded);

    const fromUrl = searchParams.get("session");
    if (fromUrl && loaded.some((s) => s.id === fromUrl)) {
      setActiveId(fromUrl);
    } else if (loaded.length > 0) {
      setActiveId(loaded[0].id);
    } else {
      // No sessions — create one
      const session = createSession();
      setSessions([session]);
      setActiveId(session.id);
    }
  }, [searchParams]);

  function handleNewChat() {
    const session = createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        if (next.length > 0) {
          setActiveId(next[0].id);
        } else {
          const session = createSession();
          next.push(session);
          setActiveId(session.id);
        }
      }
      return next;
    });
  }

  const handleFirstMessage = useCallback(
    (text: string) => {
      if (!activeId) return;
      const title = deriveTitle(text);
      updateSessionTitle(activeId, title);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, title } : s)),
      );
    },
    [activeId],
  );

  const activeSession = sessions.find((s) => s.id === activeId);

  return (
    <div className="flex gap-4 h-[calc(100vh-3rem)]">
      {/* Session sidebar */}
      <div className="w-64 shrink-0 rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Chats</span>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors ${
                session.id === activeId
                  ? "bg-muted/60"
                  : "hover:bg-muted/30"
              }`}
              onClick={() => setActiveId(session.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">
                {session.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat thread */}
      <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-0">
        {activeSession && (
          <ChatThread
            key={activeId}
            chatId={activeId!}
            onFirstMessage={handleFirstMessage}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}
