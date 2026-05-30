const sequelize = require('../src/config/sequelize');
const NoticeBoard = require('../src/models/NoticeBoard');

async function check() {
  try {
    await sequelize.authenticate();
    const count = await NoticeBoard.countDocuments();
    console.log('Total notices in SQLite:', count);
    
    const notices = await NoticeBoard.find({});
    console.log('All notices in SQLite:');
    for (const n of notices) {
      console.log(`- ID: ${n._id}, Seeker: ${n.seekerName}, Patient: ${n.patientName}, Group: ${n.bloodGroup}, City: ${n.city}, Status: ${n.status}, Urgency: ${n.urgency}`);
    }
    await sequelize.close();
  } catch (error) {
    console.error('Error querying SQLite:', error);
  }
}

check();
