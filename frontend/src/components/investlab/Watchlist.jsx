// frontend/src/components/investlab/Watchlist.jsx
import React from 'react';

const Watchlist = ({ prices }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  
  // Dummy data for static presentation with dynamic prices patched in
  const defaultWatchlist = [
    { symbol: 'AAPL', change: '+0.8%' },
    { symbol: 'MSFT', change: '+0.5%' },
    { symbol: 'NVDA', change: '+1.6%' },
    { symbol: 'GOOGL', change: '+0.3%' },
    { symbol: 'AMZN', change: '+0.2%' },
    { symbol: 'TSLA', change: '+2.1%' },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0' }}>Live Market Watchlist</h2>
      <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 16px 0' }}>Real market prices with a friendly learning view.</p>
      
      <div className="watchlist-grid">
        {defaultWatchlist.map((item) => {
          const currentPrice = prices[item.symbol] || 0;
          return (
            <div key={item.symbol} className="investlab-card watchlist-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.symbol}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f0f7e6', color: '#2d5016', padding: '2px 6px', borderRadius: '4px' }}>
                  {item.change}
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', color: '#555' }}>
                {currentPrice > 0 ? formatCurrency(currentPrice) : '---'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Watchlist;
