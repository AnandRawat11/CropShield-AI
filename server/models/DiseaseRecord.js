const mongoose = require("mongoose");

const DiseaseRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    // Core disease info
    disease: { type: String, required: true },       // translated disease name
    crop: { type: String, default: "Unknown" },       // extracted crop name
    confidence: { type: Number, required: true },

    // 3-state status (replaces keyword-based frontend logic)
    status: {
        type: String,
        enum: ["Healthy", "Infected", "Unknown"],
        default: "Unknown"
    },

    // Kept for backward compat — maps to status
    severity: {
        type: String,
        enum: ["Low", "Medium", "High", "None"],
        default: "Low"
    },

    // Structured treatment from Gemini (null for healthy/unknown)
    treatment: { type: mongoose.Schema.Types.Mixed, default: null },

    // Explanation in user's selected language
    explanation: { type: String, default: null },

    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DiseaseRecord", DiseaseRecordSchema);
