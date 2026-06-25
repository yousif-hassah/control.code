// ============================================================
//  /api/ping  –  Supabase Keep-Alive Endpoint
//  🌐 Site: https://control-code-1.vercel.app/
//  يُستدعى كل 5 دقائق من UptimeRobot أو Cron-job.org
//  لمنع قاعدة بيانات Supabase من الدخول في وضع النوم
// ============================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  // السماح بطلبات CORS من أي مكان (مهم لـ UptimeRobot)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const startTime = Date.now();

  try {
    // ✅ تحقق من وجود متغيرات البيئة
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🏓 طلب بسيط لإبقاء قاعدة البيانات مستيقظة
    // جدول "profiles" هو الجدول الأساسي في مشروع Control
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      status: "ok",
      message: "✅ Supabase is awake",
      project: "Control App",
      database: "connected",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const responseTime = Date.now() - startTime;

    console.error("[PING ERROR]", err.message);

    return res.status(500).json({
      status: "error",
      message: "❌ Ping failed",
      project: "Control App",
      error: err.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

