import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Calculator, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STYLES = [
  { name: 'Savings Account', rate: 3 },
  { name: 'Fixed Deposit', rate: 6 },
  { name: 'Conservative Portfolio', rate: 8 },
  { name: 'Index Fund Style', rate: 10 },
  { name: 'Diversified Equity', rate: 12 },
  { name: 'Aggressive Growth', rate: 15 },
];

const FutureWealthPlanner = ({ readiness, postActivity }) => {
  const { user } = useAuth();
  const [inputs, setInputs] = useState({
    monthlyInvestment: 2000,
    annualReturn: 10,
    years: 10
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fill savings from readiness
  useEffect(() => {
    if (readiness?.inputs?.monthlySavings > 0) {
      setInputs(prev => ({
        ...prev,
        monthlyInvestment: Math.round(readiness.inputs.monthlySavings * 0.2) // Default to 20% of savings
      }));
    }
  }, [readiness]);

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
  }, [inputs.annualReturn]); // Recalculate on style change automatically

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleStyleChange = (e) => {
    setInputs(prev => ({ ...prev, annualReturn: Number(e.target.value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProjection();
    if (postActivity) postActivity('WEALTH_PLANNER_USE');
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="investlab-card">
      <h2 className="investlab-title" style={{ marginBottom: '16px' }}>
        <TrendingUp size={24} color="#0052cc" /> Future Wealth Planner
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Monthly Investment (₹)</label>
          <input 
            type="number" name="monthlyInvestment" value={inputs.monthlyInvestment} onChange={handleChange}
            className="invest-input" min="100" style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
          />
          {readiness?.inputs?.monthlySavings > 0 && (
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
              Available Savings: {formatCurrency(readiness.inputs.monthlySavings)}/mo
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Investment Style</label>
          <select 
            value={inputs.annualReturn} onChange={handleStyleChange}
            className="invest-input" style={{ padding: '8px', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff' }}
          >
            {STYLES.map(style => (
              <option key={style.name} value={style.rate}>
                {style.name} ({style.rate}%)
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 80px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Years</label>
          <input 
            type="number" name="years" value={inputs.years} onChange={handleChange}
            className="invest-input" min="1" max="50" style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: '1 1 100%', display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="budgetbuddy-btn" disabled={loading} style={{ padding: '8px 16px', display: 'flex', justifyContent: 'center', gap: '8px', width: 'auto' }}>
            <Calculator size={18} /> Update Plan
          </button>
        </div>
      </form>

      {error && <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

      {data && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', marginBottom: '16px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Future Value</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0052cc' }}>
                {formatCurrency(data.finalValue)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Invested</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333' }}>
                {formatCurrency(data.totalInvested)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Estimated Growth</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#43a047' }}>
                +{formatCurrency(data.finalValue - data.totalInvested)}
              </div>
            </div>
          </div>

          <div style={{ height: '200px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.projectionData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052cc" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis hide={true} domain={['dataMin', 'dataMax']} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Value']}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#0052cc" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {data.milestones && Object.values(data.milestones).length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: '#333' }}>Key Milestones</div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {Object.values(data.milestones).map(m => (
                  <div key={m.year} style={{ padding: '8px 12px', backgroundColor: '#e3f2fd', borderRadius: '6px', minWidth: '100px', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: '#1565c0', fontWeight: 600 }}>Year {m.year}</div>
                    <div style={{ fontSize: '0.9rem', color: '#0d47a1', fontWeight: 700 }}>{formatCurrency(m.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fff8e1', borderRadius: '8px', border: '1px solid #ffe082', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Info size={16} color="#f57c00" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', color: '#555', lineHeight: '1.4' }}>
              <strong>Educational Disclaimer:</strong> The projected returns are based on a deterministic mathematical formula using a fixed annual return rate of {inputs.annualReturn}%. These figures are purely educational assumptions for planning purposes and do not guarantee future performance. Real markets fluctuate constantly.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FutureWealthPlanner;
