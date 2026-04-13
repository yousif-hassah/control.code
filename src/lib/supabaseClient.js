import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
  console.error(
    "VITE_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "✅ Set" : "❌ Missing",
  );
  console.error("Please check your .env file");
}

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  console.log("✅ Supabase client initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Supabase client:", error);
}

export { supabase };
