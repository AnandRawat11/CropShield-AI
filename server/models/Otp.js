const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB will automatically delete the document after it expires
    index: { expires: 0 }
  }
});

// Ensure only one OTP per email at a time
OtpSchema.index({ email: 1 });

module.exports = mongoose.model("Otp", OtpSchema);
