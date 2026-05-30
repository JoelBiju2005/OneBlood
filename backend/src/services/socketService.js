let ioInstance = null;
const userSockets = new Map(); // userId -> socketId

const init = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Register user to track direct notifications
    socket.on('register_user', (userId) => {
      if (userId) {
        socket.userId = userId;
        userSockets.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`👤 User registered and joined room user_${userId}: on socket ${socket.id}`);
      }
    });

    // Join user room explicitly
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`🚪 Client ${socket.id} joined user room: user_${userId}`);
      }
    });

    // Join direct donor room (donor_${donorId})
    socket.on('join_donor_room_direct', (donorId) => {
      if (donorId) {
        socket.join(`donor_${donorId}`);
        console.log(`🚪 Client ${socket.id} joined donor room: donor_${donorId}`);
      }
    });

    // Join regional blood group donor room
    socket.on('join_donor_room', ({ bloodGroup, city }) => {
      if (bloodGroup && city) {
        const roomName = `donor:${bloodGroup.toUpperCase()}:${city.toLowerCase()}`;
        socket.join(roomName);
        console.log(`🚪 Client ${socket.id} joined donor room: ${roomName}`);
      }
    });

    socket.on('join_bank_room', (bankId) => {
      if (bankId) {
        const roomName = `bloodbank:${bankId}`;
        socket.join(roomName);
        console.log(`🚪 Client ${socket.id} joined blood bank room: ${roomName}`);
      }
    });

    socket.on('join_request_room', (requestId) => {
      if (requestId) {
        const roomName = `request:${requestId}`;
        socket.join(roomName);
        console.log(`🚪 Client ${socket.id} joined request room: ${roomName}`);
      }
    });

    socket.on('join_chat_room', async ({ requestId }) => {
      if (!requestId) return;
      try {
        const BloodRequest = require('../models/BloodRequest');
        const request = await BloodRequest.findById(requestId);
        if (!request) return;
        
        const donor = await require('../models/Donor').findOne({ userId: socket.userId });
        const isRequester = request.requesterId.toString() === socket.userId;
        const isDonor = donor && request.responses.some(r => r.responderId.toString() === donor._id.toString() && r.status === 'accepted');
        
        const user = await require('../models/User').findById(socket.userId);
        const isAdmin = user && user.role === 'admin';
        
        if (isRequester || isDonor || isAdmin) {
          socket.join(`chat_${requestId}`);
          console.log(`🚪 Client ${socket.id} (User: ${socket.userId}) joined chat room: chat_${requestId}`);
        } else {
          console.log(`⛔ Unauthorized chat join attempt: User ${socket.userId} on request ${requestId}`);
        }
      } catch (err) {
        console.error('join_chat_room error:', err.message);
      }
    });

    socket.on('send_message', async ({ requestId, text }) => {
      if (!requestId || !text) return;
      try {
        const BloodRequest = require('../models/BloodRequest');
        const request = await BloodRequest.findById(requestId);
        if (!request) return;
        if (request.status === 'fulfilled' || request.status === 'cancelled') return;
        
        const donor = await require('../models/Donor').findOne({ userId: socket.userId });
        const isRequester = request.requesterId.toString() === socket.userId;
        const isDonor = donor && request.responses.some(r => r.responderId.toString() === donor._id.toString() && r.status === 'accepted');
        
        if (!isRequester && !isDonor) return;
        
        let receiverId;
        if (isRequester) {
          const acceptedResponse = request.responses.find(r => r.status === 'accepted');
          if (acceptedResponse) {
            const acceptedDonorObj = await require('../models/Donor').findById(acceptedResponse.responderId);
            if (acceptedDonorObj) receiverId = acceptedDonorObj.userId;
          }
        } else {
          receiverId = request.requesterId;
        }
        
        if (!receiverId) return;
        
        const Message = require('../models/Message');
        const message = await Message.create({
          requestId,
          senderId: socket.userId,
          receiverId,
          text
        });
        
        io.to(`chat_${requestId}`).emit('new_message', {
          messageId: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          createdAt: message.createdAt,
          readAt: message.readAt
        });

        // Notify recipient on their personal channel
        io.to(`user_${receiverId.toString()}`).emit('chat_notification', {
          requestId,
          senderId: socket.userId,
          text: message.text
        });
      } catch (err) {
        console.error('send_message socket error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }
    });
  });
};

const sendToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    const userIdStr = userId.toString();
    // Emit to room (covers multiple tabs)
    ioInstance.to(`user_${userIdStr}`).emit(event, data);
    
    // Direct socket mapping fallback
    const socketId = userSockets.get(userIdStr);
    if (socketId) {
      ioInstance.to(socketId).emit(event, data);
    }
    return true;
  }
  return false;
};

const sendToDonor = (donorId, event, data) => {
  if (ioInstance && donorId) {
    ioInstance.to(`donor_${donorId.toString()}`).emit(event, data);
    return true;
  }
  return false;
};

const broadcastToRoom = (room, event, data) => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
    return true;
  }
  return false;
};

const broadcastToAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
    return true;
  }
  return false;
};

module.exports = {
  init,
  sendToUser,
  sendToDonor,
  broadcastToRoom,
  broadcastToAll,
  userSockets
};
