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

async function sendTestToLatestUser() {
  console.log("🔍 Fetching the latest profile with an active fcm_token from Supabase...");
  
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, email, fcm_token")
    .not("fcm_token", "is", null)
    .order("id", { ascending: false }) // Or we can order by update or limit
    .limit(5);

  if (error) {
    console.error("❌ Error fetching profiles:", error.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("\n⚠️ No profiles found with an active 'fcm_token'.");
    console.log("💡 How to fix this:");
    console.log("1. Open the app in your browser: http://localhost:5173");
    console.log("2. Log in and make sure you ALLOW browser notification permissions.");
    console.log("3. The app will automatically save your token to Supabase.");
    console.log("4. Once saved, run this script again.");
    process.exit(0);
  }

  console.log(`\n📋 Found ${profiles.length} profiles with active tokens:`);
  profiles.forEach((p, idx) => {
    console.log(`${idx + 1}. Name: ${p.name || 'N/A'} | Email: ${p.email} | Token: ${p.fcm_token.substring(0, 15)}...`);
  });

  // Target the first one found
  const targetUser = profiles[0];
  console.log(`\n🎯 Targeting user: ${targetUser.name} (${targetUser.email})`);

  const payload = {
    tokens: [targetUser.fcm_token],
    title: "🔔 إشعار تجريبي ناجح!",
    body: `مرحباً ${targetUser.name || 'يا صديقي'}، إشعارات Firebase تعمل الآن بشكل ممتاز!`
  };

  try {
    console.log("📡 Sending request to backend API (http://localhost:3001/api/send-notification)...");
    const response = await fetch("http://localhost:3001/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("\n📦 Response from server:");
    console.log(JSON.stringify(result, null, 2));

    if (response.status === 200 && result.success && result.successCount > 0) {
      console.log("\n🎉 SUCCESS! The notification has been dispatched to your device.");
      console.log("   Check your browser/operating system notifications!");
    } else {
      console.log("\n❌ Failed to deliver the notification. Check if the server is running on port 3001.");
    }
  } catch (err) {
    console.error("\n❌ Error communicating with the backend server:", err.message);
  }
}

sendTestToLatestUser();
