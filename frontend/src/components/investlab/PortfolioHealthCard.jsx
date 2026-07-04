import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Activity, Shield, DollarSign, Target } from 'lucide-react';

const PortfolioHealthCard = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await axios.get('/api/investlab/portfolio-health', {
        headers: { Authorization: `Bearer ${user.token}` },
        withCredentials: true
      });
      setHealth(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading && !health) {
    return (
      <div className="investlab-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
        <RefreshCw className="spinner" size={24} color="#0052cc" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="investlab-card" style={{ color: '#d32f2f' }}>
        <p>Error loading health score: {error}</p>
        <button onClick={fetchHealth} className="budgetbuddy-btn">Retry</button>
      </div>
    );
  }

  if (!health) return null;

  const metrics = [
    { label: 'Diversification', value: health.diversification, icon: <Shield size={16} /> },
    { label: 'Cash Reserve', value: health.cashReserve, icon: <DollarSign size={16} /> },
    { label: 'Readiness Alignment', value: health.readinessAlignment, icon: <Target size={16} /> },
  ];

  let statusColor = '#e53935';
  let statusText = 'Needs Work';
  if (health.overall >= 80) {
    statusColor = '#43a047';
    statusText = 'Excellent';
  } else if (health.overall >= 50) {
    statusColor = '#fb8c00';
    statusText = 'Fair';
  }

  return (
    <div className="investlab-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#0052cc" />
            Portfolio Health
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Overall strength of your portfolio structure</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', border: `4px solid ${statusColor}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', flexShrink: 0, backgroundColor: `${statusColor}10`
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: statusColor }}>{health.overall}</div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>/100</div>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: statusColor, marginBottom: '4px' }}>
              {statusText}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {health.concentrationImpact < 0 && (
                <div style={{ color: '#d32f2f', marginBottom: '4px' }}>
                  ⚠️ Concentration penalty: {health.concentrationImpact}pts
                </div>
              )}
              Maintain balanced diversification and cash reserves to improve your score.
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {metrics.map((m) => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#555' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {m.icon} {m.label}
                </span>
                <span style={{ fontWeight: 600 }}>{m.value}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${m.value}%`, backgroundColor: m.value < 50 ? '#e53935' : (m.value < 80 ? '#fb8c00' : '#43a047') }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioHealthCard;
