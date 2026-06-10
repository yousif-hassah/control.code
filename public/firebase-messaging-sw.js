// ═══════════════════════════════════════════════════════
//  Control App – Firebase Messaging Service Worker
//  Handles background push notifications from FCM only
// ═══════════════════════════════════════════════════════

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
