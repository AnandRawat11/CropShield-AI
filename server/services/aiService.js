const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const FormData = require('form-data');

/**
 * imageUrl = Cloudinary URL
 */
const callAI = async (imageUrl) => {
  // Initialize Gemini SDK
  // Note: Requires GEMINI_API_KEY in process.env
  const ai = new GoogleGenAI({});

  try {
    // 1️⃣ Get Image Buffer (Handle both local disk paths and Cloudinary URLs)
    let imageBuffer;
    if (imageUrl.startsWith("http")) {
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      imageBuffer = imageResponse.data;
    } else {
      const fs = require('fs');
      imageBuffer = fs.readFileSync(imageUrl);
    }

    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg"
    });

    // Node.js form-data requires explicit stream length when passed via Axios
    const contentLength = await new Promise((resolve, reject) => {
      formData.getLength((err, length) => {
        if (err) return reject(err);
        resolve(length);
      });
    });

    // 2️⃣ Call Local Python Machine Learning Model
    const pythonResponse = await axios.post(
      "http://127.0.0.1:8000/predict",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "Content-Length": contentLength
        },
        timeout: 15000
      }
    );

    const pythonResult = pythonResponse.data;
    console.log("Python ML Result:", pythonResult);

    const isPlant = pythonResult.disease && !pythonResult.disease.includes("Not a Plant");

    // 3️⃣ If the local model says it's not a plant or has low confidence, return immediately
    // to save on unnecessary Gemini API calls.
    if (!isPlant || pythonResult.confidence < 0.2 || pythonResult.disease.includes("Healthy")) {
      return {
        disease: pythonResult.disease,
        confidence: pythonResult.confidence,
        is_plant: isPlant,
        treatment: null // No treatment needed or possible
      };
    }

    // 4️⃣ If disease is detected, ask Gemini to act as an Agricultural Expert for the Treatment Plan
    const diseaseName = pythonResult.disease.replace(/___/g, " - ").replace(/_/g, " ");

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

    console.log(`[aiService] About to call Gemini for disease: ${diseaseName}`);

    const base64Image = imageBuffer.toString("base64");
    const promptText = `The local ML model predicted this crop disease is: ${diseaseName}. 
However, that ML model is ONLY trained on Tomato and Potato plants. 
Please look at the attached image. 
If the plant is INDEED a Tomato or Potato, trust the ML prediction and provide the treatment for ${diseaseName}. 
If the plant is a DIFFERENT crop (e.g., Strawberry, Corn, Apple, etc.), IGNORE the ML model's prediction. Identify the correct crop and its disease from the image yourself, and return that in your JSON response.`;

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

    console.log(`[aiService] Gemini request finished successfully!`);
    const geminiText = geminiResponse.text;
    console.log("Raw Gemini Text:", geminiText);

    let geminiResult = { treatment: { message: "AI Treatment generation failed." } };
    try {
      // Strip markdown codeblocks just in case Gemini ignored the prompt
      const cleanText = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
      geminiResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON. Raw output was:", geminiText);
    }

    console.log("Gemini Treatment Result:", geminiResult);

    // 5️⃣ Merge Local ML Disease Prediction with Gemini Treatment Generation
    // If Gemini identified a different crop, override the disease name.
    const finalDiseaseName = geminiResult.disease || pythonResult.disease;

    return {
      disease: finalDiseaseName,
      confidence: pythonResult.confidence,
      is_plant: pythonResult.is_plant,
      treatment: geminiResult.treatment || geminiResult // some models wrap it differently
    };

  } catch (error) {
    console.error("Hybrid AI Pipeline Error Message:", error.message);
    if (error.response) {
      console.error("HTTP Response Error Data:", error.response.data);
    }
    throw new Error("Failed to process image with the Hybrid ML+AI pipeline");
  }
};

module.exports = callAI;
