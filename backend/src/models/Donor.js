const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  age: { type: Number },
  weight: { type: Number },
  gender: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  pincode: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  bio: { type: String },
  medicalConditions: [String],
  preferredContactMethod: { type: String, default: 'phone' },
  lastDonated: { type: Date },
  isAvailable: { type: Boolean, default: true },
  eligibleToDonateSince: { type: Date },
  totalDonations: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  badges: [String]
}, {
  timestamps: true,
  strict: false
});

donorSchema.index({ userId: 1 });
donorSchema.index({ location: '2dsphere' });

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;
