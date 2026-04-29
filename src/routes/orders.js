const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  listOrders, getOrder, createOrder, advanceStage,
  assignWorker, recordPayment, updateOrder, getStats,
} = require('../controllers/orderController');

router.use(protect);

router.get('/stats', requireRole('admin'), getStats);
router.get('/', listOrders);
router.post('/', requireRole('admin', 'worker'), createOrder);
router.get('/:id', getOrder);
router.patch('/:id', requireRole('admin', 'worker'), updateOrder);
router.patch('/:id/stage', requireRole('admin', 'worker'), advanceStage);
router.patch('/:id/assign', requireRole('admin'), assignWorker);
router.patch('/:id/payment', requireRole('admin'), recordPayment);

module.exports = router;
