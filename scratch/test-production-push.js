import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductionFCM() {
  console.log("🔍 Fetching latest profile with fcm_token from Supabase...");
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, email, fcm_token")
    .not("fcm_token", "is", null)
    .order("id", { ascending: false })
    .limit(3);

  if (error) {
    console.error("❌ Error fetching profiles:", error.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("⚠️ No profiles found with active fcm_token.");
    process.exit(0);
  }

  console.log(`\n📋 Found ${profiles.length} profiles:`);
  profiles.forEach((p, idx) => {
    console.log(`${idx + 1}. Name: ${p.name || 'N/A'} | Email: ${p.email} | Token: ${p.fcm_token.substring(0, 15)}...`);
  });

  const target = profiles[0];
  console.log(`\n🎯 Target profile: ${target.name} (${target.email})`);

  const payload = {
    tokens: [target.fcm_token],
    title: "🚨 Test Notification",
    body: "This is a direct test of the production FCM API!"
  };

  const productionUrl = "https://control-code-1.vercel.app/api/send-notification";
  console.log(`📡 Sending POST to production API: ${productionUrl}...`);

  try {
    const res = await fetch(productionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log(`\n📦 HTTP Status Code: ${res.status}`);
    const bodyText = await res.text();
    console.log("📦 Response Body:");
    console.log(bodyText);

    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.success) {
        console.log("\n🎉 API call successful! Check your device.");
      } else {
        console.log("\n❌ API call failed with success: false.");
      }
    } catch {
      console.log("\n❌ Response body is not valid JSON.");
    }
  } catch (err) {
    console.error("\n❌ Network fetch error:", err.message);
  }
}

testProductionFCM();
