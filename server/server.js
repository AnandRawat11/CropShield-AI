const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const diseaseRoutes = require("./routes/diseaseRoutes");

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

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/disease", diseaseRoutes);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")} + *.vercel.app`);
  });
});
