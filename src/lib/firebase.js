import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBYbvd0e4vmovU23f4u4PnHdSGgVk8UQm0",
  authDomain: "control-app-b2df8.firebaseapp.com",
  projectId: "control-app-b2df8",
  storageBucket: "control-app-b2df8.firebasestorage.app",
  messagingSenderId: "177626864191",
  appId: "1:177626864191:web:e69f3d694ebd404b13768a",
  measurementId: "G-CZQ79Z2665",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = getMessaging(app);
  console.log("✅ Firebase Messaging initialized");
} catch (e) {
  console.warn("⚠️ Firebase Messaging initialization failed:", e.message);
}

// ── Request FCM Token ──────────────────────────────────────────────────────
// Uses a DEDICATED firebase-messaging-sw.js so it never interferes with
// the clean PWA sw.js registered in main.jsx.
export const requestForToken = async () => {
  try {
    if (!("Notification" in window)) {
      console.warn("Browser doesn't support notifications");
      return null;
    }
    if (!("serviceWorker" in navigator)) {
      console.warn("Browser doesn't support service workers");
      return null;
    }
    if (!("PushManager" in window)) {
      console.warn("Browser doesn't support Push API");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied:", permission);
      return null;
    }

    // Wait for the active PWA service worker registration (registered in main.jsx)
    const pwaReg = await navigator.serviceWorker.ready;
    console.log("✅ Using active PWA Service Worker for FCM:", pwaReg.scope);

    if (!messaging) messaging = getMessaging(app);

    let token = null;
    try {
      token = await getToken(messaging, {
        vapidKey:
          "BCPR1Bii5kdoBC2JmgdlaW1jHEM7eGQHkD0OOI40vur1V5MYxD9CaQBoGBDftBo5BzW9tDKuiMGTyVG4dczTXSg",
        serviceWorkerRegistration: pwaReg,
      });
    } catch (tokenErr) {
      console.warn("⚠️ getToken with PWA SW failed, trying default:", tokenErr.message);
      try {
        token = await getToken(messaging, {
          vapidKey:
            "BCPR1Bii5kdoBC2JmgdlaW1jHEM7eGQHkD0OOI40vur1V5MYxD9CaQBoGBDftBo5BzW9tDKuiMGTyVG4dczTXSg",
        });
      } catch (fallbackErr) {
        console.error("❌ FCM token fallback also failed:", fallbackErr.message);
      }
    }

    if (token) {
      console.log("✅ FCM Token obtained");
      return token;
    } else {
      console.warn("⚠️ No FCM token returned");
    }
  } catch (error) {
    console.error("❌ requestForToken Error:", error.code, error.message);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.warn("⚠️ Messaging not initialized – skipping listener");
      return;
    }
    onMessage(messaging, (payload) => resolve(payload));
  });

export { app, messaging };
