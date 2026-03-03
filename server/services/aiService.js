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

    const pythonResponse = await axios.post(
      `${AI_API_URL}/predict`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "Content-Length": contentLength
        },
        timeout: 60000  // 60s — Render free tier may cold-start
      }
    );

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
