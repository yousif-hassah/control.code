const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let firebaseMessaging = null;

try {
  // Check if Firebase app is already initialized to avoid duplicate initialization error in serverless environment
  if (admin.apps.length === 0) {
    const serviceAccountPath = path.resolve("./firebase-service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("✅ Vercel FCM: Initialized with local service account JSON");
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
      console.log("✅ Vercel FCM: Initialized with environment variables");
    } else {
      console.warn("⚠️ Vercel FCM: Credentials not found. Simulation mode active.");
    }
  }
  
  if (admin.apps.length > 0) {
    firebaseMessaging = admin.messaging();
  }
} catch (e) {
  console.error("❌ Vercel FCM Initialization Error:", e.message);
}

module.exports = async function handler(req, res) {
  console.log("🚀 send-notification API Function called!");
  console.log("Method:", req.method);

  // Allow CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS request handled");
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tokens, title, body, data } = req.body;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ success: false, error: "Missing or invalid tokens array" });
  }
  if (!title || !body) {
    return res.status(400).json({ success: false, error: "Missing title or body" });
  }

  console.log(`🔔 Vercel FCM: Sending notification "${title}" to ${tokens.length} devices.`);

  if (!firebaseMessaging) {
    console.log("⚠️ Vercel FCM: Simulation mode (no credentials).");
    return res.status(200).json({
      success: true,
      simulated: true,
      message: "Push notifications simulated successfully (FCM not initialized on Vercel)."
    });
  }

  try {
    const message = {
      notification: { title, body },
      tokens: tokens,
    };
    if (data) {
      message.data = data;
    }

    const response = await firebaseMessaging.sendEachForMulticast(message);
    console.log(`✅ Push notifications sent. Success count: ${response.successCount}, Failure count: ${response.failureCount}`);
    
    // Log failures
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Token ${tokens[idx]} failed:`, resp.error?.message);
        }
      });
    }

    res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("❌ FCM Send Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
