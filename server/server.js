const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const diseaseRoutes = require("./routes/diseaseRoutes");

const app = express();

// CORS: allow frontend on Vite dev server
app.use(cors());


// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
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
  });
});
