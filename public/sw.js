// Jarvis OS Service Worker — handles Web Push notifications
self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "Jarvis OS", body: event.data?.text() ?? "New notification" }
  }

  const { title = "Jarvis OS", body = "", icon = "/app-logo-dark.svg", badge = "/app-logo-dark.svg" } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: data.data ?? {},
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? "/"

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
