// ═══════════════════════════════════════════════════════
//  Control App – Combined PWA & Firebase Service Worker (sw.js)
// ═══════════════════════════════════════════════════════

// 1. Firebase Messaging scripts
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBYbvd0e4vmovU23f4u4PnHdSGgVk8UQm0",
  authDomain: "control-app-b2df8.firebaseapp.com",
  projectId: "control-app-b2df8",
  storageBucket: "control-app-b2df8.firebasestorage.app",
  messagingSenderId: "177626864191",
  appId: "1:177626864191:web:e69f3d694ebd404b13768a",
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[FCM-SW] Background message:", payload);
    const { title = "Control", body = "" } = payload.notification || {};
    self.registration.showNotification(title, {
      body,
      icon: "/controll.app.png",
      badge: "/controll.app.png",
      vibrate: [200, 100, 200],
    });
  });
} catch (e) {
  console.warn("[FCM-SW] Firebase Messaging init failed inside SW:", e);
}

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
