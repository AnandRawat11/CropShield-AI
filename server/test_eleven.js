const axios = require('axios');

async function testElevenLabs() {
  const apiKey = "sk_a4c6ea951278a27d715ce4f64d43eac936ca7241cb98d85e";
  const voiceId = "21m00Tcm4TlvDq8ikWAM"; 

  try {
    console.log("Sending request to ElevenLabs...");
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: "This is a test message.",
        model_id: "eleven_multilingual_v2",
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
        responseType: 'arraybuffer'
      }
    );
    console.log("Success! Received audio bytes:", response.data.length);
  } catch (error) {
    if (error.response) {
       console.error("ElevenLabs Error:", error.response.status, error.response.data.toString('utf8'));
    } else {
       console.error("Network Error:", error.message);
    }
  }
}

testElevenLabs();
