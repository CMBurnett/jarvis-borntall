// Web Push notification sender
// Requires: npm install web-push
// Env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
//
// Usage: import { sendPushNotification } from "@/lib/push/send-notification"

export interface PushPayload {
  title: string
  body: string
  icon?: string
  data?: Record<string, unknown>
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<void> {
  // Dynamic import so the module is only loaded server-side
  // and doesn't crash the build if web-push is not installed yet.
  let webpush: typeof import("web-push")
  try {
    webpush = await import("web-push")
  } catch {
    console.warn("[push] web-push not installed — run: npm install web-push")
    return
  }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  await webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  )
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin")
  const supabase = createAdminClient()

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("user_id", userId)

  if (!subs?.length) return

  await Promise.allSettled(
    subs.map((sub) =>
      sendPushNotification(sub as PushSubscription, payload)
    )
  )
}
