import { notFound } from "next/navigation"
import { ChecklistView } from "@/components/security/ChecklistView"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/dev"
import { MOCK_CONTEXTS } from "@/lib/data/mock-contexts"

export default async function ContextSecurityPage({
  params,
}: {
  params: Promise<{ contextId: string }>
}) {
  const { contextId } = await params

  let contextName = ""

  if (!isSupabaseConfigured()) {
    const ctx = MOCK_CONTEXTS.find((c) => c.id === contextId)
    if (!ctx) notFound()
    contextName = ctx.name
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()
    const { data: ctx } = await supabase
      .from("contexts")
      .select("name")
      .eq("id", contextId)
      .eq("user_id", user.id)
      .single()
    if (!ctx) notFound()
    contextName = ctx.name
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h1 className="text-base font-semibold text-foreground">{contextName} — Security</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Security checklist. Click any row to update status or add notes. Checks auto-seed on first visit.
        </p>
      </div>
      <ChecklistView contextId={contextId} />
    </div>
  )
}
