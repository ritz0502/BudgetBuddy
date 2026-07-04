// backend/routes/predictRoutes.js
const express = require('express');
const router = express.Router();
const { getPredictions } = require('../controllers/predictController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPredictions);

module.exports = router;
