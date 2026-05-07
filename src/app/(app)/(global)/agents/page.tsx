import { AgentRunsLog } from "@/components/observability/AgentRunsLog"
import { WebhookLogsTable } from "@/components/observability/WebhookLogsTable"

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h1 className="text-base font-semibold text-foreground">Agents</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Agent runs and webhook ingestion across all contexts.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Agent Runs</h2>
        <AgentRunsLog limit={50} />
      </div>

      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Webhook Logs</h2>
        <WebhookLogsTable limit={50} />
      </div>
    </div>
  )
}
