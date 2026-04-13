// 🧪 اختبار سريع للتحقق من اتصال Supabase
// شغل هذا الملف: node test-supabase-connection.js

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// تحميل متغيرات البيئة
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 Testing Supabase Connection...\n");

// 1. التحقق من المتغيرات
console.log("📋 Environment Variables:");
console.log("VITE_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
console.log(
  "VITE_SUPABASE_ANON_KEY:",
  supabaseAnonKey ? "✅ Set (hidden)" : "❌ Missing",
);
console.log("");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables! Check your .env file");
  process.exit(1);
}

// 2. إنشاء العميل
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase client created successfully\n");
} catch (error) {
  console.error("❌ Failed to create Supabase client:", error);
  process.exit(1);
}

// 3. اختبار الاتصال
async function testConnection() {
  try {
    console.log("🔄 Testing database connection...");

    // محاولة جلب جدول profiles
    const { data, error, count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: false })
      .limit(1);

    if (error) {
      console.error("❌ Database query failed:", error.message);
      console.error("Details:", error);
      return false;
    }

    console.log("✅ Database connection successful!");
    console.log(`📊 Profiles table exists with ${count || 0} records`);

    if (data && data.length > 0) {
      console.log("📝 Sample profile:", {
        id: data[0].id,
        email: data[0].email,
        name: data[0].name,
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return false;
  }
}

// 4. اختبار الجداول المطلوبة
async function testTables() {
  console.log("\n🔍 Testing required tables...\n");

  const tables = [
    "profiles",
    "journals",
    "todos",
    "pinned_notes",
    "groups",
    "group_members",
    "group_tasks",
    "group_messages",
    "group_activities",
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`❌ ${table}: Missing or inaccessible`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Error - ${error.message}`);
    }
  }
}

// تشغيل الاختبارات
(async () => {
  const connectionOk = await testConnection();

  if (connectionOk) {
    await testTables();
    console.log("\n✅ All tests completed!");
  } else {
    console.log("\n❌ Connection test failed. Please check:");
    console.log(
      "1. Your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    );
    console.log("2. Your Supabase project is active");
    console.log("3. The profiles table exists in your database");
    console.log(
      "4. Row Level Security (RLS) is disabled or properly configured",
    );
  }
})();
