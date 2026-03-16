import { Bot, Sparkles, ArrowUp } from "lucide-react";

const SUGGESTIONS = [
  "Summarize today's compliance gaps",
  "What's our current OEE trend?",
  "Which suppliers have active alerts?",
  "Draft an audit readiness report",
];

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">Chat</h1>
          <p className="text-xs text-muted-foreground">Full-screen conversation with Jarvis</p>
        </div>
      </div>

      {/* Placeholder conversation area */}
      <div className="flex flex-col gap-3 min-h-[340px] rounded-2xl border border-border bg-card p-5">
        {/* Jarvis message */}
        <div className="flex items-start gap-3">
          <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 max-w-md">
            <p className="text-sm text-foreground leading-relaxed">
              Hello! I&apos;m Jarvis. Ask me anything about your operations — compliance gaps,
              OEE trends, order status, or anything else across your connected systems.
            </p>
          </div>
        </div>

        {/* User message placeholder */}
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-tr-sm bg-brand-gradient px-4 py-3 max-w-sm">
            <p className="text-sm text-primary-foreground leading-relaxed">
              How many open compliance gaps do we have this month?
            </p>
          </div>
        </div>

        {/* Jarvis response */}
        <div className="flex items-start gap-3">
          <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 max-w-md">
            <p className="text-sm text-foreground leading-relaxed">
              You currently have <strong>14 open gaps</strong> across ISO 9001 and ISO 14001.
              3 are flagged as critical and require attention before your audit on April 2nd.
            </p>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <input
            readOnly
            placeholder="Ask Jarvis anything…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {SUGGESTIONS.slice(0, 2).map((s) => (
              <span
                key={s}
                className="text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-border bg-muted/40"
              >
                {s}
              </span>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-gradient text-primary-foreground shrink-0">
            <ArrowUp className="h-3 w-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
