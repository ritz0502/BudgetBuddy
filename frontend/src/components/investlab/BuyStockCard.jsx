import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BuyStockCard = ({ prices, onBuySuccess }) => {
  const { user } = useAuth();
  const [symbol, setSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentPrice = prices[symbol] || 0;
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const availableSymbols = [
    { id: 'AAPL', name: 'Apple Inc.' },
    { id: 'MSFT', name: 'Microsoft Corp.' },
    { id: 'NVDA', name: 'NVIDIA Corp.' },
    { id: 'GOOGL', name: 'Alphabet Inc.' },
    { id: 'AMZN', name: 'Amazon.com Inc.' },
    { id: 'TSLA', name: 'Tesla, Inc.' }
  ];

  const handleBuy = async () => {
    if (!symbol || !quantity || quantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const res = await axios.post('/api/investlab/buy', {
        symbol,
        quantity: Number(quantity),
        price: currentPrice
      }, {
        headers: { Authorization: `Bearer ${user?.token}` },
        withCredentials: true
      });

      setSuccess(`Successfully bought ${quantity} shares of ${symbol}.`);
      setQuantity('');
      if (onBuySuccess) onBuySuccess();

      // Clear success message after 3s
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="investlab-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Buy Stock</h2>
        <div style={{ color: '#7cb342' }}>
          {/* dummy icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Symbol</label>
        <select 
          className="invest-input" 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value)}
          style={{ appearance: 'none', background: '#fff' }}
        >
          {availableSymbols.map(s => (
            <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Quantity</label>
        <input 
          type="number" 
          className="invest-input" 
          placeholder="10" 
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Current Price</label>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>
          {currentPrice > 0 ? formatCurrency(currentPrice) : '---'}
        </div>
      </div>

      {error && <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}
      {success && <div style={{ color: '#2e7d32', fontSize: '0.85rem', marginBottom: '12px' }}>{success}</div>}

      <button className="btn-invest" onClick={handleBuy} disabled={loading || !currentPrice}>
        {loading ? 'Processing...' : 'Buy with Virtual Cash'}
      </button>

      <div style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'center', marginTop: '12px' }}>
        This uses virtual money only.
      </div>
    </div>
  );
};

export default BuyStockCard;
