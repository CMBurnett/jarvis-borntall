"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatThread } from "./chat-thread";
import {
  createSession,
  deriveTitle,
  updateSessionTitle,
} from "@/lib/chat-sessions";

export function ChatBlock() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Create a fresh session for the home chat
    const session = createSession();
    setSessionId(session.id);
  }, []);

  const handleFirstMessage = useCallback(
    (text: string) => {
      if (!sessionId) return;
      updateSessionTitle(sessionId, deriveTitle(text));
      // Navigate to the full chat view with this session
      router.push(`/chat?session=${sessionId}`);
    },
    [sessionId, router],
  );

  if (!sessionId) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden min-h-24 max-h-[100vh]">
      <ChatThread
        chatId={sessionId}
        onFirstMessage={handleFirstMessage}
        className="h-full"
      />
    </div>
  );
}
