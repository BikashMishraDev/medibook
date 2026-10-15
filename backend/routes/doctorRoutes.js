const express = require('express');
const router = express.Router();
const {
  getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', protect, adminOnly, createDoctor);
router.put('/:id', protect, adminOnly, updateDoctor);
router.delete('/:id', protect, adminOnly, deleteDoctor);

module.exports = router;
