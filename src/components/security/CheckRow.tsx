"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { SecurityCheck } from "@/lib/types/security"
import { CheckCircle2, XCircle, AlertTriangle, Circle, Minus, ChevronDown, Loader2 } from "lucide-react"

const STATUS_CONFIG = {
  pass:    { icon: CheckCircle2, color: "text-green-500",          label: "Pass" },
  fail:    { icon: XCircle,      color: "text-destructive",        label: "Fail" },
  warn:    { icon: AlertTriangle, color: "text-amber-500",         label: "Warn" },
  pending: { icon: Circle,       color: "text-muted-foreground/50", label: "Pending" },
  na:      { icon: Minus,        color: "text-muted-foreground/40", label: "N/A" },
} as const

const STATUSES: SecurityCheck["status"][] = ["pass", "warn", "fail", "pending", "na"]

export function CheckRow({
  check,
  contextId,
  onUpdate,
}: {
  check: SecurityCheck
  contextId: string
  onUpdate: (updated: SecurityCheck) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(check.notes ?? "")
  const [saving, setSaving] = useState(false)

  const { icon: Icon, color } = STATUS_CONFIG[check.status]

  async function updateStatus(status: SecurityCheck["status"]) {
    setSaving(true)
    try {
      const res = await fetch(`/api/security/${contextId}/${check.check_key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  async function saveNotes() {
    setSaving(true)
    try {
      const res = await fetch(`/api/security/${contextId}/${check.check_key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-3 px-5 py-3 text-left hover:bg-muted/30 transition-colors w-full"
      >
        <Icon className={cn("h-4 w-4 shrink-0", color)} />
        <span className="flex-1 text-sm text-foreground">{check.label}</span>
        {check.last_checked_at && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {new Date(check.last_checked_at).toLocaleDateString()}
          </span>
        )}
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="px-5 pb-4 flex flex-col gap-3 border-t border-border/50 pt-3">
          {/* Status buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUSES.map((s) => {
              const { icon: SIcon, color: sc, label } = STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    check.status === s
                      ? "border-current bg-muted font-medium"
                      : "border-border text-muted-foreground hover:border-current hover:text-foreground",
                    sc
                  )}
                >
                  <SIcon className="h-3.5 w-3.5" />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes, links, or evidence…"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
