const mongoose = require('mongoose');

const donationMatchSchema = new mongoose.Schema({
  matchObid: { type: String, required: true, unique: true },
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destinationType: { type: String, enum: ['Hospital', 'BloodBank', 'BloodBankAndHospital'], default: 'Hospital' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
  requestId: { type: mongoose.Schema.Types.ObjectId, required: true },
  requestType: { type: String, enum: ['BloodRequest', 'NoticeBoard'], default: 'BloodRequest' },
  bloodGroup: { type: String, required: true },
  units: { type: Number, required: true },
  status: { type: String, enum: ['in_progress', 'completed', 'cancelled'], default: 'in_progress' },
  bloodBankStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  hospitalStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  stage: { type: String, enum: ['at_blood_bank', 'at_hospital', 'completed', 'cancelled'], default: 'at_hospital' },
  bloodBankCompletedAt: { type: Date },
  completionEvidence: { type: String }, // Path to completed cert or receipt
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  pdfPath: { type: String },
  completedAt: { type: Date }
}, {
  timestamps: true
});

donationMatchSchema.statics.generateMatchId = async function() {
  const chars = '0123456789';
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    let suffix = '';
    for (let i = 0; i < 7; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const candidateId = `MOB-${suffix}`;
    const existing = await this.findOne({ matchObid: candidateId });
    if (!existing) {
      return candidateId;
    }
    attempts++;
  }
  throw new Error('Failed to generate a unique Match ID');
};

module.exports = mongoose.model('DonationMatch', donationMatchSchema);
