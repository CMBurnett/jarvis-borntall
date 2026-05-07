import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contextId = searchParams.get("context_id")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)

  // Only return logs for contexts owned by user
  let query = supabase
    .from("webhook_logs")
    .select("*, contexts!inner(id, name, user_id)")
    .eq("contexts.user_id", user.id)
    .order("received_at", { ascending: false })
    .limit(limit)

  if (contextId) query = query.eq("context_id", contextId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
