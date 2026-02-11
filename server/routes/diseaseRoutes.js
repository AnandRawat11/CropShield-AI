const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const { detectDisease, getHistory } = require("../controllers/diseaseController");

const auth = require("../middleware/auth");
const scanLimit = require("../middleware/scanLimit");

// 🔐 Protected + Freemium + Upload + AI Detection
router.post(
  "/detect",
  auth,               // JWT authentication
  scanLimit,          // Free vs Premium logic
  upload.single("image"), // Cloudinary upload
  detectDisease       // AI + Treatment logic
);

// 📜 History
router.get("/history", auth, getHistory);

// Optional test route
router.get("/test", (req, res) => {
  res.send("Disease route working with auth system");
});

module.exports = router;
