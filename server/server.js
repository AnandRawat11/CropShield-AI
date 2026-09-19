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
const paymentRoutes = require("./routes/paymentRoutes");

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

// Request logger — logs method, path, response status and duration
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const icon = status >= 500 ? "❌" : status >= 400 ? "⚠️ " : "✅";
    console.log(`[${new Date().toISOString()}] ${icon} ${method} ${originalUrl} → ${status} [${ms}ms]`);
  });
  next();
});

app.get("/", (req, res) => {
  res.send("Backend working");
});

app.get("/health", (req, res) => {
  res.status(200).send("Backend service running");
});

app.get("/api/health", async (req, res) => {
  try {
    const aiApiUrl = process.env.AI_API_URL;
    if (aiApiUrl && !aiApiUrl.includes("127.0.0.1")) {
      // Ping the AI API to wake it up (with a long timeout if sleeping)
      await axios.get(`${aiApiUrl}/health`, { timeout: 60000 });
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[Health Check] AI API ping failed:", error.message);
    // Still return 200 so the frontend loads, even if AI API is struggling
    res.status(200).json({ status: "ok", ml_error: error.message });
  }
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
app.use("/api/payment", paymentRoutes);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")} + *.vercel.app`);

    // Keep the Render AI API warm — ping every 10 min (Render sleeps after ~15 min)
    const AI_API_URL = process.env.AI_API_URL;
    if (AI_API_URL && !AI_API_URL.includes("127.0.0.1") && !AI_API_URL.includes("localhost")) {
      const pingAIApi = async () => {
        try {
          await axios.get(`${AI_API_URL}/health`, { timeout: 15000 });
          console.log("[keepAlive] ✅ AI API pinged successfully");
        } catch (e) {
          if (e.response && e.response.status === 429) {
            // Rate limited — service is alive, just throttling us
            console.log("[keepAlive] AI API is alive (rate-limited 429 — normal on free tier)");
          } else {
            // Service sleeping — try root endpoint to wake it
            try {
              await axios.get(AI_API_URL, { timeout: 15000 });
              console.log("[keepAlive] ✅ AI API woken via root endpoint");
            } catch (e2) {
              console.warn("[keepAlive] AI API may be in cold start:", e2.message);
            }
          }
        }
      };
      // Initial ping on startup
      setTimeout(pingAIApi, 5000);
      // Then every 10 minutes
      setInterval(pingAIApi, 10 * 60 * 1000);
      console.log("[keepAlive] Keep-alive pinger started for AI API (every 10 min)");
    }
  });
});
