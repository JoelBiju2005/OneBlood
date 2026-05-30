const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config({ path: '../.env' });

async function check() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/oneblood';
  await mongoose.connect(uri);
  console.log('Connected to DB:', uri);
  
  const users = await User.find({});
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, OneBloodID: ${u.onebloodId}`);
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
