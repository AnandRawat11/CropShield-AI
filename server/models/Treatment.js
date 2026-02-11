const mongoose = require("mongoose");

const TreatmentSchema = new mongoose.Schema({
  crop: String,
  disease: String,
  chemical: {
    name: String,
    dose: String
  },
  organic: String,
  prevention: String
});

module.exports = mongoose.model("Treatment", TreatmentSchema);
