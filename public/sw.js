const CACHE_NAME = "buks-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/placeholder.svg",
  "/icon-192.png",
  "/icon-512.png",
];

// Install: cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip OAuth
  if (url.pathname.startsWith("/~oauth")) return;

  // API calls & supabase — network only, fail silently offline
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/")
  ) {
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", clone));
          return response;
        })
        .catch(() => {
          // Offline: serve cached app shell — app will detect offline and show downloads
          return caches.match("/").then((cached) => {
            return cached || new Response("Offline", { status: 503 });
          });
        })
    );
    return;
  }

  // Assets: cache first, then network (and cache new assets)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (
            response.ok &&
            (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/) ||
              url.hostname === "fonts.googleapis.com" ||
              url.hostname === "fonts.gstatic.com")
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for assets
          return new Response("", { status: 503 });
        });
    })
  );
});
