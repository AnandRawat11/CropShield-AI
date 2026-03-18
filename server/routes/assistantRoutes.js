const express = require('express');
const router = express.Router();
const { handleVoiceQuery, handleTextToSpeech } = require('../controllers/assistantController');

// Define route for voice assistant
router.post('/voice', handleVoiceQuery);
router.post('/speak', handleTextToSpeech);

module.exports = router;
