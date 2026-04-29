const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  listCustomers, listWorkers, getUser,
  updateMe, updateMeasurements, createWorker,
} = require('../controllers/userController');

router.use(protect);

router.get('/customers', requireRole('admin', 'worker'), listCustomers);
router.get('/workers', requireRole('admin'), listWorkers);
router.post('/workers', requireRole('admin'), createWorker);
router.patch('/me', updateMe);
router.get('/:id', getUser);
router.patch('/:id/measurements', updateMeasurements);

module.exports = router;
