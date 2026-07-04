// frontend/src/components/investlab/ProjectionCard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Calculator } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProjectionCard = () => {
  const { user } = useAuth();
  const [inputs, setInputs] = useState({
    monthlyInvestment: 2000,
    annualReturn: 12,
    years: 10
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjection = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/investlab/projection', inputs, {
        headers: { Authorization: `Bearer ${user.token}` },
        withCredentials: true
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to calculate projection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProjection();
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString()}`;
  };

  return (
    <div className="investlab-card">
      <h2 className="investlab-title" style={{ marginBottom: '16px' }}>
        <TrendingUp size={24} color="#7cb342" /> Wealth Simulator
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Monthly (₹)</label>
          <input 
            type="number" name="monthlyInvestment" value={inputs.monthlyInvestment} onChange={handleChange}
            className="invest-input" min="100" style={{ padding: '8px' }}
          />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Return (%)</label>
          <input 
            type="number" name="annualReturn" value={inputs.annualReturn} onChange={handleChange}
            className="invest-input" min="1" max="100" style={{ padding: '8px' }}
          />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Years</label>
          <input 
            type="number" name="years" value={inputs.years} onChange={handleChange}
            className="invest-input" min="1" max="50" style={{ padding: '8px' }}
          />
        </div>
        <div style={{ flex: '1 1 100%', display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="btn-invest" disabled={loading} style={{ padding: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <Calculator size={18} /> Calculate
          </button>
        </div>
      </form>

      {error && <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

      {data && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Future Value</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2d5016' }}>
                {formatCurrency(data.finalValue)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Invested</div>
              <div style={{ fontWeight: 600 }}>{formatCurrency(data.totalInvested)}</div>
            </div>
          </div>

          <div style={{ height: '200px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.projectionData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7cb342" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7cb342" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis hide={true} domain={['dataMin', 'dataMax']} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Value']}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#7cb342" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectionCard;
