const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  onebloodId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  passwordHash: { type: String },
  refreshTokenHash: { type: String },
  role: { type: String, default: 'donor' },
  city: { type: String },
  avatar: { type: String },
  bio: { type: String },
  isVerified: { type: Boolean, default: false },
  donorProfileComplete: { type: Boolean, default: false },
  bankProfileComplete: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  }
}, {
  timestamps: true,
  strict: false
});

// Create 2dsphere index for location proximity queries
userSchema.index({ location: '2dsphere' });

userSchema.statics.generateOneBloodId = async function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const candidateId = `OB-${suffix}`;
    const existing = await this.findOne({ onebloodId: candidateId });
    if (!existing) {
      return candidateId;
    }
    attempts++;
  }
  throw new Error('Failed to generate a unique OneBlood ID');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
