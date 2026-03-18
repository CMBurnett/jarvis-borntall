"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles, ArrowUp, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "Summarize today's compliance gaps",
  "What's our current OEE trend?",
  "Which suppliers have active alerts?",
  "Draft an audit readiness report",
];

export function ChatThread({
  chatId,
  onFirstMessage,
  className = "",
}: {
  chatId: string;
  onFirstMessage?: (text: string) => void;
  className?: string;
}) {
  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    id: chatId,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleSetRef = useRef(false);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (error) console.error("useChat error:", error);
  }, [error]);

  // Derive title from first user message
  useEffect(() => {
    if (titleSetRef.current || !onFirstMessage) return;
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser) {
      const text = firstUser.parts
        .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
        .map((p) => p.text)
        .join("");
      if (text) {
        titleSetRef.current = true;
        onFirstMessage(text);
      }
    }
  }, [messages, onFirstMessage]);

  function submit() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className={`flex flex-col overflow-hidden ${className}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {hasMessages && (
          <div className="flex flex-col gap-4 px-5 pt-5">
            {messages.map((m) => {
              const text = m.parts
                .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
                .map((p) => p.text)
                .join("");

              if (!text && m.role === "assistant") return null;

              return (
                <div key={m.id} className="flex items-start gap-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
                      m.role === "assistant" ? "bg-brand-gradient" : "bg-muted"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-sm leading-relaxed pt-1 min-w-0 prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 max-w-none">
                    {m.role === "assistant" ? (
                      <ReactMarkdown>{text}</ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5 bg-brand-gradient">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground animate-pulse" />
                </div>
                <div className="text-sm text-muted-foreground pt-1">Thinking…</div>
              </div>
            )}
          </div>
        )}

        {error && !hasMessages && (
          <div className="flex items-center justify-center h-20 text-destructive text-sm px-5 text-center">
            Failed to connect — make sure Ollama is running
          </div>
        )}

        {/* Input */}
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-start gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jarvis anything…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground leading-relaxed"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-gradient text-primary-foreground disabled:opacity-35 transition-opacity shrink-0"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Ask
            </button>
          </div>
          {!hasMessages && (
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full border border-border hover:bg-muted/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
