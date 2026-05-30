const { getModel } = require('../utils/firestoreDb');
const User = getModel('users');

User.generateOneBloodId = async function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const candidateId = `OB-${suffix}`;
    const existing = await User.findOne({ onebloodId: candidateId });
    if (!existing) {
      return candidateId;
    }
    attempts++;
  }
  throw new Error('Failed to generate a unique OneBlood ID');
};

module.exports = User;
