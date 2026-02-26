const CACHE_VERSION = "v4";
const CACHE_NAME = `tbo-assemble-${CACHE_VERSION}`;
const MAX_CACHE_ENTRIES = 100;
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/logo.svg",
  "/manifest.json",
  "/favicon.ico",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clear old caches (version-based invalidation)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("tbo-assemble-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Trim cache to max entries
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxEntries);
  }
}

// Fetch — network-first with bounded cache fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses (bounded)
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
            trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
          });
        }
        return response;
      })
      .catch(() => {
        // Serve from cache if network fails
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve a branded offline page
          if (event.request.mode === "navigate") {
            return new Response(
              '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — TBO Assemble</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fafbfc;color:#1e293b;text-align:center;padding:2rem}.c{max-width:400px}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#64748b;margin-bottom:1.5rem}button{background:linear-gradient(135deg,#ff6b35,#e55a2b);color:#fff;border:none;padding:.75rem 1.5rem;border-radius:.75rem;font-weight:600;cursor:pointer;font-size:.875rem}button:hover{opacity:.9}</style></head><body><div class="c"><h1>You\'re Offline</h1><p>TBO Assemble needs an internet connection. Please check your network and try again.</p><button onclick="location.reload()">Try Again</button></div></body></html>',
              {
                status: 503,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }
            );
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Push notifications (demo)
self.addEventListener("push", (event) => {
  const defaultData = {
    title: "TBO Assemble",
    body: "You have a new notification",
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: "tbo-notification",
  };

  let data = defaultData;
  try {
    data = event.data ? { ...defaultData, ...event.data.json() } : defaultData;
  } catch (e) {
    // Use default data if parsing fails
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      renotify: true,
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline form submissions (demo)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-bookings") {
    event.waitUntil(syncPendingBookings());
  }
});

async function syncPendingBookings() {
  // This would sync any pending offline bookings when connection is restored
  console.log("[SW] Syncing pending bookings...");
  // In production, this would read from IndexedDB and POST to server
}

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-events") {
    event.waitUntil(updateEventsCache());
  }
});

async function updateEventsCache() {
  // Refresh events data in background
  try {
    const response = await fetch("/api/events");
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put("/api/events", response);
    }
  } catch (e) {
    // Silently fail if offline
  }
}
