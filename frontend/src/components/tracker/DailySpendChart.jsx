// frontend/src/components/tracker/DailySpendChart.jsx
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '8px 14px',
        fontSize: '0.82rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ color: '#888', marginBottom: 2 }}>Day {label}</div>
        <div style={{ fontWeight: 700, color: '#2d5016' }}>
          ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </div>
      </div>
    );
  }
  return null;
};

const DailySpendChart = ({ transactions, month, year }) => {
  const now = new Date();
  const m = month || (now.getMonth() + 1);
  const y = year || now.getFullYear();
  const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;

  // Build daily totals for days of that navigated month (expenses only)
  const data = useMemo(() => {
    const dailyMap = {};
    const daysInMonth = new Date(y, m, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }

    (transactions || []).forEach((tx) => {
      if (tx.type !== 'expense') return;
      const txDate = new Date(tx.date);
      // Double check that the transaction belongs to the same month and year
      if (txDate.getMonth() + 1 === m && txDate.getFullYear() === y) {
        const day = txDate.getDate();
        if (dailyMap[day] !== undefined) {
          dailyMap[day] += tx.amount;
        }
      }
    });

    return Object.entries(dailyMap).map(([day, total]) => ({
      day: Number(day),
      total,
    }));
  }, [transactions, m, y]);

  return (
    <div className="chart-card">
      <h2>Daily Spending — {monthLabel}</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={14} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#aaa' }}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#aaa' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v === 0 ? '' : `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,179,66,0.08)' }} />
          <Bar dataKey="total" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.day}
                fill={entry.total > 0 ? '#7cb342' : '#dcedc8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailySpendChart;
