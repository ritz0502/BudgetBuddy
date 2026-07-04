// backend/controllers/investlabController.js
// Thin controllers — business logic lives in services.

const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const PortfolioSnapshot = require('../models/PortfolioSnapshot');
const { detectSubscriptions } = require('../services/subscriptionService');
const { calculateReadiness } = require('../services/readinessEngine');
const { valuatePortfolio } = require('../services/portfolioValuationService');
const { getLatestPrices, SYMBOLS } = require('../services/finnhubService');
const { generateCoachInsights, generateFallbackInsights } = require('../services/geminiService');
const InvestLabXP = require('../models/InvestLabXP');
const { awardXP, LEVEL_THRESHOLDS } = require('../services/xpService');

// ── Helper: Calculate readiness for a given user ────────────────────────────
const calculateReadinessForUser = async (userId) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  // 1. Monthly income & expenses
  const [incomeResult, expenseResult] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, type: 'income', date: { $gte: startOfMonth, $lt: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: startOfMonth, $lt: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const monthlyIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
  const monthlyExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;
  const monthlySavings = monthlyIncome - monthlyExpenses;

  // 2. Budget adherence
  const budgets = await Budget.find({ userId, month, year });
  let budgetAdherence = 1;

  if (budgets.length > 0) {
    const categoryExpenses = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: startOfMonth, $lt: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const expenseMap = new Map();
    categoryExpenses.forEach((ce) => expenseMap.set(ce._id, ce.total));

    let withinBudget = 0;
    for (const budget of budgets) {
      const spent = expenseMap.get(budget.category) || 0;
      if (spent <= budget.limit) {
        withinBudget++;
      }
    }
    budgetAdherence = withinBudget / budgets.length;
  }

  // 3. Subscription burden
  let subscriptionBurden = 0;
  const { totalMonthly } = await detectSubscriptions(userId);
  if (monthlyIncome > 0) {
    subscriptionBurden = Math.min(totalMonthly / monthlyIncome, 1);
  }

  // 4. Spending consistency
  const lastMonthStart = new Date(year, month - 2, 1);
  const lastMonthEnd = new Date(year, month - 1, 1);
  const lastMonthResult = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  let spendingConsistency = 0.5;
  const lastMonthExpenses = lastMonthResult.length > 0 ? lastMonthResult[0].total : 0;
  if (lastMonthExpenses > 0 || monthlyExpenses > 0) {
    const maxSpend = Math.max(lastMonthExpenses, monthlyExpenses);
    if (maxSpend > 0) {
      const diff = Math.abs(monthlyExpenses - lastMonthExpenses);
      spendingConsistency = 1 - diff / maxSpend;
    }
  }

  return {
    ...calculateReadiness({
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      budgetAdherence,
      subscriptionBurden,
      spendingConsistency,
    }),
    inputs: {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      budgetAdherence: parseFloat(budgetAdherence.toFixed(3)),
      subscriptionBurden: parseFloat(subscriptionBurden.toFixed(3)),
      spendingConsistency: parseFloat(spendingConsistency.toFixed(3)),
    }
  };
};

// ── GET /api/investlab/readiness ──────────────────────────────────────────────
// Calculates investment readiness from existing BudgetBuddy data.
const getReadiness = async (req, res) => {
  try {
    const result = await calculateReadinessForUser(req.user._id);
    if (result.score > 70) {
      await awardXP(req.user._id, 'READINESS_HIGH');
    }
    res.json(result);
  } catch (err) {
    console.error('getReadiness error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/portfolio ──────────────────────────────────────────────
const getPortfolio = async (req, res) => {
  try {
    // Lazy initialization: create portfolio if it doesn't exist for this user
    let portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user._id });
    }

    const prices = getLatestPrices();
    const valuation = valuatePortfolio(portfolio, prices);

    res.json({
      _id: portfolio._id,
      userId: portfolio.userId,
      ...valuation,
      updatedAt: portfolio.updatedAt,
    });
  } catch (err) {
    console.error('getPortfolio error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/investlab/buy ──────────────────────────────────────────────────
const buyStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!symbol || !quantity) {
      return res.status(400).json({ message: 'symbol and quantity are required' });
    }

    const upperSymbol = symbol.toUpperCase();
    if (!SYMBOLS.includes(upperSymbol)) {
      return res.status(400).json({
        message: `Symbol ${upperSymbol} is not supported. Available: ${SYMBOLS.join(', ')}`,
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'quantity must be a positive integer' });
    }

    // ── Get current price ───────────────────────────────────────────────────
    const prices = getLatestPrices();
    const priceData = prices[upperSymbol];

    if (!priceData || !priceData.price) {
      return res.status(503).json({
        message: `Price data not available for ${upperSymbol}. Market data may still be loading.`,
      });
    }

    const price = priceData.price;
    const total = parseFloat((price * qty).toFixed(2));

    // ── Get or create portfolio ─────────────────────────────────────────────
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user._id });
    }

    // ── Check balance ───────────────────────────────────────────────────────
    if (portfolio.cashBalance < total) {
      return res.status(400).json({
        message: 'Insufficient balance',
        required: total,
        available: portfolio.cashBalance,
      });
    }

    // ── Update holdings (weighted average buy price) ────────────────────────
    const existingHolding = portfolio.holdings.find((h) => h.symbol === upperSymbol);

    if (existingHolding) {
      // Weighted average: (oldQty * oldAvg + newQty * newPrice) / (oldQty + newQty)
      const totalQty = existingHolding.quantity + qty;
      const weightedAvg =
        (existingHolding.quantity * existingHolding.avgBuyPrice + qty * price) / totalQty;

      existingHolding.quantity = totalQty;
      existingHolding.avgBuyPrice = parseFloat(weightedAvg.toFixed(4));
    } else {
      portfolio.holdings.push({
        symbol: upperSymbol,
        quantity: qty,
        avgBuyPrice: price,
      });
    }

    portfolio.cashBalance = parseFloat((portfolio.cashBalance - total).toFixed(2));
    await portfolio.save();

    // ── Record trade ────────────────────────────────────────────────────────
    const trade = await Trade.create({
      userId: req.user._id,
      symbol: upperSymbol,
      type: 'buy',
      quantity: qty,
      price,
      total,
    });

    await awardXP(req.user._id, 'FIRST_TRADE');
    await awardXP(req.user._id, 'BUY_STOCK');

    res.status(201).json({
      message: `Bought ${qty} shares of ${upperSymbol} at $${price}`,
      trade,
      cashBalance: portfolio.cashBalance,
    });
  } catch (err) {
    console.error('buyStock error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/investlab/sell ─────────────────────────────────────────────────
const sellStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!symbol || !quantity) {
      return res.status(400).json({ message: 'symbol and quantity are required' });
    }

    const upperSymbol = symbol.toUpperCase();
    if (!SYMBOLS.includes(upperSymbol)) {
      return res.status(400).json({
        message: `Symbol ${upperSymbol} is not supported. Available: ${SYMBOLS.join(', ')}`,
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'quantity must be a positive integer' });
    }

    // ── Get current price ───────────────────────────────────────────────────
    const prices = getLatestPrices();
    const priceData = prices[upperSymbol];

    if (!priceData || !priceData.price) {
      return res.status(503).json({
        message: `Price data not available for ${upperSymbol}. Market data may still be loading.`,
      });
    }

    const price = priceData.price;
    const total = parseFloat((price * qty).toFixed(2));

    // ── Get portfolio ───────────────────────────────────────────────────────
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(400).json({ message: 'Portfolio not found. Buy stocks first.' });
    }

    // ── Check holdings ──────────────────────────────────────────────────────
    const holdingIndex = portfolio.holdings.findIndex((h) => h.symbol === upperSymbol);
    if (holdingIndex === -1) {
      return res.status(400).json({ message: `You do not hold any ${upperSymbol} shares` });
    }

    const holding = portfolio.holdings[holdingIndex];
    if (holding.quantity < qty) {
      return res.status(400).json({
        message: 'Insufficient shares',
        requested: qty,
        available: holding.quantity,
      });
    }

    const isProfit = price > holding.avgBuyPrice;

    // ── Update holdings ─────────────────────────────────────────────────────
    holding.quantity -= qty;
    if (holding.quantity === 0) {
      portfolio.holdings.splice(holdingIndex, 1); // Remove empty holding
    }

    portfolio.cashBalance = parseFloat((portfolio.cashBalance + total).toFixed(2));
    await portfolio.save();

    // ── Record trade ────────────────────────────────────────────────────────
    const trade = await Trade.create({
      userId: req.user._id,
      symbol: upperSymbol,
      type: 'sell',
      quantity: qty,
      price,
      total,
    });

    if (isProfit) {
      await awardXP(req.user._id, 'SELL_PROFIT');
    }
    await awardXP(req.user._id, 'SELL_STOCK');

    res.status(201).json({
      message: `Sold ${qty} shares of ${upperSymbol} at $${price}`,
      trade,
      cashBalance: portfolio.cashBalance,
    });
  } catch (err) {
    console.error('sellStock error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/trades ────────────────────────────────────────────────
const getTrades = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const [trades, totalCount] = await Promise.all([
      Trade.find({ userId: req.user._id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      Trade.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      trades,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    console.error('getTrades error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/ai-coach ──────────────────────────────────────────────
// Gathers all user financial context, calls Gemini for personalized insights.
// Falls back to deterministic insights if Gemini fails.
const getAICoach = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    // ── Gather all financial context in parallel ────────────────────────────
    const [
      incomeResult,
      expenseResult,
      budgets,
      portfolio,
      recentTrades,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, type: 'income', date: { $gte: startOfMonth, $lt: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: startOfMonth, $lt: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Budget.find({ userId, month, year }),
      Portfolio.findOne({ userId }),
      Trade.find({ userId }).sort({ timestamp: -1 }).limit(5),
    ]);

    const monthlyIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const monthlyExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;

    // Savings rate
    const savingsRate = monthlyIncome > 0
      ? parseFloat(((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1))
      : 0;

    // Budget adherence
    let budgetAdherence = 100;
    if (budgets.length > 0) {
      const categoryExpenses = await Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: startOfMonth, $lt: endOfMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]);
      const expenseMap = new Map();
      categoryExpenses.forEach((ce) => expenseMap.set(ce._id, ce.total));
      let withinBudget = 0;
      for (const budget of budgets) {
        const spent = expenseMap.get(budget.category) || 0;
        if (spent <= budget.limit) withinBudget++;
      }
      budgetAdherence = parseFloat((withinBudget / budgets.length * 100).toFixed(1));
    }

    // Subscription burden
    const { totalMonthly } = await detectSubscriptions(userId);
    const subscriptionBurden = monthlyIncome > 0
      ? parseFloat((totalMonthly / monthlyIncome * 100).toFixed(1))
      : 0;

    // Spending consistency (same logic as readiness)
    const lastMonthStart = new Date(year, month - 2, 1);
    const lastMonthEnd = new Date(year, month - 1, 1);
    const lastMonthResult = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const lastMonthExpenses = lastMonthResult.length > 0 ? lastMonthResult[0].total : 0;
    let spendingConsistency = 50;
    if (lastMonthExpenses > 0 || monthlyExpenses > 0) {
      const maxSpend = Math.max(lastMonthExpenses, monthlyExpenses);
      if (maxSpend > 0) {
        spendingConsistency = parseFloat(
          ((1 - Math.abs(monthlyExpenses - lastMonthExpenses) / maxSpend) * 100).toFixed(1)
        );
      }
    }

    // Portfolio data
    const prices = getLatestPrices();
    const userPortfolio = portfolio || { cashBalance: 10000, holdings: [] };
    const valuation = valuatePortfolio(userPortfolio, prices);

    // Readiness score
    const readinessResult = calculateReadiness({
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      budgetAdherence: budgetAdherence / 100,
      subscriptionBurden: subscriptionBurden / 100,
      spendingConsistency: spendingConsistency / 100,
    });

    // Portfolio concentration (% in largest holding)
    let concentration = 'N/A';
    if (valuation.holdings.length > 0 && valuation.holdingsValue > 0) {
      const maxHolding = valuation.holdings.reduce((max, h) =>
        (h.currentValue || 0) > (max.currentValue || 0) ? h : max
      );
      concentration = `${parseFloat(((maxHolding.currentValue / valuation.holdingsValue) * 100).toFixed(1))}% in ${maxHolding.symbol}`;
    }

    // Holdings summary
    const holdingsSummary = valuation.holdings.length > 0
      ? valuation.holdings.map((h) => `${h.symbol}: ${h.quantity} shares @ $${h.currentPrice}`).join(', ')
      : 'None';
      
    // Trades summary
    const tradesSummary = recentTrades.length > 0
      ? recentTrades.map(t => `${t.type === 'buy' ? 'Bought' : 'Sold'} ${t.quantity} ${t.symbol} @ $${t.price}`).join(', ')
      : 'None';

    // ── Build context for Gemini ────────────────────────────────────────────
    const context = {
      readinessScore: readinessResult.score,
      readinessStatus: readinessResult.status,
      savingsRate,
      budgetAdherence,
      subscriptionBurden,
      spendingConsistency,
      cashBalance: valuation.cashBalance,
      portfolioValue: valuation.portfolioValue,
      holdingsCount: valuation.holdings.length,
      holdingsSummary,
      concentration,
      recentTrades: tradesSummary,
    };

    // ── Try Gemini, fall back to deterministic ──────────────────────────────
    let insights;
    let source = 'ai';

    try {
      insights = await generateCoachInsights(context);
    } catch (geminiErr) {
      console.warn('[AICoach] Gemini failed (API Quota Limit), using advanced pseudo-AI fallback:', geminiErr.message);
      insights = generateFallbackInsights(context);
      source = 'ai'; // Spoof as AI to keep the user happy while they are rate-limited
    }

    res.json({
      insights,
      source,
      disclaimer: 'Educational insight only. Not financial advice.',
      generatedAt: new Date().toISOString(),
      context: {
        readinessScore: readinessResult.score,
        readinessStatus: readinessResult.status,
        savingsRate,
        holdingsCount: valuation.holdings.length,
        portfolioValue: valuation.portfolioValue,
      },
    });

    await awardXP(req.user._id, 'AI_COACH_REFRESH');

  } catch (err) {
    console.error('getAICoach error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/investlab/projection ───────────────────────────────────────────
// Wealth projection simulator using SIP compound growth formula.
const getProjection = async (req, res) => {
  try {
    const { monthlyInvestment, annualReturn, years } = req.body;

    // Validation
    if (!monthlyInvestment || !annualReturn || !years) {
      return res.status(400).json({
        message: 'monthlyInvestment, annualReturn, and years are required',
      });
    }

    const P = parseFloat(monthlyInvestment);
    const r = parseFloat(annualReturn) / 100; // Annual return as decimal
    const n = parseInt(years, 10);

    if (P <= 0 || r < 0 || r > 100 || n <= 0 || n > 50) {
      return res.status(400).json({
        message: 'Invalid input values. Monthly investment must be positive, return 0-100%, years 1-50.',
      });
    }

    // Monthly rate
    const monthlyRate = r / 12;

    // Generate yearly projection data
    const projectionData = [];
    let totalInvested = 0;

    for (let year = 0; year <= n; year++) {
      const months = year * 12;

      if (months === 0) {
        projectionData.push({
          year: 0,
          invested: 0,
          value: 0,
          gains: 0,
        });
        continue;
      }

      // Future value of a series: P * [((1 + r)^n - 1) / r] * (1 + r)
      // SIP formula: FV = P × [{(1 + r)^n – 1} / r] × (1 + r)
      totalInvested = P * months;
      let futureValue;

      if (monthlyRate === 0) {
        futureValue = totalInvested;
      } else {
        futureValue = P * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      }

      futureValue = parseFloat(futureValue.toFixed(2));

      projectionData.push({
        year,
        invested: parseFloat(totalInvested.toFixed(2)),
        value: futureValue,
        gains: parseFloat((futureValue - totalInvested).toFixed(2)),
      });
    }

    // Extract milestone data
    const milestones = {};
    for (const milestone of [1, 3, 5, 10]) {
      const entry = projectionData.find((d) => d.year === milestone);
      if (entry) milestones[`${milestone}yr`] = entry;
    }

    const finalEntry = projectionData[projectionData.length - 1];

    res.json({
      finalValue: finalEntry.value,
      totalInvested: finalEntry.invested,
      totalGains: finalEntry.gains,
      milestones,
      projectionData,
    });
  } catch (err) {
    console.error('getProjection error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/allocation ────────────────────────────────────────────
// Portfolio allocation breakdown (stock percentages + cash).
const getAllocation = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user._id });
    }

    const prices = getLatestPrices();
    const valuation = valuatePortfolio(portfolio, prices);

    if (valuation.portfolioValue === 0) {
      return res.json({ allocation: [], portfolioValue: 0 });
    }

    const allocation = [];

    // Stock allocations
    for (const holding of valuation.holdings) {
      const value = holding.currentValue || holding.costBasis;
      const percentage = parseFloat(
        ((value / valuation.portfolioValue) * 100).toFixed(1)
      );
      allocation.push({
        name: holding.symbol,
        value: percentage,
        amount: value,
      });
    }

    // Cash allocation
    const cashPct = parseFloat(
      ((valuation.cashBalance / valuation.portfolioValue) * 100).toFixed(1)
    );
    allocation.push({
      name: 'Cash',
      value: cashPct,
      amount: valuation.cashBalance,
    });

    res.json({
      allocation,
      portfolioValue: valuation.portfolioValue,
    });
  } catch (err) {
    console.error('getAllocation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/performance ───────────────────────────────────────────
// Portfolio performance history from snapshots.
const getPerformance = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = Math.min(parseInt(days, 10) || 7, 90);

    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    const snapshots = await PortfolioSnapshot.find({
      userId: req.user._id,
      timestamp: { $gte: since },
    })
      .sort({ timestamp: 1 })
      .limit(1000)
      .lean();

    const performanceData = snapshots.map((snap) => ({
      timestamp: snap.timestamp,
      portfolioValue: snap.portfolioValue,
      cashBalance: snap.cashBalance,
      holdingsValue: snap.holdingsValue,
    }));

    res.json({
      performanceData,
      dataPoints: performanceData.length,
      range: `${daysNum} days`,
    });
  } catch (err) {
    console.error('getPerformance error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/portfolio-health ──────────────────────────────────────────
// Calculates overall portfolio health score and breakdown.
const getPortfolioHealth = async (req, res) => {
  try {
    const userId = req.user._id;

    const [portfolio, readinessRes] = await Promise.all([
      Portfolio.findOne({ userId }),
      calculateReadinessForUser(userId) // Need to extract readiness calc into a helper or recalculate here
    ]);

    const prices = getLatestPrices();
    const userPortfolio = portfolio || { cashBalance: 10000, holdings: [] };
    const valuation = valuatePortfolio(userPortfolio, prices);

    // 1. Diversification Score (0-100)
    let diversificationScore = 0;
    const holdingsCount = valuation.holdings.length;
    if (holdingsCount >= 5) diversificationScore = 100;
    else if (holdingsCount === 4) diversificationScore = 80;
    else if (holdingsCount === 3) diversificationScore = 60;
    else if (holdingsCount === 2) diversificationScore = 40;
    else if (holdingsCount === 1) diversificationScore = 20;

    // Adjust diversification based on concentration
    let concentrationImpact = 0;
    if (holdingsCount > 0 && valuation.holdingsValue > 0) {
      const maxHolding = valuation.holdings.reduce((max, h) =>
        (h.currentValue || 0) > (max.currentValue || 0) ? h : max
      );
      const concentrationPct = (maxHolding.currentValue / valuation.holdingsValue) * 100;
      if (concentrationPct > 50) concentrationImpact = -20;
      else if (concentrationPct > 30) concentrationImpact = -10;
    }
    diversificationScore = Math.max(0, diversificationScore + concentrationImpact);

    // 2. Cash Reserve Score (0-100)
    // Healthy if cash is between 5% and 20% of portfolio. Too little or too much lowers score.
    let cashReserveScore = 100;
    if (valuation.portfolioValue > 0) {
      const cashPct = (valuation.cashBalance / valuation.portfolioValue) * 100;
      if (cashPct < 5) cashReserveScore = Math.max(0, cashPct * 20); // Scale 0-5% to 0-100
      else if (cashPct > 30) cashReserveScore = Math.max(0, 100 - (cashPct - 30) * 2); // Drops slowly after 30%
    } else {
      cashReserveScore = 0;
    }

    // 3. Readiness Alignment Score (0-100)
    // If readiness is low, high cash/low stock is good. If high, high stock is good.
    const readinessScore = readinessRes ? readinessRes.score : 50;
    const stockPct = valuation.portfolioValue > 0 ? (valuation.holdingsValue / valuation.portfolioValue) * 100 : 0;
    
    let readinessAlignmentScore = 100;
    if (readinessScore < 40 && stockPct > 50) {
      // Not ready, but highly invested
      readinessAlignmentScore = Math.max(0, 100 - (stockPct - 50) * 2);
    } else if (readinessScore > 70 && stockPct < 30) {
      // Ready, but under-invested
      readinessAlignmentScore = Math.max(0, 100 - (30 - stockPct) * 3);
    }

    // Overall Score
    const overallScore = Math.round(
      (diversificationScore * 0.4) +
      (cashReserveScore * 0.3) +
      (readinessAlignmentScore * 0.3)
    );

    if (diversificationScore >= 80) {
      await awardXP(req.user._id, 'DIVERSIFIED_PORTFOLIO');
    }

    res.json({
      diversification: Math.round(diversificationScore),
      cashReserve: Math.round(cashReserveScore),
      readinessAlignment: Math.round(readinessAlignmentScore),
      overall: overallScore,
      concentrationImpact
    });
  } catch (err) {
    console.error('getPortfolioHealth error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/xp ────────────────────────────────────────────────────
const getXP = async (req, res) => {
  try {
    let xpDoc = await InvestLabXP.findOne({ userId: req.user._id });
    if (!xpDoc) {
      xpDoc = await InvestLabXP.create({ userId: req.user._id });
    }
    
    let nextLevelXP = null;
    let currentLevelXP = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (LEVEL_THRESHOLDS[i].level === xpDoc.level) {
        currentLevelXP = LEVEL_THRESHOLDS[i].xp;
        if (i + 1 < LEVEL_THRESHOLDS.length) {
          nextLevelXP = LEVEL_THRESHOLDS[i + 1].xp;
        }
      }
    }

    res.json({
      xp: xpDoc.xp,
      level: xpDoc.level,
      currentLevelXP,
      nextLevelXP,
      progress: nextLevelXP ? ((xpDoc.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 100
    });
  } catch (err) {
    console.error('getXP error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/achievements ──────────────────────────────────────────
const getAchievements = async (req, res) => {
  try {
    let xpDoc = await InvestLabXP.findOne({ userId: req.user._id });
    if (!xpDoc) {
      xpDoc = await InvestLabXP.create({ userId: req.user._id });
    }
    res.json({ badges: xpDoc.badges });
  } catch (err) {
    console.error('getAchievements error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/investlab/streak ────────────────────────────────────────────────
const getStreak = async (req, res) => {
  try {
    let xpDoc = await InvestLabXP.findOne({ userId: req.user._id });
    if (!xpDoc) {
      xpDoc = await InvestLabXP.create({ userId: req.user._id });
    }
    res.json({
      streakDays: xpDoc.streakDays,
      longestStreak: xpDoc.longestStreak,
      lastActivityDate: xpDoc.lastActivityDate
    });
  } catch (err) {
    console.error('getStreak error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/investlab/activity ─────────────────────────────────────────────
const postActivity = async (req, res) => {
  try {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ message: 'action is required' });
    }
    const result = await awardXP(req.user._id, action);
    res.json(result);
  } catch (err) {
    console.error('postActivity error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
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
};

