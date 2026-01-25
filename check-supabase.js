// Quick test to verify Supabase configuration
import { supabase } from "./src/lib/supabaseClient.js";

console.log("🔍 Checking Supabase Configuration...\n");

// Check if URL is defined
const url = import.meta.env.VITE_SUPABASE_URL;
console.log("✅ Supabase URL:", url || "❌ NOT FOUND");

// Check if anon key is defined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (key && key.startsWith("eyJ")) {
  console.log("✅ Supabase Anon Key: Found (starts with eyJ)");
  console.log("   Length:", key.length, "characters");
} else if (key && key.includes("YOUR_ACTUAL")) {
  console.log("❌ Supabase Anon Key: PLACEHOLDER - Please update .env file!");
  console.log("   Current value:", key.substring(0, 50) + "...");
} else {
  console.log("❌ Supabase Anon Key: NOT FOUND");
}

// Try to connect
console.log("\n🔌 Testing connection...");
try {
  const { data, error } = await supabase
    .from("profiles")
    .select("count")
    .limit(1);
  if (error) {
    console.log("❌ Connection failed:", error.message);
    if (error.message.includes("JWT")) {
      console.log("\n💡 This error means your anon key is invalid or missing.");
      console.log(
        "   Please check FIX_GROUPS_COMPLETE_GUIDE_AR.md for instructions.",
      );
    }
  } else {
    console.log("✅ Connection successful!");
  }
} catch (err) {
  console.log("❌ Connection error:", err.message);
}

console.log(
  "\n📝 For detailed instructions, see: FIX_GROUPS_COMPLETE_GUIDE_AR.md",
);
