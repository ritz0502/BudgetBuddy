// backend/models/InvestLabXP.js
const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  unlockedAt: { type: Date, default: Date.now }
});

const investLabXPSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  xp: { 
    type: Number, 
    default: 0 
  },
  level: { 
    type: Number, 
    default: 1 
  },
  lastActivityDate: { 
    type: Date, 
    default: Date.now 
  },
  streakDays: { 
    type: Number, 
    default: 1 
  },
  longestStreak: { 
    type: Number, 
    default: 1 
  },
  badges: [badgeSchema]
}, { timestamps: true });

module.exports = mongoose.model('InvestLabXP', investLabXPSchema);
