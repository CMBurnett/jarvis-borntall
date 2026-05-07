"use client"

import { useState, useEffect } from "react"

export type PushState = "unsupported" | "denied" | "default" | "subscribed"

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("unsupported")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    if (Notification.permission === "denied") {
      setState("denied")
      return
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? "subscribed" : "default")
    })
  }, [])

  async function subscribe() {
    if (!("serviceWorker" in navigator)) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      const res = await fetch("/api/push/vapid-public-key")
      if (!res.ok) throw new Error("VAPID key not configured")
      const { publicKey } = await res.json()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })

      setState("subscribed")
    } catch (err) {
      console.error("[push] subscribe failed:", err)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    if (!("serviceWorker" in navigator)) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState("default")
    } catch (err) {
      console.error("[push] unsubscribe failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return { state, loading, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)))
}
