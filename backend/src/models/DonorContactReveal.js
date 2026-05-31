const mongoose = require('mongoose');

const donorContactRevealSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  unlockedFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revealedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: false
});

donorContactRevealSchema.index({ requestId: 1 });
donorContactRevealSchema.index({ donorId: 1 });
donorContactRevealSchema.index({ unlockedFor: 1 });

const DonorContactReveal = mongoose.model('DonorContactReveal', donorContactRevealSchema);

module.exports = DonorContactReveal;
