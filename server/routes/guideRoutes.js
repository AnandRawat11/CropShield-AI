const express = require('express');
const router = express.Router();
const { getPersonalizedGuide } = require('../controllers/guideController');

router.post('/personalized', getPersonalizedGuide);

module.exports = router;
