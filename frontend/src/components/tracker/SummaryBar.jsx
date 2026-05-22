// frontend/src/components/tracker/SummaryBar.jsx
import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN');

const SummaryBar = ({ summary, loading }) => {
  return (
    <div className="summary-bar">
      {/* Total Income */}
      <div className="summary-card">
        <div className="summary-card-label">
          <TrendingUp size={14} color="#2d5016" />
          Total Income
        </div>
        <div className="summary-card-amount income">
          {loading ? '…' : fmt(summary?.totalIncome)}
        </div>
      </div>

      {/* Total Expenses */}
      <div className="summary-card">
        <div className="summary-card-label">
          <TrendingDown size={14} color="#e53935" />
          Total Expenses
        </div>
        <div className="summary-card-amount expense">
          {loading ? '…' : fmt(summary?.totalExpenses)}
        </div>
      </div>

      {/* Net Balance */}
      <div className="summary-card">
        <div className="summary-card-label">
          <Wallet size={14} color="#2d5016" />
          Net Balance
        </div>
        <div className="summary-card-amount balance">
          {loading ? '…' : fmt(summary?.netBalance)}
        </div>
      </div>
    </div>
  );
};

export default SummaryBar;
