const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    // Do NOT exit — let the server stay up so Render detects the open port.
    // API routes that need DB will fail gracefully instead of crashing everything.
  }
};

module.exports = connectDB;
