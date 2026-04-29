const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function userPayload(user) {
  return {
    id:       user._id,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    initials: user.initials,
  };
}

// POST /api/auth/register
// Body: { email, password, name }
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name?.trim()) {
      return res.status(400).json({ message: 'Email, password and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed,
      name: name.trim(),
      role: 'customer',
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: userPayload(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// POST /api/auth/login
// Body: { email, password }
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact support.' });
    }

    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({ token, user: userPayload(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
