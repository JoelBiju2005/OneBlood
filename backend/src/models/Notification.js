const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  priority: { type: String, default: 'normal' },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true,
  strict: false
});

notificationSchema.index({ recipientId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
