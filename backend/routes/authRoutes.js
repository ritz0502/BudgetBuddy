// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { signup, login, refresh, logout, getLeaderboard, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { signupValidator, loginValidator } = require('../middleware/validators/authValidators');

router.post('/signup', signupValidator, signup);
router.post('/login', login);

// Refresh token flow
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.get('/leaderboard', getLeaderboard);

module.exports = router;