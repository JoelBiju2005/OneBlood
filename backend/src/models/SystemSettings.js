const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  emailProvider: { type: String, enum: ['brevo'], default: 'brevo' },
  fromEmail: { type: String, default: 'oneblood.officialteam@gmail.com' },
  escalationEnabled: { type: Boolean, default: true },
  donorMinAge: { type: Number, default: 18 },
  donorMaxAge: { type: Number, default: 65 },
  donorMinWeight: { type: Number, default: 45 },
  donationGapDays: { type: Number, default: 90 }
}, {
  timestamps: true
});

// Helper static to get settings or return defaults if none in DB
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      emailProvider: process.env.EMAIL_PROVIDER || 'brevo',
      fromEmail: process.env.FROM_EMAIL || 'oneblood.officialteam@gmail.com',
      escalationEnabled: true,
      donorMinAge: 18,
      donorMaxAge: 65,
      donorMinWeight: 45,
      donationGapDays: 90
    });
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
