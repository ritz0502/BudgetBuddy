// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as BarTooltip, CartesianGrid,
} from 'recharts';
import { Wallet, TrendingDown, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SpendingForecast from '../components/dashboard/SpendingForecast';
import './dashboard.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#2d5016', '#4a7c1f', '#7cb342', '#a5d66a', '#c5e1a5', '#dcedc8'];

const CATEGORY_ICONS = {
  Food: '🍽️', Rent: '🏠', Transport: '🚗', Education: '📚',
  Entertainment: '🎬', Health: '💊', Shopping: '🛍️',
  Utilities: '💡', Salary: '💼', Other: '💰',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmtShortDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// XP → level thresholds (mirrors quiz logic)
const XP_PER_LEVEL = 1000;
const xpToNextLevel = (xp) => {
  const levelXp = xp % XP_PER_LEVEL;
  return { levelXp, toNext: XP_PER_LEVEL - levelXp };
};

// ── Custom Tooltips ───────────────────────────────────────────────────────────
const BarTooltipContent = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0',
        borderRadius: 8, padding: '8px 14px',
        fontSize: '0.82rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ color: '#888', marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 700, color: '#2d5016' }}>
          {fmt(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${currentYear}`;

  const [summary, setSummary] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [user, authLoading, navigate]);

  const getAuthHeader = () => ({
    Authorization: `Bearer ${user?.token}`,
  });

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const cfg = { headers, withCredentials: true };

      const [summaryRes, recentRes, overviewRes] = await Promise.all([
        axios.get(`/api/transactions/summary?month=${currentMonth}&year=${currentYear}`, cfg),
        axios.get('/api/transactions?limit=5', cfg),
        axios.get('/api/transactions/monthly-overview', cfg),
      ]);

      setSummary(summaryRes.data);
      setRecentTx(recentRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth, currentYear]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (authLoading || loading) {
    return (
      <div className="dashboard-page">
        <div className="db-loading">Loading your dashboard…</div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || 'there';
  const { levelXp, toNext } = xpToNextLevel(user.xp || 0);
  const xpPercent = Math.min(100, Math.round((levelXp / XP_PER_LEVEL) * 100));

  // Pie chart data — only categories with data
  const pieData = (summary?.categoryBreakdown || []).filter((c) => c.total > 0);
  const totalExpenses = summary?.totalExpenses || 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-inner">

        {/* Greeting */}
        <div className="dashboard-greeting">
          <h1>{getGreeting()}, {firstName} 👋</h1>
          <p>Here's your financial snapshot for {monthLabel}</p>
        </div>

        {/* ── Row 1: Stat Cards ── */}
        <div className="db-stat-row">
          {/* Current Balance */}
          <div className="db-stat-card">
            <div className="db-stat-card-top">
              <span className="db-stat-label">Current Balance</span>
              <Wallet size={18} className="db-stat-icon" />
            </div>
            <div className="db-stat-value green">{fmt(summary?.netBalance)}</div>
            <div className="db-stat-sub">This month</div>
          </div>

          {/* Total Expenses */}
          <div className="db-stat-card">
            <div className="db-stat-card-top">
              <span className="db-stat-label">Total Expenses</span>
              <TrendingDown size={18} color="#ffcdd2" />
            </div>
            <div className="db-stat-value red">{fmt(summary?.totalExpenses)}</div>
            <div className="db-stat-sub">This month</div>
          </div>

          {/* Quiz XP */}
          <div className="db-stat-card">
            <div className="db-stat-card-top">
              <span className="db-stat-label">Quiz XP</span>
              <Trophy size={18} color="#c5e1a5" />
            </div>
            <div className="db-stat-value green">{(user.xp || 0).toLocaleString()}</div>
            <div className="xp-level-row">
              <span>Level {user.level || 1}</span>
              <span>{toNext.toLocaleString()} XP to next</span>
            </div>
            <div className="xp-progress-bar">
              <div className="xp-progress-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* ── Row 2: Pie + Recent Transactions ── */}
        <div className="db-middle-row">

          {/* Spending by Category */}
          <div className="db-card">
            <h2>Spending by Category</h2>

            {pieData.length === 0 ? (
              <div className="pie-no-data">No expense data for {monthLabel}</div>
            ) : (
              <div className="pie-chart-wrapper">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={2}
                      label={false}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={entry.category} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <PieTooltip
                      formatter={(value, name) => [fmt(value), name]}
                      contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }}
                    />
                    {/* Center label */}
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="pie-legend">
                  {pieData.map((entry, idx) => {
                    const pct = totalExpenses > 0
                      ? Math.round((entry.total / totalExpenses) * 100)
                      : 0;
                    return (
                      <div key={entry.category} className="pie-legend-item">
                        <div
                          className="pie-legend-dot"
                          style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span>{entry.category}</span>
                        <span className="pie-legend-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="db-card">
            <div className="db-card-header">
              <h2>Recent Transactions</h2>
              <Link to="/tracker" className="view-all-link">View All</Link>
            </div>

            {recentTx.length === 0 ? (
              <div className="recent-tx-empty">No recent transactions</div>
            ) : (
              <ul className="recent-tx-list">
                {recentTx.map((tx) => (
                  <li key={tx._id} className="recent-tx-row">
                    <div className="recent-tx-icon">
                      {CATEGORY_ICONS[tx.category] || '💰'}
                    </div>
                    <div className="recent-tx-info">
                      <div className="recent-tx-desc">{tx.description || tx.category}</div>
                      <div className="recent-tx-date">{fmtShortDate(tx.date)}</div>
                    </div>
                    <span className={`recent-tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Row 3: Monthly Spending Overview ── */}
        <div className="db-full-card">
          <h2>Monthly Spending Overview</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={overview}
              barSize={28}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#aaa' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#aaa' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v === 0 ? '0' : `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                width={44}
              />
              <BarTooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(124,179,66,0.08)' }} />
              <Bar dataKey="total" fill="#7cb342" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Row 4: Spending Forecast ── */}
        <SpendingForecast />

      </div>
    </div>
  );
};

export default DashboardPage;
