// frontend/src/components/investlab/HoldingsTable.jsx
import React from 'react';

const HoldingsTable = ({ portfolio, prices, onSellClick }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const holdings = portfolio?.holdings || [];

  const getCompanyName = (symbol) => {
    const names = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'NVDA': 'NVIDIA Corp.',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla, Inc.'
    };
    return names[symbol] || symbol;
  };

  return (
    <div className="investlab-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Current Holdings</h2>
        <div style={{ fontSize: '0.8rem', color: '#4285f4' }}>Updated: Live</div>
      </div>

      {holdings.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#888' }}>
          <p>Start your investing journey.</p>
          <p style={{ fontSize: '0.85rem' }}>Buy your first stock using virtual cash.</p>
        </div>
      ) : (
        <div className="investlab-table-container">
          <table className="investlab-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Bought At</th>
                <th>Current Price</th>
                <th>Gain/Loss Per Share</th>
                <th>Total P/L</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => {
                const currentPrice = prices[h.symbol] || h.avgBuyPrice || 0;
                const gainLossPerShare = currentPrice - (h.avgBuyPrice || 0);
                const totalPL = gainLossPerShare * h.quantity;
                const isProfit = totalPL >= 0;

                return (
                  <tr key={`${h.symbol}-${i}`}>
                    <td>
                      <div className="ticker-info">
                        <div className="ticker-avatar">{h.symbol.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{h.symbol}</div>
                          <div className="ticker-name">{getCompanyName(h.symbol)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{h.quantity}</td>
                    <td>{formatCurrency(h.avgBuyPrice)}</td>
                    <td>{formatCurrency(currentPrice)}</td>
                    <td className={gainLossPerShare >= 0 ? 'text-positive' : 'text-negative'} style={{ fontWeight: 600 }}>
                      {gainLossPerShare >= 0 ? '+' : ''}{formatCurrency(gainLossPerShare)}
                    </td>
                    <td className={isProfit ? 'text-positive' : 'text-negative'} style={{ fontWeight: 600 }}>
                      {isProfit ? '+' : ''}{formatCurrency(totalPL)}
                    </td>
                    <td>
                      <button className="btn-sell" onClick={() => onSellClick(h.symbol, h.quantity, currentPrice)}>
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HoldingsTable;
