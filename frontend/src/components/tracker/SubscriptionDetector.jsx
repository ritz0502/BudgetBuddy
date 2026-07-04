// frontend/src/components/tracker/SubscriptionDetector.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Info, X, TrendingUp, Calendar, Tag } from 'lucide-react';

const CATEGORY_ICONS = {
  Food: '🍔',
  Rent: '🏠',
  Transport: '🚗',
  Education: '📚',
  Entertainment: '🎬',
  Health: '💊',
  Shopping: '🛍️',
  Utilities: '⚡',
  Salary: '💰',
  Other: '📦',
};

const fmtAmt = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Toast = ({ message, type, onClose }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 28,
      right: 28,
      background: type === 'success' ? '#2d5016' : '#e53935',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: 10,
      fontWeight: 600,
      fontSize: '0.88rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      animation: 'fadeInUp 0.3s ease',
    }}
  >
    <span>{message}</span>
    <button
      onClick={onClose}
      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, lineHeight: 1 }}
    >
      <X size={14} />
    </button>
  </div>
);

const SubscriptionDetector = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null); // { subscriptions, totalMonthly }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null); // description being cancelled
  const [toast, setToast] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const getAuthHeader = () => ({ Authorization: `Bearer ${user?.token}` });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result } = await axios.get('/api/transactions/subscriptions', {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      setData(result);
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error('fetchSubscriptions error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchSubscriptions();
  }, [user, fetchSubscriptions]);

  const handleCancel = async (subscription) => {
    setCancelling(subscription.description);
    try {
      await axios.patch(
        '/api/transactions/subscriptions/cancel',
        { description: subscription.description },
        { headers: getAuthHeader(), withCredentials: true }
      );
      // Optimistically remove from list and refetch total
      setData((prev) => {
        if (!prev) return prev;
        const updated = prev.subscriptions.filter(
          (s) => s.description !== subscription.description
        );
        const totalMonthly = updated.reduce((sum, s) => sum + s.amount, 0);
        return { subscriptions: updated, totalMonthly };
      });
      showToast(`"${subscription.description}" marked as cancelled`);
    } catch (err) {
      showToast('Failed to cancel subscription', 'error');
      console.error('cancelSubscription error:', err);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="sub-detector-card">
      {/* Header */}
      <div className="sub-detector-header">
        <div className="sub-detector-title-row">
          <div>
            <h2 className="sub-detector-title">Recurring Subscriptions</h2>
            <p className="sub-detector-subtitle">Detected from your transaction history</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Info tooltip */}
            <div style={{ position: 'relative' }}>
              <button
                className="sub-info-btn"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                aria-label="How subscriptions are detected"
              >
                <Info size={16} />
              </button>
              {showTooltip && (
                <div className="sub-tooltip">
                  Subscriptions are auto-detected when the same expense appears across multiple months
                </div>
              )}
            </div>
            <button
              className="sub-refresh-btn"
              onClick={fetchSubscriptions}
              disabled={loading}
              title="Refresh subscriptions"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Total monthly cost */}
        {data && data.subscriptions.length > 0 && (
          <div className="sub-total-banner">
            <TrendingUp size={18} />
            <span>
              <strong>{fmtAmt(data.totalMonthly)}/month</strong> in subscriptions
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="sub-detector-body">
        {loading && (
          <div className="sub-loading">
            <div className="sub-spinner" />
            Detecting subscriptions…
          </div>
        )}

        {!loading && error && (
          <div className="sub-error">{error}</div>
        )}

        {!loading && !error && data && data.subscriptions.length === 0 && (
          <div className="sub-empty">
            <span style={{ fontSize: '2rem', marginBottom: 10 }}>🔍</span>
            <p>No recurring subscriptions detected yet</p>
            <p className="sub-empty-hint">
              Add a few months of transactions to enable detection
            </p>
          </div>
        )}

        {!loading && !error && data && data.subscriptions.length > 0 && (
          <ul className="sub-list">
            {data.subscriptions.map((sub) => (
              <li key={sub.description} className="sub-row">
                {/* Category icon */}
                <div className="sub-icon">
                  {CATEGORY_ICONS[sub.category] || '📦'}
                </div>

                {/* Info */}
                <div className="sub-info">
                  <div className="sub-desc">{sub.description}</div>
                  <div className="sub-meta">
                    <span className="sub-badge">{sub.category}</span>
                    <span className="sub-meta-item">
                      <Calendar size={11} />
                      Last: {fmtDate(sub.lastCharged)}
                    </span>
                    <span className="sub-meta-item">
                      <Tag size={11} />
                      {sub.monthsDetected} months detected
                    </span>
                  </div>
                </div>

                {/* Amount + cancel */}
                <div className="sub-right">
                  <div className="sub-amount">{fmtAmt(sub.amount)}/mo</div>
                  <button
                    className="sub-cancel-btn"
                    onClick={() => handleCancel(sub)}
                    disabled={cancelling === sub.description}
                    title="Mark as cancelled"
                  >
                    {cancelling === sub.description ? '…' : 'Mark cancelled'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SubscriptionDetector;
