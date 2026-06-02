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
    const { requestId, donorId, destinationType, facilityId } = req.body;

    if (!requestId || !donorId || !destinationType || !facilityId) {
      return res.status(400).json({ message: 'Missing required fields: requestId, donorId, destinationType, facilityId' });
    }

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    // Ensure the requester is the one approving
    if (request.requesterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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

    // Resolve Facility
    let facility = null;
    let facilityEmail = '';
    let facilityName = '';
    let hospitalId = null;
    let bloodBankId = null;

    if (destinationType === 'Hospital') {
      facility = await Hospital.findById(facilityId).populate('userId');
      if (!facility) return res.status(404).json({ message: 'Hospital not found' });
      hospitalId = facilityId;
      facilityName = facility.hospitalName;
      facilityEmail = facility.userId?.email || facility.emergencyContact;
    } else {
      facility = await BloodBank.findById(facilityId).populate('adminUserId');
      if (!facility) return res.status(404).json({ message: 'Blood Bank not found' });
      bloodBankId = facilityId;
      facilityName = facility.name;
      facilityEmail = facility.adminUserId?.email || facility.email;
    }

    // Generate Match OBID
    const matchObid = await DonationMatch.generateMatchId();

    // Create Donation Match
    const match = await DonationMatch.create({
      matchObid,
      seekerId: request.requesterId,
      donorId: donorUser._id,
      destinationType,
      hospitalId,
      bloodBankId,
      requestId,
      bloodGroup: request.bloodGroup,
      units: request.unitsRequired || 1,
      status: 'in_progress'
    });

    // Update Blood Request response item status to approved
    const respIndex = request.responses.findIndex(r => r.responderId && r.responderId.toString() === donorProfile._id.toString());
    if (respIndex > -1) {
      request.responses[respIndex].status = 'accepted';
      request.markModified('responses');
    }
    request.status = 'accepted';
    await request.save();

    // Generate PDF
    const seekerUser = await User.findById(request.requesterId);
    let pdfPath = '';
    try {
      pdfPath = await generateMatchPDF(match, seekerUser, donorUser, facility);
      match.pdfPath = pdfPath;
      await match.save();
    } catch (pdfErr) {
      console.error('Failed to generate PDF:', pdfErr.message);
    }

    // Send emails with PDF attached
    const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
    
    const emailSubject = `OneBlood Donation Match Confirmed - ID: ${matchObid}`;
    const emailBody = `
      <h3>Donation Match Confirmed</h3>
      <p>A blood donation match has been established between seeker <strong>${seekerUser.name}</strong> and donor <strong>${donorUser.name}</strong>.</p>
      <p><strong>Match OBID:</strong> ${matchObid}</p>
      <p><strong>Destination Facility:</strong> ${facilityName}</p>
      <p>Please find the official match slip attached to this email.</p>
    `;

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
      message: `You are matched for donation. Match ID: ${matchObid}. Facility: ${facilityName}.`
    });
    await sendEmail(donorUser.email, emailSubject, emailBody, 'match_confirmed', attachments);

    // Notify Facility
    const facUserId = destinationType === 'Hospital' ? facility.userId?._id : facility.adminUserId?._id;
    if (facUserId) {
      await createNotification({
        recipientId: facUserId,
        type: 'system',
        title: '🏥 New Match Assigned',
        message: `Match ID ${matchObid} has been registered to your facility.`
      });
    }
    if (facilityEmail) {
      await sendEmail(facilityEmail, emailSubject, emailBody, 'match_confirmed', attachments);
    }

    res.status(201).json({
      success: true,
      message: 'Donor approved and DonationMatch established',
      match,
      pdfUrl: pdfPath ? `/uploads/pdfs/match_${matchObid}.pdf` : null
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

    // Verify authorized user (Facility admin or site admin)
    let isAuthorized = req.user.role === 'admin';
    if (!isAuthorized) {
      if (match.destinationType === 'Hospital') {
        const hosp = await Hospital.findById(match.hospitalId);
        if (hosp && hosp.userId.toString() === req.user._id.toString()) isAuthorized = true;
      } else {
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

    // Update Blood Request status
    await BloodRequest.findByIdAndUpdate(match.requestId, { status: 'fulfilled' });

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
    await BloodRequest.findByIdAndUpdate(match.requestId, { status: 'active' });

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
