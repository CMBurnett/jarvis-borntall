"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { InboxItem } from "@/lib/types/inbox"
import { cn } from "@/lib/utils"
import { Circle, AlertTriangle, CheckCircle2, Info, Archive, Check, Loader2, Bot } from "lucide-react"

const PRIORITY_CONFIG = {
  urgent: { dot: "bg-red-500",             label: "Urgent" },
  high:   { dot: "bg-amber-500",           label: "High" },
  normal: { dot: "bg-muted-foreground",    label: "Normal" },
  low:    { dot: "bg-muted-foreground/40", label: "Low" },
} as const

const SOURCE_LABELS: Record<string, string> = {
  sentry: "Sentry", vercel: "Vercel", supabase: "Supabase",
  github: "GitHub", uptime: "Uptime", anthropic: "Anthropic",
  security_check: "Security", manual: "Manual",
}

function InboxCard({
  item,
  onUpdate,
}: {
  item: InboxItem
  onUpdate: (updated: Partial<InboxItem>) => void
}) {
  const [triaging, setTriaging] = useState(false)
  const { dot } = PRIORITY_CONFIG[item.priority]

  async function markRead() {
    if (item.is_read) return
    await fetch(`/api/inbox/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    })
    onUpdate({ is_read: true })
  }

  async function archive() {
    await fetch(`/api/inbox/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: true }),
    })
    onUpdate({ is_archived: true })
  }

  async function triage() {
    setTriaging(true)
    try {
      const res = await fetch(`/api/inbox/${item.id}/triage`, { method: "POST" })
      if (res.ok) {
        const updated = await res.json()
        onUpdate({
          priority: updated.priority,
          agent_summary: updated.agent_summary,
          agent_suggested_actions: updated.agent_suggested_actions,
        })
      }
    } finally {
      setTriaging(false)
    }
  }

  return (
    <div
      onClick={markRead}
      className={cn(
        "rounded-xl border p-3.5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-all group",
        item.is_read ? "border-border bg-card/60" : "border-border bg-card/90 shadow-sm"
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-1 h-2 w-2 rounded-full shrink-0", dot, item.is_read && "opacity-40")} />
        <p className={cn("text-sm leading-snug flex-1", item.is_read ? "text-muted-foreground" : "font-medium text-foreground")}>
          {item.title}
        </p>
      </div>

      {item.agent_summary ? (
        <p className="pl-4 text-[11px] text-muted-foreground leading-relaxed line-clamp-2 flex items-start gap-1.5">
          <Bot className="h-3 w-3 shrink-0 mt-0.5 text-brand/70" />
          {item.agent_summary}
        </p>
      ) : item.preview ? (
        <p className="pl-4 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.preview}</p>
      ) : null}

      {/* Suggested actions */}
      {item.agent_suggested_actions && (item.agent_suggested_actions as string[]).length > 0 && (
        <div className="pl-4 flex flex-wrap gap-1">
          {(item.agent_suggested_actions as string[]).map((action) => (
            <span key={action} className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">
              {action}
            </span>
          ))}
        </div>
      )}

      <div className="pl-4 flex items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-px text-[9px] font-medium text-muted-foreground">
          {SOURCE_LABELS[item.source] ?? item.source}
        </span>
        <span className="text-[9px] text-muted-foreground/60">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!item.agent_summary && (
            <button
              onClick={(e) => { e.stopPropagation(); triage() }}
              disabled={triaging}
              className="rounded px-1.5 py-1 text-[9px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
            >
              {triaging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
              Triage
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); archive() }}
            className="rounded px-1.5 py-1 text-[9px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Archive className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

const COLUMNS: { label: string; priority: InboxItem["priority"]; color: string }[] = [
  { label: "Urgent", priority: "urgent", color: "border-red-500/20 bg-red-500/5" },
  { label: "High",   priority: "high",   color: "border-amber-500/20 bg-amber-500/5" },
  { label: "Normal", priority: "normal", color: "border-border bg-card/30" },
  { label: "Low",    priority: "low",    color: "border-border/50 bg-transparent" },
]

export function InboxFeed({ contextId }: { contextId?: string }) {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = contextId ? `/api/inbox?context_id=${contextId}` : "/api/inbox"
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setItems(data) })
      .finally(() => setLoading(false))

    // Supabase realtime for new inbox items
    const supabase = createClient()
    const channel = supabase
      .channel("inbox_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inbox_items" },
        (payload) => {
          setItems((prev) => [payload.new as InboxItem, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [contextId])

  function updateItem(id: string, updates: Partial<InboxItem>) {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ).filter((item) => !item.is_archived))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading inbox…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-12 text-center">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Inbox is clear</p>
        <p className="text-xs text-muted-foreground/60">New items will appear here in real-time as webhooks arrive</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4" style={{ minWidth: "max-content" }}>
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.priority === col.priority && !i.is_archived)
        return (
          <div key={col.priority} className="flex w-72 shrink-0 flex-col gap-3">
            <div className="flex items-center gap-2 pb-1">
              <span className={cn("h-2 w-2 rounded-full", PRIORITY_CONFIG[col.priority].dot)} />
              <span className="text-xs font-semibold text-foreground">{col.label}</span>
              <span className="ml-auto rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                {colItems.length}
              </span>
            </div>
            <div className={cn("flex flex-col gap-2 rounded-2xl border p-2", col.color)}>
              {colItems.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-muted-foreground/50">Empty</div>
              ) : (
                colItems.map((item) => (
                  <InboxCard
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => updateItem(item.id, updates)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
