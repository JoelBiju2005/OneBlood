const Notification = require('../models/Notification');
const socketService = require('./socketService');

/**
 * Creates and dispatches a notification to a specific user
 * @param {Object} params Notification settings
 * @param {string} params.recipientId Target user ObjectId
 * @param {string} params.type Notification category
 * @param {string} params.title Notification header
 * @param {string} params.message Text message
 * @param {Object} [params.data] Optional payload data
 * @param {string} [params.priority] 'high' | 'normal' | 'low'
 * @param {string} [params.email] Optional recipient email (to send email alert)
 * @param {string} [params.recipientName] Optional recipient name
 */
const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  data = {},
  priority = 'normal',
  email = null,
  recipientName = 'User'
}) => {
  try {
    // 1. Create notification in database
    const notification = await Notification.create({
      recipientId,
      type,
      title,
      message,
      data,
      priority,
      isRead: false
    });

    // 2. Push notification in real-time via Socket.IO
    socketService.sendToUser(recipientId.toString(), 'notification', notification);

    return notification;
  } catch (error) {
    console.error('🔴 Error creating notification:', error.message);
  }
};

module.exports = {
  createNotification
};
