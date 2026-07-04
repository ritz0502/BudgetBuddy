const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { classifyDescription, submitFeedback } = require('../controllers/classifyController');

router.post('/', protect, classifyDescription);
router.post('/feedback', protect, submitFeedback);

module.exports = router;
