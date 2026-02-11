const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const today = new Date().toDateString();

    // ✅ RESET COUNT IF NEW DAY
    if (!user.lastScanDate || user.lastScanDate.toDateString() !== today) {
      user.dailyScans = 0;
      user.lastScanDate = new Date();
    }

    // ✅ CHECK LIMIT AFTER RESET
    if (user.plan === "FREE" && user.dailyScans >= 5) {
      return res.status(403).json({
        error: "Free limit reached. Upgrade to Premium."
      });
    }

    // ✅ INCREMENT ONLY AFTER PASSING CHECK
    user.dailyScans += 1;
    await user.save();

    next();
  } catch (err) {
    console.error("ScanLimit Error:", err);
    res.status(500).json({ error: "Scan limit check failed" });
  }
};
