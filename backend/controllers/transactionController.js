// backend/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const CancelledSubscription = require('../models/CancelledSubscription');
const redis = require('../config/redis');
const { extractReceiptData } = require('../services/ocrService');
const { detectSubscriptions } = require('../services/subscriptionService');
const { checkBudgetAlerts } = require('../services/alertService');

// ── helpers ──────────────────────────────────────────────────────────────────

/** Delete all Redis summary keys for a user + month/year combo */
const invalidateSummaryCache = async (userId, date) => {
  const d = date ? new Date(date) : new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  await redis.del(`summary:${userId}:${month}:${year}`);
};

/** Delete the monthly-overview cache for a user */
const invalidateOverviewCache = async (userId) => {
  await redis.del(`overview:${userId}`);
};

/** Delete the subscriptions cache for a user */
const invalidateSubscriptionsCache = async (userId) => {
  await redis.del(`subscriptions:${userId}`);
};

// ── POST /api/transactions ────────────────────────────────────────────────────
const createTransaction = async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'type, amount and category are required' });
    }

    const receiptUrl = req.file ? req.file.path : null;

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount: Number(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      receiptUrl,
    });

    let ocrData = null;
    if (receiptUrl) {
      console.log('[CTRL] Receipt URL found, calling OCR:', receiptUrl);
      ocrData = await extractReceiptData(receiptUrl);
      console.log('[CTRL] OCR returned:', JSON.stringify(ocrData ? { amount: ocrData.amount, merchant: ocrData.merchant, date: ocrData.date, confidence: ocrData.confidence } : null));
      if (ocrData) {
        let changed = false;
        if (ocrData.amount) {
          console.log('[CTRL] Updating amount from', transaction.amount, 'to', ocrData.amount);
          transaction.amount = ocrData.amount;
          changed = true;
        }
        if (ocrData.merchant) {
          transaction.description = ocrData.merchant;
          changed = true;
        }
        if (ocrData.date) {
          const d = new Date(ocrData.date);
          if (!isNaN(d.valueOf())) {
            transaction.date = d;
            changed = true;
          }
        }
        if (changed) {
          await transaction.save();
          console.log('[CTRL] Transaction saved with OCR data. Amount:', transaction.amount);
        }
      }
    }

    // Invalidate caches
    await invalidateSummaryCache(req.user._id, transaction.date);
    await invalidateOverviewCache(req.user._id);
    await invalidateSubscriptionsCache(req.user._id);
    await redis.del(`predict:${req.user._id}`);

    // Fire budget alerts check non-blocking (fire-and-forget)
    const txDate = new Date(transaction.date);
    checkBudgetAlerts(req.user._id, txDate.getMonth() + 1, txDate.getFullYear())
      .catch((err) => console.error('[ALERT] checkBudgetAlerts (create) error:', err));

    res.status(201).json({ transaction, ocrData });
  } catch (err) {
    console.error('createTransaction error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/transactions ─────────────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { month, year, type, category, limit } = req.query;

    const query = { userId: req.user._id };

    // Date range filter
    if (month || year) {
      const now = new Date();
      const m = parseInt(month) || now.getMonth() + 1;
      const y = parseInt(year) || now.getFullYear();
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      query.date = { $gte: start, $lt: end };
    }

    if (type) query.type = type;
    if (category) query.category = category;

    let dbQuery = Transaction.find(query).sort({ date: -1 });
    if (limit) dbQuery = dbQuery.limit(parseInt(limit));

    const transactions = await dbQuery.exec();
    res.json(transactions);
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /api/transactions/:id ─────────────────────────────────────────────────
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const oldDate = transaction.date;
    const { type, amount, category, description, date, removeReceipt } = req.body;

    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (req.file) transaction.receiptUrl = req.file.path;
    else if (removeReceipt === 'true') transaction.receiptUrl = null;

    await transaction.save();

    // Invalidate caches for both old and new dates
    await invalidateSummaryCache(req.user._id, oldDate);
    await invalidateSummaryCache(req.user._id, transaction.date);
    await invalidateOverviewCache(req.user._id);
    await invalidateSubscriptionsCache(req.user._id);
    await redis.del(`predict:${req.user._id}`);

    // Fire budget alerts check non-blocking (fire-and-forget)
    const txDateU = new Date(transaction.date);
    checkBudgetAlerts(req.user._id, txDateU.getMonth() + 1, txDateU.getFullYear())
      .catch((err) => console.error('[ALERT] checkBudgetAlerts (update) error:', err));

    res.json(transaction);
  } catch (err) {
    console.error('updateTransaction error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const txDate = transaction.date;
    await transaction.deleteOne();

    // Invalidate caches
    await invalidateSummaryCache(req.user._id, txDate);
    await invalidateOverviewCache(req.user._id);
    await invalidateSubscriptionsCache(req.user._id);

    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('deleteTransaction error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/transactions/summary?month=5&year=2026 ───────────────────────────
const getMonthlySummary = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const cacheKey = `summary:${req.user._id}:${month}:${year}`;

    // Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const pipeline = [
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          byCategory: {
            $push: { category: '$category', amount: '$amount' },
          },
        },
      },
    ];

    const results = await Transaction.aggregate(pipeline);

    // Category breakdown (expenses only)
    const categoryPipeline = [
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lt: end },
          type: 'expense',
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
        },
      },
    ];

    const categoryBreakdown = await Transaction.aggregate(categoryPipeline);

    // Fetch user budgets for this month/year
    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year,
    });

    const budgetMap = new Map();
    budgets.forEach((b) => {
      budgetMap.set(b.category, b.limit);
    });

    const breakdownMap = new Map();

    // 1. Process categoryBreakdown from aggregate (categories with transactions)
    categoryBreakdown.forEach((item) => {
      const limit = budgetMap.get(item.category) ?? null;
      let percentUsed = null;
      if (limit !== null) {
        percentUsed = Number(((item.total / limit) * 100).toFixed(1));
      }
      breakdownMap.set(item.category, {
        category: item.category,
        total: item.total,
        limit,
        percentUsed,
      });
    });

    // 2. Process budgets that don't have any transaction total yet
    budgets.forEach((b) => {
      if (!breakdownMap.has(b.category)) {
        breakdownMap.set(b.category, {
          category: b.category,
          total: 0,
          limit: b.limit,
          percentUsed: 0.0,
        });
      }
    });

    const enrichedBreakdown = Array.from(breakdownMap.values()).sort(
      (a, b) => b.total - a.total
    );

    let totalIncome = 0;
    let totalExpenses = 0;

    results.forEach((r) => {
      if (r._id === 'income') totalIncome = r.total;
      if (r._id === 'expense') totalExpenses = r.total;
    });

    const summary = {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      categoryBreakdown: enrichedBreakdown,
    };

    // Cache result for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(summary));

    res.json(summary);
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/transactions/monthly-overview ────────────────────────────────────
const getMonthlyOverview = async (req, res) => {
  try {
    const cacheKey = `overview:${req.user._id}`;

    // Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Last 6 months from current month
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const pipeline = [
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ];

    const results = await Transaction.aggregate(pipeline);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build last 6 months array — fill zeros for months with no data
    const overview = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const found = results.find((r) => r._id.month === m && r._id.year === y);
      overview.push({
        month: monthNames[d.getMonth()],
        total: found ? found.total : 0,
      });
    }

    // Reverse to get chronological order (oldest → newest)
    // The loop already builds oldest→newest, so no reverse needed

    // Cache for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(overview));

    res.json(overview);
  } catch (err) {
    console.error('getMonthlyOverview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/transactions/subscriptions ──────────────────────────────────────
const getSubscriptions = async (req, res) => {
  try {
    const cacheKey = `subscriptions:${req.user._id}`;

    // Check Redis cache (TTL 24h)
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await detectSubscriptions(req.user._id);

    await redis.setex(cacheKey, 86400, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    console.error('getSubscriptions error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PATCH /api/transactions/subscriptions/cancel ─────────────────────────────
const cancelSubscription = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'description is required' });
    }

    // Upsert: avoid duplicate cancelled records for the same description+user
    await CancelledSubscription.findOneAndUpdate(
      { userId: req.user._id, description: description.toLowerCase().trim() },
      { userId: req.user._id, description: description.toLowerCase().trim(), cancelledAt: new Date() },
      { upsert: true, new: true }
    );

    // Invalidate subscriptions cache so next GET reflects the cancellation
    await invalidateSubscriptionsCache(req.user._id);

    res.json({ message: 'Subscription marked as cancelled' });
  } catch (err) {
    console.error('cancelSubscription error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getMonthlyOverview,
  getSubscriptions,
  cancelSubscription,
};
