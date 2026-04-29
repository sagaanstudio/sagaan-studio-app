const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const { listDesigns, createDesign, updateDesign, deleteDesign, seedDesigns } = require('../controllers/garmentDesignController');

router.get('/', listDesigns);

router.use(protect);
router.post('/seed', requireRole('admin'), seedDesigns);
router.post('/', requireRole('admin'), createDesign);
router.patch('/:id', requireRole('admin'), updateDesign);
router.delete('/:id', requireRole('admin'), deleteDesign);

module.exports = router;
