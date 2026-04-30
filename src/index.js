require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();

// CORS — allow all origins (mobile app + web)
app.use(cors({
  origin: true,
  credentials: false,
}));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,Content-Type,Authorization,Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { message: 'Too many requests' } }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/garment-designs', require('./routes/garmentDesigns'));
app.use('/api/customization-fields', require('./routes/customizationFields'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// One-time setup — creates admin if none exists
app.post('/setup', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return res.json({ message: 'Admin already exists', email: existing.email });
    const hashed = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      email: 'admin@sagaan.in', password: hashed,
      name: 'Master Ravi', role: 'admin',
      shopName: 'Sagaan Atelier', initials: 'MR',
    });
    res.json({ message: 'Admin created!', email: admin.email, password: 'admin123' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Sagaan API running on :${PORT}`)))
  .catch(err => { console.error('DB connection failed:', err); process.exit(1); });
