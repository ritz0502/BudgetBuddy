const mongoose = require('mongoose');

const classifierFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  suggestedCategory: {
    type: String,
  },
  actualCategory: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000, // 90 days in seconds (90 * 24 * 60 * 60)
  },
});

module.exports = mongoose.model('ClassifierFeedback', classifierFeedbackSchema);
