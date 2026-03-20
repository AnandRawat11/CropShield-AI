const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OTP_EMAIL,
    pass: process.env.OTP_EMAIL_PASS
  }
});

/**
 * Sends a 6-digit OTP to the given email address.
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"CropShield AI" <${process.env.OTP_EMAIL}>`,
    to,
    subject: "Your CropShield AI Login Code",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f7f8f6; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3ED500 0%, #2aaa00 100%); padding: 32px 40px; text-align: center;">
          <img src="https://cropshield-ai.vercel.app/logo.png" alt="CropShield AI" style="height: 56px; width: auto;" onerror="this.style.display='none'" />
          <h1 style="color: #fff; margin: 12px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">CropShield AI</h1>
        </div>

        <!-- Body -->
        <div style="padding: 36px 40px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Your one-time login code is:</p>

          <div style="background: #fff; border: 2px solid #3ED500; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #18181b; font-family: monospace;">${otp}</span>
          </div>

          <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">⏱️ This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 13px; margin: 0;">If you did not request this code, you can safely ignore this email.</p>
        </div>

        <!-- Footer -->
        <div style="background: #f0f0ee; padding: 16px 40px; text-align: center;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} CropShield AI · Protecting your crops with intelligence</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
