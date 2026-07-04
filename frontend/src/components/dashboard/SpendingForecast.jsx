import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

const fmtAmt = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

const SpendingForecast = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const { data } = await axios.get('/api/predict', {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        
        if (data.fallback) {
          setFallback(true);
        } else {
          setPredictions(data.predictions || []);
        }
      } catch (err) {
        console.error('Forecast error:', err);
        setError(err.message);
        setFallback(true);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPredictions();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="db-full-card" style={{ marginTop: '20px' }}>
        <h2>Spending Forecast</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <div style={{ height: '20px', background: '#e0e0e0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
          <div style={{ height: '20px', background: '#e0e0e0', borderRadius: '4px', animation: 'pulse 1.5s infinite', width: '80%' }}></div>
          <div style={{ height: '20px', background: '#e0e0e0', borderRadius: '4px', animation: 'pulse 1.5s infinite', width: '90%' }}></div>
        </div>
      </div>
    );
  }

  if (fallback || predictions.length === 0) {
    return (
      <div className="db-full-card" style={{ marginTop: '20px', opacity: 0.7 }}>
        <h2>Spending Forecast</h2>
        <div style={{ marginTop: '16px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>Not enough data yet — add at least 2 months of transactions to enable spending predictions.</span>
        </div>
      </div>
    );
  }

  // Find biggest overspend
  const increasingPreds = predictions.filter(p => p.trend === 'increasing');
  let topIncrease = null;
  if (increasingPreds.length > 0) {
    topIncrease = increasingPreds.reduce((prev, current) => {
      const prevDiff = prev.predictedAmount - prev.lastMonthActual;
      const currentDiff = current.predictedAmount - current.lastMonthActual;
      return (currentDiff > prevDiff) ? current : prev;
    });
  }

  return (
    <div className="db-full-card" style={{ marginTop: '20px' }}>
      <h2>Spending Forecast</h2>
      
      {topIncrease ? (
        <div style={{ 
          background: '#fff8e1', 
          borderLeft: '4px solid #ffb300', 
          padding: '12px 16px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          color: '#b27d00',
          fontWeight: '500',
          marginTop: '16px'
        }}>
          Heads up — {topIncrease.category} spend is predicted to increase by {fmtAmt(topIncrease.predictedAmount - topIncrease.lastMonthActual)} next month
        </div>
      ) : (
        <div style={{ 
          background: '#f1f8e9', 
          borderLeft: '4px solid #7cb342', 
          padding: '12px 16px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          color: '#33691e',
          fontWeight: '500',
          marginTop: '16px'
        }}>
          Your spending looks stable next month 🎉
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee', color: '#888' }}>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>Category</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>Last Month (₹)</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>Predicted (₹)</th>
              <th style={{ padding: '12px 8px', fontWeight: '500', textAlign: 'center' }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map(p => (
              <tr key={p.category} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#333' }}>{p.category}</td>
                <td style={{ padding: '12px 8px', color: '#555' }}>{fmtAmt(p.lastMonthActual)}</td>
                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#2d5016' }}>{fmtAmt(p.predictedAmount)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {p.trend === 'increasing' && <TrendingUp size={16} color="#d32f2f" style={{ display: 'inline-block' }} />}
                  {p.trend === 'decreasing' && <TrendingDown size={16} color="#388e3c" style={{ display: 'inline-block' }} />}
                  {p.trend === 'stable' && <Minus size={16} color="#9e9e9e" style={{ display: 'inline-block' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpendingForecast;
