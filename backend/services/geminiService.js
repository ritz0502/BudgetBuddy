// backend/services/geminiService.js
// AI Financial Coach — Gemini integration with deterministic fallback.

const { GoogleGenAI } = require('@google/genai');

let ai = null;

const getAI = () => {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

/**
 * Build a structured prompt for Gemini from user financial context.
 */
const buildPrompt = (context) => {
  return `You are a friendly AI financial coach for college students using a budgeting app called BudgetBuddy.
The student has the following financial profile:

- Investment Readiness Score: ${context.readinessScore}/100 (${context.readinessStatus})
- Savings Rate: ${context.savingsRate}%
- Budget Adherence: ${context.budgetAdherence}%
- Subscription Burden: ${context.subscriptionBurden}% of income
- Spending Consistency: ${context.spendingConsistency}%
- Portfolio Cash Balance: $${context.cashBalance}
- Total Portfolio Value: $${context.portfolioValue}
- Number of Holdings: ${context.holdingsCount}
- Holdings: ${context.holdingsSummary || 'None'}
- Portfolio Concentration: ${context.concentration || 'N/A'}
- Recent Trades: ${context.recentTrades || 'None'}

Based on this data, provide a personalized analysis for this student.

Rules:
1. Use beginner-friendly, encouraging language appropriate for college students.
2. Keep each point brief (1-3 sentences maximum).
3. DO NOT provide specific investment advice.
4. DO NOT recommend specific stocks to buy or sell.

Respond ONLY with a valid JSON object containing exactly these 5 keys:
"strengths": Analyze their positive financial behaviors based on savings rate, readiness, or budget adherence.
"weaknesses": Point out an area they need to improve (e.g., low budget adherence, high subscription burden, or lack of diversification).
"learningRecommendation": Suggest exactly one specific topic they should learn about next (e.g., "Compound Interest", "Emergency Funds", "Diversification").
"portfolioObservation": An observation about their current portfolio holdings, concentration, or cash balance.
"financialHabit": One actionable daily or weekly habit they should adopt to improve their readiness.

Return ONLY the JSON object, no markdown, no code fences, no extra text.
IMPORTANT: The user just clicked 'Refresh'. Provide a COMPLETELY DIFFERENT perspective, phrasing, and specific suggestions than what you normally provide. Do not repeat the same advice.
Timestamp for randomness: ${new Date().toISOString()}`;
};

/**
 * Call Gemini API to generate AI coach insights.
 * @param {Object} context - Financial context object
 * @returns {Object} { strengths, weaknesses, learningRecommendation, portfolioObservation, financialHabit }
 */
const generateCoachInsights = async (context) => {
  const client = getAI();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = buildPrompt(context);

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 1.2,
    }
  });

  // Extract text from response
  const text = response.text || '';
  
  // Parse JSON from response (handle potential markdown wrapping)
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const insights = JSON.parse(cleaned);

  if (!insights || typeof insights !== 'object' || Array.isArray(insights)) {
    throw new Error('Invalid response format from Gemini');
  }

  return {
    strengths: String(insights.strengths || 'No strengths identified.'),
    weaknesses: String(insights.weaknesses || 'No weaknesses identified.'),
    learningRecommendation: String(insights.learningRecommendation || 'General financial literacy.'),
    portfolioObservation: String(insights.portfolioObservation || 'No portfolio data available.'),
    financialHabit: String(insights.financialHabit || 'Track your expenses daily.'),
  };
};

/**
 * Deterministic fallback insights generated from user data.
 * Used when Gemini is unavailable or fails.
 * @param {Object} context - Financial context object
 * @returns {Object} { strengths, weaknesses, learningRecommendation, portfolioObservation, financialHabit }
 */
const generateFallbackInsights = (context) => {
  const rand = Math.floor(Math.random() * 3);
  
  // Highly varied pseudo-AI strengths
  const strengthsOptions = [
    `Your saving habits (${context.savingsRate}%) and budget adherence (${context.budgetAdherence}%) show exceptional discipline. Keep it up!`,
    `You are doing a fantastic job maintaining a ${context.savingsRate}% savings rate. This is the cornerstone of long-term wealth.`,
    `A readiness score of ${context.readinessScore}/100 indicates you have a solid grasp on your financial basics.`
  ];
  const strengths = strengthsOptions[rand];

  // Highly varied pseudo-AI weaknesses
  const weaknessesOptions = [
    context.subscriptionBurden > 10 ? `Your subscriptions are consuming ${context.subscriptionBurden}% of your income. Consider trimming unused services.` : `You could slightly increase your savings rate by optimizing discretionary spending.`,
    context.budgetAdherence < 70 ? `Your budget adherence is at ${context.budgetAdherence}%. Try to stick strictly to your monthly limits.` : `Your portfolio is highly concentrated. Diversification could reduce your risk.`,
    context.holdingsCount === 0 ? `You haven't made any investments yet. Your cash is losing value to inflation.` : `Focus on adding more diverse assets to your portfolio.`
  ];
  const weaknesses = weaknessesOptions[rand];

  // Highly varied pseudo-AI learning
  const learningOptions = [
    context.holdingsCount === 0 ? 'Introduction to Index Funds' : 'Advanced Portfolio Diversification',
    'The Power of Compound Interest',
    'Managing Subscription Bloat'
  ];
  const learningRecommendation = learningOptions[rand];

  // Highly varied pseudo-AI portfolio observation
  const obsOptions = [
    context.holdingsCount === 0 ? `You have $${context.cashBalance} sitting in cash. It's time to put it to work.` : `You hold ${context.holdingsCount} assets. Make sure they aren't all in the same sector.`,
    `Your total portfolio value is $${context.portfolioValue}. Focus on consistent monthly contributions.`,
    context.concentration === 'High' ? `Your portfolio has high concentration risk. Avoid putting all your eggs in one basket.` : `Your cash-to-stock ratio looks healthy for your current level.`
  ];
  const portfolioObservation = obsOptions[rand];

  // Highly varied pseudo-AI habits
  const habitOptions = [
    'Review your budget every Sunday night to prepare for the week.',
    'Set up an automatic transfer of 10% of your income to a separate savings account.',
    'Before buying a subscription, implement a 48-hour waiting rule.'
  ];
  const financialHabit = habitOptions[rand];

  return { strengths, weaknesses, learningRecommendation, portfolioObservation, financialHabit };
};

module.exports = { generateCoachInsights, generateFallbackInsights };
