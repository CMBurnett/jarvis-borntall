"use client";

import { useState, useRef } from "react";
import { Sparkles, ArrowUp } from "lucide-react";

const SUGGESTIONS = [
  "Summarize today's compliance gaps",
  "What's our current OEE trend?",
  "Which suppliers have active alerts?",
  "Draft an audit readiness report",
];

export function ChatBlock() {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    // TODO: wire to LLM
    setQuery("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuery(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* Input area */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jarvis anything — analyze compliance gaps, get OEE insights, draft reports, query your data..."
            rows={3}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground leading-relaxed"
            style={{ minHeight: "72px" }}
          />
        </div>

        {/* Footer: suggestions + send */}
        <div className="flex items-center justify-between gap-4 px-5 pb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  textareaRef.current?.focus();
                }}
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full border border-border hover:bg-muted/60 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-gradient text-primary-foreground disabled:opacity-35 transition-opacity shrink-0"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
