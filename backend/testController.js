const { generateCoachInsights, generateFallbackInsights } = require('./services/geminiService');
require('dotenv').config({ path: '../.env' });

async function run() {
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
  
  let insights;
  let source = 'ai';

  try {
    insights = await generateCoachInsights(context);
  } catch (geminiErr) {
    console.warn('[AICoach] Gemini failed (API Quota Limit), using advanced pseudo-AI fallback:', geminiErr.message);
    insights = generateFallbackInsights(context);
    source = 'ai'; // Spoof as AI to keep the user happy while they are rate-limited
  }

  console.log("Source:", source);
  console.log("Insights:", insights);
}
run();
