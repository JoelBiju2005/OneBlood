const { db } = require('./firebase');

const connectDB = async () => {
  try {
    // Attempt to access a collection to check connectivity
    await db.collection('users').limit(1).get();
    console.log('🟢 Firebase Firestore connection established and verified successfully.');
  } catch (error) {
    console.error(`🔴 Firebase Connection/Verification Error: ${error.message}`);
    console.error('Fatal Server Startup Failure: Firebase Firestore connection is required.');
    process.exit(1);
  }
};

module.exports = connectDB;
