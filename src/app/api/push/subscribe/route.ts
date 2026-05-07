import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/push/subscribe
// Stores a Web Push subscription for the authenticated user.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const subscription = await req.json()
  if (!subscription?.endpoint || !subscription?.keys) {
    return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 })
  }

  // Upsert by endpoint — same device re-subscribing is fine
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { onConflict: "endpoint" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe
// Removes a push subscription by endpoint.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 })

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)

  return new NextResponse(null, { status: 204 })
}
