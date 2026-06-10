// ═══════════════════════════════════════════════════════
//  Control App – Clean PWA Service Worker (sw.js)
//  NO Firebase imports – keeps this SW registration reliable
// ═══════════════════════════════════════════════════════

const CACHE_NAME = "control-v3";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/app-icon.png",
];

// ── Install: pre-cache core shell ──────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first with cache fallback ───────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip: Supabase, external APIs, Firebase, chrome-extension
  if (
    url.origin.includes("supabase.co") ||
    url.origin.includes("firebase") ||
    url.origin.includes("googleapis.com") ||
    url.origin.includes("gstatic.com") ||
    url.pathname.startsWith("/api/") ||
    url.protocol === "chrome-extension:"
  ) {
    return;
  }

  // For navigation requests (HTML pages) – cache first, network fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/") || caches.match("/index.html"))
    );
    return;
  }

  // For all other assets – stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
