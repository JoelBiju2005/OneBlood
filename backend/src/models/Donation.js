const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  units: { type: Number, required: true },
  donatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: false
});

donationSchema.index({ donorId: 1 });
donationSchema.index({ bloodBankId: 1 });

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
