const callAI = require("../services/aiService");
const Treatment = require("../models/Treatment");
const DiseaseRecord = require("../models/DiseaseRecord");

// Helper to clean disease name
const formatDiseaseName = (name) => {
  return name
    .replace("___", " - ")
    .replace(/_/g, " ");
};

const detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Cloudinary image URL
    const imageUrl = req.file.path;

    // Call AI Model
    const aiResult = await callAI(imageUrl);

    // Severity logic
    let severity = "Low";
    if (aiResult.disease.toLowerCase().includes("healthy")) {
      severity = "None";
    } else if (aiResult.confidence > 0.85) {
      severity = "High";
    } else if (aiResult.confidence > 0.7) {
      severity = "Medium";
    }

    // Trim and clean name
    const cleanName = formatDiseaseName(aiResult.disease).trim();

    // Fetch treatment only if disease (not healthy)
    let treatment = null;
    if (severity !== "None") {
      // Case-insensitive search
      treatment = await Treatment.findOne({
        disease: { $regex: new RegExp(`^${cleanName}$`, "i") }
      });

      if (!treatment) {
        treatment = { message: "Treatment data not available yet" };
      }
    }

    // Save to History
    await DiseaseRecord.create({
      user: req.user.id,
      imageUrl,
      disease: formatDiseaseName(aiResult.disease),
      confidence: aiResult.confidence,
      severity
    });

    res.json({
      imageUrl,
      disease: {
        disease: formatDiseaseName(aiResult.disease),
        confidence: Number(aiResult.confidence.toFixed(3)),
        severity
      },
      treatment
    });

  } catch (error) {
    console.error("Backend Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await DiseaseRecord.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(20);

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

module.exports = { detectDisease, getHistory };
