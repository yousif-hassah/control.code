import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

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
    console.error("❌ Nodemailer Error:", error);
    console.error("❌ Error details:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
