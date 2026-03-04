const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const FormData = require('form-data');

/**
 * imageUrl = Cloudinary URL
 */
const callAI = async (imageUrl) => {
  const ai = new GoogleGenAI({});

  try {
    // 1️⃣ Get Image Buffer from Cloudinary URL
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
    formData.append("image", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg"
    });

    const contentLength = await new Promise((resolve, reject) => {
      formData.getLength((err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });

    // 2️⃣ Call Python ML Model on Render
    const AI_API_URL = process.env.AI_API_URL || "http://127.0.0.1:8000";
    console.log("[aiService] Step 2: Calling AI API at:", AI_API_URL + "/predict");

    // Check GEMINI key is present early so bad env is caught in logs
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.warn("[aiService] ⚠️  GEMINI_API_KEY / GOOGLE_API_KEY not found in env — Gemini step will fail!");
    }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // --- Smart warm-up: poll /health every 5s until alive (max 75s) ---
    // This beats the fixed-sleep approach because:
    //   • If API is already warm, we skip the wait entirely
    //   • If cold, we detect exactly when it's ready (30–60s on Render free tier)
    const WARM_UP_LIMIT_MS = 75000;
    const POLL_INTERVAL_MS = 5000;
    const warmStart = Date.now();
    let apiAlive = false;

    console.log("[aiService] Step 2a: Polling AI API health until alive (max 75s)...");
    while (Date.now() - warmStart < WARM_UP_LIMIT_MS) {
      try {
        await axios.get(`${AI_API_URL}/health`, { timeout: 8000 });
        apiAlive = true;
        console.log(`[aiService] Step 2a OK: AI API alive after ${Math.round((Date.now() - warmStart) / 1000)}s`);
        break;
      } catch (_) {
        const elapsed = Math.round((Date.now() - warmStart) / 1000);
        console.log(`[aiService] Still waiting for AI API... (${elapsed}s elapsed)`);
        await sleep(POLL_INTERVAL_MS);
      }
    }

    if (!apiAlive) {
      throw new Error("AI API did not become available within 75 seconds (Render cold-start timeout)");
    }

    // --- Single predict call (API is confirmed alive) ---
    let pythonResponse;
    try {
      pythonResponse = await axios.post(
        `${AI_API_URL}/predict`,
        formData,
        {
          headers: { ...formData.getHeaders(), "Content-Length": contentLength },
          timeout: 120000  // 120s — generous buffer after API is confirmed alive
        }
      );
    } catch (predictErr) {
      console.error("[aiService] /predict failed:", predictErr.message);
      throw predictErr;
    }


    const pythonResult = pythonResponse.data;
    console.log("[aiService] Step 2 OK — Python ML Result:", pythonResult);

    const isPlant = pythonResult.disease && !pythonResult.disease.includes("Not a Plant");

    // 3️⃣ Return early if not a plant or low confidence
    if (!isPlant || pythonResult.confidence < 0.2 || pythonResult.disease.includes("Healthy")) {
      return {
        disease: pythonResult.disease,
        confidence: pythonResult.confidence,
        is_plant: isPlant,
        treatment: null
      };
    }

    // 4️⃣ Call Gemini for treatment plan
    const diseaseName = pythonResult.disease.replace(/___/g, " - ").replace(/_/g, " ");
    console.log("[aiService] Step 3: Calling Gemini for disease:", diseaseName);

    const systemInstruction = `
      You are an expert Agricultural Pathologist.
      Your job is to provide specific, accurate treatment plans for crop diseases.
      You MUST respond ONLY with valid JSON. Do not return any markdown formatting like \`\`\`json.
      
      Response JSON Format:
      {
        "disease": "<Verified crop and disease name (e.g., Strawberry - Leaf Spot)>",
        "treatment": {
          "organic": "<a brief organic treatment method>",
          "chemical": {
            "name": "<name of the chemical fungicide/pesticide>",
            "dose": "<suggested dosage>"
          },
          "prevention": "<a brief prevention strategy>"
        }
      }
    `;

    const base64Image = imageBuffer.toString("base64");
    const promptText = `The local ML model predicted this crop image belongs to the class: "${diseaseName}".
The ML model is trained on 14 crop disease superclasses: Cotton Disease, Cotton Pest, Cotton Healthy, Wheat Disease, Wheat Healthy, Rice Disease, Maize Disease, Maize Healthy, Sugarcane Disease, Sugarcane Healthy, Tomato Disease, Tomato Healthy, Potato Disease, Potato Healthy.
Please look at the attached image to verify this prediction.
If the prediction looks correct, provide precise treatment for that disease.
If the ML model seems wrong (e.g., the image clearly shows a different crop), identify the correct crop and disease yourself and provide appropriate treatment.
Always return the specific disease name, not just the superclass.`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    console.log("[aiService] Step 3 OK: Gemini responded");
    const geminiText = geminiResponse.text;

    let geminiResult = { treatment: { message: "AI Treatment generation failed." } };
    try {
      const cleanText = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
      geminiResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("[aiService] Failed to parse Gemini JSON:", geminiText);
    }

    const finalDiseaseName = geminiResult.disease || pythonResult.disease;

    return {
      disease: finalDiseaseName,
      confidence: pythonResult.confidence,
      is_plant: pythonResult.is_plant,
      treatment: geminiResult.treatment || geminiResult
    };

  } catch (error) {
    // Log the FULL error so we can see exactly where it failed
    console.error("[aiService] ❌ PIPELINE FAILED at step:");
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

module.exports = callAI;
