import nodemailer from "nodemailer";

export default async function handler(req, res) {
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
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({
      success: false,
      error:
        "EMAIL_USER or EMAIL_PASS environment variables are missing in Vercel settings.",
    });
  }

  const { email, name, otp } = req.body;

  console.log(`📧 Attempting to send OTP to: ${email}`);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Nodemailer Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
