const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  responderId: { type: mongoose.Schema.Types.ObjectId },
  responderType: { type: String, enum: ['donor', 'blood_bank'] },
  status: { type: String, default: 'pending' },
  message: { type: String },
  respondedAt: { type: Date, default: Date.now }
}, { _id: false });

const bloodRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, required: true },
  hospitalName: { type: String },
  city: { type: String },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
  phone: { type: String },
  reason: { type: String },
  status: { type: String, default: 'pending' },
  responses: [responseSchema],
  notifiedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }],
  notifiedBanks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' }]
}, {
  timestamps: true,
  strict: false
});

bloodRequestSchema.index({ requesterId: 1 });
bloodRequestSchema.index({ location: '2dsphere' });

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

module.exports = BloodRequest;
