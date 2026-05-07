import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/dev"
import { MOCK_CONTEXTS, LIFECYCLE_STAGE_COLORS, LIFECYCLE_STAGE_LABELS } from "@/lib/data/mock-contexts"
import { cn } from "@/lib/utils"
import { Shield, GitBranch, ExternalLink, Inbox } from "lucide-react"
import Link from "next/link"
import type { Context } from "@/lib/types/contexts"

async function getContexts(): Promise<Context[]> {
  if (!isSupabaseConfigured()) return MOCK_CONTEXTS
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from("contexts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
  if (!data?.length) return MOCK_CONTEXTS
  return data.map((c) => ({
    ...c,
    models: (c.models ?? []) as unknown as Context["models"],
    tools: (c.tools ?? []) as unknown as Context["tools"],
    security_tier: c.security_tier as 1 | 2 | 3,
  }))
}

const TIER_COLOR: Record<number, string> = {
  1: "text-red-500",
  2: "text-amber-500",
  3: "text-muted-foreground",
}

export default async function PortfolioPage() {
  const contexts = await getContexts()

  const byStage = {
    active_dev:    contexts.filter((c) => c.lifecycle_stage === "active_dev"),
    stabilization: contexts.filter((c) => c.lifecycle_stage === "stabilization"),
    maintenance:   contexts.filter((c) => c.lifecycle_stage === "maintenance"),
    paused:        contexts.filter((c) => c.lifecycle_stage === "paused"),
  }

  return (
    <div className="flex flex-col gap-5 p-6" style={{ minWidth: 720 }}>
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h1 className="text-base font-semibold text-foreground">Portfolio</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {contexts.length} context{contexts.length !== 1 ? "s" : ""} ·{" "}
          {byStage.active_dev.length} active ·{" "}
          {byStage.stabilization.length} stabilization ·{" "}
          {byStage.maintenance.length + byStage.paused.length} inactive
        </p>
      </div>

      {/* Context rows */}
      <div className="flex flex-col gap-3">
        {contexts.map((ctx) => (
          <Link
            key={ctx.id}
            href={`/context/${ctx.id}`}
            className="group rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4 hover:border-border/70 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Status dot */}
              <span className={cn("mt-1 h-3 w-3 rounded-full shrink-0", LIFECYCLE_STAGE_COLORS[ctx.lifecycle_stage])} />

              {/* Main info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
                    {ctx.name}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-px text-[10px] text-muted-foreground">
                    {LIFECYCLE_STAGE_LABELS[ctx.lifecycle_stage]}
                  </span>
                  <span className={cn("flex items-center gap-0.5 text-[10px]", TIER_COLOR[ctx.security_tier])}>
                    <Shield className="h-3 w-3" /> T{ctx.security_tier}
                  </span>
                </div>
                {ctx.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{ctx.description}</p>
                )}
                {ctx.sprint_focus && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/70 leading-snug line-clamp-1 border-l-2 border-brand/30 pl-2">
                    {ctx.sprint_focus}
                  </p>
                )}
              </div>

              {/* Meta + links */}
              <div className="flex items-center gap-2 shrink-0">
                {ctx.stack_summary && (
                  <span className="hidden lg:block text-[10px] text-muted-foreground/60 font-mono max-w-40 truncate">
                    {ctx.stack_summary}
                  </span>
                )}
                {ctx.repo_url && (
                  <span className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <GitBranch className="h-3.5 w-3.5" />
                  </span>
                )}
                {ctx.deploy_url && (
                  <span className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {contexts.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No contexts yet</p>
          <p className="text-xs text-muted-foreground/60">Create your first context using the selector on the left</p>
        </div>
      )}
    </div>
  )
}
