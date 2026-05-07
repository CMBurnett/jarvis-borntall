import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contextId = searchParams.get("context_id")
  const archived = searchParams.get("archived") === "true"
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)

  let query = supabase
    .from("inbox_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", archived)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (contextId) query = query.eq("context_id", contextId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (!body.context_id || !body.title?.trim()) {
    return NextResponse.json({ error: "context_id and title are required" }, { status: 400 })
  }

  // IDOR: verify user owns the context
  const { data: ctx } = await supabase
    .from("contexts")
    .select("id")
    .eq("id", body.context_id)
    .eq("user_id", user.id)
    .single()
  if (!ctx) return NextResponse.json({ error: "Context not found" }, { status: 404 })

  const { data, error } = await supabase
    .from("inbox_items")
    .insert({
      user_id: user.id,
      context_id: body.context_id,
      source: body.source ?? "manual",
      category: body.category ?? "info",
      priority: body.priority ?? "normal",
      title: body.title.trim(),
      preview: body.preview?.trim() ?? "",
      raw_payload: body.raw_payload ?? {},
      needs_action: body.needs_action ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
