// Seeds the database with sample doctors so the app has data to show immediately.
// Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

const slots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const doctors = [
  {
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@medibook.com',
    specialty: 'Cardiologist',
    qualification: 'MBBS, MD (Cardiology)',
    experience: 12,
    hospital: 'Fortis Heart Institute',
    fee: 1200,
    rating: 4.8,
    bio: 'Specializes in interventional cardiology and preventive heart care, with over a decade of clinical experience.',
    profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
    availableDays: days,
    availableSlots: slots
  },
  {
    name: 'Dr. Rohan Mehta',
    email: 'rohan.mehta@medibook.com',
    specialty: 'Dermatologist',
    qualification: 'MBBS, MD (Dermatology)',
    experience: 8,
    hospital: 'SkinCare Clinic',
    fee: 800,
    rating: 4.6,
    bio: 'Focuses on cosmetic dermatology, acne treatment, and skin allergy management.',
    profileImage: 'https://randomuser.me/api/portraits/men/45.jpg',
    availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    availableSlots: slots
  },
  {
    name: 'Dr. Priya Nair',
    email: 'priya.nair@medibook.com',
    specialty: 'Dentist',
    qualification: 'BDS, MDS (Orthodontics)',
    experience: 6,
    hospital: 'SmileCare Dental',
    fee: 600,
    rating: 4.7,
    bio: 'Expert in orthodontics, root canal treatment, and cosmetic dentistry.',
    profileImage: 'https://randomuser.me/api/portraits/women/22.jpg',
    availableDays: days,
    availableSlots: slots
  },
  {
    name: 'Dr. Vikram Desai',
    email: 'vikram.desai@medibook.com',
    specialty: 'Neurologist',
    qualification: 'MBBS, DM (Neurology)',
    experience: 15,
    hospital: 'NeuroCare Hospital',
    fee: 1500,
    rating: 4.9,
    bio: 'Treats disorders of the brain and nervous system, including migraines, epilepsy, and stroke recovery.',
    profileImage: 'https://randomuser.me/api/portraits/men/33.jpg',
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    availableSlots: slots
  },
  {
    name: 'Dr. Sneha Kulkarni',
    email: 'sneha.kulkarni@medibook.com',
    specialty: 'Orthopedic',
    qualification: 'MBBS, MS (Orthopedics)',
    experience: 10,
    hospital: 'Bone & Joint Center',
    fee: 1000,
    rating: 4.5,
    bio: 'Specializes in joint replacement surgery, sports injuries, and fracture management.',
    profileImage: 'https://randomuser.me/api/portraits/women/50.jpg',
    availableDays: days,
    availableSlots: slots
  },
  {
    name: 'Dr. Arjun Kapoor',
    email: 'arjun.kapoor@medibook.com',
    specialty: 'General Physician',
    qualification: 'MBBS, MD (General Medicine)',
    experience: 9,
    hospital: 'CityCare Clinic',
    fee: 500,
    rating: 4.4,
    bio: 'Provides comprehensive primary care for common illnesses, chronic disease management, and preventive checkups.',
    profileImage: 'https://randomuser.me/api/portraits/men/60.jpg',
    availableDays: days,
    availableSlots: slots
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    await Doctor.deleteMany({});
    console.log('Cleared existing doctors');

    await Doctor.insertMany(doctors);
    console.log(`Seeded ${doctors.length} doctors successfully`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
