const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const auth = require("../middleware/auth");
const User = require("../models/User");

const FREE_DAILY_LIMIT = 5; // 👈 change limit here anytime

/* ================= AUTH ================= */
router.post("/register", register);
router.post("/login", login);

/* ================= GET LOGGED-IN USER ================= */
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const dailyLimit =
    user.plan === "PREMIUM" ? "Unlimited" : FREE_DAILY_LIMIT;

  const remainingScans =
    user.plan === "PREMIUM"
      ? "Unlimited"
      : Math.max(0, FREE_DAILY_LIMIT - user.dailyScans);

  res.json({
    name: user.name,
    email: user.email,
    plan: user.plan,
    dailyLimit,
    remainingScans
  });
});

/* ================= UPGRADE TO PREMIUM ================= */
router.post("/upgrade", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔥 UPGRADE LOGIC (MINIMAL CHANGE)
    user.plan = "PREMIUM";
    user.dailyScans = 0; // reset scans on upgrade

    await user.save();

    res.json({
      message: "Upgraded to Premium",
      plan: user.plan,
      dailyLimit: "Unlimited",
      remainingScans: "Unlimited"
    });
  } catch (err) {
    console.error("Upgrade error:", err);
    res.status(500).json({ error: "Upgrade failed" });
  }
});

module.exports = router;
