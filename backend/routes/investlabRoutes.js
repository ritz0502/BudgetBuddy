// backend/routes/investlabRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getReadiness,
  getPortfolio,
  buyStock,
  sellStock,
  getTrades,
  getAICoach,
  getProjection,
  getAllocation,
  getPerformance,
  getPortfolioHealth,
  getXP,
  getAchievements,
  getStreak,
  postActivity
} = require('../controllers/investlabController');

// All InvestLab routes are protected by JWT middleware
router.use(protect);

router.get('/readiness', getReadiness);
router.get('/portfolio', getPortfolio);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/trades', getTrades);

// Day 3 endpoints
router.get('/ai-coach', getAICoach);
router.post('/projection', getProjection);
router.get('/allocation', getAllocation);
router.get('/performance', getPerformance);
router.get('/portfolio-health', getPortfolioHealth);

// Day 4 endpoints
router.get('/xp', getXP);
router.get('/achievements', getAchievements);
router.get('/streak', getStreak);
router.post('/activity', postActivity);

module.exports = router;
