const nodemailer = require("nodemailer");

const send2FACode = async (email, code) => {
  // Create a transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Ciaan Security" <no-reply@vpciaan.in>`,
    to: email,
    subject: "Ciaan Superadmin 2FA Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Ciaan</h1>
          <p style="color: white; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Curriculum Implementation Assessment Norms</p>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #2c3e50; font-size: 20px; margin-top: 0;">Two-Factor Authentication</h2>
          <p>Hello Superadmin,</p>
          <p>A login attempt was made to your Ciaan Superadmin account. Please use the following 2FA verification code to complete your login:</p>
          <div style="text-align: center; margin: 25px 0;">
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 15px 30px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; display: inline-block; color: #28a745;">
              ${code}
            </div>
          </div>
          <p>This code is valid for <strong>5 minutes</strong>. If you did not initiate this login request, please ignore this email or update your password immediately.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
          <p style="font-size: 11px; color: #7f8c8d; margin: 0;">© ${new Date().getFullYear()} Vidyalankar Polytechnic. All rights reserved.</p>
          <p style="font-size: 10px; color: #95a5a6; margin: 5px 0 0 0;">This is an automated security notification. Please do not reply.</p>
        </div>
      </div>
    `,
  };

  // Log OTP in the console
  console.log(`\n📨 [2FA OTP] Code generated for ${email}: ${code}\n`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP credentials not found in environment variables. 2FA Email NOT sent. OTP printed in console above.");
    return { sent: false, info: "SMTP credentials not configured" };
  }

  const info = await transporter.sendMail(mailOptions);
  return { sent: true, info };
};

module.exports = { send2FACode };
