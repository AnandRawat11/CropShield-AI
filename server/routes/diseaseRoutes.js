const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const { detectDisease, getHistory } = require("../controllers/diseaseController");

const auth = require("../middleware/auth");
const scanLimit = require("../middleware/scanLimit");

// Wrap multer upload to catch Cloudinary/upload errors and log them clearly
const uploadWithErrorHandling = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("[upload] ❌ Cloudinary/multer upload FAILED:", err.message);
      console.error("[upload] 🔑 Check CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Render env vars");
      return res.status(500).json({ error: "Image upload failed. Please try again." });
    }
    if (!req.file) {
      console.warn("[upload] ⚠️  No file received in request — form field must be named 'image'");
    } else {
      console.log("[upload] ✅ Image uploaded to Cloudinary:", req.file.path);
    }
    next();
  });
};

// 🔐 Protected + Freemium + Upload + AI Detection
router.post(
  "/detect",
  auth,                    // JWT authentication
  scanLimit,               // Free vs Premium logic
  uploadWithErrorHandling, // Cloudinary upload (with error logging)
  detectDisease            // AI + Treatment logic
);

// 📜 History
router.get("/history", auth, getHistory);

// Optional test route
router.get("/test", (req, res) => {
  res.send("Disease route working with auth system");
});

module.exports = router;
