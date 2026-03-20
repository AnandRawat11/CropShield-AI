const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../services/emailService");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      plan: "FREE",
      dailyLimit: 3,
      remainingScans: 3
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: "Internal Server Error. Please try again later." });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan,
        remainingScans: user.remainingScans
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

/* ================= GET LOGGED-IN USER ================= */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/* ================= UPGRADE TO PREMIUM ================= */
exports.upgradeToPremium = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🔥 ONLY UPDATE PLAN FIELDS
    user.plan = "PREMIUM";
    user.dailyLimit = 9999;      // simulate unlimited
    user.remainingScans = 9999;

    await user.save();

    res.json({
      plan: user.plan,
      dailyLimit: user.dailyLimit,
      remainingScans: user.remainingScans
    });
  } catch (err) {
    console.error("Upgrade error:", err);
    res.status(500).json({ error: "Upgrade failed" });
  }
};

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert: one OTP per email at a time
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { otp: otpCode, expiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otpCode);

    res.json({ message: "OTP sent to your email. It expires in 10 minutes." });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const record = await Otp.findOne({ email: email.toLowerCase().trim() });

    if (!record || record.otp !== otp || record.expiresAt < new Date()) {
      // Clean up expired record if present
      if (record && record.expiresAt < new Date()) await record.deleteOne();
      return res.status(400).json({ error: "Invalid or expired OTP. Please try again." });
    }

    // Valid OTP — delete it (single-use)
    await record.deleteOne();

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Auto-register new users
    if (!user) {
      // Create a random secure password since they use OTP
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Extract a name from the email (e.g., "john.doe" from "john.doe@gmail.com")
      const nameFromEmail = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
      
      user = await User.create({
        name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) || "User",
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        plan: "FREE",
        dailyLimit: 3,
        remainingScans: 3
      });
    }

    const token = jwt.sign(
      { id: user._id, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan,
        remainingScans: user.remainingScans
      }
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ error: "OTP verification failed. Please try again." });
  }
};
