const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Helper: is the given YYYY-MM-DD date today or in the future?
const isDateValid = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(dateStr);
  inputDate.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

// POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const {
      doctorId, date, time, patientName, patientPhone,
      patientEmail, age, gender, reason
    } = req.body;

    if (!doctorId || !date || !time || !patientName || !patientPhone || !patientEmail || !age || !gender) {
      return res.status(400).json({ message: 'Missing required booking details' });
    }

    if (!isDateValid(date)) {
      return res.status(400).json({ message: 'Cannot book an appointment in the past' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.availableSlots.length && !doctor.availableSlots.includes(time)) {
      return res.status(400).json({ message: 'Selected time slot is not offered by this doctor' });
    }

    // Prevent double booking: check for an existing non-cancelled appointment at the same slot
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });

    if (conflict) {
      return res.status(409).json({ message: 'This appointment slot is no longer available.' });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      time,
      patientName,
      patientPhone,
      patientEmail,
      age,
      gender,
      reason,
      fee: doctor.fee,
      status: 'upcoming'
    });

    const populated = await appointment.populate('doctor patient', '-password');
    res.status(201).json(populated);
  } catch (err) {
    // Catches the rare race-condition case where the unique index rejects a duplicate
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This appointment slot is no longer available.' });
    }
    res.status(500).json({ message: 'Failed to book appointment', error: err.message });
  }
};

// GET /api/appointments/my
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch appointments', error: err.message });
  }
};

// GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('doctor patient', '-password');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const isOwner = appointment.patient._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch appointment', error: err.message });
  }
};

// PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const isOwner = appointment.patient.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status !== 'upcoming') {
      return res.status(400).json({ message: 'Only upcoming appointments can be cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel appointment', error: err.message });
  }
};

// PUT /api/appointments/:id/status (admin/doctor)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('doctor patient', '-password');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus
};
