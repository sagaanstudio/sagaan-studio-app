const Order = require('../models/Order');
const User = require('../models/User');

const PRODUCTION_STATUSES = ['cutting', 'stitching', 'finishing', 'ready', 'delivered'];
const NEXT_STATUS = {
  approved:   'assigned',
  assigned:   'cutting',
  cutting:    'stitching',
  stitching:  'finishing',
  finishing:  'ready',
  ready:      'delivered',
};

// GET /api/orders
async function listOrders(req, res) {
  const { status, search, page = 1, limit = 50, assignedTo, pending } = req.query;
  const query = { isDeleted: false };

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  }
  if (req.user.role === 'worker') {
    query.assignedTo = req.user._id;
  }
  if (status) query.status = { $in: status.split(',') };
  if (assignedTo) query.assignedTo = assignedTo;
  if (pending === 'approval') query.status = 'pending_approval';

  if (search) {
    const customers = await User.find({
      $or: [
        { name:  { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
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
      .populate('assignedTo', 'name workerRole initials load')
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
    .populate('customer', 'name phone initials measurements email')
    .populate('assignedTo', 'name workerRole initials load');

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

  // Admin/walk-in orders skip payment+approval and start at 'approved'
  // User app orders start at 'pending_payment'
  const isAdminOrder = ['admin', 'worker'].includes(req.user.role);
  const initialStatus = isAdminOrder ? 'approved' : 'pending_payment';

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
    channel:         channel         || (isAdminOrder ? 'shop' : 'app'),
    notes:           notes           || '',
    status: initialStatus,
    history: [{
      status: initialStatus,
      at:     new Date(),
      byName: req.user.name || 'System',
      byId:   req.user._id,
      note:   isAdminOrder ? 'Order created by admin' : 'Order placed by customer',
    }],
  });

  await order.populate('customer', 'name phone initials');
  res.status(201).json(order);
}

// PATCH /api/orders/:id/approve
async function approveOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== 'pending_approval') {
    return res.status(400).json({ message: 'Order is not pending approval' });
  }

  order.status = 'approved';
  order.approvedAt = new Date();
  order.approvedBy = req.user._id;
  order.history.push({
    status: 'approved',
    at: new Date(),
    byName: req.user.name,
    byId: req.user._id,
    note: req.body.note || 'Approved by admin',
  });

  await order.save();
  await order.populate('customer', 'name phone initials');
  await order.populate('assignedTo', 'name workerRole initials load');
  res.json(order);
}

// PATCH /api/orders/:id/reject
async function rejectOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!['pending_approval', 'pending_payment'].includes(order.status)) {
    return res.status(400).json({ message: 'Cannot reject this order' });
  }

  order.status = 'rejected';
  order.rejectedAt = new Date();
  order.rejectedReason = req.body.reason || '';
  order.history.push({
    status: 'rejected',
    at: new Date(),
    byName: req.user.name,
    byId: req.user._id,
    note: req.body.reason || 'Rejected by admin',
  });

  await order.save();
  await order.populate('customer', 'name phone initials');
  res.json(order);
}

// PATCH /api/orders/:id/status  — advance to next status
async function advanceStatus(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order || order.isDeleted) return res.status(404).json({ message: 'Order not found' });

  const nextStatus = NEXT_STATUS[order.status];
  if (!nextStatus) return res.status(400).json({ message: 'Cannot advance from current status' });

  // Assigned status requires assignedTo
  if (order.status === 'approved' && !order.assignedTo) {
    return res.status(400).json({ message: 'Assign a karigar before advancing' });
  }

  order.status = nextStatus;
  order.history.push({
    status: nextStatus,
    at: new Date(),
    byName: req.user.name,
    byId: req.user._id,
    note: req.body.note || '',
  });

  await order.save();
  await order.populate('customer', 'name phone initials');
  await order.populate('assignedTo', 'name workerRole initials load');
  res.json(order);
}

// PATCH /api/orders/:id/assign
async function assignWorker(req, res) {
  const { workerId, stitchingNotes } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const worker = await User.findById(workerId);
  if (!worker || !['worker', 'admin'].includes(worker.role)) {
    return res.status(404).json({ message: 'Worker not found' });
  }

  order.assignedTo = worker._id;
  if (stitchingNotes) order.stitchingNotes = stitchingNotes;

  // Auto-advance from approved to assigned
  if (order.status === 'approved') {
    order.status = 'assigned';
    order.history.push({
      status: 'assigned',
      at: new Date(),
      byName: req.user.name,
      byId: req.user._id,
      note: `Assigned to ${worker.name}`,
    });
  }

  await order.save();
  await order.populate('customer', 'name phone initials');
  await order.populate('assignedTo', 'name workerRole initials load');
  res.json(order);
}

// PATCH /api/orders/:id/payment
async function recordPayment(req, res) {
  const { amount } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.paid = Math.min(order.paid + Number(amount), order.price);

  // Auto-advance: if 50% or more is paid, move from pending_payment to pending_approval
  if (order.status === 'pending_payment' && order.price > 0 && order.paid >= order.price * 0.5) {
    order.status = 'pending_approval';
    order.history.push({
      status: 'pending_approval',
      at: new Date(),
      byName: 'System',
      note: `50% advance received (₹${order.paid}) — awaiting admin approval`,
    });
  }

  await order.save();
  res.json(order);
}

// PATCH /api/orders/:id
async function updateOrder(req, res) {
  const allowed = ['notes', 'stitchingNotes', 'dueDate', 'price', 'fabric', 'fabricClass', 'product', 'garmentCategory', 'garmentDesign', 'customizations', 'status'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('customer', 'name phone initials')
    .populate('assignedTo', 'name workerRole initials');

  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
}

// GET /api/orders/stats
async function getStats(req, res) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear  = new Date(now.getFullYear(), 0, 1);

  const [byStatus, revenue, monthly, yearly] = await Promise.all([
    Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
        _id: null,
        totalRevenue:   { $sum: '$price' },
        totalCollected: { $sum: '$paid' },
        totalOrders:    { $sum: 1 },
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

  const statusMap = Object.fromEntries(byStatus.map(s => [s._id, s.count]));
  const rev = revenue[0] || { totalRevenue: 0, totalCollected: 0, totalOrders: 0 };
  const mon = monthly[0] || { revenue: 0, orders: 0 };
  const yr  = yearly[0]  || { revenue: 0, orders: 0 };

  const inProduction = (statusMap.assigned || 0) + (statusMap.cutting || 0) + (statusMap.stitching || 0) + (statusMap.finishing || 0);

  res.json({
    byStatus,
    statusMap,
    pendingApproval: statusMap.pending_approval || 0,
    pendingPayment:  statusMap.pending_payment  || 0,
    inProduction,
    ready:           statusMap.ready      || 0,
    delivered:       statusMap.delivered  || 0,
    totalOrders:     rev.totalOrders,
    totalRevenue:    rev.totalRevenue,
    totalCollected:  rev.totalCollected,
    pendingCollection: rev.totalRevenue - rev.totalCollected,
    monthlyRevenue:  mon.revenue,
    monthlyOrders:   mon.orders,
    yearlyRevenue:   yr.revenue,
    yearlyOrders:    yr.orders,
  });
}

module.exports = { listOrders, getOrder, createOrder, approveOrder, rejectOrder, advanceStatus, assignWorker, recordPayment, updateOrder, getStats };
