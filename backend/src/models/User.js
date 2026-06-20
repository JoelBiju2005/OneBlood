const mongoose = require('mongoose');
const crypto = require('crypto');

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
  hospitalProfileComplete: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },

  // ─── Security: Account lockout ────────────────────────────────────────────
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date, default: null },

  // ─── Security: Password reset ─────────────────────────────────────────────
  resetTokenHash: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null }
}, {
  timestamps: true,
  strict: false
});

// Create 2dsphere index for location proximity queries
userSchema.index({ location: '2dsphere' });

// ─── OneBlood ID generation with circuit breaker (max 10 attempts) ──────────
userSchema.statics.generateOneBloodId = async function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const MAX_ATTEMPTS = 10;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const candidateId = `OB-${suffix}`;
    const existing = await this.findOne({ onebloodId: candidateId });
    if (!existing) {
      return candidateId;
    }
  }
  throw new Error('Unable to generate unique OneBlood ID — please try again later.');
};

// ─── Password reset token helper ────────────────────────────────────────────
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return resetToken; // return raw token (this is what goes in the email link)
};

const User = mongoose.model('User', userSchema);

module.exports = User;
