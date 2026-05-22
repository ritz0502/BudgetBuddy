// frontend/src/pages/StocksPage.jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';

const StocksPage = () => (
  <div style={{
    minHeight: '100vh',
    background: '#f4f8ef',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    paddingTop: '80px',
    color: '#2d5016',
    fontFamily: 'Poppins, sans-serif',
  }}>
    <TrendingUp size={56} color="#7cb342" strokeWidth={1.5} />
    <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Stocks & Investments</h1>
    <p style={{ color: '#888', margin: 0 }}>Coming soon — we're building something great 📈</p>
  </div>
);

export default StocksPage;
