import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SellModal = ({ isOpen, onClose, sellData, onSellSuccess }) => {
  const { user } = useAuth();
  if (!isOpen || !sellData) return null;

  const { symbol, maxQuantity, currentPrice } = sellData;
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const handleSell = async () => {
    const qty = Number(quantity);
    if (!qty || qty <= 0 || qty > maxQuantity) {
      setError(`Please enter a valid quantity between 1 and ${maxQuantity}.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const res = await axios.post('/api/investlab/sell', {
        symbol,
        quantity: qty,
        price: currentPrice
      }, {
        headers: { Authorization: `Bearer ${user?.token}` },
        withCredentials: true
      });

      if (onSellSuccess) onSellSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0' }}>Sell {symbol}</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
            <span>Available to sell</span>
            <span style={{ fontWeight: 600 }}>{maxQuantity} shares</span>
          </div>
          <input 
            type="number" 
            className="invest-input" 
            placeholder="Quantity to sell" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            max={maxQuantity}
          />
        </div>

        <div style={{ marginBottom: '24px', padding: '12px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
            <span style={{ color: '#666' }}>Current Price</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(currentPrice)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: '#666' }}>Estimated Return</span>
            <span style={{ fontWeight: 600, color: '#2d5016' }}>{formatCurrency((Number(quantity) || 0) * currentPrice)}</span>
          </div>
        </div>

        {error && <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-invest" 
            style={{ background: '#eee', color: '#333', flex: 1 }} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn-invest" 
            style={{ flex: 1 }} 
            onClick={handleSell} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Sell'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellModal;
