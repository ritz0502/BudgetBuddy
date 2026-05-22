// models/Quiz.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true } // Index of correct option
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'general' },      // e.g. "budgeting", "investing"
  topic: { type: String, default: '' },                // sub-topic within category
  topicOrder: { type: Number, default: 1 },            // sequential topic number (1–6) for progressive unlocking
  seriesOrder: { type: Number, default: 1 },           // order within a topic series
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  xpReward: { type: Number, required: true },
  unlockRequirement: { type: Number, default: 0 },
  isDaily: { type: Boolean, default: false },
  questions: [questionSchema] //gets from questionSchema
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);