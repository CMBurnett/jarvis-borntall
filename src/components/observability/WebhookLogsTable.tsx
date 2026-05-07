"use client"

import { useState, useEffect } from "react"
import { Webhook, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface WebhookLog {
  id: string
  received_at: string
  source: string
  is_valid: boolean
  http_status: number | null
  error: string | null
  contexts: { name: string } | null
}

const SOURCE_LABELS: Record<string, string> = {
  vercel: "Vercel", github: "GitHub", sentry: "Sentry", uptime: "Uptime",
}

export function WebhookLogsTable({ contextId, limit = 50 }: { contextId?: string; limit?: number }) {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = contextId
      ? `/api/webhook-logs?context_id=${contextId}&limit=${limit}`
      : `/api/webhook-logs?limit=${limit}`
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLogs(d) })
      .finally(() => setLoading(false))
  }, [contextId, limit])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading webhook logs…
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
        <Webhook className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No webhook logs yet</p>
        <p className="text-xs text-muted-foreground/60">
          Logs appear when webhooks are received at{" "}
          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">/api/webhooks/[contextId]/[source]</code>
        </p>
      </div>
    )
  }

  const validCount = logs.filter((l) => l.is_valid).length

  return (
    <div className="flex flex-col gap-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card/80 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-lg font-semibold text-foreground">{logs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Valid</p>
          <p className="text-lg font-semibold text-green-500">{validCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invalid sig</p>
          <p className="text-lg font-semibold text-red-500">{logs.length - validCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Valid</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Source</th>
              {!contextId && (
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Context</th>
              )}
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Error</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Received</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr
                key={log.id}
                className={cn(
                  "border-b border-border last:border-0",
                  i % 2 === 0 ? "bg-card/60" : "bg-muted/20"
                )}
              >
                <td className="px-4 py-2.5">
                  {log.is_valid
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                </td>
                <td className="px-4 py-2.5 text-foreground font-medium">
                  {SOURCE_LABELS[log.source] ?? log.source}
                </td>
                {!contextId && (
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {log.contexts?.name ?? "—"}
                  </td>
                )}
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {log.http_status ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground/70 max-w-[180px] truncate">
                  {log.error ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">
                  {new Date(log.received_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
