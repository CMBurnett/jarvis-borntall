import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("contexts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("contexts")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() ?? "",
      lifecycle_stage: body.lifecycle_stage ?? "active_dev",
      security_tier: body.security_tier ?? 2,
      stack_summary: body.stack_summary?.trim() ?? "",
      repo_url: body.repo_url?.trim() || null,
      deploy_url: body.deploy_url?.trim() || null,
      sprint_focus: body.sprint_focus?.trim() ?? "",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
