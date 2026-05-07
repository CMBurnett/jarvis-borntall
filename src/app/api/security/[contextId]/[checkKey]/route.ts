import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ contextId: string; checkKey: string }> }

// PATCH /api/security/[contextId]/[checkKey]
// Update status and/or notes on a single security check
export async function PATCH(req: NextRequest, { params }: Params) {
  const { contextId, checkKey } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // IDOR: verify ownership via security_checks.user_id
  const { data: check } = await supabase
    .from("security_checks")
    .select("id")
    .eq("context_id", contextId)
    .eq("check_key", checkKey)
    .eq("user_id", user.id)
    .single()
  if (!check) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if ("status" in body) update.status = body.status
  if ("notes" in body) update.notes = body.notes
  if (body.status && body.status !== "pending") {
    update.last_checked_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("security_checks")
    .update(update)
    .eq("id", check.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
