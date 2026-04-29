const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyFirebaseToken } = require('../config/firebase');

// Allowed email domains — extend this list as needed
const ALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.in',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'sagaan.in',      // custom domain
];

function isAllowedEmail(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function userPayload(user) {
  return {
    id:    user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    initials: user.initials,
  };
}

// POST /api/auth/register
// Body: { firebaseIdToken, email, name }
// Firebase has already created the account; we sync to MongoDB and issue JWT.
async function register(req, res) {
  const { firebaseIdToken, email, name } = req.body;

  if (!firebaseIdToken || !email || !name?.trim()) {
    return res.status(400).json({ message: 'firebaseIdToken, email, and name are required' });
  }

  if (!isAllowedEmail(email)) {
    return res.status(400).json({
      message: 'Email domain not allowed. Please use a Gmail, Yahoo, Outlook, or company email address.',
    });
  }

  let firebaseUid;
  try {
    const decoded = await verifyFirebaseToken(firebaseIdToken);
    firebaseUid = decoded.uid;

    // Ensure the token's email matches the claimed email
    if (decoded.email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ message: 'Token email mismatch' });
    }
  } catch {
    return res.status(401).json({ message: 'Invalid Firebase token' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
  }

  const user = await User.create({
    firebaseUid,
    email: email.toLowerCase(),
    name: name.trim(),
    role: 'customer',
  });

  const token = signToken(user._id);
  res.status(201).json({ token, user: userPayload(user) });
}

// POST /api/auth/login
// Body: { firebaseIdToken, email }
// Firebase has verified the password; we find the user and issue JWT.
async function login(req, res) {
  const { firebaseIdToken, email } = req.body;

  if (!firebaseIdToken || !email) {
    return res.status(400).json({ message: 'firebaseIdToken and email are required' });
  }

  let firebaseUid;
  try {
    const decoded = await verifyFirebaseToken(firebaseIdToken);
    firebaseUid = decoded.uid;

    if (decoded.email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ message: 'Token email mismatch' });
    }
  } catch {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // First-time login for an existing Firebase account — auto-create customer profile
    user = await User.create({ firebaseUid, email: email.toLowerCase(), role: 'customer' });
  } else {
    // Keep firebaseUid in sync
    if (!user.firebaseUid) {
      user.firebaseUid = firebaseUid;
      await user.save();
    }
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Account is deactivated. Contact support.' });
  }

  const token = signToken(user._id);
  res.json({ token, user: userPayload(user) });
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
