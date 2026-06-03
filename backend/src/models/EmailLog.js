const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  templateName: { type: String },
  emailType: { type: String },
  subject: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed', 'retrying'], required: true },
  provider: { type: String, default: 'brevo', required: true },
  errorMessage: { type: String },
  attempts: { type: Number, default: 1 }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
