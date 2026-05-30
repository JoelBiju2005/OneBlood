const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let firebaseApp;

const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin initialized via env variable credentials.');
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin initialized via firebase-service-account.json.');
  } else {
    // If running in development/local and no credentials, try loading without credentials
    // (useful for Firestore emulator or ADC)
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'oneblood-app-2026'
    });
    console.log('🔥 Firebase Admin initialized using default/fallback settings.');
  }
} catch (error) {
  console.error('🔴 Firebase Admin Initialization Error:', error.message);
}

const db = admin.firestore();

// Set setting to ignore undefined values to prevent crash when writing empty fields
db.settings({ ignoreUndefinedProperties: true });

module.exports = {
  db,
  admin,
  firebaseApp
};
