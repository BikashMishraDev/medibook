const Doctor = require('../models/Doctor');

// GET /api/doctors  (supports ?search=&specialty=&minPrice=&maxPrice=&minRating=&sortBy=)
const getDoctors = async (req, res) => {
  try {
    const { search, specialty, minPrice, maxPrice, minRating, sortBy } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } }
      ];
    }
    if (specialty) query.specialty = specialty;
    if (minPrice || maxPrice) {
      query.fee = {};
      if (minPrice) query.fee.$gte = Number(minPrice);
      if (maxPrice) query.fee.$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };

    let sort = { createdAt: -1 };
    if (sortBy === 'priceLow') sort = { fee: 1 };
    if (sortBy === 'priceHigh') sort = { fee: -1 };
    if (sortBy === 'rating') sort = { rating: -1 };

    const doctors = await Doctor.find(query).sort(sort);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doctors', error: err.message });
  }
};

// GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doctor', error: err.message });
  }
};

// POST /api/doctors (admin only)
const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A doctor with this email already exists' });
    }
    res.status(400).json({ message: 'Failed to create doctor', error: err.message });
  }
};

// PUT /api/doctors/:id (admin only)
const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update doctor', error: err.message });
  }
};

// DELETE /api/doctors/:id (admin only)
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete doctor', error: err.message });
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor };
