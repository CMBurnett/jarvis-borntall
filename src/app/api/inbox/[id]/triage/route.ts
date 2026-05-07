import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { triageInboxItem } from "@/lib/anthropic/inbox-agent"

type Params = { params: Promise<{ id: string }> }

// POST /api/inbox/[id]/triage
// Runs the triage agent on a single inbox item and saves the result.
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // IDOR: fetch item, verify ownership
  const { data: item } = await supabase
    .from("inbox_items")
    .select("*, contexts(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const contextName = (item.contexts as unknown as { name: string } | null)?.name ?? "Unknown"
  const start = Date.now()

  let result
  try {
    result = await triageInboxItem(
      contextName,
      item.source,
      item.title,
      item.raw_payload as Record<string, unknown>
    )
  } catch (err) {
    return NextResponse.json({ error: "Agent failed", detail: String(err) }, { status: 500 })
  }

  const latencyMs = Date.now() - start

  // Update inbox item with agent results
  const { data: updated } = await supabase
    .from("inbox_items")
    .update({
      priority: result.priority,
      agent_summary: result.agent_summary,
      agent_suggested_actions: result.agent_suggested_actions,
    })
    .eq("id", id)
    .select()
    .single()

  // Log the agent run
  await supabase.from("agent_runs").insert({
    inbox_item_id: id,
    user_id: user.id,
    model_used: "claude-haiku-4-5-20251001",
    latency_ms: latencyMs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: result as any,
  })

  // Push notification for urgent items
  if (result.priority === "urgent") {
    const { sendPushToUser } = await import("@/lib/push/send-notification")
    sendPushToUser(user.id, {
      title: `Urgent: ${item.title}`,
      body: result.agent_summary ?? "Requires immediate attention",
      data: { url: "/inbox" },
    }).catch(() => {}) // fire-and-forget, don't fail the response
  }

  return NextResponse.json(updated)
}
