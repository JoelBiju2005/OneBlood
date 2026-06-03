const fs = require('fs');
const path = require('path');
const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const SystemSettings = require('../models/SystemSettings');

/**
 * Core send email routine using Brevo Transactional Email HTTP API.
 * Falls back to console mock in dev/local if API key is missing or mock.
 */
const sendEmail = async (to, subject, htmlBody, templateName = 'custom', attachments = null, emailType = null) => {
  const settings = await SystemSettings.getSettings();
  const fromEmail = settings.fromEmail || 'oneblood.officialteam@gmail.com';
  const apiKey = process.env.BREVO_API_KEY;

  let providerUsed = 'brevo';
  let emailSent = false;
  let errorMsg = '';
  let resultInfo = null;

  // Check if API key is valid and not mock
  const isMockEnv = !apiKey || apiKey === 'mock_key_for_dev' || apiKey.trim() === '';

  if (!isMockEnv) {
    try {
      // Process attachments if any
      const brevoAttachments = [];
      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att.path) {
            try {
              let resolvedPath = att.path;
              if (!path.isAbsolute(resolvedPath)) {
                resolvedPath = path.resolve(__dirname, '../../', resolvedPath);
              }
              if (fs.existsSync(resolvedPath)) {
                const fileBuffer = fs.readFileSync(resolvedPath);
                const base64Content = fileBuffer.toString('base64');
                brevoAttachments.push({
                  content: base64Content,
                  name: att.filename || path.basename(resolvedPath)
                });
              } else {
                console.warn(`Attachment file not found at path: ${resolvedPath}`);
              }
            } catch (err) {
              console.error(`Failed to read attachment file:`, err.message);
            }
          } else if (att.content && att.filename) {
            brevoAttachments.push({
              content: att.content,
              name: att.filename
            });
          }
        }
      }

      // Construct Brevo API request
      const payload = {
        sender: { name: "OneBlood", email: fromEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlBody
      };

      if (brevoAttachments.length > 0) {
        payload.attachment = brevoAttachments;
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok) {
        emailSent = true;
        resultInfo = responseData;
        console.log(`✉️ Email sent successfully via Brevo to ${to}`);
      } else {
        throw new Error(responseData.message || JSON.stringify(responseData));
      }
    } catch (err) {
      errorMsg = `Brevo failed: ${err.message}.`;
      console.error(`🔴 Brevo Email delivery failed to ${to}: ${errorMsg}`);
    }
  }

  // Dev log output if mock mode or if Brevo failed (acting as local fallback)
  if (!emailSent) {
    providerUsed = 'mock';
    console.log('\n=================== MOCK EMAIL OUTPUT ===================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------- BODY -------------------------------');
    console.log(htmlBody.replace(/<[^>]*>/g, '').trim().substring(0, 500) + '...');
    console.log('==========================================================\n');
    emailSent = true; // Mark as sent to prevent infinite retry loops in local dev
  }

  // Log execution details to DB
  try {
    await EmailLog.create({
      to,
      templateName,
      emailType: emailType || templateName,
      subject,
      status: providerUsed === 'mock' ? 'sent' : (emailSent ? 'sent' : 'failed'),
      provider: providerUsed,
      errorMessage: errorMsg || undefined,
      attempts: 1
    });
  } catch (logErr) {
    console.error('Failed to save EmailLog:', logErr.message);
  }

  return { success: emailSent, info: resultInfo, provider: providerUsed };
};

/**
 * Resolves template from DB or default values, replacing placeholders.
 */
const sendTemplateEmail = async (to, templateName, defaultSubject, defaultHtml, variables, attachments = null, emailType = null) => {
  let subject = defaultSubject;
  let html = defaultHtml;

  try {
    const template = await EmailTemplate.findOne({ templateName, active: true });
    if (template) {
      subject = template.subject;
      html = template.html;
    }
  } catch (err) {
    console.error(`Error loading template ${templateName} from database:`, err.message);
  }

  // Replace variables in subject and html
  if (variables) {
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, val || '');
      html = html.replace(regex, val || '');
    }
  }

  return sendEmail(to, subject, html, templateName, attachments, emailType);
};

/**
 * Send welcome email to user
 */
const sendWelcomeEmail = async (to, name, onebloodId = 'N/A', role = 'donor') => {
  const defaultSubject = 'Welcome to OneBlood!';
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #B91C1C; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; margin-top: 0;">Welcome to OneBlood</h2>
      <p>Dear <strong>{{name}}</strong>,</p>
      <p>Thank you for registering on the OneBlood platform. We are building the fastest real-time blood coordination network.</p>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 5px 0;"><strong>OneBlood ID (OBID):</strong> {{onebloodId}}</p>
        <p style="margin: 5px 0;"><strong>Role:</strong> {{role}}</p>
      </div>
      <p>Whether you need to request blood in an emergency or want to save lives as a donor/facility, you now have access to a verified network.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/search" style="background-color: #B91C1C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Search Map & Inventory</a>
      </p>
    </div>
  `;
  return sendTemplateEmail(to, 'welcome_email', defaultSubject, defaultHtml, { name, onebloodId, role }, null, 'welcome');
};

/**
 * Send match confirmation email to seeker and donor
 */
const sendMatchConfirmationEmail = async (to, seekerName, donorName, matchObid, facilityName, pdfPath = null) => {
  const defaultSubject = `OneBlood Donation Match Confirmed - ID: {{matchObid}}`;
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #B91C1C; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; margin-top: 0;">Donation Match Confirmed</h2>
      <p>Dear User,</p>
      <p>A blood donation match has been established between seeker <strong>{{seekerName}}</strong> and donor <strong>{{donorName}}</strong>.</p>
      <p><strong>Match OBID:</strong> {{matchObid}}</p>
      <p><strong>Destination Hospital:</strong> {{facilityName}}</p>
      <p>Please find the official match slip attached to this email.</p>
    </div>
  `;
  const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
  return sendTemplateEmail(to, 'match_confirmed_seeker_donor', defaultSubject, defaultHtml, { seekerName, donorName, matchObid, facilityName }, attachments, 'match_confirmed');
};

/**
 * Send match email to hospital
 */
const sendHospitalMatchEmail = async (to, seekerName, donorName, matchObid, facilityName, pdfPath = null) => {
  const defaultSubject = `🏥 New Match Assigned - ID: {{matchObid}}`;
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #B91C1C; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; margin-top: 0;">🏥 New Match Assigned</h2>
      <p>Dear Hospital Administrator,</p>
      <p>Match ID <strong>{{matchObid}}</strong> has been registered to your hospital.</p>
      <p>A blood donation match has been established between seeker <strong>{{seekerName}}</strong> and donor <strong>{{donorName}}</strong>.</p>
      <p><strong>Match OBID:</strong> {{matchObid}}</p>
      <p><strong>Destination Hospital:</strong> {{facilityName}}</p>
      <p>Please find the official match slip attached to this email.</p>
    </div>
  `;
  const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
  return sendTemplateEmail(to, 'match_confirmed_hospital', defaultSubject, defaultHtml, { seekerName, donorName, matchObid, facilityName }, attachments, 'match_confirmed_hospital');
};

/**
 * Send match email to blood bank (transit detour)
 */
const sendBloodBankMatchEmail = async (to, seekerName, donorName, matchObid, facilityName, detourBankName, pdfPath = null) => {
  const defaultSubject = `🏥 New Detour Match Assigned - ID: {{matchObid}}`;
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #B91C1C; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; margin-top: 0;">🏥 New Detour Match Assigned</h2>
      <p>Dear Blood Bank Administrator,</p>
      <p>Match ID <strong>{{matchObid}}</strong> detour has been registered to your blood bank.</p>
      <p>A blood donation match has been established between seeker <strong>{{seekerName}}</strong> and donor <strong>{{donorName}}</strong>, with your blood bank as a transit step.</p>
      <p><strong>Match OBID:</strong> {{matchObid}}</p>
      <p><strong>Detour Blood Bank:</strong> {{detourBankName}}</p>
      <p><strong>Destination Hospital:</strong> {{facilityName}}</p>
      <p>Please find the official match slip attached to this email.</p>
    </div>
  `;
  const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
  return sendTemplateEmail(to, 'match_confirmed_blood_bank', defaultSubject, defaultHtml, { seekerName, donorName, matchObid, facilityName, detourBankName }, attachments, 'match_confirmed_blood_bank');
};

/**
 * Send donation completed email to all parties (seeker, donor, hospital, blood bank)
 */
const sendDonationCompletedEmail = async (to, role, seekerName, donorName, matchObid, facilityName) => {
  const defaultSubject = `✅ Donation Completed - Match ID: {{matchObid}}`;
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">✅ Donation Completed</h2>
      <p>Dear {{role}},</p>
      <p>The blood donation for Match ID <strong>{{matchObid}}</strong> has been successfully completed and verified at <strong>{{facilityName}}</strong>.</p>
      <p>Donor <strong>{{donorName}}</strong> donated blood for seeker <strong>{{seekerName}}</strong>.</p>
      <p>Thank you for your valuable contribution to saving lives through OneBlood!</p>
    </div>
  `;
  return sendTemplateEmail(to, 'donation_completed', defaultSubject, defaultHtml, { role, seekerName, donorName, matchObid, facilityName }, null, 'donation_completed');
};

/**
 * Background retry handler for failed emails. Run periodically.
 */
const runEmailRetryJob = async () => {
  try {
    const failedLogs = await EmailLog.find({ status: 'failed', attempts: { $lt: 3 } });
    for (const log of failedLogs) {
      log.attempts += 1;
      log.status = 'retrying';
      await log.save();

      console.log(`Retrying email send to ${log.to} for template ${log.templateName} (Attempt ${log.attempts})`);
      const res = await sendEmail(log.to, log.subject, log.html || 'Retry body', log.templateName, null, log.emailType);
      if (res.success && res.provider !== 'mock') {
        log.status = 'sent';
        log.errorMessage = undefined;
      } else {
        log.status = 'failed';
        log.errorMessage = res.errorMessage;
      }
      await log.save();
    }
  } catch (err) {
    console.error('Email retry runner failed:', err.message);
  }
};

// Set up background check every 5 minutes
setInterval(runEmailRetryJob, 5 * 60 * 1000);

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendWelcomeEmail,
  sendMatchConfirmationEmail,
  sendHospitalMatchEmail,
  sendBloodBankMatchEmail,
  sendDonationCompletedEmail,
  runEmailRetryJob
};
