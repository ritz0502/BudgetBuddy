// frontend/src/components/investlab/ReadinessCard.jsx
import React from 'react';

const ReadinessCard = ({ readiness }) => {
  if (!readiness) return <div className="investlab-card">Loading Readiness...</div>;

  const metrics = [
    { label: 'Savings Rate', value: readiness.breakdown?.savingsRate?.score || 0 },
    { label: 'Budget Discipline', value: readiness.breakdown?.budgetAdherence?.score || 0 },
    { label: 'Subscription Load', value: readiness.breakdown?.subscriptionBurden?.score || 0 },
    { label: 'Spending Consistency', value: readiness.breakdown?.spendingConsistency?.score || 0 },
  ];

  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="investlab-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0' }}>Investment Readiness</h2>
          <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>A holistic score to guide your first steps</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #7cb342',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', flexShrink: 0
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d5016' }}>{readiness.score || 0}</div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>/100</div>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: '#2d5016', marginBottom: '4px' }}>
              {readiness.status || 'Beginner'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              Focus on improving the areas below to raise your readiness score.
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {metrics.map((m) => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#555' }}>
                <span>{m.label}</span>
                <span>{m.value}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${m.value}%`, backgroundColor: m.value < 50 ? '#e53935' : '#7cb342' }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Why this score? Expandable section */}
        <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
          <button 
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', color: '#0052cc', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {expanded ? 'Hide Breakdown' : 'Why this score?'}
          </button>
          
          {expanded && (
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#555', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Savings Rate Contribution (40%)</span>
                <strong>+{readiness.breakdown?.savingsRate?.weighted || 0} pts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Budget Adherence Contribution (30%)</span>
                <strong>+{readiness.breakdown?.budgetAdherence?.weighted || 0} pts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subscription Burden Contribution (20%)</span>
                <strong>+{readiness.breakdown?.subscriptionBurden?.weighted || 0} pts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Consistency Contribution (10%)</span>
                <strong>+{readiness.breakdown?.spendingConsistency?.weighted || 0} pts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '4px' }}>
                <strong>Total Score</strong>
                <strong>{readiness.score || 0} / 100</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadinessCard;
