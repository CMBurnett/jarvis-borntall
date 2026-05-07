import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/security/aggregate
// Returns per-context security check counts grouped by status.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get all contexts owned by user
  const { data: contexts } = await supabase
    .from("contexts")
    .select("id, name, lifecycle_stage, security_tier")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (!contexts?.length) return NextResponse.json([])

  // Get security checks for all those contexts
  const contextIds = contexts.map((c) => c.id)
  const { data: checks } = await supabase
    .from("security_checks")
    .select("context_id, status")
    .in("context_id", contextIds)

  // Group by context
  const checkMap = new Map<string, { pass: number; warn: number; fail: number; pending: number; na: number; total: number }>()
  for (const c of contexts) {
    checkMap.set(c.id, { pass: 0, warn: 0, fail: 0, pending: 0, na: 0, total: 0 })
  }
  for (const ch of checks ?? []) {
    const entry = checkMap.get(ch.context_id)
    if (!entry) continue
    entry.total++
    entry[ch.status as "pass" | "warn" | "fail" | "pending" | "na"]++
  }

  return NextResponse.json(
    contexts.map((c) => ({
      ...c,
      checks: checkMap.get(c.id) ?? { pass: 0, warn: 0, fail: 0, pending: 0, na: 0, total: 0 },
    }))
  )
}
