const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const diseaseRoutes = require("./routes/diseaseRoutes");

const app = express();

// CORS: allow frontend on Vite dev server
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

connectDB();

app.get("/", (req, res) => {
  res.send("Backend working");
});

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/disease", diseaseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("MongoDB Connected");
  console.log(`Server running on port ${PORT}`);
});
