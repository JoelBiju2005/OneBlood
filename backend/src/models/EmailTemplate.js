const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  templateName: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  variables: [{ type: String }],
  description: { type: String },
  category: { type: String },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
