const axios = require('axios');

async function testElevenLabs() {
  const apiKey = "sk_a4c6ea951278a27d715ce4f64d43eac936ca7241cb98d85e";
  const voiceId = "pqHfZKP75CvOlQylNhV4"; 

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      { text: "Test", model_id: "eleven_multilingual_v2" },
      { headers: { 'xi-api-key': apiKey } }
    );
    console.log("Success with pqHfZKP75CvOlQylNhV4");
  } catch (e) {
    console.error("Error with pqHfZKP75CvOlQylNhV4:", e.response ? e.response.data : e.message);
  }
}
testElevenLabs();
