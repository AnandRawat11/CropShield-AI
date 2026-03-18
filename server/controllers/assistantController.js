const { processVoiceAudio, generateElevenLabsAudio } = require('../services/voiceService');

const handleVoiceQuery = async (req, res) => {
  try {
    const { audio, mimeType, location } = req.body;

    if (!audio) {
      return res.status(400).json({ success: false, message: "Audio data is required." });
    }

    const aiResponse = await processVoiceAudio(audio, mimeType || "audio/webm", location);

    res.status(200).json({
      success: true,
      data: {
        transcript: aiResponse.transcript || "Voice note received",
        reply: aiResponse.reply || "I received your voice note, but couldn't generate a specific response."
      }
    });
  } catch (error) {
    console.error("Error in handleVoiceQuery:", error);
    res.status(500).json({ success: false, message: "Failed to process voice request. Please try again later." });
  }
};

const handleTextToSpeech = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required." });
    }

    const audioBuffer = await generateElevenLabsAudio(text);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="speech.mp3"',
    });
    
    res.status(200).send(audioBuffer);
  } catch (error) {
    console.error("Error in handleTextToSpeech:", error);
    res.status(500).json({ success: false, message: "Failed to process text to speech request." });
  }
};

module.exports = {
  handleVoiceQuery,
  handleTextToSpeech
};
