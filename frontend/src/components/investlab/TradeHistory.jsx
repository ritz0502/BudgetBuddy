// frontend/src/components/investlab/TradeHistory.jsx
import React from 'react';

const TradeHistory = ({ trades }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div className="investlab-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Trade History</h2>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>Recent</div>
      </div>

      {!trades || trades.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
          No trades yet.
        </div>
      ) : (
        <ul className="trade-history-list">
          {trades.map((trade) => {
            const isBuy = trade.type && trade.type.toUpperCase() === 'BUY';
            return (
              <li key={trade.id || Math.random()} className="trade-item">
                <div className={`trade-dot ${isBuy ? '' : 'sell'}`}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#333' }}>
                    {isBuy ? 'BUY' : 'SELL'} {trade.symbol}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {isBuy ? 'Bought' : 'Sold'} {trade.quantity} shares • {formatCurrency(trade.price)} • {formatDate(trade.timestamp || trade.createdAt)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TradeHistory;
