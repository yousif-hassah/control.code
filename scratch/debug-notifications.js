/**
 * Deep diagnostic script - checks ALL potential causes for notification failure
 * Run with: node scratch/debug-notifications.js
 */
import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log("====================================================");
console.log("🔍 FULL NOTIFICATION SYSTEM DIAGNOSTIC");
console.log("====================================================\n");

async function main() {
  // 1. Check Firebase Admin init
  console.log("--- [1] Firebase Admin SDK Initialization ---");
  try {
    const sa = JSON.parse(readFileSync("./firebase-service-account.json", "utf8"));
    if (admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    }
    console.log("✅ Firebase Admin initialized locally\n");
  } catch (e) {
    console.error("❌ Firebase Admin init failed:", e.message, "\n");
    return;
  }

  // 2. Check all FCM tokens in DB
  console.log("--- [2] FCM Tokens in Supabase ---");
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, email, fcm_token")
    .not("fcm_token", "is", null);

  if (error) {
    console.error("❌ Supabase fetch error:", error.message, "\n");
    return;
  }
  if (!profiles || profiles.length === 0) {
    console.log("⚠️ NO profiles have an fcm_token stored!");
    console.log("📋 FIX: Open https://control-code-1.vercel.app, log in, and grant notification permission.\n");
    return;
  }

  console.log(`✅ Found ${profiles.length} profile(s) with tokens:\n`);
  profiles.forEach((p, i) => {
    const tokenPreview = p.fcm_token ? `${p.fcm_token.substring(0, 20)}...` : "NULL";
    console.log(`  ${i + 1}. ${p.name || "N/A"} (${p.email}) → Token: ${tokenPreview}`);
  });
  console.log();

  // 3. Try to send to each token individually and report results
  console.log("--- [3] Testing Each Token via Local Firebase Admin ---");
  const messaging = admin.messaging();

  for (const profile of profiles) {
    if (!profile.fcm_token) continue;
    try {
      const result = await messaging.send({
        token: profile.fcm_token,
        notification: {
          title: "🔔 Test from Control App",
          body: `Hi ${profile.name || "there"}! Notifications are working!`,
        },
        webpush: {
          notification: {
            icon: "/controll.app.png",
          },
        },
      });
      console.log(`  ✅ Token for ${profile.name} (${profile.email}): SENT OK → ${result}`);
    } catch (err) {
      console.log(`  ❌ Token for ${profile.name} (${profile.email}): FAILED`);
      console.log(`     Error Code: ${err.code}`);
      console.log(`     Error Message: ${err.message}`);

      if (err.code === "messaging/registration-token-not-registered" ||
          err.code === "messaging/invalid-registration-token") {
        console.log("     💡 Token is EXPIRED/INVALID. User must open app to refresh it.");
        // Optionally clear the stale token
        const { error: clearErr } = await supabase
          .from("profiles")
          .update({ fcm_token: null })
          .eq("id", profile.id);
        if (!clearErr) {
          console.log("     🗑️ Stale token cleared from Supabase.");
        }
      }
    }
    console.log();
  }

  // 4. Check group_notifications table and realtime
  console.log("--- [4] Recent entries in group_notifications table ---");
  const { data: notifs } = await supabase
    .from("group_notifications")
    .select("id, group_id, sender_id, recipient_id, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!notifs || notifs.length === 0) {
    console.log("⚠️ No entries found in group_notifications.");
    console.log("   This means sendRealtimeNotification is NOT inserting rows.\n");
  } else {
    console.log(`✅ Found ${notifs.length} recent notifications:\n`);
    notifs.forEach((n) => {
      console.log(`  - [${n.created_at}] "${n.title}" → recipient: ${n.recipient_id || "ALL"}`);
    });
    console.log();
  }

  console.log("====================================================");
  console.log("Diagnostic complete.");
  console.log("====================================================");
}

main().catch(console.error);
