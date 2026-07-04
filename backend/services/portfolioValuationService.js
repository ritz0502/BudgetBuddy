// backend/services/portfolioValuationService.js
// Reusable portfolio valuation logic.
// Used by controllers and (future) BullMQ snapshot jobs.

/**
 * Calculate the full valuation of a portfolio given current prices.
 *
 * @param {Object}  portfolio            - Mongoose Portfolio document (or plain object)
 * @param {Object}  pricesMap            - { AAPL: { price: 189.5, ... }, ... }
 * @returns {Object} Valuation result
 */
const valuatePortfolio = (portfolio, pricesMap = {}) => {
  const holdings = (portfolio.holdings || []).map((holding) => {
    const priceData = pricesMap[holding.symbol];
    const currentPrice = priceData ? priceData.price : null;

    const costBasis = holding.quantity * holding.avgBuyPrice;
    const currentValue = currentPrice !== null ? holding.quantity * currentPrice : null;
    const gainLoss = currentValue !== null ? currentValue - costBasis : null;
    const gainLossPct =
      gainLoss !== null && costBasis > 0
        ? parseFloat(((gainLoss / costBasis) * 100).toFixed(2))
        : null;

    return {
      symbol: holding.symbol,
      quantity: holding.quantity,
      avgBuyPrice: holding.avgBuyPrice,
      currentPrice,
      costBasis: parseFloat(costBasis.toFixed(2)),
      currentValue: currentValue !== null ? parseFloat(currentValue.toFixed(2)) : null,
      gainLoss: gainLoss !== null ? parseFloat(gainLoss.toFixed(2)) : null,
      gainLossPct,
    };
  });

  // Sum up holdings values (only for holdings with a known current price)
  const holdingsValue = holdings.reduce((sum, h) => {
    return sum + (h.currentValue !== null ? h.currentValue : h.costBasis);
  }, 0);

  const cashBalance = portfolio.cashBalance;
  const portfolioValue = parseFloat((cashBalance + holdingsValue).toFixed(2));

  // Total cost basis of all holdings
  const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnL = parseFloat((holdingsValue - totalCostBasis).toFixed(2));
  const totalPnLPct =
    totalCostBasis > 0
      ? parseFloat(((totalPnL / totalCostBasis) * 100).toFixed(2))
      : 0;

  return {
    cashBalance: parseFloat(cashBalance.toFixed(2)),
    holdings,
    holdingsValue: parseFloat(holdingsValue.toFixed(2)),
    portfolioValue,
    totalPnL,
    totalPnLPct,
  };
};

module.exports = { valuatePortfolio };
