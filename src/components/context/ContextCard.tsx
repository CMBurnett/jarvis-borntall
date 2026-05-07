"use client"

import { cn } from "@/lib/utils"
import { LIFECYCLE_STAGE_COLORS, LIFECYCLE_STAGE_LABELS } from "@/lib/data/mock-contexts"
import type { Context } from "@/lib/types/contexts"

export function ContextCard({ context }: { context: Context }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", LIFECYCLE_STAGE_COLORS[context.lifecycle_stage])} />
        <h2 className="text-sm font-semibold text-foreground">{context.name}</h2>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {LIFECYCLE_STAGE_LABELS[context.lifecycle_stage]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{context.description}</p>
      <p className="text-[10px] text-muted-foreground font-mono">{context.stack_summary}</p>
      <p className="text-[10px] text-muted-foreground italic">[Context Card — Sprint 2]</p>
    </div>
  )
}
