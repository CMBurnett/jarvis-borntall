"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ContextSecurityRow {
  id: string
  name: string
  lifecycle_stage: string
  security_tier: 1 | 2 | 3
  checks: { pass: number; warn: number; fail: number; pending: number; na: number; total: number }
}

const TIER_COLOR: Record<number, string> = {
  1: "text-red-500",
  2: "text-amber-500",
  3: "text-muted-foreground",
}

export function SecurityAggregate() {
  const [rows, setRows] = useState<ContextSecurityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/security/aggregate")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRows(d) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading security status…
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-12 text-center">
        <Shield className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No security data yet</p>
        <p className="text-xs text-muted-foreground/60">Open a context's Security tab to seed its checklist</p>
      </div>
    )
  }

  // Global tallies
  const totals = rows.reduce(
    (acc, r) => ({
      pass: acc.pass + r.checks.pass,
      warn: acc.warn + r.checks.warn,
      fail: acc.fail + r.checks.fail,
      total: acc.total + r.checks.total,
    }),
    { pass: 0, warn: 0, fail: 0, total: 0 }
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Global summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Contexts", value: rows.length, icon: Shield, color: "text-foreground" },
          { label: "Passing", value: totals.pass, icon: CheckCircle2, color: "text-green-500" },
          { label: "Warnings", value: totals.warn, icon: AlertTriangle, color: "text-amber-500" },
          { label: "Failing", value: totals.fail, icon: XCircle, color: "text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card/80 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={cn("h-3.5 w-3.5", color)} />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
            <p className={cn("text-2xl font-semibold tabular-nums", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-context rows */}
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const { pass, warn, fail, total } = row.checks
          const passRate = total > 0 ? Math.round((pass / total) * 100) : 0
          const hasFail = fail > 0
          const hasWarn = warn > 0

          return (
            <Link
              key={row.id}
              href={`/context/${row.id}/security`}
              className="group rounded-xl border border-border bg-card/80 px-5 py-3.5 hover:border-brand/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium text-foreground group-hover:text-brand transition-colors">
                      {row.name}
                    </span>
                    <span className={cn("flex items-center gap-0.5 text-[10px]", TIER_COLOR[row.security_tier])}>
                      <Shield className="h-2.5 w-2.5" /> T{row.security_tier}
                    </span>
                    {hasFail && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-500">
                        <XCircle className="h-2.5 w-2.5" /> {fail} failing
                      </span>
                    )}
                    {!hasFail && hasWarn && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                        <AlertTriangle className="h-2.5 w-2.5" /> {warn} warnings
                      </span>
                    )}
                  </div>
                  {total > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            hasFail ? "bg-red-500" : hasWarn ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${passRate}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {pass}/{total}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/60 italic">No checks seeded — visit Security tab</p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
