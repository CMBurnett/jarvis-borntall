"use client"

import { useState, useEffect } from "react"
import { CheckRow } from "./CheckRow"
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/security/checklist-defaults"
import type { SecurityCheck } from "@/lib/types/security"
import { Loader2 } from "lucide-react"

export function ChecklistView({ contextId }: { contextId: string }) {
  const [checks, setChecks] = useState<SecurityCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/security/${contextId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setChecks(data)
        else setError(data.error ?? "Failed to load")
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false))
  }, [contextId])

  function updateCheck(updated: SecurityCheck) {
    setChecks((prev) => prev.map((c) => c.id === updated.id ? updated : c))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading security checks…
      </div>
    )
  }

  if (error) {
    return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
  }

  const byCategory = CATEGORY_ORDER.reduce<Record<string, SecurityCheck[]>>((acc, cat) => {
    acc[cat] = checks.filter((c) => c.category === cat)
    return acc
  }, {})

  const total = checks.length
  const passed = checks.filter((c) => c.status === "pass").length
  const failed = checks.filter((c) => c.status === "fail").length
  const warned = checks.filter((c) => c.status === "warn").length

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/80 px-5 py-3">
        <Stat label="Total" value={total} />
        <div className="h-4 w-px bg-border" />
        <Stat label="Pass" value={passed} color="text-green-600 dark:text-green-400" />
        <Stat label="Warn" value={warned} color="text-amber-600 dark:text-amber-400" />
        <Stat label="Fail" value={failed} color="text-destructive" />
        <div className="ml-auto">
          <div className="h-2 w-40 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: total > 0 ? `${(passed / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((cat) => {
        const catChecks = byCategory[cat] ?? []
        if (!catChecks.length) return null
        return (
          <div key={cat} className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground">{CATEGORY_LABELS[cat]}</p>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {catChecks.filter((c) => c.status === "pass").length}/{catChecks.length} passed
              </span>
            </div>
            <div className="divide-y divide-border">
              {catChecks.map((check) => (
                <CheckRow key={check.id} check={check} contextId={contextId} onUpdate={updateCheck} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={cn("text-sm font-semibold tabular-nums", color ?? "text-foreground")}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

// cn needed locally since it's a client component
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}
