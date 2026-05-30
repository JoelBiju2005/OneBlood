const NoticeBoard = require('../models/NoticeBoard');
const { uploadFile } = require('../services/storageService');

exports.getAllNotices = async (req, res) => {
  try {
    const { urgency, bloodGroup, city, status = 'open' } = req.query;
    const filter = { status };
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
      hospital,
      city,
      contactNumber,
      urgency,
      message,
      doctorLetterUrl,
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
    if (notice.status !== 'open') {
      return res.status(400).json({ message: 'This need is no longer open.' });
    }

    const Donor = require('../models/Donor');
    const donorProfile = await Donor.findOne({ userId: req.user._id });
    const donorProfileIdStr = donorProfile ? donorProfile._id.toString() : '';
    const userIdStr = req.user._id.toString();

    // Prevent duplicate response of same action by same donor
    const alreadyResponded = notice.responses.some(
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
      responseObj.donorPhone = req.user.phone;
      responseObj.donorEmail = req.user.email;
    }

    if (action === 'know_someone') {
      responseObj.referralName = req.body.referralName || '';
      responseObj.referralPhone = req.body.referralPhone || '';
      responseObj.referralBloodGroup = req.body.referralBloodGroup || '';
    }

    notice.responses = [...notice.responses, responseObj];
    notice.changed('responses', true);
    await notice.save();

    // Send Notification to Seeker
    try {
      const { createNotification } = require('../services/notificationService');
      const User = require('../models/User');
      const seekerUser = await User.findById(notice.seekerId);
      
      if (seekerUser) {
        const actionLabels = {
          can_donate: 'Volunteer Donor ("I Can Donate")',
          know_someone: 'Referral ("Refer Someone")',
          contacted: 'Direct Contact ("I\'ve Contacted Them")',
          shared: 'Social Share ("I Shared This")'
        };
        
        const actionLabel = actionLabels[action] || action;
        
        await createNotification({
          recipientId: notice.seekerId,
          type: 'notice_board_response',
          title: `Response on notice for ${notice.patientName}`,
          message: `${req.user.name} responded to your notice: "${actionLabel}".${note ? ` Details: "${note}"` : ''}`,
          data: { noticeId: notice._id, action },
          priority: action === 'can_donate' ? 'high' : 'normal',
          email: seekerUser.email,
          recipientName: seekerUser.name
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch notification:', notifErr.message);
    }

    res.json({ message: 'Response recorded.', notice });
  } catch (err) {
    console.error('[NoticeBoard Respond]', err);
    res.status(500).json({ message: 'Failed to respond.' });
  }
};

exports.getMyNotices = async (req, res) => {
  try {
    const notices = await NoticeBoard.find({ seekerId: req.user._id }).sort({ createdAt: -1 });
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
