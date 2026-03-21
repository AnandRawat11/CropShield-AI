const { GoogleGenAI } = require('@google/genai');
const { getWeatherContext } = require('./weatherService');
const axios = require('axios');

const processVoiceAudio = async (base64Audio, mimeType = "audio/webm", location = null, isFirstInteraction = false) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("AI assistant is temporarily unavailable (API key missing).");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  console.log(`[voiceService] isFirstInteraction: ${isFirstInteraction}`);

  let weatherContext = "";
  if (location && location.latitude && location.longitude) {
    const weatherInfo = await getWeatherContext(location.latitude, location.longitude);
    if (weatherInfo) {
      weatherContext = `\nReal-time Context:\nUser is at Latitude: ${location.latitude}, Longitude: ${location.longitude}.\n${weatherInfo}\n`;
      console.log("[voiceService] Fetched weather context:", weatherInfo);
    }
  }

  const systemInstruction = `
You are the CropShield AI Voice Assistant.
You are an expert in agriculture, crop health, weather impacts on farming, and soil management.
You are a helpful male assistant.
Your users are farmers in India, many of whom may have low literacy.
Listen to the user's spoken audio.
Respond with a strictly formatted JSON object containing two fields:
{
  "transcript": "What the user said in their language",
  "reply": "Your agricultural advice"
}

Rules for the 'reply':
1. Extremely simple and easy to understand when spoken out loud.
2. Direct and actionable. Use the weather/location context if provided and relevant.
3. Conversational and polite.
4. Keep the response under 3-4 short sentences.
5. Do NOT use markdown (no asterisks, hash signs, bullet points).
6. Reply in the same language the user spoke in.
7. CRITICAL: Use masculine grammar/tone (e.g., in Hindi use "sakta hu" instead of "sakti hu") as your voice is male.
8. ${isFirstInteraction ? 'You may greet the farmer warmly at the start of your reply.' : 'IMPORTANT: Do NOT greet or say Namaste or any salutation — the farmer already knows you. Jump straight to answering the question.'}
${weatherContext}
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { text: "Please process this voice request." },
          { inlineData: { data: base64Audio, mimeType: mimeType } }
        ]
      }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    let jsonResult;
    try {
      jsonResult = JSON.parse(response.text.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (e) {
      console.error("Failed to parse JSON from Gemini voice:", response.text);
      return { transcript: "Audio received", reply: response.text.replace(/[*#_`]/g, "") };
    }
    
    // Strip trailing markdown from reply just in case
    jsonResult.reply = jsonResult.reply.replace(/[*#_`]/g, "");
    
    return jsonResult;
  } catch (error) {
    console.error("[voiceService] Error querying Gemini audio:", error);
    throw new Error("Failed to process voice query with AI.");
  }
};

const generateElevenLabsAudio = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID; 

  if (!apiKey || !voiceId) {
    throw new Error("ElevenLabs credentials are not configured in the backend environment.");
  }
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: "eleven_flash_v2_5", // Optimized for low latency while supporting multilingual (Hindi/English)
        speed: 1.15, // Slightly faster than default (1.0), range: 0.7–1.2
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer' // crucial for returning binary data
      }
    );
    return response.data;
  } catch (error) {
    console.error("[voiceService] Error generating ElevenLabs audio:", error.response ? error.response.data.toString('utf8') : error.message);
    throw new Error("Failed to generate audio from ElevenLabs");
  }
};

module.exports = {
  processVoiceAudio,
  generateElevenLabsAudio
};
