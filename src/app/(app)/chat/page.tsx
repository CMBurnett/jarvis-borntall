"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
  Sparkles,
} from "lucide-react";

const EXAMPLE_CHATS = [
  {
    title: "Summarize compliance gaps",
    preview: "Give me a summary of our open compliance gaps by severity",
  },
  {
    title: "OEE trend analysis",
    preview: "What's our current OEE trend across all production lines?",
  },
  {
    title: "Supplier risk review",
    preview: "Which suppliers have active alerts or are overdue for evaluation?",
  },
  {
    title: "Draft audit report",
    preview: "Draft an audit readiness report for our upcoming ISO 9001 surveillance audit",
  },
  {
    title: "AR aging breakdown",
    preview: "Break down our accounts receivable by aging bucket",
  },
];

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load sessions, prune stale blanks, and set active from URL param
  useEffect(() => {
    const loaded = getSessions();

    // Keep at most one blank "New chat" session — delete the rest
    const blanks = loaded.filter((s) => s.title === "New chat");
    if (blanks.length > 1) {
      const toDelete = blanks.slice(1);
      for (const s of toDelete) deleteSession(s.id);
    }
    const cleaned = blanks.length > 1
      ? loaded.filter((s) => s.title !== "New chat" || s.id === blanks[0].id)
      : loaded;

    const fromUrl = searchParams.get("session");
    if (fromUrl && cleaned.some((s) => s.id === fromUrl)) {
      setSessions(cleaned);
      setActiveId(fromUrl);
    } else if (cleaned.length > 0) {
      const blank = cleaned.find((s) => s.title === "New chat");
      setSessions(cleaned);
      setActiveId(blank?.id ?? cleaned[0].id);
    } else {
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
    <div className="flex flex-col gap-4 h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pt-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">Jarvis Chat</h1>
            <p className="text-xs text-muted-foreground">Ask Jarvis about operations, compliance, orders, and more</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-4 flex-1 min-h-0">
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
            {/* User sessions */}
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

            {/* Example chats divider */}
            <div className="px-4 pt-4 pb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Try asking
              </p>
            </div>

            {/* Example chats */}
            {EXAMPLE_CHATS.map((example) => (
              <button
                key={example.title}
                onClick={() => {
                  const session = createSession();
                  setSessions((prev) => [session, ...prev]);
                  setActiveId(session.id);
                  // Small delay to let the new session mount, then we can't
                  // directly set the input — the ChatThread will show suggestions
                  // which serve a similar purpose. Instead we'll just open a new chat.
                }}
                className="w-full text-left px-4 py-2 hover:bg-muted/30 transition-colors group"
              >
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {example.title}
                </p>
                <p className="text-[11px] text-muted-foreground/50 truncate">
                  {example.preview}
                </p>
              </button>
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
    </div>
  );
}
