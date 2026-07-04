// backend/services/readinessEngine.js
// Pure scoring engine — no database access.
// All data must be fetched and passed in by the caller (controller).

/**
 * Calculate an investment readiness score.
 *
 * @param {Object} inputs
 * @param {number} inputs.monthlyIncome      - Total income for the month
 * @param {number} inputs.monthlyExpenses    - Total expenses for the month
 * @param {number} inputs.monthlySavings     - Income minus expenses
 * @param {number} inputs.budgetAdherence    - 0–1 scale (1 = all categories within budget)
 * @param {number} inputs.subscriptionBurden - 0–1 scale (subscription total / income)
 * @param {number} inputs.spendingConsistency - 0–1 scale (1 = very consistent month-to-month)
 *
 * @returns {{ score: number, status: string, breakdown: Object }}
 */
const calculateReadiness = (inputs) => {
  const {
    monthlyIncome = 0,
    monthlyExpenses = 0,
    monthlySavings = 0,
    budgetAdherence = 0,
    subscriptionBurden = 0,
    spendingConsistency = 0,
  } = inputs;

  // ── 1. Savings Rate (40%) ──────────────────────────────────────────────────
  // savingsRate is monthlySavings / monthlyIncome, clamped to [0, 1]
  let savingsRate = 0;
  if (monthlyIncome > 0) {
    savingsRate = Math.max(0, Math.min(monthlySavings / monthlyIncome, 1));
  }
  const savingsScore = savingsRate * 100; // 0–100

  // ── 2. Budget Adherence (30%) ──────────────────────────────────────────────
  // Already on a 0–1 scale from the caller
  const adherenceScore = Math.max(0, Math.min(budgetAdherence, 1)) * 100;

  // ── 3. Subscription Burden (20%) ───────────────────────────────────────────
  // Inverted: lower burden = higher score
  // burden is subscriptionTotal / income (0–1 scale from caller)
  const burdenClamped = Math.max(0, Math.min(subscriptionBurden, 1));
  const burdenScore = (1 - burdenClamped) * 100;

  // ── 4. Spending Consistency (10%) ──────────────────────────────────────────
  // Already on a 0–1 scale from the caller
  const consistencyScore = Math.max(0, Math.min(spendingConsistency, 1)) * 100;

  // ── Weighted total ─────────────────────────────────────────────────────────
  const score = Math.round(
    savingsScore * 0.4 +
    adherenceScore * 0.3 +
    burdenScore * 0.2 +
    consistencyScore * 0.1
  );

  // ── Status ─────────────────────────────────────────────────────────────────
  let status;
  if (score >= 70) {
    status = 'Ready';
  } else if (score >= 40) {
    status = 'Improving';
  } else {
    status = 'Beginner';
  }

  // ── Breakdown ──────────────────────────────────────────────────────────────
  const breakdown = {
    savingsRate: {
      raw: parseFloat(savingsRate.toFixed(3)),
      score: parseFloat(savingsScore.toFixed(1)),
      weight: 0.4,
      weighted: parseFloat((savingsScore * 0.4).toFixed(1)),
    },
    budgetAdherence: {
      raw: parseFloat(budgetAdherence.toFixed(3)),
      score: parseFloat(adherenceScore.toFixed(1)),
      weight: 0.3,
      weighted: parseFloat((adherenceScore * 0.3).toFixed(1)),
    },
    subscriptionBurden: {
      raw: parseFloat(burdenClamped.toFixed(3)),
      score: parseFloat(burdenScore.toFixed(1)),
      weight: 0.2,
      weighted: parseFloat((burdenScore * 0.2).toFixed(1)),
    },
    spendingConsistency: {
      raw: parseFloat(spendingConsistency.toFixed(3)),
      score: parseFloat(consistencyScore.toFixed(1)),
      weight: 0.1,
      weighted: parseFloat((consistencyScore * 0.1).toFixed(1)),
    },
  };

  return { score, status, breakdown };
};

module.exports = { calculateReadiness };
