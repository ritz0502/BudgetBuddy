import React from 'react';
import { PieChart, AlertTriangle } from 'lucide-react';

const ConcentrationRiskCard = ({ portfolio, prices }) => {
  if (!portfolio || !prices) return null;

  // Calculate holdings value
  let totalHoldingsValue = 0;
  const holdingsValuation = (portfolio.holdings || []).map(h => {
    const currentPrice = prices[h.symbol]?.price || h.avgBuyPrice;
    const currentValue = currentPrice * h.quantity;
    totalHoldingsValue += currentValue;
    return { ...h, currentValue };
  });

  if (totalHoldingsValue === 0) {
    return (
      <div className="investlab-card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={20} color="#0052cc" />
          Concentration Risk
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '16px' }}>
          No holdings to analyze yet.
        </p>
      </div>
    );
  }

  // Find max holding
  const maxHolding = holdingsValuation.reduce((max, h) =>
    h.currentValue > (max.currentValue || 0) ? h : max
  );

  const maxPct = (maxHolding.currentValue / totalHoldingsValue) * 100;

  let riskLevel = 'Low';
  let riskColor = '#43a047';
  let explanation = 'Your portfolio is well diversified across multiple assets.';

  if (maxPct > 50) {
    riskLevel = 'High';
    riskColor = '#e53935';
    explanation = 'Over half your portfolio is in a single asset. This exposes you to significant risk if that specific company performs poorly.';
  } else if (maxPct > 30) {
    riskLevel = 'Medium';
    riskColor = '#fb8c00';
    explanation = 'You have a moderate concentration in one asset. Consider diversifying future investments.';
  }

  return (
    <div className="investlab-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={20} color="#0052cc" />
            Concentration Risk
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Analysis of your largest holding</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: `4px solid ${riskColor}` }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Largest Holding</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>
            {maxHolding.symbol} ({maxPct.toFixed(1)}%)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', backgroundColor: `${riskColor}15`, color: riskColor, fontWeight: 600, fontSize: '0.85rem' }}>
            {riskLevel === 'High' && <AlertTriangle size={14} />}
            {riskLevel} Risk
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
          {explanation}
        </p>
      </div>
    </div>
  );
};

export default ConcentrationRiskCard;
