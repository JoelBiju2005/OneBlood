const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  registrationNumber: { type: String },
  address: { type: String },
  city: { type: String },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
  phone: { type: String },
  email: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  inventory: { type: mongoose.Schema.Types.Mixed, default: {} },
  operatingHours: { type: String }
}, {
  timestamps: true,
  strict: false
});

bloodBankSchema.index({ adminUserId: 1 });
bloodBankSchema.index({ location: '2dsphere' });

const BloodBank = mongoose.model('BloodBank', bloodBankSchema);

module.exports = BloodBank;
