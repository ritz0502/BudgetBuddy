// backend/controllers/budgetController.js
const Budget = require('../models/Budget');
const redis = require('../config/redis');

// ── POST /api/budgets ─────────────────────────────────────────────────────────
// Create or update (upsert) a budget limit for a category + month + year
const upsertBudget = async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;

    if (!category || limit === undefined || !month || !year) {
      return res.status(400).json({ message: 'category, limit, month, and year are required' });
    }

    const numericLimit = Number(limit);
    if (isNaN(numericLimit) || numericLimit < 0) {
      return res.status(400).json({ message: 'limit must be a non-negative number' });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        category,
        month: Number(month),
        year: Number(year),
      },
      {
        limit: numericLimit,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Invalidate Redis summary cache key for this user, month, and year
    const cacheKey = `summary:${req.user._id}:${month}:${year}`;
    await redis.del(cacheKey);

    res.status(200).json(budget);
  } catch (err) {
    console.error('upsertBudget error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/budgets ──────────────────────────────────────────────────────────
// Get all budget limits for the logged-in user for that month
const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'month and year are required' });
    }

    const budgets = await Budget.find({
      userId: req.user._id,
      month: Number(month),
      year: Number(year),
    });

    res.json(budgets);
  } catch (err) {
    console.error('getBudgets error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  upsertBudget,
  getBudgets,
};
