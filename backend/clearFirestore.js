require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionName, batchSize = 100) {
  const ref = db.collection(collectionName);
  const query = ref.limit(batchSize);

  let deleted = 0;
  while (true) {
    const snapshot = await query.get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
    process.stdout.write(`  Deleted ${deleted} docs so far...\r`);
  }
  return deleted;
}

async function main() {
  const collections = [
    'users',
    'donors',
    'bloodbanks',
    'bloodrequests',
    'donations',
    'donorcontactreveals',
    'messages',
    'noticeboards',
    'notifications'
  ];

  console.log('🗑️  Starting Firestore data cleanup...\n');

  for (const coll of collections) {
    try {
      process.stdout.write(`⏳ Deleting "${coll}"...`);
      const count = await deleteCollection(coll);
      console.log(`\r✅ "${coll}" — ${count} document(s) deleted.`);
    } catch (err) {
      console.log(`\r❌ "${coll}" — Error: ${err.message}`);
    }
  }

  console.log('\n🏁 Firestore cleanup complete! All old data has been removed.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
