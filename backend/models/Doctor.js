const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  specialty: { type: String, required: true, trim: true },
  qualification: { type: String, default: '' },
  experience: { type: Number, default: 0 }, // years
  hospital: { type: String, default: '' },
  fee: { type: Number, required: true },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  bio: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  // e.g. ["Monday", "Wednesday", "Friday"]
  availableDays: { type: [String], default: [] },
  // e.g. ["09:00 AM", "09:30 AM", ...] - the master list of slot times this doctor offers
  availableSlots: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);
