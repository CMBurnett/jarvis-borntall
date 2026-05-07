import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/dev"
import { MOCK_CONTEXTS, LIFECYCLE_STAGE_LABELS, LIFECYCLE_STAGE_COLORS } from "@/lib/data/mock-contexts"
import { cn } from "@/lib/utils"
import { Shield, ExternalLink, GitBranch } from "lucide-react"
import type { Context } from "@/lib/types/contexts"

async function getContext(contextId: string): Promise<Context | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_CONTEXTS.find((c) => c.id === contextId) ?? null
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("contexts")
    .select("*")
    .eq("id", contextId)
    .eq("user_id", user.id)
    .single()
  if (!data) return null
  return { ...data, models: (data.models ?? []) as unknown as Context["models"], tools: (data.tools ?? []) as unknown as Context["tools"], security_tier: data.security_tier as 1|2|3 }
}

export default async function ContextPage({
  params,
}: {
  params: Promise<{ contextId: string }>
}) {
  const { contextId } = await params
  const context = await getContext(contextId)
  if (!context) notFound()

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-6 py-5">
        <div className="flex items-start gap-3">
          <span className={cn("mt-1 h-3 w-3 rounded-full shrink-0", LIFECYCLE_STAGE_COLORS[context.lifecycle_stage])} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold text-foreground">{context.name}</h1>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {LIFECYCLE_STAGE_LABELS[context.lifecycle_stage]}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" /> Tier {context.security_tier}
              </span>
            </div>
            {context.description && (
              <p className="mt-1 text-sm text-muted-foreground">{context.description}</p>
            )}
            {context.stack_summary && (
              <p className="mt-1 text-xs text-muted-foreground/70 font-mono">{context.stack_summary}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {context.repo_url && (
              <a href={context.repo_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <GitBranch className="h-3.5 w-3.5" /> Repo
              </a>
            )}
            {context.deploy_url && (
              <a href={context.deploy_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <ExternalLink className="h-3.5 w-3.5" /> Deploy
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sprint focus */}
      {context.sprint_focus && (
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Current Sprint</p>
          <p className="text-sm text-foreground leading-relaxed">{context.sprint_focus}</p>
        </div>
      )}

      {/* Models + Tools */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Models</p>
          {context.models.length > 0 ? (
            <div className="flex flex-col gap-2">
              {context.models.map((m) => (
                <div key={m.model_id} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{m.model_id}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No models assigned</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tools</p>
          {context.tools.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {context.tools.filter((t) => t.is_active).map((t) => (
                <span key={t.tool_name} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                  {t.tool_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No tools connected</p>
          )}
        </div>
      </div>
    </div>
  )
}
