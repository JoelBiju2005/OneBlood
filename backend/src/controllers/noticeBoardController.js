const NoticeBoard = require('../models/NoticeBoard');
const { uploadFile } = require('../services/storageService');
const socketService = require('../services/socketService');


exports.getAllNotices = async (req, res) => {
  try {
    const { urgency, bloodGroup, city } = req.query;
    // Support both 'open' (new) and 'active' (legacy) statuses
    const filter = { status: { $in: ['open', 'active'] } };
    if (urgency) filter.urgency = urgency;
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = new RegExp(city, 'i');

    const notices = await NoticeBoard.find(filter)
      .sort({ urgency: 1, createdAt: -1 }) // critical first, then newest
      .limit(50)
      .lean();
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notices.' });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const { patientName, bloodGroup, component, unitsNeeded, hospital, city, contactNumber, urgency, message } = req.body;

    let doctorLetterUrl = null;
    if (req.file) {
      doctorLetterUrl = await uploadFile(req.file);
    }

    const notice = await NoticeBoard.create({
      seekerId: req.user._id,
      seekerName: req.user.name,
      patientName,
      bloodGroup,
      component: component || 'Whole Blood',
      unitsNeeded: parseInt(unitsNeeded, 10) || 1,
      unitsRequired: parseInt(unitsNeeded, 10) || 1,
      hospital,
      hospitalName: hospital,
      city,
      contactNumber,
      urgency,
      message,
      doctorLetterUrl,
      status: 'open',
    });

    res.status(201).json(notice);
  } catch (err) {
    console.error('[NoticeBoard Create]', err);
    res.status(500).json({ message: 'Failed to post notice.' });
  }
};

exports.respondToNotice = async (req, res) => {
  try {
    const { action, note } = req.body;
    const validActions = ['can_donate', 'know_someone', 'contacted', 'shared'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    const notice = await NoticeBoard.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found.' });
    }
    if (notice.status !== 'open' && notice.status !== 'active') {
      return res.status(400).json({ message: 'This need is no longer open.' });
    }

    const Donor = require('../models/Donor');
    const donorProfile = await Donor.findOne({ userId: req.user._id });
    const donorProfileIdStr = donorProfile ? donorProfile._id.toString() : '';
    const userIdStr = req.user._id.toString();

    // Safely read existing responses
    const existingResponses = Array.isArray(notice.responses) ? notice.responses : [];

    // Prevent duplicate response of same action by same donor
    const alreadyResponded = existingResponses.some(
      r => r.donorId && (r.donorId.toString() === userIdStr || r.donorId.toString() === donorProfileIdStr) && r.action === action
    );
    if (alreadyResponded) {
      return res.status(409).json({ message: 'You have already responded with this action.' });
    }

    const responseObj = {
      donorId: donorProfile ? donorProfile._id.toString() : req.user._id.toString(),
      donorName: req.user.name,
      action,
      note: note || '',
      createdAt: new Date().toISOString()
    };

    if (action === 'can_donate') {
      responseObj.donorPhone = req.user.phone || '';
      responseObj.donorEmail = req.user.email || '';
    }

    if (action === 'know_someone') {
      responseObj.referralName = req.body.referralName || '';
      responseObj.referralPhone = req.body.referralPhone || '';
      responseObj.referralBloodGroup = req.body.referralBloodGroup || '';
    }

    // Use $push directly — bypasses Mongoose change tracking, always reliable
    const updatedNotice = await NoticeBoard.findByIdAndUpdate(
      req.params.id,
      { $push: { responses: responseObj } },
      { new: true }
    );

    if (!updatedNotice) {
      return res.status(500).json({ message: 'Failed to save response.' });
    }

    // Send real-time socket event AND persistent notification to Seeker (non-fatal)
    try {
      const { createNotification } = require('../services/notificationService');
      const User = require('../models/User');
      const seekerUser = await User.findById(notice.seekerId);

      if (seekerUser) {
        const actionLabels = {
          can_donate: '🩸 Can Donate',
          know_someone: '👥 Referred Someone',
          contacted: '📞 Contacted',
          shared: '🔗 Shared'
        };
        const actionLabel = actionLabels[action] || action;

        // 1. Real-time socket — push the entire updated notice so the UI re-renders live
        socketService.sendToUser(notice.seekerId, 'notice_board_response', {
          noticeId: notice._id.toString(),
          updatedNotice,
          responder: {
            name: req.user.name,
            action,
            actionLabel,
          }
        });

        // 2. Toast-style notification event
        socketService.sendToUser(notice.seekerId, 'notification', {
          title: `New response on your notice`,
          message: `${req.user.name} responded: ${actionLabel}`,
          type: 'notice_board_response',
          priority: action === 'can_donate' ? 'high' : 'normal',
          data: { noticeId: notice._id },
          createdAt: new Date(),
          isRead: false
        });

        // 3. Persistent DB notification
        await createNotification({
          recipientId: notice.seekerId,
          type: 'notice_board_response',
          title: `New response on notice for ${notice.patientName}`,
          message: `${req.user.name} responded: ${actionLabel}.${note ? ` Note: "${note}"` : ''}`,
          data: { noticeId: notice._id, action },
          priority: action === 'can_donate' ? 'high' : 'normal',
          email: seekerUser.email,
          recipientName: seekerUser.name
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch notification:', notifErr.message);
    }


    res.json({ message: 'Response recorded.', notice: updatedNotice });
  } catch (err) {
    console.error('[NoticeBoard Respond]', err);
    res.status(500).json({ message: 'Failed to respond.' });
  }
};


exports.getMyNotices = async (req, res) => {
  try {
    // Include both 'open' and 'active' (legacy) statuses
    const notices = await NoticeBoard.find({
      seekerId: req.user._id,
      status: { $in: ['open', 'active'] }
    }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your notices.' });
  }
};

exports.closeNotice = async (req, res) => {
  try {
    const notice = await NoticeBoard.findOne({ _id: req.params.id, seekerId: req.user._id });
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found or unauthorized.' });
    }
    notice.status = 'fulfilled';
    await notice.save();
    res.json({ message: 'Notice marked as fulfilled.', notice });
  } catch (err) {
    res.status(500).json({ message: 'Failed to close notice.' });
  }
};
