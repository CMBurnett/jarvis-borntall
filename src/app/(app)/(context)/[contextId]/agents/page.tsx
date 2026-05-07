import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/dev"
import { MOCK_CONTEXTS } from "@/lib/data/mock-contexts"
import { AgentRunsLog } from "@/components/observability/AgentRunsLog"
import { WebhookLogsTable } from "@/components/observability/WebhookLogsTable"

type Props = { params: Promise<{ contextId: string }> }

async function getContextName(contextId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_CONTEXTS.find((c) => c.id === contextId)?.name ?? null
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("contexts")
    .select("name")
    .eq("id", contextId)
    .eq("user_id", user.id)
    .single()
  return data?.name ?? null
}

export default async function ContextAgentsPage({ params }: Props) {
  const { contextId } = await params
  const name = await getContextName(contextId)
  if (!name) notFound()

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h1 className="text-base font-semibold text-foreground">{name} — Agents</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Agent runs and webhook ingestion logs for this context.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Agent Runs</h2>
        <AgentRunsLog limit={30} />
      </div>

      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Webhook Logs</h2>
        <WebhookLogsTable contextId={contextId} limit={30} />
      </div>
    </div>
  )
}
