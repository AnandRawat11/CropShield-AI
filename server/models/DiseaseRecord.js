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
    disease: {
        type: String,
        required: true
    },
    confidence: {
        type: Number,
        required: true
    },
    severity: {
        type: String,
        enum: ["Low", "Medium", "High", "None"],
        default: "Low"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("DiseaseRecord", DiseaseRecordSchema);
