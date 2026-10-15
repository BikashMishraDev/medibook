const express = require('express');
const router = express.Router();
const { getStats, getAllAppointments } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/stats', protect, adminOnly, getStats);
router.get('/appointments', protect, adminOnly, getAllAppointments);

module.exports = router;
