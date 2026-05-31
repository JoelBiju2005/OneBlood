require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!\n');

  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log(`👥 Total users in MongoDB Atlas: ${users.length}`);
  users.forEach(u => {
    console.log(`  - ${u.name} | ${u.email} | Role: ${u.role} | ID: ${u.onebloodId}`);
  });

  await mongoose.disconnect();
  console.log('\n🏁 Done.');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
