const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  listOrders, getOrder, createOrder,
  approveOrder, rejectOrder, advanceStatus,
  assignWorker, recordPayment, updateOrder, getStats,
} = require('../controllers/orderController');

router.use(protect);

router.get('/stats', requireRole('admin'), getStats);
router.get('/', listOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/:id', requireRole('admin', 'worker'), updateOrder);
router.patch('/:id/approve', requireRole('admin'), approveOrder);
router.patch('/:id/reject', requireRole('admin'), rejectOrder);
router.patch('/:id/status', requireRole('admin', 'worker'), advanceStatus);
router.patch('/:id/assign', requireRole('admin'), assignWorker);
router.patch('/:id/payment', recordPayment);

module.exports = router;
