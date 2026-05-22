const express = require('express');
const router = express.Router();
const {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getDailyQuiz,
  getLeaderboard,
  seedQuizzes
} = require('../controllers/quizController');

const { protect } = require('../middleware/authMiddleware');

router.get('/leaderboard', getLeaderboard);
router.get('/daily', getDailyQuiz);

router.post('/submit', protect, submitQuiz);

router.post('/seed', seedQuizzes);
router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);

module.exports = router;