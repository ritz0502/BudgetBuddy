// backend/models/Portfolio.js
const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
    cashBalance: {
      type: Number,
      default: 10000,
    },
    holdings: [holdingSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);
