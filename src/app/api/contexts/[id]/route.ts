import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

async function getAuthedContext(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, context: null, error: "Unauthorized" }

  const { data: context, error } = await supabase
    .from("contexts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)  // IDOR check — user must own it
    .single()

  if (error || !context) return { supabase, user, context: null, error: "Not found" }
  return { supabase, user, context, error: null }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { context, error } = await getAuthedContext(id)
  if (error || !context) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 404 })
  return NextResponse.json(context)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { supabase, user, context, error } = await getAuthedContext(id)
  if (error || !context || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 404 })

  const body = await req.json()
  const allowed = [
    "name", "description", "lifecycle_stage", "security_tier",
    "stack_summary", "repo_url", "deploy_url", "sprint_focus",
    "claude_md_content", "models", "tools",
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error: updateError } = await supabase
    .from("contexts")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { supabase, user, context, error } = await getAuthedContext(id)
  if (error || !context || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 404 })

  const { error: deleteError } = await supabase
    .from("contexts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
