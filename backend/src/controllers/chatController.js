const Message = require('../models/Message');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const User = require('../models/User');
const socketService = require('../services/socketService');

// Helper to check if user has access to this request's chat
const checkChatAccess = async (requestId, userId) => {
  const request = await BloodRequest.findById(requestId);
  if (!request) return { allowed: false, status: 404, message: 'Request not found' };

  // Check if User is Seeker
  if (request.requesterId.toString() === userId.toString()) {
    return { allowed: true, request, role: 'seeker' };
  }

  // Check if User is accepted or notified Donor
  const donor = await Donor.findOne({ userId });
  if (donor) {
    const acceptedResponse = request.responses.find(
      (r) => {
        const rId = r.responderId || r.donorId;
        return rId && rId.toString() === donor._id.toString() && r.status === 'accepted';
      }
    );
    const isNotified = request.notifiedDonors && request.notifiedDonors.some(id => id.toString() === donor._id.toString());
    if (acceptedResponse || isNotified) {
      return { allowed: true, request, role: 'donor', donorId: donor._id };
    }
  }

  // Check if User is Admin
  const user = await User.findById(userId);
  if (user && user.role === 'admin') {
    return { allowed: true, request, role: 'admin' };
  }

  return { allowed: false, status: 403, message: 'Access denied. You are not a participant in this request.' };
};

const getMessages = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { before } = req.query; // for cursor pagination

    const access = await checkChatAccess(requestId, req.user._id);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const query = { requestId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Paginated messages, last 50
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Return in chronological order
    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      requestStatus: access.request.status
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const access = await checkChatAccess(requestId, req.user._id);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const request = access.request;
    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return res.status(400).json({ message: 'This request is closed. Chat is read-only.' });
    }

    // Determine receiverId
    let receiverId;
    if (access.role === 'seeker') {
      const acceptedResponse = request.responses.find((r) => r.status === 'accepted');
      let targetDonorId = null;
      if (acceptedResponse) {
        targetDonorId = acceptedResponse.responderId || acceptedResponse.donorId;
      } else if (request.notifiedDonors && request.notifiedDonors.length > 0) {
        targetDonorId = request.notifiedDonors[0];
      }

      if (!targetDonorId) {
        return res.status(400).json({ message: 'No donor associated with this request' });
      }

      const donorObj = await Donor.findById(targetDonorId);
      if (!donorObj) {
        return res.status(400).json({ message: 'Donor profile not found' });
      }
      receiverId = donorObj.userId;
    } else if (access.role === 'donor') {
      receiverId = request.requesterId;
    } else {
      return res.status(400).json({ message: 'Admins cannot send messages' });
    }

    const message = await Message.create({
      requestId,
      senderId: req.user._id,
      receiverId,
      text: text.slice(0, 1000)
    });

    // Broadcast message via socket service to chat room
    socketService.broadcastToRoom(`chat_${requestId}`, 'new_message', {
      messageId: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      text: message.text,
      createdAt: message.createdAt,
      readAt: message.readAt
    });

    // Send real-time notification to receiver
    socketService.sendToUser(receiverId, 'chat_notification', {
      requestId,
      senderId: req.user._id,
      text: message.text
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const access = await checkChatAccess(requestId, req.user._id);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    // Mark all messages sent by the other party as read
    const result = await Message.updateMany(
      {
        requestId,
        receiverId: req.user._id,
        readAt: null
      },
      {
        $set: { readAt: new Date() }
      }
    );

    res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

const getChatRooms = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all blood requests where user is requester
    // OR donor is accepted or targeted
    const donor = await Donor.findOne({ userId });
    const query = {
      $or: [
        { requesterId: userId },
        ...(donor ? [
          { 'responses.responderId': donor._id, 'responses.status': 'accepted' },
          { 'responses.donorId': donor._id, 'responses.status': 'accepted' },
          { notifiedDonors: donor._id.toString() }
        ] : [])
      ]
    };

    const requests = await BloodRequest.find(query)
      .populate('requesterId', 'name avatar')
      .sort({ updatedAt: -1 });

    const rooms = [];

    for (const reqObj of requests) {
      // Find latest message for preview
      const latestMessage = await Message.findOne({ requestId: reqObj._id })
        .sort({ createdAt: -1 });

      // Count unread messages
      const unreadCount = await Message.countDocuments({
        requestId: reqObj._id,
        receiverId: userId,
        readAt: null
      });

      // Find the other user details
      let otherPartyName = 'Coordinator';
      let otherPartyBlood = reqObj.bloodGroup;

      if (reqObj.requesterId._id.toString() === userId.toString()) {
        // Seeker is current user, find accepted donor or targeted donor
        const accepted = reqObj.responses.find(r => r.status === 'accepted');
        let targetId = null;
        if (accepted) {
          targetId = accepted.responderId || accepted.donorId;
        } else if (reqObj.notifiedDonors && reqObj.notifiedDonors.length > 0) {
          targetId = reqObj.notifiedDonors[0];
        }

        if (targetId) {
          const donorObj = await Donor.findById(targetId);
          if (donorObj) {
            otherPartyName = donorObj.name;
            otherPartyBlood = donorObj.bloodGroup;
          }
        }
      } else {
        // Donor is current user, other party is requester (seeker)
        otherPartyName = reqObj.patientName ? `Patient Coordinator (${reqObj.patientName})` : 'Patient Coordinator';
      }

      rooms.push({
        requestId: reqObj._id,
        patientName: reqObj.patientName,
        bloodGroup: otherPartyBlood,
        status: reqObj.status,
        otherPartyName,
        unreadCount,
        latestMessage: latestMessage ? {
          text: latestMessage.text,
          createdAt: latestMessage.createdAt
        } : null
      });
    }

    res.status(200).json({
      success: true,
      rooms
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
  getChatRooms
};
