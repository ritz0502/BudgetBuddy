// backend/models/CancelledSubscription.js
const mongoose = require('mongoose');

const cancelledSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  cancelledAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CancelledSubscription', cancelledSubscriptionSchema);
