const sequelize = require('../src/config/sequelize');
const User = require('../src/models/User');

async function check() {
  try {
    await sequelize.authenticate();
    const count = await User.countDocuments();
    console.log('Total users in SQLite:', count);
    
    const users = await User.find().limit(5);
    console.log('First 5 users in SQLite:');
    for (const u of users) {
      console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, OneBloodID: ${u.onebloodId}`);
    }
    await sequelize.close();
  } catch (error) {
    console.error('Error querying SQLite:', error);
  }
}

check();
