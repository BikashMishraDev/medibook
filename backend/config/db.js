const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // A shorter server-selection timeout means a bad URI / unreachable DB fails fast
    // with a clear message instead of hanging for mongoose's 30s default.
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
