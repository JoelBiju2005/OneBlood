const mongoose = require('mongoose');

const noticeBoardSchema = new mongoose.Schema({
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, required: true },
  hospitalName: { type: String },
  city: { type: String },
  phone: { type: String },
  reason: { type: String },
  status: { type: String, default: 'active' }
}, {
  timestamps: true,
  strict: false
});

noticeBoardSchema.index({ seekerId: 1 });

const NoticeBoard = mongoose.model('NoticeBoard', noticeBoardSchema);

module.exports = NoticeBoard;
