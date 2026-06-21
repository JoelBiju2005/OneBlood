const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const SystemSettings = require('../models/SystemSettings');
const { createNotification } = require('./notificationService');
const { sendEmail } = require('./emailService');
const { calculateDistance } = require('../utils/geoUtils'); // Let's check if this utility exists or if we should write a simple distance helper

/**
 * Quick distance calculation between two coordinates (in km)
 */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
};

const runEscalationCheck = async () => {
  try {
    const settings = await SystemSettings.getSettings();
    if (!settings.escalationEnabled) {
      return;
    }

    // Find active requests that are critical and created more than 15 minutes ago
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const criticalRequests = await BloodRequest.find({
      urgency: 'critical',
      status: 'pending', // or 'active'
      createdAt: { $lte: fifteenMinsAgo },
      $or: [{ responses: { $exists: false } }, { responses: { $size: 0 } }]
    }).populate('requesterId');

    for (const request of criticalRequests) {
      console.log(`⚠️ Escalating critical request ${request._id} for blood group ${request.bloodGroup}...`);
      
      // Get coordinates of requester if exists
      const reqLat = request.requesterId?.location?.coordinates?.[1];
      const reqLng = request.requesterId?.location?.coordinates?.[0];

      // 1. Notify nearby Approved Hospitals
      const approvedHospitals = await Hospital.find({ verificationStatus: 'approved' }).populate('userId');
      for (const hosp of approvedHospitals) {
        if (!hosp.emailVerified) {
          console.warn(`[Escalation Warning] Hospital ${hosp.hospitalName} email is unverified. Skipping critical alert.`);
          continue;
        }
        let isClose = true;
        if (reqLat && reqLng && hosp.location?.coordinates) {
          const dist = getDistance(reqLat, reqLng, hosp.location.coordinates[1], hosp.location.coordinates[0]);
          if (dist > 15) isClose = false; // Limit escalation to 15km range
        }
        if (isClose && hosp.userId) {
          await createNotification({
            recipientId: hosp.userId._id,
            type: 'request_alert',
            title: '🚨 CRITICAL ESCALATION',
            message: `A critical blood request for ${request.bloodGroup} at ${request.hospitalName} is pending. Please check if you can supply units.`,
            priority: 'high'
          });
          if (hosp.userId.email) {
            await sendEmail(
              hosp.userId.email,
              `🚨 OneBlood Critical Request Escalation: ${request.bloodGroup}`,
              `<h2 style="color:#C0152A;margin-top:0;font-size:20px;font-weight:700;">🚨 Critical Request Escalation</h2>
               <p>Dear Hospital Administrator,</p>
               <p>A critical requirement for <strong>${request.bloodGroup}</strong> blood remains unfulfilled within 15 km of your location.</p>
               <div class="info-card" style="border-left-color:#C0152A;background-color:#fcfcfc;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
                 <div style="font-weight:700;color:#1e293b;margin-bottom:12px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Requirement Details</div>
                 <table style="width:100%;border-collapse:collapse;">
                   <tr>
                     <td style="padding:6px 0;font-size:14px;color:#64748b;font-weight:600;width:140px;">Blood Group:</td>
                     <td style="padding:6px 0;font-size:14px;color:#0f172a;"><strong>${request.bloodGroup}</strong></td>
                   </tr>
                   <tr>
                     <td style="padding:6px 0;font-size:14px;color:#64748b;font-weight:600;width:140px;">Hospital:</td>
                     <td style="padding:6px 0;font-size:14px;color:#0f172a;">${request.hospitalName}</td>
                   </tr>
                 </table>
               </div>
               <div style="text-align:center;margin:24px 0;">
                 <a href="${process.env.FRONTEND_URL || 'https://oneblood-app.web.app'}/search" class="button">View Search Map</a>
               </div>`
            );
          }
        }
      }

      // 2. Notify nearby Approved Blood Banks
      const approvedBanks = await BloodBank.find({ verificationStatus: 'approved' }).populate('adminUserId');
      for (const bank of approvedBanks) {
        let isClose = true;
        if (reqLat && reqLng && bank.location?.coordinates) {
          const dist = getDistance(reqLat, reqLng, bank.location.coordinates[1], bank.location.coordinates[0]);
          if (dist > 15) isClose = false;
        }
        if (isClose && bank.adminUserId) {
          await createNotification({
            recipientId: bank.adminUserId._id,
            type: 'request_alert',
            title: '🚨 CRITICAL ESCALATION',
            message: `A critical blood request for ${request.bloodGroup} at ${request.hospitalName} is pending. Please verify inventory.`,
            priority: 'high'
          });
          if (bank.adminUserId.email) {
            await sendEmail(
              bank.adminUserId.email,
              `🚨 OneBlood Critical Request Escalation: ${request.bloodGroup}`,
              `<h2 style="color:#C0152A;margin-top:0;font-size:20px;font-weight:700;">🚨 Critical Request Escalation</h2>
               <p>Dear Blood Bank Administrator,</p>
               <p>A critical requirement for <strong>${request.bloodGroup}</strong> blood remains unfulfilled nearby.</p>
               <div class="info-card" style="border-left-color:#C0152A;background-color:#fcfcfc;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
                 <div style="font-weight:700;color:#1e293b;margin-bottom:12px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Requirement Details</div>
                 <table style="width:100%;border-collapse:collapse;">
                   <tr>
                     <td style="padding:6px 0;font-size:14px;color:#64748b;font-weight:600;width:140px;">Blood Group:</td>
                     <td style="padding:6px 0;font-size:14px;color:#0f172a;"><strong>${request.bloodGroup}</strong></td>
                   </tr>
                   <tr>
                     <td style="padding:6px 0;font-size:14px;color:#64748b;font-weight:600;width:140px;">Hospital:</td>
                     <td style="padding:6px 0;font-size:14px;color:#0f172a;">${request.hospitalName}</td>
                   </tr>
                 </table>
               </div>
               <div style="text-align:center;margin:24px 0;">
                 <a href="${process.env.FRONTEND_URL || 'https://oneblood-app.web.app'}/search" class="button">View Search Map</a>
               </div>`
            );
          }
        }
      }

      // 3. Notify System Administrators
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          recipientId: admin._id,
          type: 'system',
          title: '🚨 UNRESOLVED CRITICAL REQUEST',
          message: `Critical request ${request._id} has no responses after 15 minutes.`,
          priority: 'high'
        });
      }
    }
  } catch (err) {
    console.error('Critical request escalation execution failed:', err.message);
  }
};

// Check every 10 minutes
setInterval(runEscalationCheck, 10 * 60 * 1000);

module.exports = {
  runEscalationCheck
};
