// frontend/src/pages/TrackerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SummaryBar from '../components/tracker/SummaryBar';
import TransactionForm from '../components/tracker/TransactionForm';
import TransactionList from '../components/tracker/TransactionList';
import DailySpendChart from '../components/tracker/DailySpendChart';
import CategoryPieChart from '../components/tracker/CategoryPieChart';
import './tracker.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TrackerPage = () => {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);

  // Lift editing transaction state
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/tracker' } });
    }
  }, [user, authLoading, navigate]);

  const getAuthHeader = () => ({
    Authorization: `Bearer ${user?.token}`,
  });

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const { data } = await axios.get(
        `/api/transactions/summary?month=${month}&year=${year}`,
        { headers: getAuthHeader(), withCredentials: true }
      );
      setSummary(data);
    } catch (err) {
      console.error('Summary fetch error:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [month, year]);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data } = await axios.get(
        `/api/transactions?month=${month}&year=${year}`,
        { headers: getAuthHeader(), withCredentials: true }
      );
      setTransactions(data);
    } catch (err) {
      console.error('Transactions fetch error:', err);
    } finally {
      setTxLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (user) {
      fetchSummary();
      fetchTransactions();
    }
  }, [user, month, year, fetchSummary, fetchTransactions]);

  const handleRefresh = () => {
    fetchSummary();
    fetchTransactions();
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setEditingTransaction(null); // Cancel edit on navigation
  };

  const handleNextMonth = () => {
    const today = new Date();
    const isCurrent = (year === today.getFullYear()) && (month === today.getMonth() + 1);
    if (isCurrent) return; // Prevent future navigation

    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setEditingTransaction(null); // Cancel edit on navigation
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return (year === today.getFullYear()) && (month === today.getMonth() + 1);
  };

  if (authLoading) {
    return (
      <div className="tracker-page">
        <div className="tracker-inner">
          <div className="tx-loading">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="tracker-page">
      <div className="tracker-inner">
        {/* Header */}
        <div className="tracker-header">
          <h1>Expense Tracker</h1>
          <p>Track your income and expenses · Smart Budgeting</p>
        </div>

        {/* Summary Cards */}
        <SummaryBar summary={summary} loading={summaryLoading} />

        {/* Two-column: Form + List */}
        <div className="tracker-main-row">
          <TransactionForm
            onSuccess={handleRefresh}
            editingTransaction={editingTransaction}
            setEditingTransaction={setEditingTransaction}
          />
          <div className="list-column">
            {/* Month Navigation Row */}
            <div className="month-navigation">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="btn-month-nav"
                title="Previous Month"
              >
                ‹
              </button>
              <span className="month-nav-label">{MONTH_NAMES[month - 1]} {year}</span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="btn-month-nav"
                disabled={isCurrentMonth()}
                title="Next Month"
              >
                ›
              </button>
            </div>

            <TransactionList
              transactions={transactions}
              loading={txLoading}
              onDelete={handleRefresh}
              setEditingTransaction={setEditingTransaction}
            />
          </div>
        </div>

        {/* Charts Row: Donut + Spend */}
        <div className="tracker-charts-row">
          <CategoryPieChart
            categoryBreakdown={summary?.categoryBreakdown || []}
            month={month}
            year={year}
            onSuccess={handleRefresh}
          />
          <DailySpendChart transactions={transactions} month={month} year={year} />
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;
