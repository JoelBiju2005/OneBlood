const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalName: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  hospitalType: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  website: { type: String },
  authorizedPersonName: { type: String, required: true },
  designation: { type: String, required: true },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  documents: {
    registrationCertificate: { type: String },
    govApproval: { type: String }
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
}, {
  timestamps: true
});

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
