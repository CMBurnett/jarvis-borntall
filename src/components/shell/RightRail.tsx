"use client"

import { cn } from "@/lib/utils"
import { Shield } from "lucide-react"
import { LIFECYCLE_STAGE_COLORS, LIFECYCLE_STAGE_LABELS } from "@/lib/data/mock-contexts"
import type { Context } from "@/lib/types/contexts"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="mx-3 border-t border-border shrink-0" />
}

export function RightRail({ context }: { context?: Context }) {
  if (!context) {
    return (
      <aside className="fixed right-3 top-3 bottom-3 z-40 hidden xl:flex w-56 flex-col rounded-2xl border border-border bg-card shadow-md">
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">Select a context to see details</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="fixed right-3 top-3 bottom-3 z-40 hidden xl:flex w-56 flex-col rounded-2xl border border-border bg-card shadow-md overflow-y-auto">
      {/* Active context header */}
      <div className="flex flex-col gap-1 px-3 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              LIFECYCLE_STAGE_COLORS[context.lifecycle_stage]
            )}
          />
          <p className="text-sm font-semibold text-foreground truncate">{context.name}</p>
        </div>
        <div className="flex items-center gap-1.5 pl-4">
          <span className="text-[10px] text-muted-foreground">
            {LIFECYCLE_STAGE_LABELS[context.lifecycle_stage]}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Shield className="h-2.5 w-2.5" />
            Tier {context.security_tier}
          </span>
        </div>
        {context.description && (
          <p className="pl-4 text-[11px] text-muted-foreground leading-tight line-clamp-2">
            {context.description}
          </p>
        )}
      </div>

      <Divider />

      {/* Models */}
      <Section title="Models">
        {context.models.length > 0 ? (
          context.models.map((m) => (
            <div key={m.model_id} className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-foreground">{m.model_id.split("-").slice(0, 2).join("-")}</p>
                <p className="truncate text-[9px] text-muted-foreground">{m.role}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-muted-foreground italic">[Models — Sprint 2]</p>
        )}
      </Section>

      <Divider />

      {/* Tools */}
      <Section title="Tools">
        {context.tools.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {context.tools.filter((t) => t.is_active).map((t) => (
              <span
                key={t.tool_name}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground"
              >
                {t.tool_name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">[Tools — Sprint 2]</p>
        )}
      </Section>

      <Divider />

      {/* Security summary */}
      <Section title="Security">
        <p className="text-[11px] text-muted-foreground italic">[Security Summary — Sprint 3]</p>
      </Section>

      <Divider />

      {/* Sprint focus */}
      <Section title="Sprint Focus">
        <p className="text-[11px] text-foreground leading-relaxed">
          {context.sprint_focus || <span className="italic text-muted-foreground">[Sprint Focus — Sprint 2]</span>}
        </p>
      </Section>
    </aside>
  )
}
