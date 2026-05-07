"use client"

import { useState, useEffect } from "react"
import { Bot, Loader2, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentRun {
  id: string
  created_at: string
  model_used: string
  latency_ms: number | null
  tokens_in: number | null
  tokens_out: number | null
  result: Record<string, unknown> | null
  inbox_items: { title: string; source: string; context_id: string } | null
}

const SOURCE_LABELS: Record<string, string> = {
  sentry: "Sentry", vercel: "Vercel", github: "GitHub",
  uptime: "Uptime", manual: "Manual", anthropic: "Anthropic",
}

export function AgentRunsLog({ limit = 50 }: { limit?: number }) {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/agent-runs?limit=${limit}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRuns(d) })
      .finally(() => setLoading(false))
  }, [limit])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading agent runs…
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
        <Bot className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No agent runs yet</p>
        <p className="text-xs text-muted-foreground/60">Runs appear here after inbox items are triaged</p>
      </div>
    )
  }

  const totalTokensIn = runs.reduce((s, r) => s + (r.tokens_in ?? 0), 0)
  const totalTokensOut = runs.reduce((s, r) => s + (r.tokens_out ?? 0), 0)
  const avgLatency = runs.filter((r) => r.latency_ms).reduce((s, r) => s + (r.latency_ms ?? 0), 0) / runs.filter((r) => r.latency_ms).length

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total runs", value: runs.length },
          { label: "Avg latency", value: `${Math.round(avgLatency || 0)}ms` },
          { label: "Total tokens", value: (totalTokensIn + totalTokensOut).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card/80 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Item</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Source</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Model</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Latency</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Tokens in</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Tokens out</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Priority</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, i) => {
              const priority = run.result?.priority as string | undefined
              return (
                <tr
                  key={run.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    i % 2 === 0 ? "bg-card/60" : "bg-muted/20"
                  )}
                >
                  <td className="px-4 py-2.5 max-w-[220px] truncate text-foreground font-medium">
                    {run.inbox_items?.title ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {SOURCE_LABELS[run.inbox_items?.source ?? ""] ?? run.inbox_items?.source ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground/80 text-[10px]">
                    {run.model_used.replace("claude-", "").replace("-20251001", "")}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                    {run.latency_ms ? `${run.latency_ms}ms` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                    {run.tokens_in?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                    {run.tokens_out?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {priority && (
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium",
                        priority === "urgent" ? "bg-red-500/10 text-red-500" :
                        priority === "high"   ? "bg-amber-500/10 text-amber-500" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {priority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">
                    {new Date(run.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
