// backend/routes/budgetRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upsertBudget, getBudgets } = require('../controllers/budgetController');

router.post('/', protect, upsertBudget);
router.get('/', protect, getBudgets);

module.exports = router;
