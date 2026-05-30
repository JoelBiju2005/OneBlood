const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { db } = require('../config/firebase');

const dbPath = path.join(__dirname, '../../database.sqlite');
console.log('📂 Opening SQLite database at:', dbPath);

const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('🔴 Error opening SQLite database:', err.message);
    process.exit(1);
  }
});

const runQuery = (query) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(query, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const migrateTable = async (tableName, firestoreCollection, options = {}) => {
  try {
    const rows = await runQuery(`SELECT * FROM ${tableName}`);
    console.log(`📦 Found ${rows.length} rows in SQLite table "${tableName}"`);

    let migratedCount = 0;
    for (const row of rows) {
      const docId = row._id || row.id;
      if (!docId) continue;

      const docData = { ...row };
      delete docData.id;
      delete docData._id;

      // Parse JSON fields
      if (options.jsonFields) {
        for (const field of options.jsonFields) {
          if (docData[field] && typeof docData[field] === 'string') {
            try {
              docData[field] = JSON.parse(docData[field]);
            } catch (e) {
              console.warn(`⚠️ Failed to parse JSON for field "${field}" in row ${docId}:`, e.message);
            }
          }
        }
      }

      // Convert Booleans (0/1 to false/true)
      if (options.booleanFields) {
        for (const field of options.booleanFields) {
          if (docData[field] !== undefined) {
            docData[field] = docData[field] === 1;
          }
        }
      }

      // Convert Date strings to Date objects if needed
      if (options.dateFields) {
        for (const field of options.dateFields) {
          if (docData[field]) {
            docData[field] = new Date(docData[field]);
          }
        }
      }

      // Clean up undefined properties to avoid Firestore errors
      Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) {
          delete docData[key];
        }
      });

      // Write to Firestore
      await db.collection(firestoreCollection).doc(docId).set(docData);
      migratedCount++;
    }

    console.log(`🟢 Successfully migrated ${migratedCount}/${rows.length} documents to Firestore collection "${firestoreCollection}"`);
  } catch (error) {
    if (error.message.includes('no such table')) {
      console.log(`⚠️ Table "${tableName}" does not exist in SQLite, skipping.`);
    } else {
      console.error(`🔴 Error migrating table "${tableName}":`, error.message);
    }
  }
};

const startMigration = async () => {
  console.log('🚀 Starting SQLite to Firebase Firestore migration...');

  try {
    // 1. Users
    await migrateTable('Users', 'users', {
      booleanFields: ['donorProfileComplete', 'bankProfileComplete', 'isVerified']
    });

    // 2. Donors
    await migrateTable('Donors', 'donors', {
      jsonFields: ['donationHistory', 'medicalConditions', 'reviews', 'badges'],
      booleanFields: ['isAvailable', 'notificationsEnabled'],
      dateFields: ['lastDonated', 'eligibleToDonateSince', 'createdAt', 'updatedAt']
    });

    // 3. BloodBanks
    await migrateTable('BloodBanks', 'bloodbanks', {
      jsonFields: ['operatingHours', 'inventory', 'facilities', 'photos'],
      booleanFields: ['isVerified', 'isActive', 'acceptsWalkIn', 'acceptsOnlineRequest'],
      dateFields: ['lastInventoryUpdate', 'createdAt', 'updatedAt']
    });

    // 4. BloodRequests
    await migrateTable('BloodRequests', 'bloodrequests', {
      jsonFields: ['doctorLetterVerification', 'notifiedDonors', 'notifiedBanks', 'responses'],
      dateFields: ['requiredBy', 'createdAt', 'updatedAt']
    });

    // 5. Donations
    await migrateTable('Donations', 'donations', {
      dateFields: ['donationDate', 'createdAt', 'updatedAt']
    });

    // 6. DonorContactReveals
    await migrateTable('DonorContactReveals', 'donorcontactreveals', {
      dateFields: ['revealedAt', 'createdAt', 'updatedAt']
    });

    // 7. Messages
    await migrateTable('Messages', 'messages', {
      dateFields: ['readAt', 'createdAt', 'updatedAt']
    });

    // 8. NoticeBoards
    await migrateTable('NoticeBoards', 'noticeboards', {
      jsonFields: ['responses'],
      dateFields: ['createdAt', 'updatedAt']
    });

    // 9. Notifications
    await migrateTable('Notifications', 'notifications', {
      jsonFields: ['data'],
      booleanFields: ['isRead'],
      dateFields: ['createdAt', 'updatedAt']
    });

    console.log('🎉 SQLite to Firestore Migration completed successfully!');
  } catch (err) {
    console.error('🔴 Critical Migration Error:', err.message);
  } finally {
    sqliteDb.close();
  }
};

startMigration();
