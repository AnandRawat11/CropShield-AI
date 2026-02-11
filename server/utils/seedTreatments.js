const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Treatment = require("../models/Treatment");

dotenv.config({ path: "../.env" });

const treatments = [
    // Corn (Maize)
    {
        crop: "Corn (Maize)",
        disease: "Corn (Maize) - Common rust",
        chemical: {
            name: "Mancozeb 75% WP",
            dose: "1.5 kg/ha"
        },
        organic: "Spray neem oil (3%) or garlic extract.",
        prevention: "Plant resistant varieties and maintain proper field sanitation."
    },
    {
        crop: "Corn (Maize)",
        disease: "Corn (Maize) - Northern Leaf Blight",
        chemical: {
            name: "Propiconazole 25% EC",
            dose: "500 ml/ha"
        },
        organic: "Use Trichoderma viride bio-fungicide.",
        prevention: "Rotate crops with non-host plants like soybean."
    },

    // Potato
    {
        crop: "Potato",
        disease: "Potato - Early blight",
        chemical: {
            name: "Chlorothalonil 75% WP",
            dose: "1.2 kg/ha"
        },
        organic: "Avoid overhead irrigation and use copper-based fungicides.",
        prevention: "Use certified disease-free tubers."
    },
    {
        crop: "Potato",
        disease: "Potato - Late blight",
        chemical: {
            name: "Metalaxyl + Mancozeb",
            dose: "2.5 g/liter water"
        },
        organic: "Apply compost tea or copper fungicides regularly.",
        prevention: "Destroy cull piles and volunteer potatoes."
    },

    // Tomato
    {
        crop: "Tomato",
        disease: "Tomato - Bacterial spot",
        chemical: {
            name: "Copper Oxychloride",
            dose: "3 g/liter water"
        },
        organic: "Spray streptomycin sulphate (Agri-mycin).",
        prevention: "Use drip irrigation instead of overhead sprinklers."
    },
    {
        crop: "Tomato",
        disease: "Tomato - Early blight",
        chemical: {
            name: "Azoxystrobin 23% SC",
            dose: "1 ml/liter water"
        },
        organic: "Remove lower infected leaves and mulch the soil.",
        prevention: "Stake plants to improve air circulation."
    },

    // Rice (Common Indian Crop)
    {
        crop: "Rice",
        disease: "Rice - Brown Spot",
        chemical: {
            name: "Carbendazim 50% WP",
            dose: "1 g/liter water"
        },
        organic: "Treat seeds with Pseudomonas fluorescens.",
        prevention: "Apply balanced fertilizers (avoid excess Nitrogen)."
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cropshield");
        console.log("MongoDB Connected for Seeding");

        await Treatment.deleteMany({});
        console.log("Cleared existing treatments");

        await Treatment.insertMany(treatments);
        console.log("Seeded Treatment Data Successfully");

        process.exit();
    } catch (err) {
        console.error("Seeding Error:", err);
        process.exit(1);
    }
};

seedDB();
