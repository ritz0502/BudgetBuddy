const { generateCoachInsights } = require('./services/geminiService');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    const context = {
      readinessScore: 80,
      readinessStatus: 'Ready',
      savingsRate: 20,
      budgetAdherence: 90,
      subscriptionBurden: 5,
      spendingConsistency: 85,
      cashBalance: 5000,
      portfolioValue: 10000,
      holdingsCount: 3,
      holdingsSummary: 'AAPL, TSLA',
      concentration: 'Low',
      recentTrades: 'Bought AAPL'
    };
    console.log("Calling Gemini...");
    const res = await generateCoachInsights(context);
    console.log("SUCCESS:");
    console.log(res);
  } catch (err) {
    console.error("ERROR:");
    console.error(err.message);
  }
}
run();
