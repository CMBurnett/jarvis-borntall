import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CHECKLIST_DEFAULTS } from "@/lib/security/checklist-defaults"

type Params = { params: Promise<{ contextId: string }> }

// GET /api/security/[contextId]
// Returns checks for the context. If none exist yet, seeds defaults and returns them.
export async function GET(_req: NextRequest, { params }: Params) {
  const { contextId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // IDOR: verify user owns the context
  const { data: ctx } = await supabase
    .from("contexts")
    .select("id")
    .eq("id", contextId)
    .eq("user_id", user.id)
    .single()
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: existing, error } = await supabase
    .from("security_checks")
    .select("*")
    .eq("context_id", contextId)
    .order("category")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed defaults if this context has no checks yet
  if (existing && existing.length === 0) {
    const seeds = CHECKLIST_DEFAULTS.map((check) => ({
      ...check,
      context_id: contextId,
      user_id: user.id,
    }))
    const { data: seeded, error: seedError } = await supabase
      .from("security_checks")
      .insert(seeds)
      .select()
    if (seedError) return NextResponse.json({ error: seedError.message }, { status: 500 })
    return NextResponse.json(seeded)
  }

  return NextResponse.json(existing)
}
