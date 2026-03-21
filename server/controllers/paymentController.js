const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");

// Initialize Razorpay instance safely
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not configured in .env");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

exports.createOrder = async (req, res) => {
  try {
    const rzp = getRazorpayInstance();
    const options = {
      amount: 9900, // ₹99 in paise
      currency: "INR",
      receipt: `receipt_order_${req.user.id}`,
    };

    const order = await rzp.orders.create(options);
    res.json({ order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: "Could not create payment order. " + (err.message || "") });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Razorpay secret not configured" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Upgrade the user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.plan = "PREMIUM";
    user.dailyLimit = 9999;     // simulates unlimited
    user.remainingScans = 9999;
    await user.save();

    res.json({
      message: "Payment successful. Upgraded to Premium!",
      plan: user.plan,
      dailyLimit: user.dailyLimit,
      remainingScans: user.remainingScans
    });

  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
};
