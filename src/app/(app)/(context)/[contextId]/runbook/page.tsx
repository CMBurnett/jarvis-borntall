import { notFound } from "next/navigation"
import { RunbookEditor } from "@/components/runbook/RunbookEditor"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/dev"
import { MOCK_CONTEXTS } from "@/lib/data/mock-contexts"

export default async function RunbookPage({
  params,
}: {
  params: Promise<{ contextId: string }>
}) {
  const { contextId } = await params

  let initialContent = ""
  let contextName = ""

  if (!isSupabaseConfigured()) {
    const ctx = MOCK_CONTEXTS.find((c) => c.id === contextId)
    if (!ctx) notFound()
    initialContent = ctx.claude_md_content
    contextName = ctx.name
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

    const { data: ctx } = await supabase
      .from("contexts")
      .select("name, claude_md_content")
      .eq("id", contextId)
      .eq("user_id", user.id)
      .single()
    if (!ctx) notFound()

    initialContent = ctx.claude_md_content
    contextName = ctx.name
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h1 className="text-base font-semibold text-foreground">{contextName} — Runbook</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          CLAUDE.md living document. Auto-saves on blur. "Copy for Claude" formats it for pasting into a Claude Code session.
        </p>
      </div>
      <RunbookEditor contextId={contextId} initialContent={initialContent} />
    </div>
  )
}
