const { GoogleGenAI } = require('@google/genai');
const { getWeatherContext } = require('../services/weatherService');

const getPersonalizedGuide = async (req, res) => {
  try {
    const { lat, lng, language = 'en' } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required." });
    }

    // 1. Fetch real-time weather context
    const weatherInfo = await getWeatherContext(lat, lng) || "Weather data unavailable.";

    // 2. Set up Gemini
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ success: false, message: "AI service temporarily unavailable (API key missing)." });
    }
    const ai = new GoogleGenAI({ apiKey });

    const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';

    const systemInstruction = `
You are an expert Agronomist and Soil Scientist. 
The user's selected language is: ${langName}.
You must evaluate the user's location based on the provided weather and coordinates, and provide location-specific Soil Health Recommendations and Fertilizer Guidance. 
Consider typical soil profiles and common crops grown at these coordinates in India.
Keep the advice practical, simple to understand, and highly actionable for a farmer.
DO NOT use markdown formatting (no asterisks, hashes, etc).

Required JSON format:
{
  "locationContext": "<A short 1-sentence description of the inferred agricultural zone>",
  "soilHealth": [
    "<Recommendation 1>",
    "<Recommendation 2>"
  ],
  "fertilizerGuidance": [
    "<Guidance 1>",
    "<Guidance 2>"
  ],
  "recommendedCrops": ["Crop 1", "Crop 2"]
}
    `.trim();

    const promptText = `
User Location: Latitude ${lat}, Longitude ${lng}.
Current Weather: ${weatherInfo}

Based on this precise location and weather, generate a localized soil health assessment and organic/chemical fertilizer recommendations. 
All fields in the JSON response MUST be written in ${langName}.
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: promptText }]
      }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    let jsonResult;
    try {
      jsonResult = JSON.parse(response.text.replace(/```json/g, "").replace(/```/g, "").trim());
      
      const cleanArray = (arr) => Array.isArray(arr) ? arr.map(str => str.replace(/[*#_`]/g, "")) : arr;
      jsonResult.soilHealth = cleanArray(jsonResult.soilHealth);
      jsonResult.fertilizerGuidance = cleanArray(jsonResult.fertilizerGuidance);
      jsonResult.locationContext = (jsonResult.locationContext || "").replace(/[*#_`]/g, "");

    } catch (e) {
      console.error("Failed to parse Gemini JSON:", response.text);
      throw new Error("Failed to generate personalized guidance.");
    }

    return res.status(200).json({
      success: true,
      data: jsonResult
    });

  } catch (error) {
    console.error("Error in getPersonalizedGuide:", error);
    res.status(500).json({ success: false, message: "Failed to generate guide. Please try again later." });
  }
};

module.exports = {
  getPersonalizedGuide
};
