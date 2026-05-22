// frontend/src/pages/ScholarshipsPage.jsx
import React from 'react';
import { GraduationCap } from 'lucide-react';

const ScholarshipsPage = () => (
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
    <GraduationCap size={56} color="#7cb342" strokeWidth={1.5} />
    <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Scholarships & Grants</h1>
    <p style={{ color: '#888', margin: 0 }}>Coming soon — explore financial aid opportunities 🎓</p>
  </div>
);

export default ScholarshipsPage;
