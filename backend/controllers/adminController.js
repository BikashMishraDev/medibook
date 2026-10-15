const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalDoctors, totalPatients, totalAppointments, upcomingAppointments] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'upcoming' })
    ]);

    res.json({ totalDoctors, totalPatients, totalAppointments, upcomingAppointments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

// GET /api/admin/appointments
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctor')
      .populate('patient', '-password')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch appointments', error: err.message });
  }
};

module.exports = { getStats, getAllAppointments };
