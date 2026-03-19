"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles, ArrowUp, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ChatThread({
  chatId,
  onFirstMessage,
  className = "",
  footer,
}: {
  chatId: string;
  onFirstMessage?: (text: string) => void;
  className?: string;
  footer?: React.ReactNode;
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
      {hasMessages ? (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col gap-4 px-5 pt-5 pb-4">
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
          </div>

          {/* Input bar — pinned to bottom when messages exist */}
          <div className="shrink-0 px-4 pb-4 pt-2">
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 transition-colors focus-within:border-muted-foreground/40 focus-within:bg-muted/50">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Jarvis anything…"
                rows={1}
                className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground leading-relaxed"
              />
              <div className="flex items-center justify-end mt-1.5">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!input.trim() || isLoading}
                  className="flex items-center justify-center h-7 w-7 rounded-lg bg-foreground text-background disabled:opacity-30 transition-opacity hover:opacity-80"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty state — hero + input centered together */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          <div className="text-center space-y-1 mb-5">
            <div className="h-10 w-10 rounded-xl bg-brand-gradient flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <p className="text-base font-semibold text-foreground">What can I help with?</p>
            <p className="text-xs text-muted-foreground">Ask about operations, compliance, orders, suppliers, and more</p>
          </div>

          {error && (
            <div className="text-destructive text-sm text-center mb-4">
              Failed to connect — make sure Ollama is running
            </div>
          )}

          <div className="w-full max-w-xl">
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 transition-colors focus-within:border-muted-foreground/40 focus-within:bg-muted/50">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Jarvis anything…"
                rows={1}
                className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground leading-relaxed"
              />
              <div className="flex items-center justify-end mt-1.5">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!input.trim() || isLoading}
                  className="flex items-center justify-center h-7 w-7 rounded-lg bg-foreground text-background disabled:opacity-30 transition-opacity hover:opacity-80"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
            {footer && (
              <div className="flex justify-center mt-3">{footer}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
