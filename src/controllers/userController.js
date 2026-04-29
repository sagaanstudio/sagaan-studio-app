const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /api/users/customers
async function listCustomers(req, res) {
  const { search, page = 1, limit = 20 } = req.query;
  const query = { role: 'customer', isActive: true };

  if (search) {
    query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({ customers, total });
}

// GET /api/users/workers
async function listWorkers(req, res) {
  const workers = await User.find({ role: 'worker', isActive: true }).sort({ name: 1 });
  res.json(workers);
}

// GET /api/users/:id
async function getUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

// PATCH /api/users/me
async function updateMe(req, res) {
  const allowed = ['name', 'email', 'measurements'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json(user);
}

// PATCH /api/users/:id/measurements
async function updateMeasurements(req, res) {
  const { measurements } = req.body;
  const isOwn = String(req.params.id) === String(req.user._id);
  if (!isOwn && req.user.role === 'customer') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { measurements }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

// POST /api/users/workers  (admin creates workers)
async function createWorker(req, res) {
  try {
    const { name, email, password, workerRole } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const worker = await User.create({
      name, email: email.toLowerCase(), password: hashed,
      role: 'worker', workerRole, load: 0,
    });
    res.status(201).json(worker);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = { listCustomers, listWorkers, getUser, updateMe, updateMeasurements, createWorker };
