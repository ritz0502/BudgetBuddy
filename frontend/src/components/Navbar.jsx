// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Wallet from './Wallet';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Read directly from AuthContext — always in sync with in-memory token
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();  // clears cookie + in-memory state
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Tracker', path: '/tracker' },
    { name: 'Stocks', path: '/stocks' },
    { name: 'Quizzes', path: '/quizzes' },
    { name: 'Scholarships', path: '/scholarships' },
  ];


  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Wallet size={24} />
            Budget Buddy
          </Link>

          <ul className="navbar-nav">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Avatar circle */}
                <div style={{
                  width: 34, height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4a7c1f, #7cb342)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#333' }}>
                  {user.name?.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#888', padding: '4px', borderRadius: 6,
                    display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e53935'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" state={{ from: location.pathname }} className="btn-primary">
                  Log In
                </Link>
                <Link to="/signup" state={{ from: location.pathname }} className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>


          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;