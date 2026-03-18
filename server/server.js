const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const connectDB = require("./config/db");
const session = require("express-session");
const passport = require("passport");
require("./config/passport");
const authRoutes = require("./routes/authRoutes");

const diseaseRoutes = require("./routes/diseaseRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

const app = express();

// CORS — allow all Vercel preview URLs + explicit origins from FRONTEND_URL env var
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
];
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",").forEach((url) =>
    allowedOrigins.push(url.trim())
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow: no origin (Postman/curl), localhost, known Vercel URLs, or explicit list
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)   // allow ANY vercel.app subdomain
      ) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked: ${origin}`);
        callback(null, false); // return false, NOT an Error — avoids 500
      }
    },
    credentials: true,
  })
);

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Backend working");
});

app.get("/health", (req, res) => {
  res.status(200).send("Backend service running");
});

app.use(express.json({ limit: "15mb" }));

app.use(
  session({
    secret: process.env.JWT_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/assistant", assistantRoutes);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")} + *.vercel.app`);

    // Keep the Render AI API warm — ping every 13 min (Render sleeps after ~15 min)
    const AI_API_URL = process.env.AI_API_URL;
    if (AI_API_URL && !AI_API_URL.includes("127.0.0.1")) {
      setInterval(async () => {
        try {
          await axios.get(`${AI_API_URL}/health`, { timeout: 10000 });
          console.log("[keepAlive] AI API pinged successfully");
        } catch (e) {
          console.warn("[keepAlive] AI API ping failed (may be sleeping):", e.message);
        }
      }, 13 * 60 * 1000); // 13 minutes
      console.log("[keepAlive] Keep-alive pinger started for AI API");
    }
  });
});
