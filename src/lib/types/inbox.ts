export interface InboxItem {
  id: string
  context_id: string
  source: "sentry" | "vercel" | "supabase" | "github" | "uptime" | "anthropic" | "security_check" | "manual"
  category: "error" | "deploy" | "security" | "performance" | "ai_alert" | "business_event" | "pr" | "info"
  priority: "urgent" | "high" | "normal" | "low"
  title: string
  preview: string
  raw_payload: Record<string, unknown>
  agent_summary?: string
  agent_suggested_actions?: string[]
  is_read: boolean
  is_archived: boolean
  needs_action: boolean
  created_at: string
}
