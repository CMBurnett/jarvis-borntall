"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { ChatThread } from "./chat-thread";
import {
  createSession,
  deriveTitle,
  updateSessionTitle,
} from "@/lib/chat-sessions";

export function ChatBlock() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const handleFirstMessage = useCallback(
    (text: string) => {
      if (!sessionId) return;
      if (persisted) {
        updateSessionTitle(sessionId, deriveTitle(text));
      } else {
        createSession(deriveTitle(text), sessionId);
        setPersisted(true);
      }
    },
    [sessionId, persisted],
  );

  if (!sessionId) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden h-90">
      <ChatThread
        chatId={sessionId}
        onFirstMessage={handleFirstMessage}
        className="h-full"
        footer={
          <Link
            href="/chat"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessagesSquare className="h-3 w-3" />
            View all chats
          </Link>
        }
      />
    </div>
  );
}
