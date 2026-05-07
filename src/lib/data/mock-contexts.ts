import type { Context } from "@/lib/types/contexts"

export const MOCK_CONTEXTS: Context[] = [
  {
    id: "jarvis-os",
    name: "Jarvis OS",
    description: "AI-native work operating system",
    lifecycle_stage: "active_dev",
    security_tier: 1,
    stack_summary: "Next.js 16, Supabase, Vercel, Anthropic API",
    repo_url: "https://github.com/cmb/jarvis-borntall",
    sprint_focus: "Sprint 1 — Shell + Context CRUD. Building three-panel layout, Supabase auth, context data model with RLS, and the context switcher.",
    claude_md_content: "",
    models: [
      { model_id: "claude-sonnet-4-6", role: "Primary coding", is_default: true },
    ],
    tools: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
  },
  {
    id: "mastrocco",
    name: "Mastrocco",
    description: "Order processing and CRM platform",
    lifecycle_stage: "stabilization",
    security_tier: 2,
    stack_summary: "Next.js 14, Supabase, Vercel",
    sprint_focus: "Stability pass and CRM polish. Fixing edge cases in order ingestion flow.",
    claude_md_content: "",
    models: [],
    tools: [],
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2026-04-15T00:00:00Z",
  },
  {
    id: "iso-ready",
    name: "ISO Ready",
    description: "ISO gap analysis and audit readiness",
    lifecycle_stage: "maintenance",
    security_tier: 2,
    stack_summary: "Next.js 14, Supabase, Anthropic API",
    sprint_focus: "Maintenance mode — no active sprint.",
    claude_md_content: "",
    models: [],
    tools: [],
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2026-02-20T00:00:00Z",
  },
  {
    id: "sage-connector",
    name: "Sage Connector",
    description: "ERP integration bridge for Sage 200",
    lifecycle_stage: "paused",
    security_tier: 3,
    stack_summary: "Next.js, Sage 200 API",
    sprint_focus: "Paused — awaiting client decision on scope.",
    claude_md_content: "",
    models: [],
    tools: [],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-12-01T00:00:00Z",
  },
]

export const LIFECYCLE_STAGE_COLORS: Record<Context["lifecycle_stage"], string> = {
  active_dev: "bg-green-500",
  stabilization: "bg-amber-500",
  maintenance: "bg-blue-400",
  paused: "bg-gray-400",
}

export const LIFECYCLE_STAGE_LABELS: Record<Context["lifecycle_stage"], string> = {
  active_dev: "Active Dev",
  stabilization: "Stabilization",
  maintenance: "Maintenance",
  paused: "Paused",
}
