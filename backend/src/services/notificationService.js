const Notification = require('../models/Notification');
const socketService = require('./socketService');
const emailService = require('./emailService');

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

    // 3. Send email if requested / critical
    if (email && (priority === 'high' || type === 'blood_request')) {
      if (type === 'blood_request' && data.request) {
        await emailService.sendRequestAlertEmail(email, recipientName, data.request);
      } else {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #B91C1C;">OneBlood Notice</h2>
            <p>Hello <strong>${recipientName}</strong>,</p>
            <p>${message}</p>
            <p>For more details, please log in to your dashboard.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 11px; color: #777;">This is an automated notification from OneBlood. Do not reply directly to this mail.</p>
          </div>
        `;
        await emailService.sendEmail(email, title, htmlBody);
      }
    }

    return notification;
  } catch (error) {
    console.error('🔴 Error creating notification:', error.message);
  }
};

module.exports = {
  createNotification
};
