const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const { listFields, createField, updateField, deleteField, seedFields } = require('../controllers/customizationFieldController');

router.get('/', listFields);

router.use(protect);
router.post('/seed', requireRole('admin'), seedFields);
router.post('/', requireRole('admin'), createField);
router.patch('/:id', requireRole('admin'), updateField);
router.delete('/:id', requireRole('admin'), deleteField);

module.exports = router;
