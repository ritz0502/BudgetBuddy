// backend/models/PortfolioSnapshot.js
const mongoose = require('mongoose');

const portfolioSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  portfolioValue: {
    type: Number,
    required: true,
  },
  cashBalance: {
    type: Number,
    required: true,
  },
  holdingsValue: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient per-user time-series queries (future analytics)
portfolioSnapshotSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);
