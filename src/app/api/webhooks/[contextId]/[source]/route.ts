import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateWebhookSignature, type WebhookSource } from "@/lib/webhooks/validate-signature"
import { createAdminClient } from "@/lib/supabase/admin"

type Params = { params: Promise<{ contextId: string; source: string }> }

const SUPPORTED_SOURCES = ["vercel", "github", "sentry", "uptime"] as const

// POST /api/webhooks/[contextId]/[source]
// Receives webhook from a provider, validates signature, creates inbox item.
export async function POST(req: NextRequest, { params }: Params) {
  const { contextId, source } = await params

  if (!SUPPORTED_SOURCES.includes(source as WebhookSource)) {
    return NextResponse.json({ error: "Unsupported source" }, { status: 400 })
  }

  const rawBody = await req.text()
  let parsedBody: Record<string, unknown>
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Validate signature — reject before any DB writes
  const valid = validateWebhookSignature(
    source as WebhookSource,
    rawBody,
    req.headers,
    parsedBody
  )

  // Use admin client for webhook processing (no user session)
  const adminClient = createAdminClient()

  // Look up the context to find the user_id
  const { data: ctx } = await adminClient
    .from("contexts")
    .select("id, user_id, name")
    .eq("id", contextId)
    .single()

  const logStatus = !valid ? "invalid_sig" : "pending"

  // Log all incoming webhooks — even invalid ones (audit trail)
  const { data: log } = await adminClient.from("webhook_logs").insert({
    context_id: ctx?.id ?? null,
    user_id: ctx?.user_id ?? null,
    source,
    status: logStatus,
    raw_payload: parsedBody,
  }).select().single()

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  if (!ctx) {
    await adminClient.from("webhook_logs").update({ status: "failed", error_message: "Context not found" }).eq("id", log?.id ?? "")
    return NextResponse.json({ error: "Context not found" }, { status: 404 })
  }

  // Transform payload into an inbox item
  let inboxPayload: {
    title: string
    preview: string
    category: string
    priority: string
  }

  try {
    inboxPayload = transformPayload(source as WebhookSource, parsedBody)
  } catch {
    await adminClient.from("webhook_logs").update({ status: "failed", error_message: "Transform failed" }).eq("id", log?.id ?? "")
    return NextResponse.json({ error: "Could not process payload" }, { status: 422 })
  }

  // Create inbox item
  await adminClient.from("inbox_items").insert({
    context_id: contextId,
    user_id: ctx.user_id,
    source,
    category: inboxPayload.category as "error" | "deploy" | "security" | "performance" | "ai_alert" | "business_event" | "pr" | "info",
    priority: inboxPayload.priority as "urgent" | "high" | "normal" | "low",
    title: inboxPayload.title,
    preview: inboxPayload.preview,
    raw_payload: parsedBody,
    needs_action: inboxPayload.priority === "urgent" || inboxPayload.priority === "high",
  })

  await adminClient
    .from("webhook_logs")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("id", log?.id ?? "")

  return NextResponse.json({ ok: true })
}

// ── Payload transformers ───────────────────────────────────
function transformPayload(
  source: WebhookSource,
  payload: Record<string, unknown>
): { title: string; preview: string; category: string; priority: string } {
  switch (source) {
    case "vercel": {
      const state = (payload.state as string)?.toLowerCase()
      const name = payload.name as string ?? "Deploy"
      const url = payload.url as string ?? ""
      const isError = state === "error"
      return {
        title: `${name} — deploy ${state ?? "event"}`,
        preview: url ? `${url}` : "Vercel deploy event",
        category: "deploy",
        priority: isError ? "high" : "normal",
      }
    }
    case "github": {
      const action = payload.action as string
      const pr = payload.pull_request as Record<string, unknown> | undefined
      const ref = payload.ref as string | undefined
      if (pr) {
        return {
          title: `PR #${pr.number} ${action} — ${(pr.title as string)?.slice(0, 60)}`,
          preview: `${pr.user ? (pr.user as Record<string,unknown>).login : ""}  →  ${(pr.head as Record<string,unknown> | undefined)?.ref ?? ""}`,
          category: "pr",
          priority: "normal",
        }
      }
      return {
        title: `GitHub: ${action ?? "event"} on ${ref ?? "unknown ref"}`,
        preview: JSON.stringify(payload).slice(0, 120),
        category: "info",
        priority: "normal",
      }
    }
    case "sentry": {
      const event = payload.event as Record<string, unknown> | undefined
      const level = (event?.level as string) ?? "error"
      const title = (event?.title as string) ?? "Sentry error"
      const isUrgent = level === "fatal"
      return {
        title: `Sentry: ${title.slice(0, 80)}`,
        preview: (event?.culprit as string) ?? (event?.transaction as string) ?? "",
        category: "error",
        priority: isUrgent ? "urgent" : "high",
      }
    }
    case "uptime": {
      const monitorUrl = payload.monitorURL as string ?? ""
      const alertType = payload.alertType as string ?? "unknown"
      const isDown = alertType === "1" // 1 = down in UptimeRobot
      return {
        title: `Uptime: ${isDown ? "DOWN" : "recovered"} — ${monitorUrl}`,
        preview: `Alert type: ${alertType}`,
        category: "performance",
        priority: isDown ? "urgent" : "normal",
      }
    }
  }
}
