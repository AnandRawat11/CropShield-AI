const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,

  plan: {
    type: String,
    enum: ["FREE", "PREMIUM"],
    default: "FREE"
  },

  dailyScans: {
    type: Number,
    default: 0
  },

  lastScanDate: Date
});

module.exports = mongoose.model("User", UserSchema);
