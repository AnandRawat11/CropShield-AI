const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const FormData = require('form-data');

/**
 * imageUrl = Cloudinary URL
 * lang = "en" | "hi" | "mr"
 */
const callAI = async (imageUrl, lang = "en") => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[aiService] ❌ GEMINI_API_KEY or GOOGLE_API_KEY is missing from environment variables!");
    throw new Error("AI analysis service temporarily unavailable (API key missing).");
  }
  const ai = new GoogleGenAI(apiKey);

  try {
    // 1️⃣ Fetch image
    console.log("[aiService] 🚀 Starting Hybrid AI Pipeline...");
    console.log("[aiService] Step 1: Fetching image from:", imageUrl);
    let imageBuffer;
    if (imageUrl.startsWith("http")) {
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      imageBuffer = imageResponse.data;
    } else {
      const fs = require('fs');
      imageBuffer = fs.readFileSync(imageUrl);
    }
    console.log("[aiService] Step 1 OK: Image fetched, size:", imageBuffer.length);

    const formData = new FormData();
    formData.append("image", imageBuffer, { filename: "image.jpg", contentType: "image/jpeg" });

    const contentLength = await new Promise((resolve, reject) => {
      formData.getLength((err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });

    // 2️⃣ Warm-up poll then call Python ML model
    const AI_API_URL = process.env.AI_API_URL || "http://127.0.0.1:8000";
    console.log("[aiService] Step 2: Calling AI API at:", AI_API_URL + "/predict");

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const WARM_UP_LIMIT_MS = 45000; // Reduced from 120s to 45s
    const POLL_INTERVAL_MS = 3000;  // More frequent polling
    const warmStart = Date.now();
    let apiAlive = false;

    console.log("[aiService] Step 2a: Polling AI API health...");
    while (Date.now() - warmStart < WARM_UP_LIMIT_MS) {
      try {
        await axios.get(`${AI_API_URL}/health`, { timeout: 8000 });
        apiAlive = true;
        console.log("[aiService] Step 2a: AI API is alive after", Date.now() - warmStart, "ms");
        break;
      } catch {
        console.log("[aiService] Step 2a: Waiting for AI API...");
        await sleep(POLL_INTERVAL_MS);
      }
    }

    if (!apiAlive) {
      console.error("[aiService] ❌ AI API health check failed after", WARM_UP_LIMIT_MS, "ms");
      throw new Error("AI API did not become available within timeout. It might be experiencing a cold start.");
    }

    let pythonResponse;
    try {
      pythonResponse = await axios.post(
        `${AI_API_URL}/predict`,
        formData,
        {
          headers: { ...formData.getHeaders(), "Content-Length": contentLength },
          timeout: 120000
        }
      );
    } catch (predictErr) {
      console.error("[aiService] /predict failed:", predictErr.message);
      throw predictErr;
    }

    const pythonResult = pythonResponse.data;
    console.log("[aiService] Step 2 OK — Python ML Result:", pythonResult);

    const isPlant = pythonResult.disease && !pythonResult.disease.includes("Not a Plant");

    // 3️⃣ Early return: not a plant or very low confidence
    if (!isPlant || pythonResult.confidence < 0.2) {
      console.log("[aiService] Early return: not a plant or low confidence");
      return {
        crop: null,
        disease: _translateWord("Not identifiable", lang),
        status: "Unknown",
        confidence: pythonResult.confidence,
        is_plant: isPlant,
        explanation: _unknownExplanation(lang),
        treatment: null
      };
    }

    // 4️⃣ Healthy early return
    if (pythonResult.disease.toLowerCase().includes("healthy")) {
      const cropName = _extractCrop(pythonResult.disease);
      const translatedCrop = _translateCrop(cropName, lang);
      return {
        crop: translatedCrop || cropName,
        disease: _healthyLabel(lang),
        status: "Healthy",
        confidence: pythonResult.confidence,
        is_plant: true,
        explanation: _healthyExplanation(lang),
        treatment: null
      };
    }

    // 5️⃣ Call Gemini for full analysis
    const diseaseName = pythonResult.disease.replace(/___/g, " - ").replace(/_/g, " ");
    console.log("[aiService] Step 3: Calling Gemini for disease:", diseaseName);

    const LANG_NAMES = { hi: "Hindi", mr: "Marathi", en: "English" };
    const langName = LANG_NAMES[lang] || "English";

    const systemInstruction = `
You are an expert Agricultural Pathologist AI.
The user's selected language is: ${langName}.
You MUST respond ONLY with valid JSON. No markdown. No extra keys.

Required JSON format:
{
  "crop": "<Crop name in ${langName}>",
  "disease": "<Specific disease name in ${langName} (e.g. टमाटर - झुलसा or Tomato - Late Blight)>",
  "status": "<MUST be exactly one of: Healthy | Infected | Unknown>",
  "explanation": "<2-3 sentences explaining the disease in simple ${langName} suitable for a farmer>",
  "treatment": {
    "chemical": { "name": "<chemical name>", "dose": "<dosage>" },
    "organic": "<organic treatment>",
    "prevention": "<prevention tips>"
  }
}

STATUS RULES (strictly follow):
- status = "Healthy" ONLY if the crop has no disease.
- status = "Infected" ONLY if a specific disease is clearly identified.
- status = "Unknown" if: image is unclear, crop is not identifiable, insufficient detail, or confidence is low.

IMPORTANT: "Not identifiable", "Undetermined", "Insufficient" → ALWAYS use status = "Unknown", never "Infected".
All text fields (crop, disease, explanation, treatment) MUST be in ${langName}.
    `.trim();

    const promptText = `
The ML model predicted this crop image as: "${diseaseName}".
The ML model is trained on: Cotton, Wheat, Rice, Maize, Sugarcane, Tomato, Potato (Healthy and Disease variants).

Look at the attached image and verify:
- If prediction is correct → provide treatment in ${langName}.
- If prediction is wrong → correct it and provide treatment in ${langName}.
- If image is unclear or not a crop → set status = "Unknown" and explain why in ${langName}.

Respond ONLY in ${langName}. All JSON field values must be in ${langName}.
    `.trim();

    const base64Image = imageBuffer.toString("base64");

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Verified available model
      contents: [{
        role: 'user',
        parts: [
          { text: promptText },
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]
      }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    console.log("[aiService] Step 3 OK: Gemini responded");
    const geminiText = geminiResponse.text;

    let geminiResult = null;
    try {
      const cleanText = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
      geminiResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("[aiService] Failed to parse Gemini JSON:", geminiText);
    }

    if (!geminiResult) {
      // Fallback if Gemini parse fails
      return {
        crop: _extractCrop(diseaseName),
        disease: diseaseName,
        status: "Unknown",
        confidence: pythonResult.confidence,
        is_plant: true,
        explanation: null,
        treatment: { message: "AI analysis failed. Please try again." }
      };
    }

    // Validate status — never default an ambiguous case to "Infected"
    let finalStatus = geminiResult.status;
    if (!["Healthy", "Infected", "Unknown"].includes(finalStatus)) {
      finalStatus = "Unknown";
    }
    const diseaseText = (geminiResult.disease || "").toLowerCase();
    if (
      diseaseText.includes("not identifiable") ||
      diseaseText.includes("undetermined") ||
      diseaseText.includes("insufficient") ||
      diseaseText.includes("unclear") ||
      diseaseText.includes("cannot identify")
    ) {
      finalStatus = "Unknown";
    }

    return {
      crop: geminiResult.crop || _extractCrop(diseaseName),
      disease: geminiResult.disease || diseaseName,
      status: finalStatus,
      confidence: pythonResult.confidence,
      is_plant: true,
      explanation: geminiResult.explanation || null,
      treatment: finalStatus === "Healthy" ? null : (geminiResult.treatment || null)
    };

  } catch (error) {
    console.error("[aiService] ❌ PIPELINE FAILED:");
    console.error("  Message:", error.message);
    console.error("  Code:", error.code);
    console.error("  Stack:", error.stack?.split('\n')[1]);
    if (error.response) {
      console.error("  HTTP Status:", error.response.status);
      console.error("  HTTP Data:", JSON.stringify(error.response.data));
    }
    throw new Error("Failed to process image with the Hybrid ML+AI pipeline");
  }
};

/* ── Helpers ── */

function _extractCrop(diseaseName) {
  if (!diseaseName) return null;
  const dashIdx = diseaseName.indexOf(' - ');
  return dashIdx > 0 ? diseaseName.slice(0, dashIdx).trim() : null;
}

function _translateCrop(crop, lang) {
  if (!crop || lang === 'en') return crop;
  const MAP = {
    hi: { Maize: 'मक्का', Tomato: 'टमाटर', Potato: 'आलू', Rice: 'चावल', Wheat: 'गेहूं', Cotton: 'कपास', Sugarcane: 'गन्ना' },
    mr: { Maize: 'मका', Tomato: 'टोमॅटो', Potato: 'बटाटा', Rice: 'तांदूळ', Wheat: 'गहू', Cotton: 'कापूस', Sugarcane: 'ऊस' }
  };
  return (MAP[lang] || {})[crop] || crop;
}

function _translateWord(word, lang) {
  const MAP = {
    hi: { 'Not identifiable': 'पहचान योग्य नहीं' },
    mr: { 'Not identifiable': 'ओळखता येत नाही' }
  };
  return (MAP[lang] || {})[word] || word;
}

function _healthyLabel(lang) {
  return { hi: 'कोई रोग नहीं', mr: 'कोणताही रोग नाही', en: 'No Disease' }[lang] || 'No Disease';
}

function _healthyExplanation(lang) {
  return {
    hi: 'आपकी फसल स्वस्थ दिख रही है। किसी उपचार की आवश्यकता नहीं है। इसी तरह देखभाल जारी रखें।',
    mr: 'आपले पीक निरोगी दिसत आहे. कोणत्याही उपचाराची गरज नाही. अशाच प्रकारे काळजी घ्या.',
    en: 'Your crop looks healthy! No treatment is required. Keep up the good work!'
  }[lang] || 'Your crop looks healthy!';
}

function _unknownExplanation(lang) {
  return {
    hi: 'छवि से फसल या रोग की पहचान नहीं हो सकी। कृपया पत्ते की स्पष्ट, नज़दीकी तस्वीर अपलोड करें।',
    mr: 'प्रतिमेतून पीक किंवा रोग ओळखता आला नाही. कृपया पानाचा स्पष्ट, जवळचा फोटो अपलोड करा.',
    en: 'The image could not be identified as a crop or disease. Please upload a clear, close-up photo of the affected leaf.'
  }[lang] || 'Image could not be identified.';
}

module.exports = callAI;
