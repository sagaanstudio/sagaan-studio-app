const Order = require('../models/Order');
const User = require('../models/User');

const STAGES = ['measured', 'cutting', 'stitching', 'finishing', 'ready'];

// GET /api/orders  (admin: all; customer: own)
async function listOrders(req, res) {
  const { stage, assignedTo, search, page = 1, limit = 20 } = req.query;
  const query = { isDeleted: false };

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  }
  if (stage) query.stage = stage;
  if (assignedTo) query.assignedTo = assignedTo;

  if (search) {
    const customers = await User.find({
      $or: [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    const ids = customers.map(c => c._id);
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { customer: { $in: ids } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customer', 'name phone initials')
      .populate('assignedTo', 'name workerRole avatar load')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
}

// GET /api/orders/:id
async function getOrder(req, res) {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone initials measurements')
    .populate('assignedTo', 'name workerRole avatar load');

  if (!order || order.isDeleted) return res.status(404).json({ message: 'Order not found' });

  if (req.user.role === 'customer' && String(order.customer._id) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json(order);
}

// POST /api/orders
async function createOrder(req, res) {
  const {
    customerId, product, fabric, fabricClass,
    garmentCategory, garmentDesign, customizations,
    dueDate, price, channel, notes,
  } = req.body;

  const customer = await User.findById(customerId || req.user._id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const order = await Order.create({
    customer:        customer._id,
    product:         product || garmentDesign || garmentCategory || 'Custom Order',
    garmentCategory: garmentCategory || '',
    garmentDesign:   garmentDesign   || '',
    customizations:  customizations  || {},
    fabric:          fabric          || '',
    fabricClass:     fabricClass     || '',
    dueDate,
    price:           Number(price)   || 0,
    channel:         channel         || 'app',
    notes:           notes           || '',
    stage: 'measured',
    history: [{
      stage: 'measured',
      at: new Date(),
      byName: req.user.name || 'Admin',
      byId: req.user._id,
    }],
  });

  await order.populate('customer', 'name phone initials');
  res.status(201).json(order);
}

// PATCH /api/orders/:id/stage  — advance to next stage
async function advanceStage(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order || order.isDeleted) return res.status(404).json({ message: 'Order not found' });

  const nextIndex = order.stageIndex + 1;
  if (nextIndex > 4) return res.status(400).json({ message: 'Order already complete' });

  const nextStage = STAGES[nextIndex];
  order.stage = nextStage;
  order.history.push({
    stage: nextStage,
    at: new Date(),
    byName: req.user.name,
    byId: req.user._id,
  });

  await order.save();
  await order.populate('customer', 'name phone initials');
  await order.populate('assignedTo', 'name workerRole avatar load');
  res.json(order);
}

// PATCH /api/orders/:id/assign
async function assignWorker(req, res) {
  const { workerId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const worker = await User.findById(workerId);
  if (!worker || !['worker', 'admin'].includes(worker.role)) {
    return res.status(404).json({ message: 'Worker not found' });
  }

  order.assignedTo = worker._id;
  await order.save();
  res.json(order);
}

// PATCH /api/orders/:id/payment
async function recordPayment(req, res) {
  const { amount } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.paid = Math.min(order.paid + Number(amount), order.price);
  await order.save();
  res.json(order);
}

// PATCH /api/orders/:id
async function updateOrder(req, res) {
  const allowed = ['notes', 'dueDate', 'price', 'fabric', 'fabricClass', 'product', 'garmentCategory', 'garmentDesign', 'customizations', 'stage'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('customer', 'name phone initials')
    .populate('assignedTo', 'name workerRole avatar');

  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
}

// GET /api/orders/stats (admin only)
async function getStats(req, res) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear  = new Date(now.getFullYear(), 0, 1);

  const [byStage, revenue, monthly, yearly] = await Promise.all([
    Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$price' },
        totalCollected: { $sum: '$paid' },
        totalOrders: { $sum: 1 },
      }},
    ]),
    Order.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: '$price' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, revenue: { $sum: '$price' }, orders: { $sum: 1 } } },
    ]),
  ]);

  const stageMap = Object.fromEntries(byStage.map(s => [s._id, s.count]));
  const rev = revenue[0] || { totalRevenue: 0, totalCollected: 0, totalOrders: 0 };
  const mon = monthly[0] || { revenue: 0, orders: 0 };
  const yr  = yearly[0]  || { revenue: 0, orders: 0 };

  res.json({
    byStage:        stageMap,
    inProgress:     (stageMap.measured || 0) + (stageMap.cutting || 0) + (stageMap.stitching || 0) + (stageMap.finishing || 0),
    ready:          stageMap.ready || 0,
    totalOrders:    rev.totalOrders,
    totalRevenue:   rev.totalRevenue,
    totalCollected: rev.totalCollected,
    pendingPayment: rev.totalRevenue - rev.totalCollected,
    monthlyRevenue: mon.revenue,
    monthlyOrders:  mon.orders,
    yearlyRevenue:  yr.revenue,
    yearlyOrders:   yr.orders,
  });
}

module.exports = { listOrders, getOrder, createOrder, advanceStage, assignWorker, recordPayment, updateOrder, getStats };
