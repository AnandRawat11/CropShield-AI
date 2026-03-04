const callAI = require("../services/aiService");
const DiseaseRecord = require("../models/DiseaseRecord");

const detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageUrl = req.file.path;
    const lang = req.body.lang || "en";

    // Call AI pipeline
    const aiResult = await callAI(imageUrl, lang);

    // Map 3-state status → severity (for backward compat with scan result UI)
    let severity = "Low";
    if (aiResult.status === "Healthy") severity = "None";
    else if (aiResult.status === "Unknown") severity = "Low";
    else if (aiResult.confidence > 0.85) severity = "High";
    else if (aiResult.confidence > 0.70) severity = "Medium";
    else severity = "Low";

    // Determine treatment to return
    let treatment = aiResult.treatment;
    if (aiResult.status === "Healthy") {
      treatment = { message: aiResult.explanation };
    } else if (aiResult.status === "Unknown") {
      treatment = { message: aiResult.explanation };
    }

    // Save structured record to DB
    await DiseaseRecord.create({
      user: req.user.id,
      imageUrl,
      disease: aiResult.disease,
      crop: aiResult.crop || "Unknown",
      confidence: aiResult.confidence,
      status: aiResult.status,     // "Healthy" | "Infected" | "Unknown"
      severity,
      treatment: aiResult.treatment,  // structured object
      explanation: aiResult.explanation
    });

    // API response
    res.json({
      imageUrl,
      disease: {
        disease: aiResult.disease,
        confidence: Number(aiResult.confidence.toFixed(3)),
        severity,
        status: aiResult.status,
        crop: aiResult.crop
      },
      treatment,
      explanation: aiResult.explanation
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
