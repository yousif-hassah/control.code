import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Firebase Admin Initialization
let firebaseMessaging = null;

try {
  const serviceAccountPath = path.resolve("./firebase-service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseMessaging = admin.messaging();
    console.log("✅ Firebase Admin initialized with service account");
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
    firebaseMessaging = admin.messaging();
    console.log("✅ Firebase Admin initialized with environment variables");
  } else {
    console.warn("⚠️ Firebase Admin credentials not found. Push notifications will be simulated.");
  }
} catch (e) {
  console.error("❌ Firebase Admin Initialization Error:", e.message);
}

const app = express();
app.use(cors());
app.use(express.json());

// إعداد الناقل (Transporter) باستخدام Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// التأكد من صحة الإعدادات عند بدء التشغيل
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email Config Error:", error);
  } else {
    console.log("✅ Email Server is ready to send messages");
  }
});

app.post("/api/send-otp", async (req, res) => {
  const { email, name, otp } = req.body;

  console.log(`📧 Attempting to send OTP to: ${email}`);
  console.log(`👤 Name: ${name}`);
  console.log(`🔢 OTP: ${otp}`);

  const mailOptions = {
    from: `"Control App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Control Login Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #629FAD; text-align: center;">🧘 Control</h2>
        <p>Hello <strong>${name || "User"}</strong>,</p>
        <p>Your verification code for Control is:</p>
        <div style="background-color: #f4f8f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #629FAD; letter-spacing: 5px;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center;">Control - Your Personal Mindfulness Companion</p>
      </div>
    `,
  };

  try {
    console.log(`⏳ Sending email...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Nodemailer Error:", error.message);
    console.log("-----------------------------------------");
    console.log(`🔑 OFFLINE MODE: Verification Code for ${email} is: ${otp}`);
    console.log("-----------------------------------------");
    
    // Return success even if email fails during development for offline testing
    res.status(200).json({ 
      success: true, 
      message: "Email failed but OTP generated for offline testing",
      offline: true 
    });
  }
});

app.post("/api/send-notification", async (req, res) => {
  const { tokens, title, body, data } = req.body;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ success: false, error: "Missing or invalid tokens array" });
  }
  if (!title || !body) {
    return res.status(400).json({ success: false, error: "Missing title or body" });
  }

  console.log(`🔔 Attempting to send push notification: "${title}" - "${body}" to ${tokens.length} devices.`);

  if (!firebaseMessaging) {
    console.log("⚠️ FCM is running in SIMULATION mode (no credentials provided).");
    console.log("Tokens that would have received the notification:", tokens);
    return res.status(200).json({
      success: true,
      simulated: true,
      message: "Push notifications simulated successfully (FCM not initialized on server)."
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
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
