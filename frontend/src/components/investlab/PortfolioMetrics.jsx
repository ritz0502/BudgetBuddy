// frontend/src/components/investlab/PortfolioMetrics.jsx
import React from 'react';

const PortfolioMetrics = ({ portfolio }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const portfolioValue = portfolio?.portfolioValue || 0;
  const cashBalance = portfolio?.cashBalance || 0;
  const holdingsValue = portfolio?.holdingsValue || 0;

  const profit = portfolio?.totalPnL ?? 0;
  const profitPct = portfolio?.totalPnLPct ?? 0;

  return (
    <div className="investlab-metrics-grid">
      <div className="investlab-card">
        <div className="investlab-metric-title">Portfolio Value</div>
        <div className="investlab-metric-value">{formatCurrency(portfolioValue)}</div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>Since start {profit >= 0 ? '+' : ''}{profitPct}%</div>
      </div>
      <div className="investlab-card">
        <div className="investlab-metric-title">Cash Balance</div>
        <div className="investlab-metric-value">{formatCurrency(cashBalance)}</div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>Available to practice</div>
      </div>
      <div className="investlab-card">
        <div className="investlab-metric-title">Holdings Value</div>
        <div className="investlab-metric-value">{formatCurrency(holdingsValue)}</div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>Value of current positions</div>
      </div>
      <div className="investlab-card">
        <div className="investlab-metric-title">Total P/L</div>
        <div className="investlab-metric-value" style={{ color: profit >= 0 ? '#2d5016' : '#c62828' }}>
          {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>Paper gains from practice trades</div>
      </div>
    </div>
  );
};

export default PortfolioMetrics;
