import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DollarSign, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Financial Calculator', path: '/calculator' },
    { name: 'Expense Tracker', path: '/expense-tracker' },
    { name: 'Quizzes', path: '/quizzes' },
    { name: 'Loans and Scholarships', path: '/loans-scholarships' },
    { name: 'Stocks and Investments', path: '/stocks-investments' }
  ];

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <DollarSign size={24} />
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
            <Link to="/login" className="btn-primary">
              Sign Up / Log In
            </Link>
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