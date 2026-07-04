// frontend/src/components/tracker/TransactionList.jsx
import React, { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Category icon map (emoji icons)
const CATEGORY_ICONS = {
  Food:          '🍽️',
  Rent:          '🏠',
  Transport:     '🚗',
  Education:     '📚',
  Entertainment: '🎬',
  Health:        '💊',
  Shopping:      '🛍️',
  Utilities:     '💡',
  Salary:        '💼',
  Other:         '💰',
};

const fmtDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' });
};

const fmtAmt = (type, amount) => {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}₹${Number(amount).toLocaleString('en-IN')}`;
};

const TABS = ['All', 'Income', 'Expense'];

const TransactionList = ({ transactions, loading, onDelete, setEditingTransaction }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  const filtered = transactions.filter((tx) => {
    if (activeTab === 'All') return true;
    return tx.type === activeTab.toLowerCase();
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      setDeletingId(id);
      await axios.delete(`/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
        withCredentials: true,
      });
      onDelete?.();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="list-card">
      <div className="list-card-header">
        <h2>This Month's Transactions</h2>
        <div className="filter-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="tx-loading">Loading transactions…</div>}

      {!loading && filtered.length === 0 && (
        <div className="tx-empty">
          No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '} transactions this month
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="transaction-list">
          {filtered.map((tx) => (
            <li key={tx._id} className="transaction-row">
              <div className="tx-icon">
                {CATEGORY_ICONS[tx.category] || '💰'}
              </div>

              <div className="tx-info">
                <div className="tx-description">
                  {tx.description || tx.category}
                  {tx.receiptUrl && (
                    <span
                      style={{ marginLeft: '8px', cursor: 'pointer' }}
                      onClick={() => window.open(tx.receiptUrl, '_blank')}
                      title="View Receipt"
                    >
                      📎
                    </span>
                  )}
                </div>
                <div className="tx-meta">
                  {fmtDate(tx.date)}
                  <span className="tx-category-badge">{tx.category}</span>
                </div>
              </div>

              <span className={`tx-amount ${tx.type}`}>
                {fmtAmt(tx.type, tx.amount)}
              </span>

              <div className="tx-actions">
                <button
                  className="tx-edit-btn"
                  onClick={() => setEditingTransaction(tx)}
                  title="Edit transaction"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="tx-delete-btn"
                  onClick={() => handleDelete(tx._id)}
                  disabled={deletingId === tx._id}
                  title="Delete transaction"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionList;
