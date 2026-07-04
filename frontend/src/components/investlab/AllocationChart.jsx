// frontend/src/components/investlab/AllocationChart.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2d5016', '#4a7c24', '#7cb342', '#aed581', '#dcedc8', '#888888'];

const AllocationChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllocation = async () => {
      if (!user?.token) return;
      try {
        const res = await axios.get('/api/investlab/allocation', {
          headers: { Authorization: `Bearer ${user.token}` },
          withCredentials: true
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load allocation', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllocation();
  }, [user?.token]);

  if (loading) {
    return <div className="investlab-card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading allocation...</div>;
  }

  if (!data || data.allocation.length === 0) {
    return null;
  }

  return (
    <div className="investlab-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <h2 className="investlab-title">
          <PieChartIcon size={24} color="#7cb342" /> Portfolio Allocation
        </h2>
        <div style={{ position: 'relative', group: 'hover' }} className="tooltip-container">
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888', cursor: 'help' }}>?</div>
          <div className="tooltip-text" style={{ visibility: 'hidden', position: 'absolute', right: '0', top: '24px', background: '#333', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', width: '200px', zIndex: 10 }}>
            Diversification helps reduce concentration risk. Ideally, spread investments across different assets.
          </div>
        </div>
      </div>
      
      <style>{`
        .tooltip-container:hover .tooltip-text {
          visibility: visible !important;
        }
      `}</style>

      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.allocation}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.allocation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'Cash' ? '#888' : COLORS[index % (COLORS.length - 1)]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [`${value}% (₹${props.payload.amount.toLocaleString()})`, name]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
        {data.allocation.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.name === 'Cash' ? '#888' : COLORS[index % (COLORS.length - 1)] }}></div>
            <span style={{ color: '#666' }}>{entry.name}</span>
            <span style={{ fontWeight: 600 }}>{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationChart;
