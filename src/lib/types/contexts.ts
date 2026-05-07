export interface ContextModel {
  model_id: string
  role: string
  is_default: boolean
}

export interface ContextTool {
  tool_name: string
  tool_type: "integration" | "mcp" | "custom"
  config: Record<string, string>
  is_active: boolean
}

export interface Context {
  id: string
  name: string
  description: string
  lifecycle_stage: "active_dev" | "stabilization" | "maintenance" | "paused"
  security_tier: 1 | 2 | 3
  stack_summary: string
  repo_url?: string | null
  deploy_url?: string | null
  sprint_focus: string
  claude_md_content: string
  models: ContextModel[]
  tools: ContextTool[]
  created_at: string
  updated_at: string
}
