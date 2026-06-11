const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// ── Firebase Admin Init ──────────────────────────────────────────────────────
let firebaseMessaging = null;
try {
  if (admin.apps.length === 0) {
    const serviceAccountPath = path.resolve("./firebase-service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("✅ FCM: Initialized with local service account JSON");
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("✅ FCM: Initialized with environment variables");
    } else {
      console.warn("⚠️ FCM: No credentials found. Simulation mode active.");
    }
  }
  if (admin.apps.length > 0) firebaseMessaging = admin.messaging();
} catch (e) {
  console.error("❌ FCM Init Error:", e.message);
}

// ── Supabase Admin Client (bypasses RLS via service_role key) ────────────────
// This is the KEY fix: reading fcm_token from profiles requires service_role
// because RLS would block anon/user access to other users' tokens.
const supabaseAdmin = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ── Main Handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { tokens: rawTokens, recipientUserIds, title, body, data } = req.body;

  if (!title || !body) {
    return res.status(400).json({ success: false, error: "Missing title or body" });
  }

  // ── Resolve tokens ───────────────────────────────────────────────────────
  // Option A: caller passed raw token strings directly (fallback)
  // Option B: caller passed user IDs — we look up tokens server-side (bypasses RLS)
  let tokens = [];

  if (recipientUserIds && Array.isArray(recipientUserIds) && recipientUserIds.length > 0) {
    if (supabaseAdmin) {
      console.log(`🔍 Looking up FCM tokens for ${recipientUserIds.length} user(s) via service role...`);
      const { data: profiles, error } = await supabaseAdmin
        .from("profiles")
        .select("id, fcm_token")
        .in("id", recipientUserIds)
        .not("fcm_token", "is", null);

      if (error) {
        console.error("❌ Supabase token lookup error:", error.message);
      } else {
        tokens = (profiles || []).map((p) => p.fcm_token).filter(Boolean);
        console.log(`✅ Resolved ${tokens.length} FCM token(s) from user IDs`);
      }
    } else {
      console.warn("⚠️ supabaseAdmin not initialized — SUPABASE_SERVICE_ROLE_KEY missing on Vercel");
    }
  } else if (rawTokens && Array.isArray(rawTokens) && rawTokens.length > 0) {
    tokens = rawTokens.filter(Boolean);
    console.log(`📦 Using ${tokens.length} raw token(s) passed directly`);
  }

  if (tokens.length === 0) {
    console.log("ℹ️ No valid tokens to send to — skipping push");
    return res.status(200).json({ success: true, skipped: true, message: "No tokens to notify" });
  }

  console.log(`🔔 Sending "${title}" to ${tokens.length} device(s)`);

  if (!firebaseMessaging) {
    console.log("⚠️ FCM Simulation mode (no Firebase credentials).");
    return res.status(200).json({ success: true, simulated: true, message: "Push simulated — FCM not initialized" });
  }

  try {
    const message = {
      notification: { title, body },
      tokens,
      webpush: {
        notification: {
          title, body,
          icon: "/controll.app.png",
          badge: "/controll.app.png",
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: { link: "https://control-code-1.vercel.app" },
      },
      android: {
        priority: "high",
        notification: { sound: "default" },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { alert: { title, body }, sound: "default", badge: 1 } },
      },
    };
    if (data) message.data = data;

    const response = await firebaseMessaging.sendEachForMulticast(message);
    console.log(`✅ Sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);

    // Clean up expired/invalid tokens from Supabase automatically
    if (response.failureCount > 0 && supabaseAdmin) {
      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];
        if (!resp.success) {
          const code = resp.error?.code;
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
            console.log(`🗑️ Clearing stale token: ${tokens[i].substring(0, 20)}...`);
            await supabaseAdmin.from("profiles").update({ fcm_token: null }).eq("fcm_token", tokens[i]);
          }
        }
      }
    }

    return res.status(200).json({ success: true, successCount: response.successCount, failureCount: response.failureCount });
  } catch (error) {
    console.error("❌ FCM Send Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
