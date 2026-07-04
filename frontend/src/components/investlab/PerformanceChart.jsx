// frontend/src/components/investlab/PerformanceChart.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!user?.token) return;
      try {
        const res = await axios.get('/api/investlab/performance?days=7', {
          headers: { Authorization: `Bearer ${user.token}` },
          withCredentials: true
        });
        
        // Format timestamp for display
        const formattedData = (res.data.performanceData || []).map(d => {
          const date = new Date(d.timestamp);
          return {
            ...d,
            displayDate: `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
          };
        });
        
        setData(formattedData);
      } catch (err) {
        console.error('Failed to load performance data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [user?.token]);

  if (loading) {
    return <div className="investlab-card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading performance...</div>;
  }

  return (
    <div className="investlab-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 className="investlab-title" style={{ marginBottom: '16px' }}>
        <Activity size={24} color="#7cb342" /> Portfolio Performance
      </h2>

      {data.length < 2 ? (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
          Performance data will appear after more portfolio snapshots are recorded.<br/>Snapshots are taken automatically every minute.
        </div>
      ) : (
        <div style={{ flexGrow: 1, height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d5016" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2d5016" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }} 
                minTickGap={30}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }} 
                tickFormatter={(val) => `₹${val.toLocaleString()}`}
                width={70}
              />
              <Tooltip 
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Portfolio Value']}
                labelStyle={{ color: '#666', marginBottom: '4px' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="portfolioValue" stroke="#2d5016" strokeWidth={2} fillOpacity={1} fill="url(#colorPerf)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;
