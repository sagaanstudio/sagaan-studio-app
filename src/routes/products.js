const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

router.get('/', listProducts);
router.get('/:id', getProduct);

router.use(protect);
router.post('/', requireRole('admin'), createProduct);
router.patch('/:id', requireRole('admin'), updateProduct);
router.delete('/:id', requireRole('admin'), deleteProduct);

module.exports = router;
