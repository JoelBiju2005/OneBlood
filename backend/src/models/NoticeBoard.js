const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  donorId: { type: String },
  donorName: { type: String },
  donorPhone: { type: String },
  donorEmail: { type: String },
  action: { type: String, enum: ['can_donate', 'know_someone', 'contacted', 'shared'] },
  note: { type: String, default: '' },
  referralName: { type: String },
  referralPhone: { type: String },
  referralBloodGroup: { type: String },
  createdAt: { type: String }
}, { _id: false });

const noticeBoardSchema = new mongoose.Schema({
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seekerName: { type: String },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  component: { type: String, default: 'Whole Blood' },
  unitsNeeded: { type: Number },
  unitsRequired: { type: Number, required: true },
  hospital: { type: String },
  hospitalName: { type: String },
  city: { type: String },
  contactNumber: { type: String },
  phone: { type: String },
  urgency: { type: String, default: 'urgent', enum: ['critical', 'urgent', 'moderate', 'planned'] },
  message: { type: String },
  reason: { type: String },
  doctorLetterUrl: { type: String },
  status: { type: String, default: 'open', enum: ['open', 'fulfilled', 'closed', 'active'] },
  responses: { type: [responseSchema], default: [] }
}, {
  timestamps: true,
  strict: false
});

noticeBoardSchema.index({ seekerId: 1 });
noticeBoardSchema.index({ status: 1, createdAt: -1 });

const NoticeBoard = mongoose.model('NoticeBoard', noticeBoardSchema);

module.exports = NoticeBoard;
