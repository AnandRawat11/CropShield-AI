const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const diseaseRoutes = require("./routes/diseaseRoutes");

const app = express();

// CORS — allow frontend origins
// FRONTEND_URL env var can be a comma-separated list of allowed origins
const allowedOrigins = [
  "http://localhost:5173",   // local Vite dev server
  "http://localhost:4173",   // local Vite preview
];
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",").forEach((url) =>
    allowedOrigins.push(url.trim())
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from: ${origin}`);
        callback(new Error("Not allowed by CORS"));
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
    console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
  });
});
