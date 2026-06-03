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
  patientAge: { type: Number },
  patientGender: { type: String },
  bloodGroup: { type: String, required: true },
  bloodComponent: { type: String, default: 'whole_blood' },
  unitsRequired: { type: Number, required: true },
  urgencyLevel: { type: String, default: 'urgent' },
  requiredBy: { type: Date },
  hospitalName: { type: String },
  hospitalAddress: { type: String },
  doctorName: { type: String },
  doctorContact: { type: String },
  doctorLetterUrl: { type: String },
  doctorLetterVerification: { type: mongoose.Schema.Types.Mixed, default: { isVerified: false } },
  searchRadius: { type: Number },
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
  notifiedBanks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' }],
  isTargeted: { type: Boolean, default: false },
  targetDonorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }
}, {
  timestamps: true,
  strict: false
});

bloodRequestSchema.index({ requesterId: 1 });
bloodRequestSchema.index({ location: '2dsphere' });

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

module.exports = BloodRequest;
