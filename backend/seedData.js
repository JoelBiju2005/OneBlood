require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const { seedHubballiData } = require('./src/controllers/adminController');

const seed = async () => {
  try {
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/oneblood';
    await connectDB();
    console.log('🟢 Seeding Hubballi-Dharwad hospitals & blood banks...');
    
    // Simulate req/res context
    const req = {};
    const res = {
      status: (code) => ({
        json: (data) => console.log(`🟢 [Status ${code}] Seeding finished:`, data.message)
      })
    };
    const next = (err) => {
      if (err) console.error('🔴 Seeding failed with error:', err.message);
    };

    await seedHubballiData(req, res, next);
    
    await mongoose.disconnect();
    console.log('👋 Database seed connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('🔴 Seed process encountered an error:', error.message);
    process.exit(1);
  }
};

seed();
