const axios = require('axios');
const ClassifierFeedback = require('../models/ClassifierFeedback');

// ── POST /api/classify ────────────────────────────────────────────────────────
const classifyDescription = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length < 2) {
      return res.json({ category: null, confidence: 0 });
    }

    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/classify`, {
        description: description.trim(),
      }, { timeout: 3000 }); // 3 second timeout

      return res.json({
        category: mlResponse.data.category,
        confidence: mlResponse.data.confidence,
      });
    } catch (mlError) {
      console.error('[ML Service Error]:', mlError.message);
      // Fallback response if ML service is unreachable
      return res.json({
        category: 'Other',
        confidence: 0,
        fallback: true,
      });
    }
  } catch (err) {
    console.error('classifyDescription error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/classify/feedback ───────────────────────────────────────────────
const submitFeedback = async (req, res) => {
  try {
    const { description, suggestedCategory, actualCategory } = req.body;

    if (!description || !actualCategory) {
      return res.status(400).json({ message: 'description and actualCategory are required' });
    }

    await ClassifierFeedback.create({
      userId: req.user._id,
      description: description.trim(),
      suggestedCategory,
      actualCategory,
    });

    res.json({ saved: true });
  } catch (err) {
    console.error('submitFeedback error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  classifyDescription,
  submitFeedback,
};
