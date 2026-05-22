import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import './AuthPage.css';

const LoginPage = () => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        formData,
        { withCredentials: true }
      );

      login(response.data);
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className="auth-wrapper">
      <Link to="/" className="back-link">← Back to Dashboard</Link>

      {/* LEFT PANEL (UNCHANGED UI) */}
      <div className="auth-panel">
        <div className="auth-blob" />
        <div className="auth-illustration">
          <div className="calc-icon">
            <div className="calc-body">
              <div className="calc-screen" />
              <div className="calc-keys">
                {['x', 'y', '+', '−', '×', '÷', '=', '0'].map((k) => (
                  <span key={k} className="calc-key">{k}</span>
                ))}
              </div>
            </div>
            <div className="float-chip chip-1">$</div>
            <div className="float-chip chip-2">%</div>
            <div className="float-chip chip-3">¥</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                name="password"
                type="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn-auth btn-signup">
              Sign In
            </button>

            <div className="auth-divider"><span>or</span></div>

            <Link to="/signup" className="btn-auth btn-signin">
              Sign Up
            </Link>
          </form>

          <p className="auth-footer-text">
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;