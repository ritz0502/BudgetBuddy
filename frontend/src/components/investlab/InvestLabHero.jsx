// frontend/src/components/investlab/InvestLabHero.jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';

const InvestLabHero = ({ portfolio, readiness }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const portfolioValue = portfolio?.portfolioValue || 0;
  const cashBalance = portfolio?.cashBalance || 0;
  
  const profit = portfolio?.totalPnL ?? 0;
  const profitPercentage = portfolio?.totalPnLPct ?? 0;

  return (
    <div className="investlab-card" style={{ padding: '32px' }}>
      <h1 className="investlab-title">
        <TrendingUp size={28} color="#7cb342" /> InvestLab
      </h1>
      <p className="investlab-subtitle">
        Learn investing with virtual money and real market data.<br/>
        Build investing habits without risking real money.
      </p>

      <div className="investlab-hero-content">
        <div className="investlab-hero-stat-card">
          <div className="investlab-metric-title">Virtual Portfolio Value</div>
          <div className="investlab-metric-value">{formatCurrency(portfolioValue)}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            Since start: {formatCurrency(profit)} ({profitPercentage}%)
          </div>
        </div>

        <div className="investlab-hero-stat-card">
          <div className="investlab-metric-title">Cash Available</div>
          <div className="investlab-metric-value">{formatCurrency(cashBalance)}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            Use your cash to practice buying stocks
          </div>
        </div>

        <div className="investlab-hero-stat-card">
          <div className="investlab-metric-title">Readiness Status</div>
          <div className="investlab-metric-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', color: '#2d5016' }}>
              {readiness?.score || 0}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.2rem' }}>{readiness?.status || 'Loading'}</span>
              <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 400 }}>Practice mindset & fundamentals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestLabHero;
