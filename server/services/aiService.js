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
  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1️⃣ Fetch image
    console.log("[aiService] 🚀 Starting Hybrid AI Pipeline...");
    console.log("[aiService] Step 1: Fetching image from:", imageUrl);
    let imageBuffer;
    if (imageUrl.startsWith("http")) {
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 30000 });
      imageBuffer = Buffer.from(imageResponse.data);
    } else {
      const fs = require('fs');
      imageBuffer = fs.readFileSync(imageUrl);
    }
    console.log("[aiService] Step 1 OK: Image fetched, size:", imageBuffer.length);

    // 2️⃣ Try Python ML model — wait up to 3 minutes for cold start
    const AI_API_URL = process.env.AI_API_URL || "http://127.0.0.1:8000";
    const isRemote = !AI_API_URL.includes("127.0.0.1") && !AI_API_URL.includes("localhost");
    console.log("[aiService] Step 2: Calling AI API at:", AI_API_URL + "/predict");

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // Render free tier needs up to 3 minutes on cold start
    const WARM_UP_LIMIT_MS = isRemote ? 180000 : 15000; // 3 min for remote, 15s for local
    const POLL_INTERVAL_MS = 5000;
    const warmStart = Date.now();
    let apiAlive = false;

    console.log("[aiService] Step 2a: Polling AI API health (timeout:", WARM_UP_LIMIT_MS / 1000, "s)...");
    while (Date.now() - warmStart < WARM_UP_LIMIT_MS) {
      try {
        await axios.get(`${AI_API_URL}/health`, { timeout: 10000 });
        apiAlive = true;
        console.log("[aiService] Step 2a: ✅ AI API is alive after", Math.round((Date.now() - warmStart) / 1000), "s");
        break;
      } catch (e) {
        // KEY FIX: Any HTTP response (even 429, 500) means the service IS running.
        // Only a network-level error (no response = ECONNREFUSED/ETIMEDOUT) means sleeping.
        if (e.response) {
          apiAlive = true;
          console.log(`[aiService] Step 2a: ✅ AI API is running (HTTP ${e.response.status}) after`, Math.round((Date.now() - warmStart) / 1000), "s");
          break;
        }
        const elapsed = Math.round((Date.now() - warmStart) / 1000);
        const remaining = Math.round((WARM_UP_LIMIT_MS - (Date.now() - warmStart)) / 1000);
        console.log(`[aiService] Step 2a: No response yet (${e.code || e.message}) — waiting... (${elapsed}s elapsed, ${remaining}s left)`);
        await sleep(POLL_INTERVAL_MS);
      }
    }

    let pythonResult = null;

    if (!apiAlive) {
      console.warn("[aiService] ⚠️  AI API did not respond in", WARM_UP_LIMIT_MS / 1000, "s — falling back to Gemini-only analysis.");
      // FALLBACK: Gemini-only mode — no ML prediction, let Gemini analyse the image directly
      return await _geminiOnlyAnalysis(ai, imageBuffer, lang);
    }

    // 3️⃣ ML API is alive — send the image
    const formData = new FormData();
    formData.append("image", imageBuffer, { filename: "image.jpg", contentType: "image/jpeg" });

    const contentLength = await new Promise((resolve, reject) => {
      formData.getLength((err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });

    try {
      console.log("[aiService] Image sent to ML service");
      const pythonResponse = await axios.post(
        `${AI_API_URL}/predict`,
        formData,
        {
          headers: { ...formData.getHeaders(), "Content-Length": contentLength },
          timeout: 120000
        }
      );
      pythonResult = pythonResponse.data;
    } catch (predictErr) {
      console.error("[aiService] /predict failed:", predictErr.message, "— falling back to Gemini-only.");
      return await _geminiOnlyAnalysis(ai, imageBuffer, lang);
    }

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

    // 5️⃣ Call Gemini for full analysis with ML prediction
    const diseaseName = pythonResult.disease.replace(/___/g, " - ").replace(/_/g, " ");
    return await _geminiWithMLResult(ai, imageBuffer, diseaseName, pythonResult.confidence, lang);

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

/* ── Gemini Analysis Helpers ── */

/**
 * Gemini-only fallback: analyses the crop image without any ML prediction.
 * Used when the Python ML API is unreachable (cold start timeout, etc.)
 */
async function _geminiOnlyAnalysis(ai, imageBuffer, lang) {
  console.log("[aiService] 🤖 Gemini-only analysis mode (ML API unavailable)");

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
  "confidence": <a float between 0.0 and 1.0 representing your confidence>,
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
Set treatment = null when status = "Healthy" or "Unknown".
All text fields (crop, disease, explanation, treatment) MUST be in ${langName}.
  `.trim();

  const promptText = `
Please analyse this crop image carefully.
Identify the crop, check if it has any disease, and provide a diagnosis.
This app supports: Cotton, Wheat, Rice, Maize, Sugarcane, Tomato, Potato.

Respond ONLY in ${langName}. All JSON field values must be in ${langName}.
  `.trim();

  const base64Image = imageBuffer.toString("base64");

  const geminiResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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

  console.log("[aiService] Gemini-only analysis complete");
  const geminiText = geminiResponse.text;

  let result = null;
  try {
    const cleanText = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
    result = JSON.parse(cleanText);
  } catch (parseError) {
    console.error("[aiService] Failed to parse Gemini JSON:", geminiText);
  }

  if (!result) {
    return {
      crop: null,
      disease: _translateWord("Not identifiable", lang),
      status: "Unknown",
      confidence: 0,
      is_plant: false,
      explanation: _unknownExplanation(lang),
      treatment: null
    };
  }

  let finalStatus = result.status;
  if (!["Healthy", "Infected", "Unknown"].includes(finalStatus)) finalStatus = "Unknown";

  return {
    crop: result.crop || null,
    disease: result.disease || _translateWord("Not identifiable", lang),
    status: finalStatus,
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
    is_plant: finalStatus !== "Unknown",
    explanation: result.explanation || null,
    treatment: finalStatus === "Healthy" ? null : (result.treatment || null)
  };
}

/**
 * Gemini analysis augmented with ML model prediction.
 */
async function _geminiWithMLResult(ai, imageBuffer, diseaseName, confidence, lang) {
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
    model: 'gemini-2.5-flash',
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
    return {
      crop: _extractCrop(diseaseName),
      disease: diseaseName,
      status: "Unknown",
      confidence,
      is_plant: true,
      explanation: null,
      treatment: { message: "AI analysis failed. Please try again." }
    };
  }

  // Validate status
  let finalStatus = geminiResult.status;
  if (!["Healthy", "Infected", "Unknown"].includes(finalStatus)) finalStatus = "Unknown";
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
    confidence,
    is_plant: true,
    explanation: geminiResult.explanation || null,
    treatment: finalStatus === "Healthy" ? null : (geminiResult.treatment || null)
  };
}

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
