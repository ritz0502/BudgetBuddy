// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── Token helpers ──────────────────────────────────────────────────────────────

/** Access token: 15-minute lifetime, returned in response body */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

/** Refresh token: 7-day lifetime, stored in httpOnly cookie */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

/** Write the refresh token into a secure httpOnly cookie */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

// ── Signup ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    if (user) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      setRefreshCookie(res, refreshToken);

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        completedQuizzes: user.completedQuizzes || [],
        token: accessToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ── Login ──────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      setRefreshCookie(res, refreshToken);

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        completedQuizzes: user.completedQuizzes || [],
        token: accessToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ── Refresh ────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/refresh
// Reads the httpOnly refresh token cookie, verifies it, issues a new access token
const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      level: user.level,
      completedQuizzes: user.completedQuizzes || [],
      token: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// Clears the refresh token cookie
const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ message: 'Logged out successfully' });
};

// ── Get Me ─────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Leaderboard ────────────────────────────────────────────────────────────────
const getLeaderboard = async (req, res) => {
  try {
    const leaders = await User.find().select('name xp').sort({ xp: -1 }).limit(10);
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login, refresh, logout, getLeaderboard, getMe };