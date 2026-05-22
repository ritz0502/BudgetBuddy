import React from 'react';
import Wallet from './Wallet';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            {/* Added a custom style to the h4 to align it with the icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Wallet size={20} color="#e8f5e8" />
              <h4 style={{ margin: 0 }}>Budget Buddy</h4>
            </div>
            <p style={{ color: '#ccc', fontSize: '0.9rem' }}>
              Your friendly way to manage your money wisely.
            </p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Budget Buddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;