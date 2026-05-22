// frontend/src/components/tracker/CategoryPieChart.jsx
import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { Edit2, Save, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['#2d5016', '#4a7c1f', '#7cb342', '#a5d66a', '#c5e1a5', '#8bc34a', '#aed581', '#c5e1a5', '#dcedc8'];

const fmtAmt = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

const CategoryPieChart = ({ categoryBreakdown = [], month, year, onSuccess }) => {
  const { user } = useAuth();
  const [activeEditCategory, setActiveEditCategory] = useState(null);
  const [limitInput, setLimitInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Total expenses is sum of all category totals
  const pieData = categoryBreakdown.filter((item) => item.total > 0);
  const totalExpenses = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);

  const handleEditClick = (category, currentLimit) => {
    setActiveEditCategory(category);
    setLimitInput(currentLimit !== null ? currentLimit.toString() : '');
  };

  const handleCancelClick = () => {
    setActiveEditCategory(null);
    setLimitInput('');
  };

  const handleSaveClick = async (category) => {
    if (limitInput === '' || isNaN(Number(limitInput)) || Number(limitInput) < 0) {
      alert('Please enter a valid non-negative number.');
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        '/api/budgets',
        {
          category,
          limit: Number(limitInput),
          month,
          year,
        },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
          withCredentials: true,
        }
      );
      setActiveEditCategory(null);
      setLimitInput('');
      onSuccess?.();
    } catch (err) {
      console.error('Error saving budget limit:', err);
      alert(err.response?.data?.message || 'Failed to save budget limit.');
    } finally {
      setSaving(false);
    }
  };

  const getProgressBarColorClass = (percent) => {
    if (percent === null) return '';
    if (percent < 80) return 'progress-green';
    if (percent <= 100) return 'progress-amber';
    return 'progress-red';
  };

  return (
    <div className="pie-card">
      <h2>Expenses by Category & Budgets</h2>

      {categoryBreakdown.length === 0 ? (
        <div className="pie-empty">No expense data for this month</div>
      ) : (
        <>
          {/* Recharts Donut Pie Chart */}
          {pieData.length === 0 ? (
            <div className="pie-no-data-text">No expenses to display in chart</div>
          ) : (
            <div className="pie-chart-section">
              <div className="pie-recharts-container">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={2}
                      label={false}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={entry.category} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [fmtAmt(value), name]}
                      contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Legend */}
              <div className="pie-chart-legend">
                {pieData.map((item, idx) => {
                  const percent = totalExpenses > 0 ? ((item.total / totalExpenses) * 100).toFixed(1) : 0;
                  return (
                    <div key={item.category} className="legend-row">
                      <div className="legend-label">
                        <span
                          className="legend-dot"
                          style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="legend-category-name">{item.category}</span>
                      </div>
                      <span className="legend-percent">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget Progress & Limit Controls */}
          <div className="budget-breakdown-section">
            <h3>Monthly Budget Breakdown</h3>
            <div className="budget-rows-container">
              {categoryBreakdown.map((item) => {
                const isEditing = activeEditCategory === item.category;
                const isOver = item.percentUsed !== null && item.percentUsed > 100;

                return (
                  <div key={item.category} className="budget-category-row">
                    {/* Category Label and Total Spent */}
                    <div className="budget-row-top">
                      <div className="budget-category-label">
                        <span className="budget-category-txt">{item.category}</span>
                        {isOver && (
                          <span className="over-budget-badge">
                            <AlertTriangle size={10} /> Over budget
                          </span>
                        )}
                      </div>
                      <div className="budget-amount-txt">
                        <span className="spent-amt">{fmtAmt(item.total)}</span>
                        {item.limit !== null && (
                          <span className="limit-amt"> / {fmtAmt(item.limit)}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar (Only show if limit is set) */}
                    {item.limit !== null && (
                      <div className="budget-progress-container">
                        <div
                          className={`budget-progress-fill ${getProgressBarColorClass(item.percentUsed)}`}
                          style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                        />
                        <span className="progress-percent-label">{item.percentUsed}% used</span>
                      </div>
                    )}

                    {/* Set Limit Inline Form or Button */}
                    <div className="budget-limit-action">
                      {isEditing ? (
                        <div className="limit-edit-form">
                          <input
                            type="number"
                            min="0"
                            placeholder="Limit"
                            value={limitInput}
                            onChange={(e) => setLimitInput(e.target.value)}
                            disabled={saving}
                            className="limit-inline-input"
                          />
                          <button
                            onClick={() => handleSaveClick(item.category)}
                            disabled={saving}
                            className="btn-limit-save"
                            title="Save limit"
                          >
                            <Save size={13} />
                          </button>
                          <button
                            onClick={handleCancelClick}
                            disabled={saving}
                            className="btn-limit-cancel"
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(item.category, item.limit)}
                          className="btn-limit-toggle"
                        >
                          <Edit2 size={11} style={{ marginRight: 4 }} />
                          {item.limit !== null ? 'Edit limit' : 'Set limit'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryPieChart;
