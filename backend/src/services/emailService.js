const fs = require('fs');
const path = require('path');
const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const SystemSettings = require('../models/SystemSettings');
const BrevoClient = require('@getbrevo/brevo').BrevoClient;

const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, '');
  }
  return process.env.NODE_ENV === 'production' 
    ? 'https://oneblood-app.web.app' 
    : 'http://localhost:5173';
};

// Load OneBlood Logo for inline email embedding
const logoPath = path.join(__dirname, '../assets/oneblood-logo.png');
let logoBase64 = '';
try {
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch (err) {
  console.error('Failed to load logo for email templates:', err.message);
}

/**
 * Wraps HTML content in a beautiful, responsive layout with the OneBlood branding.
 */
const wrapEmail = (title, contentHtml) => {
  const logoUrl = `${getFrontendUrl()}/oneblood-logo.png`;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
          }
          .email-body {
            padding: 32px 40px;
            color: #374151;
            line-height: 1.6;
          }
          .email-footer {
            background-color: #f9fafb;
            padding: 24px 40px;
            border-top: 1px solid #f3f4f6;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
          }
          .button {
            display: inline-block;
            background-color: #C0152A;
            color: #ffffff !important;
            padding: 12px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 15px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(192, 21, 42, 0.2);
          }
          .info-card {
            background-color: #f8fafc;
            border-left: 4px solid #C0152A;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
          }
          .info-card-title {
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 12px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .info-grid {
            width: 100%;
            border-collapse: collapse;
          }
          .info-grid td {
            padding: 6px 0;
            font-size: 14px;
            vertical-align: top;
          }
          .info-label {
            color: #64748b;
            font-weight: 600;
            width: 140px;
          }
          .info-value {
            color: #0f172a;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 4px;
            color: #ffffff;
          }
          .badge-crimson { background-color: #C0152A; }
          .badge-success { background-color: #10b981; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <!-- Header table layout for maximum email client compatibility -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; padding: 24px 40px; border-bottom: 4px solid #C0152A;">
            <tr>
              <td width="46" style="vertical-align: middle;">
                <img src="${logoUrl}" alt="OneBlood Logo" style="height: 38px; width: auto; display: block; border: 0;" />
              </td>
              <td style="vertical-align: middle; padding-left: 14px;">
                <span style="font-family: Georgia, serif; font-weight: bold; font-size: 24px; letter-spacing: -0.02em;">
                  <span style="color: #C0152A;">One</span><span style="color: #ffffff;">Blood</span>
                </span>
              </td>
            </tr>
          </table>
          
          <div class="email-body">
            ${contentHtml}
          </div>
          
          <div class="email-footer">
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #4b5563;">One Need. One Response. One Life.</p>
            <p style="margin: 0 0 16px 0;">This is an automated operational transmission from the OneBlood coordination platform.</p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Support Center: <a href="mailto:oneblood.officialteam@gmail.com" style="color: #C0152A; text-decoration: none;">oneblood.officialteam@gmail.com</a>
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">&copy; ${new Date().getFullYear()} OneBlood. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Core send email routine using Brevo Transactional Email HTTP API.
 * Falls back to console mock in dev/local if API key is missing or mock.
 */
const sendEmail = async (to, subject, htmlBody, templateName = 'custom', attachments = null, emailType = null) => {
  // Auto-wrap plain/partial HTML content in the premium OneBlood branding wrapper
  let formattedHtml = htmlBody;
  if (htmlBody && !htmlBody.trim().toLowerCase().startsWith('<!doctype') && !htmlBody.trim().toLowerCase().startsWith('<html')) {
    formattedHtml = wrapEmail(subject, htmlBody);
  }

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
      const brevoAttachments = [];

      // Process other attachments if any
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
        htmlContent: formattedHtml
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
    console.log(formattedHtml.replace(/<[^>]*>/g, '').trim().substring(0, 500) + '...');
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
  const defaultHtml = wrapEmail('Welcome to OneBlood', `
    <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 700;">Welcome to OneBlood, {{name}}!</h2>
    <p>Thank you for registering. We are building the fastest real-time blood coordination network to bridge the gap between donors, seekers, and healthcare facilities.</p>
    
    <div class="info-card">
      <div class="info-card-title">Your Account Credentials</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">OneBlood ID:</td>
          <td class="info-value"><strong>{{onebloodId}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Account Role:</td>
          <td class="info-value"><span class="badge badge-crimson" style="text-transform: uppercase;">{{role}}</span></td>
        </tr>
      </table>
    </div>
    
    <p>Whether you need to request blood in an emergency or want to save lives as a donor or facility, you now have access to a fully verified real-time network.</p>
    
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${getFrontendUrl()}/search" class="button">Search Map & Inventory</a>
    </div>
  `);

  return sendTemplateEmail(to, 'welcome_email', defaultSubject, defaultHtml, { name, onebloodId, role }, null, 'welcome');
};

/**
 * Send match confirmation email to seeker and donor
 */
const sendMatchConfirmationEmail = async (to, seekerName, donorName, matchObid, facilityName, pdfPath = null) => {
  const defaultSubject = `OneBlood Donation Match Confirmed - ID: {{matchObid}}`;
  const defaultHtml = wrapEmail('Donation Match Confirmed', `
    <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 700;">Donation Match Confirmed</h2>
    <p>A blood donation match has been successfully established and verified by our system coordinator.</p>
    
    <div class="info-card">
      <div class="info-card-title">Match Specification</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Match ID:</td>
          <td class="info-value"><span style="color: #C0152A; font-weight: 700; font-size: 15px;">{{matchObid}}</span></td>
        </tr>
        <tr>
          <td class="info-label">Seeker:</td>
          <td class="info-value"><strong>{{seekerName}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Donor Name:</td>
          <td class="info-value"><strong>{{donorName}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Destination:</td>
          <td class="info-value">{{facilityName}}</td>
        </tr>
      </table>
    </div>
    
    <p>Please find the official digital match slip attached to this email. You can present this slip at the facility to authorize the donation process.</p>
  `);

  const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
  return sendTemplateEmail(to, 'match_confirmed_seeker_donor', defaultSubject, defaultHtml, { seekerName, donorName, matchObid, facilityName }, attachments, 'match_confirmed');
};

/**
 * Send match email to hospital
 */
const sendHospitalMatchEmail = async (to, seekerName, donorName, matchObid, facilityName, pdfPath = null) => {
  const defaultSubject = `🏥 New Match Assigned - ID: {{matchObid}}`;
  const defaultHtml = wrapEmail('New Match Assigned', `
    <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 700;">🏥 New Match Assigned</h2>
    <p>Dear Hospital Administrator,</p>
    <p>A new real-time blood donation match has been assigned and scheduled for your hospital facility.</p>
    
    <div class="info-card">
      <div class="info-card-title">Match Record Details</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Match ID:</td>
          <td class="info-value"><span style="color: #C0152A; font-weight: 700;">{{matchObid}}</span></td>
        </tr>
        <tr>
          <td class="info-label">Seeker:</td>
          <td class="info-value"><strong>{{seekerName}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Donor Name:</td>
          <td class="info-value"><strong>{{donorName}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Facility Name:</td>
          <td class="info-value"><strong>{{facilityName}}</strong></td>
        </tr>
      </table>
    </div>
    
    <p>Please prepare the necessary transfusion and collection resources. The official match authorization slip is attached to this email.</p>
  `);

  const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
  return sendTemplateEmail(to, 'match_confirmed_hospital', defaultSubject, defaultHtml, { seekerName, donorName, matchObid, facilityName }, attachments, 'match_confirmed_hospital');
};

/**
 * Send match email to blood bank (transit detour)
 */
const sendBloodBankMatchEmail = async (to, seekerName, donorName, matchObid, facilityName, detourBankName, pdfPath = null) => {
  const defaultSubject = `🏥 New Detour Match Assigned - ID: {{matchObid}}`;
  const defaultHtml = wrapEmail('New Detour Match Assigned', `
    <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 700;">🏥 New Transit Match Assigned</h2>
    <p>Dear Blood Bank Administrator,</p>
    <p>A new detour match has been registered to your blood bank. Your bank will serve as the transit collection point for this donation.</p>
    
    <div class="info-card">
      <div class="info-card-title">Detour Match Details</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Match ID:</td>
          <td class="info-value"><span style="color: #C0152A; font-weight: 700;">{{matchObid}}</span></td>
        </tr>
        <tr>
          <td class="info-label">Transit Bank:</td>
          <td class="info-value"><strong>{{detourBankName}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Destination Hospital:</td>
          <td class="info-value"><strong>{{facilityName}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Seeker:</td>
          <td class="info-value">{{seekerName}}</td>
        </tr>
        <tr>
          <td class="info-label">Donor Name:</td>
          <td class="info-value">{{donorName}}</td>
        </tr>
      </table>
    </div>
    
    <p>The donor will arrive to donate the blood units at your bank. Please perform standard screening, collect the units, and coordinate transit/release to the destination hospital. The official match slip is attached.</p>
  `);

  const attachments = pdfPath ? [{ filename: `OneBlood_Match_${matchObid}.pdf`, path: pdfPath }] : null;
  return sendTemplateEmail(to, 'match_confirmed_blood_bank', defaultSubject, defaultHtml, { seekerName, donorName, matchObid, facilityName, detourBankName }, attachments, 'match_confirmed_blood_bank');
};

/**
 * Send donation completed email to all parties (seeker, donor, hospital, blood bank)
 */
const sendDonationCompletedEmail = async (to, role, seekerName, donorName, matchObid, facilityName) => {
  const defaultSubject = `✅ Donation Completed - Match ID: {{matchObid}}`;
  const defaultHtml = wrapEmail('Donation Completed', `
    <h2 style="color: #10b981; margin-top: 0; font-size: 20px; font-weight: 700;">✅ Donation Completed successfully</h2>
    <p>Dear {{role}},</p>
    <p>We are pleased to inform you that the blood donation workflow for Match ID <strong>{{matchObid}}</strong> has been successfully completed and verified at <strong>{{facilityName}}</strong>.</p>
    
    <div class="info-card" style="border-left-color: #10b981; background-color: #f0fdf4;">
      <div class="info-card-title" style="color: #065f46;">Transaction Details</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Match ID:</td>
          <td class="info-value"><strong>{{matchObid}}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Donor:</td>
          <td class="info-value">{{donorName}}</td>
        </tr>
        <tr>
          <td class="info-label">Recipient:</td>
          <td class="info-value">{{seekerName}}</td>
        </tr>
        <tr>
          <td class="info-label">Verified At:</td>
          <td class="info-value">{{facilityName}}</td>
        </tr>
      </table>
    </div>
    
    <p>Thank you for playing a critical role in saving lives through the OneBlood coordination network. Your contribution is highly valued!</p>
  `);

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

const brevoClient = new BrevoClient({
  apiKey: (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'mock_key_for_dev') ? process.env.BREVO_API_KEY : 'mock_key_for_dev'
});

const sendEmailViaBrevo = async ({ to, toName, subject, html, templateName = 'password_reset_otp', emailType = 'password_reset_otp' }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const isMockEnv = !apiKey || apiKey === 'mock_key_for_dev' || apiKey.trim() === '';

  if (isMockEnv) {
    console.log('\n=================== MOCK EMAIL OUTPUT ===================');
    console.log(`To:      ${to} (${toName || 'User'})`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------- BODY -------------------------------');
    console.log(html.replace(/<[^>]*>/g, '').trim().substring(0, 500) + '...');
    console.log('==========================================================\n');

    try {
      await EmailLog.create({
        to,
        templateName,
        emailType,
        subject,
        status: 'sent',
        provider: 'mock',
        attempts: 1
      });
    } catch (logErr) {
      console.error('Failed to save EmailLog:', logErr.message);
    }
    return { success: true };
  }

  // Get verified sender configurations from settings database
  const settings = await SystemSettings.getSettings().catch(() => ({}));
  const fromEmail = settings.fromEmail || 'oneblood.officialteam@gmail.com';

  const sendSmtpEmail = {
    sender: {
      name: process.env.EMAIL_FROM_NAME || 'OneBlood',
      email: fromEmail
    },
    to: [{ email: to, name: toName || to }],
    subject,
    htmlContent: html
  };

  try {
    const res = await brevoClient.transactionalEmails.sendTransacEmail(sendSmtpEmail);
    try {
      await EmailLog.create({
        to,
        templateName,
        emailType,
        subject,
        status: 'sent',
        provider: 'brevo',
        attempts: 1
      });
    } catch (logErr) {
      console.error('Failed to save EmailLog:', logErr.message);
    }
    return res;
  } catch (err) {
    console.error('[Email] sendEmailViaBrevo failed:', err.message);
    try {
      await EmailLog.create({
        to,
        templateName,
        emailType,
        subject,
        status: 'failed',
        provider: 'brevo',
        errorMessage: err.message,
        attempts: 1
      });
    } catch (logErr) {
      console.error('Failed to save EmailLog:', logErr.message);
    }
    throw err;
  }
};

const sendPasswordResetOTPEmail = async ({ name, email, otp }) => {
  const html = wrapEmail(`${otp} is your OneBlood password reset code`, `
    <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset the password for your OneBlood account. Use the code below to proceed. This code is valid for <strong>10 minutes</strong>.</p>
    
    <div style="background-color: #fff5f5; border: 2px solid #C0152A; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #888; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 3px;">Your One-Time Password</p>
      <p style="color: #C0152A; font-size: 40px; font-weight: 800; margin: 0; font-family: 'Courier New', Courier, monospace; letter-spacing: 12px;">${otp}</p>
      <p style="color: #aaa; font-size: 12px; margin: 8px 0 0 0;">Expires in 10 minutes</p>
    </div>
    
    <div class="info-card" style="border-left-color: #C0152A; background-color: #fcfcfc;">
      <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">
        🔒 <strong>Never share this code with anyone</strong> — OneBlood staff will never ask for it.<br>
        If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
      </p>
    </div>
  `);

  return sendEmailViaBrevo({
    to: email,
    toName: name,
    subject: `${otp} is your OneBlood password reset code`,
    html,
    templateName: 'password_reset_otp',
    emailType: 'password_reset_otp'
  });
};

const sendPasswordResetConfirmEmail = async ({ name, email }) => {
  const html = wrapEmail('Your OneBlood password has been successfully updated', `
    <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 700;">Password Reset Confirmed</h2>
    <p>Hi ${name},</p>
    <p>This is a confirmation that the password for your OneBlood account has been successfully updated.</p>
    
    <div class="info-card" style="border-left-color: #10b981; background-color: #f0fdf4; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">
      <p style="color: #14532d; font-size: 14px; margin: 0; line-height: 1.6; font-weight: bold;">
        ✅ Your password was successfully updated.
      </p>
      <p style="color: #14532d; font-size: 13px; margin: 4px 0 0; line-height: 1.6;">
        If you did not make this change, please contact our support team immediately.
      </p>
    </div>
    
    <p>You can now log in to your account with your new password.</p>
  `);

  return sendEmailViaBrevo({
    to: email,
    toName: name,
    subject: 'Your OneBlood password has been successfully updated',
    html,
    templateName: 'password_reset_confirm',
    emailType: 'password_reset_confirm'
  });
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendWelcomeEmail,
  sendMatchConfirmationEmail,
  sendHospitalMatchEmail,
  sendBloodBankMatchEmail,
  sendDonationCompletedEmail,
  runEmailRetryJob,
  sendEmailViaBrevo,
  sendPasswordResetOTPEmail,
  sendPasswordResetConfirmEmail
};

