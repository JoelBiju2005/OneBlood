const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  status: { type: String, default: 'pending' },
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
  responses: [responseSchema]
}, {
  timestamps: true,
  strict: false
});

bloodRequestSchema.index({ requesterId: 1 });
bloodRequestSchema.index({ location: '2dsphere' });

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

module.exports = BloodRequest;
