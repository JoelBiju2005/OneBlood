const DonationMatch = require('../models/DonationMatch');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const SystemSettings = require('../models/SystemSettings');
const { generateMatchPDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const socketService = require('../services/socketService');

/**
 * Seeker approves a donor response and selects the destination facility.
 */
const approveDonorAndSelectFacility = async (req, res, next) => {
  try {
    const { requestId, donorId, hospitalId, bloodBankId } = req.body;

    if (!requestId || !donorId || !hospitalId) {
      return res.status(400).json({ message: 'Missing required fields: requestId, donorId, hospitalId' });
    }

    let request = await BloodRequest.findById(requestId);
    let isNoticeBoard = false;
    if (!request) {
      const NoticeBoard = require('../models/NoticeBoard');
      request = await NoticeBoard.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Blood request or Notice not found' });
      }
      isNoticeBoard = true;
    }

    // Ensure the requester is the one approving
    const requesterId = isNoticeBoard ? request.seekerId : request.requesterId;
    if (requesterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to approve donor' });
    }

    const donorUser = await User.findById(donorId);
    if (!donorUser) {
      return res.status(404).json({ message: 'Donor user not found' });
    }

    const donorProfile = await Donor.findOne({ userId: donorId });
    if (!donorProfile) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Load system settings for donor eligibility checks
    const settings = await SystemSettings.getSettings();
    if (donorProfile.age && (donorProfile.age < settings.donorMinAge || donorProfile.age > settings.donorMaxAge)) {
      return res.status(400).json({ message: `Donor does not meet age eligibility requirements (${settings.donorMinAge}-${settings.donorMaxAge} years)` });
    }
    if (donorProfile.weight && donorProfile.weight < settings.donorMinWeight) {
      return res.status(400).json({ message: `Donor does not meet weight eligibility requirements (minimum ${settings.donorMinWeight} kg)` });
    }
    if (donorProfile.lastDonated) {
      const diffTime = Math.abs(new Date() - new Date(donorProfile.lastDonated));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < settings.donationGapDays) {
        return res.status(400).json({ message: `Donor is in eligibility window (must wait ${settings.donationGapDays} days, last donated ${diffDays} days ago)` });
      }
    }

    // Resolve hospital
    const facility = await Hospital.findById(hospitalId).populate('userId');
    if (!facility) return res.status(404).json({ message: 'Hospital not found' });
    const facilityName = facility.hospitalName;
    const facilityEmail = facility.userId?.email || facility.emergencyContact;

    // Resolve optional detour blood bank
    let detourBank = null;
    if (bloodBankId) {
      detourBank = await BloodBank.findById(bloodBankId).populate('adminUserId');
      if (!detourBank) return res.status(404).json({ message: 'Blood Bank detour not found' });
    }

    // Generate Match OBID
    const matchObid = await DonationMatch.generateMatchId();

    const destinationType = bloodBankId ? 'BloodBankAndHospital' : 'Hospital';

    // Create Donation Match
    const match = await DonationMatch.create({
      matchObid,
      seekerId: requesterId,
      donorId: donorUser._id,
      destinationType,
      hospitalId,
      bloodBankId: bloodBankId || null,
      requestId,
      requestType: isNoticeBoard ? 'NoticeBoard' : 'BloodRequest',
      bloodGroup: request.bloodGroup,
      units: (isNoticeBoard ? request.unitsNeeded : request.unitsRequired) || 1,
      status: 'in_progress'
    });

    // Update Request status to approved/accepted
    if (isNoticeBoard) {
      const respIndex = request.responses.findIndex(r => r.donorId && (r.donorId.toString() === donorProfile._id.toString() || r.donorId.toString() === donorId.toString()));
      if (respIndex > -1) {
        request.responses[respIndex].action = 'can_donate'; // ensure action is recorded correctly
      }
      request.status = 'active'; // keep notice post active or accepted status
      await request.save();
    } else {
      const respIndex = request.responses.findIndex(r => r.responderId && r.responderId.toString() === donorProfile._id.toString());
      if (respIndex > -1) {
        request.responses[respIndex].status = 'accepted';
        request.markModified('responses');
      }
      request.status = 'accepted';
      await request.save();
    }

    // Generate PDF
    const seekerUser = await User.findById(requesterId);
    let pdfPath = '';
    try {
      pdfPath = await generateMatchPDF(match, seekerUser, donorUser, facility, detourBank);
      match.pdfPath = `/uploads/pdfs/match_${matchObid}.pdf`;
      await match.save();
    } catch (pdfErr) {
      console.error('Failed to generate PDF:', pdfErr.message);
    }

    // Send emails with PDF attached
    const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
    
    const emailSubject = `OneBlood Donation Match Confirmed - ID: ${matchObid}`;
    let emailBody = `
      <h3>Donation Match Confirmed</h3>
      <p>A blood donation match has been established between seeker <strong>${seekerUser.name}</strong> and donor <strong>${donorUser.name}</strong>.</p>
      <p><strong>Match OBID:</strong> ${matchObid}</p>
      <p><strong>Destination Hospital:</strong> ${facilityName}</p>
    `;
    if (detourBank) {
      emailBody += `<p><strong>Detour Blood Bank:</strong> ${detourBank.name}</p>`;
    }
    emailBody += `<p>Please find the official match slip attached to this email.</p>`;

    // Notify Seeker
    await createNotification({
      recipientId: seekerUser._id,
      type: 'donor_response',
      title: '💖 Match Created & Confirmed',
      message: `Your request has been matched with donor ${donorUser.name}. Match ID: ${matchObid}. PDF generated.`
    });
    await sendEmail(seekerUser.email, emailSubject, emailBody, 'match_confirmed', attachments);

    // Notify Donor
    await createNotification({
      recipientId: donorUser._id,
      type: 'donor_response',
      title: '💖 Match Confirmed',
      message: `You are matched for donation. Match ID: ${matchObid}. Hospital: ${facilityName}.`
    });
    await sendEmail(donorUser.email, emailSubject, emailBody, 'match_confirmed', attachments);

    // Notify Hospital
    if (facility.userId?._id) {
      await createNotification({
        recipientId: facility.userId._id,
        type: 'system',
        title: '🏥 New Match Assigned',
        message: `Match ID ${matchObid} has been registered to your hospital.`
      });
    }
    if (facilityEmail) {
      await sendEmail(facilityEmail, emailSubject, emailBody, 'match_confirmed', attachments);
    }

    // Notify Blood Bank Detour (if present)
    if (detourBank && detourBank.adminUserId?._id) {
      await createNotification({
        recipientId: detourBank.adminUserId._id,
        type: 'system',
        title: '🏥 New Detour Match Assigned',
        message: `Match ID ${matchObid} detour has been registered to your blood bank.`
      });
      const bbEmail = detourBank.adminUserId?.email || detourBank.email;
      if (bbEmail) {
        await sendEmail(bbEmail, emailSubject, emailBody, 'match_confirmed', attachments);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Donor approved and DonationMatch established',
      match,
      pdfUrl: `/uploads/pdfs/match_${matchObid}.pdf`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks a donation match as completed. Done by Facility (Hospital/BloodBank) or Admin.
 */
const completeDonation = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { completionEvidence } = req.body; // Path or document from upload

    const match = await DonationMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Donation match not found' });
    }

    // Verify authorized user (Hospital or BloodBank or Admin)
    let isAuthorized = req.user.role === 'admin';
    if (!isAuthorized) {
      if (match.hospitalId) {
        const hosp = await Hospital.findById(match.hospitalId);
        if (hosp && hosp.userId.toString() === req.user._id.toString()) isAuthorized = true;
      }
      if (!isAuthorized && match.bloodBankId) {
        const bb = await BloodBank.findById(match.bloodBankId);
        if (bb && bb.adminUserId.toString() === req.user._id.toString()) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Unauthorized to mark donation as completed' });
    }

    match.status = 'completed';
    match.completionEvidence = completionEvidence || '';
    match.completedAt = new Date();
    await match.save();

    // Update Donor Profile totalDonations and lastDonationDate
    const donorProfile = await Donor.findOne({ userId: match.donorId });
    if (donorProfile) {
      donorProfile.lastDonated = new Date();
      donorProfile.totalDonations += 1;
      await donorProfile.save();
    }

    // Update Request status
    if (match.requestType === 'NoticeBoard') {
      const NoticeBoard = require('../models/NoticeBoard');
      await NoticeBoard.findByIdAndUpdate(match.requestId, { status: 'fulfilled' });
    } else {
      await BloodRequest.findByIdAndUpdate(match.requestId, { status: 'fulfilled' });
    }

    // Send notifications to Seeker & Donor
    await createNotification({
      recipientId: match.seekerId,
      type: 'donor_response',
      title: '✅ Donation Completed',
      message: `Donation Match ${match.matchObid} has been marked as completed by the facility.`
    });

    await createNotification({
      recipientId: match.donorId,
      type: 'donor_response',
      title: '✅ Donation Completed',
      message: `Donation Match ${match.matchObid} completed. Thank you for saving a life!`
    });

    res.status(200).json({
      success: true,
      message: 'Donation completed successfully and history stored',
      match
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancels a match.
 */
const cancelMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { cancellationReason } = req.body;

    const match = await DonationMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Donation match not found' });
    }

    match.status = 'cancelled';
    match.cancelledBy = req.user._id;
    match.cancellationReason = cancellationReason || 'No reason specified';
    match.cancelledAt = new Date();
    await match.save();

    // Revert Request status back to active so other donors can help
    if (match.requestType === 'NoticeBoard') {
      const NoticeBoard = require('../models/NoticeBoard');
      await NoticeBoard.findByIdAndUpdate(match.requestId, { status: 'open' });
    } else {
      await BloodRequest.findByIdAndUpdate(match.requestId, { status: 'active' });
    }

    // Send alerts
    const seeker = await User.findById(match.seekerId);
    const donor = await User.findById(match.donorId);

    const alertSubject = `OneBlood Donation Match Cancelled - ID: ${match.matchObid}`;
    const alertBody = `<p>We regret to inform you that Donation Match <strong>${match.matchObid}</strong> has been cancelled.</p><p>Reason: ${match.cancellationReason}</p>`;

    if (seeker) {
      await createNotification({ recipientId: seeker._id, type: 'system', title: '🚨 Match Cancelled', message: `Match ${match.matchObid} was cancelled.` });
      await sendEmail(seeker.email, alertSubject, alertBody);
    }
    if (donor) {
      await createNotification({ recipientId: donor._id, type: 'system', title: '🚨 Match Cancelled', message: `Match ${match.matchObid} was cancelled.` });
      await sendEmail(donor.email, alertSubject, alertBody);
    }

    res.status(200).json({
      success: true,
      message: 'Donation match cancelled successfully',
      match
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active matches in progress.
 */
const getMatchesInProgress = async (req, res, next) => {
  try {
    const filter = { status: 'in_progress' };

    // Filter by role
    if (req.user.role === 'donor') {
      filter.donorId = req.user._id;
    } else if (req.user.role === 'patient') {
      filter.seekerId = req.user._id;
    } else if (req.user.role === 'hospital') {
      const hosp = await Hospital.findOne({ userId: req.user._id });
      if (hosp) filter.hospitalId = hosp._id;
    } else if (req.user.role === 'blood_bank') {
      const bank = await BloodBank.findOne({ adminUserId: req.user._id });
      if (bank) filter.bloodBankId = bank._id;
    }

    const matches = await DonationMatch.find(filter)
      .populate('seekerId', 'name email phone')
      .populate('donorId', 'name email phone onebloodId')
      .populate('hospitalId')
      .populate('bloodBankId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: matches.length, matches });
  } catch (error) {
    next(error);
  }
};

/**
 * Get match histories.
 */
const getMatchHistory = async (req, res, next) => {
  try {
    const filter = { status: { $in: ['completed', 'cancelled'] } };

    if (req.user.role === 'donor') {
      filter.donorId = req.user._id;
    } else if (req.user.role === 'patient') {
      filter.seekerId = req.user._id;
    } else if (req.user.role === 'hospital') {
      const hosp = await Hospital.findOne({ userId: req.user._id });
      if (hosp) filter.hospitalId = hosp._id;
    } else if (req.user.role === 'blood_bank') {
      const bank = await BloodBank.findOne({ adminUserId: req.user._id });
      if (bank) filter.bloodBankId = bank._id;
    }

    const history = await DonationMatch.find(filter)
      .populate('seekerId', 'name email phone')
      .populate('donorId', 'name email phone onebloodId')
      .populate('hospitalId')
      .populate('bloodBankId')
      .sort({ completedAt: -1, cancelledAt: -1 });

    res.status(200).json({ success: true, count: history.length, history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveDonorAndSelectFacility,
  completeDonation,
  cancelMatch,
  getMatchesInProgress,
  getMatchHistory
};
