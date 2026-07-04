// frontend/src/components/investlab/AICoachCard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Bot, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react';

const AICoachCard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/investlab/ai-coach', {
        headers: { Authorization: `Bearer ${user.token}` },
        withCredentials: true
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  return (
    <div className="investlab-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="investlab-title">
          <Bot size={24} color="#7cb342" /> AI Financial Coach
        </h2>
        <button 
          onClick={fetchInsights} 
          disabled={loading}
          style={{
            background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            color: '#7cb342', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-line" style={{ height: '60px', borderRadius: '8px' }}></div>
            ))}
            <style>{`
              .skeleton-line {
                background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
              }
              @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              .spin {
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '20px', background: '#ffebee', color: '#c62828', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Could not load insights</div>
              <div style={{ fontSize: '0.85rem' }}>{error}</div>
            </div>
          </div>
        ) : data?.insights ? (
          <>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: '#e8f5e9', color: '#2e7d32', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Lightbulb size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem', marginBottom: '2px' }}>Strengths</div>
                <div style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.4' }}>{data.insights.strengths}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: '#ffebee', color: '#c62828', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <AlertCircle size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem', marginBottom: '2px' }}>Areas to Improve</div>
                <div style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.4' }}>{data.insights.weaknesses}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: '#e3f2fd', color: '#1565c0', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Lightbulb size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem', marginBottom: '2px' }}>Learning Recommendation</div>
                <div style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.4' }}>{data.insights.learningRecommendation}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: '#fff3e0', color: '#ef6c00', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Lightbulb size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem', marginBottom: '2px' }}>Portfolio Observation</div>
                <div style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.4' }}>{data.insights.portfolioObservation}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: '#f3e5f5', color: '#6a1b9a', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Lightbulb size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem', marginBottom: '2px' }}>Financial Habit to Build</div>
                <div style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.4' }}>{data.insights.financialHabit}</div>
              </div>
            </div>
          </>
        ) : (
           <p style={{ color: '#888', fontSize: '0.9rem' }}>No insights available right now.</p>
        )}
      </div>

      {!loading && !error && data && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee', fontSize: '0.75rem', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
          <span>{data.disclaimer}</span>
          <span>{data.source === 'ai' ? 'Powered by Gemini' : 'Standard Insight'}</span>
        </div>
      )}
    </div>
  );
};

export default AICoachCard;
