// backend/services/alertService.js
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Check budget usage for a given user/month/year and create
 * budget_warning (>=80%) or budget_exceeded (>=100%) notifications
 * if they don't already exist for that category+month+year combo.
 *
 * @param {string|ObjectId} userId
 * @param {number} month  1-12
 * @param {number} year
 * @returns {Promise<number>} count of new notifications created
 */
const checkBudgetAlerts = async (userId, month, year) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Fetch budgets for this user/month/year
  const budgets = await Budget.find({ userId: userObjectId, month, year });
  if (!budgets.length) return 0;

  // Fetch category spending totals for this month/year
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const categoryPipeline = [
    {
      $match: {
        userId: userObjectId,
        type: 'expense',
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
  ];

  const categoryTotals = await Transaction.aggregate(categoryPipeline);
  const spendMap = new Map(categoryTotals.map((c) => [c._id, c.total]));

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  let created = 0;

  for (const budget of budgets) {
    const spent = spendMap.get(budget.category) || 0;
    const percentUsed = (spent / budget.limit) * 100;

    if (percentUsed >= 100) {
      // Check if a budget_exceeded notification already exists for this category+month+year
      const exists = await Notification.findOne({
        userId: userObjectId,
        type: 'budget_exceeded',
        category: budget.category,
        // Check within the same month/year window
        createdAt: { $gte: start, $lt: end },
      });

      if (!exists) {
        await Notification.create({
          userId: userObjectId,
          type: 'budget_exceeded',
          message: `You've exceeded your ${budget.category} budget for ${monthLabel}`,
          category: budget.category,
        });
        created++;
      }
    } else if (percentUsed >= 80) {
      // Check if a budget_warning notification already exists for this category+month+year
      const exists = await Notification.findOne({
        userId: userObjectId,
        type: 'budget_warning',
        category: budget.category,
        createdAt: { $gte: start, $lt: end },
      });

      if (!exists) {
        await Notification.create({
          userId: userObjectId,
          type: 'budget_warning',
          message: `You're at ${Math.round(percentUsed)}% of your ${budget.category} budget for ${monthLabel}`,
          category: budget.category,
        });
        created++;
      }
    }
  }

  return created;
};

module.exports = { checkBudgetAlerts };
