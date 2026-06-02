const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const SystemSettings = require('../models/SystemSettings');

let resend = null;
let gmailTransporter = null;

// Initialize Resend
const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    try {
      resend = new Resend(process.env.RESEND_API_KEY);
      console.log('🟢 Resend Email Client Initialized');
    } catch (error) {
      console.error('Failed to initialize Resend client:', error.message);
    }
  }
  return resend;
};

// Initialize Gmail Transporter
const getGmailTransporter = () => {
  if (!gmailTransporter && process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    try {
      gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS
        }
      });
      console.log('🟢 Gmail Transporter Initialized');
    } catch (error) {
      console.error('Failed to initialize Gmail Transporter:', error.message);
    }
  }
  return gmailTransporter;
};

/**
 * Core send email routine with automatic provider fallback and audit logging.
 */
const sendEmail = async (to, subject, htmlBody, templateName = 'custom', attachments = null) => {
  const settings = await SystemSettings.getSettings();
  const providerPreference = settings.emailProvider || 'resend';
  const fromEmail = settings.fromEmail || 'oneblood.officialteam@gmail.com';
  
  let providerUsed = '';
  let emailSent = false;
  let errorMsg = '';
  let resultInfo = null;

  // 1. Attempt primary provider
  if (providerPreference === 'resend') {
    const client = getResendClient();
    if (client) {
      try {
        providerUsed = 'resend';
        const fromAddress = fromEmail.includes('gmail.com') ? 'OneBlood <onboarding@resend.dev>' : fromEmail;
        const mailOptions = {
          from: fromAddress,
          to: [to],
          subject: subject,
          html: htmlBody,
        };
        if (attachments) {
          mailOptions.attachments = attachments;
        }
        resultInfo = await client.emails.send(mailOptions);
        if (resultInfo && (resultInfo.id || resultInfo.data?.id)) {
          emailSent = true;
          console.log(`✉️ Email sent successfully via Resend to ${to}`);
        } else {
          throw new Error(JSON.stringify(resultInfo));
        }
      } catch (err) {
        errorMsg = `Resend failed: ${err.message}.`;
        console.warn(`${errorMsg} Trying Gmail fallback...`);
      }
    } else {
      errorMsg = 'Resend client not configured.';
      console.warn(`${errorMsg} Trying Gmail fallback...`);
    }
  }

  // 2. Fallback to Gmail if primary failed or Gmail selected
  if (!emailSent && (providerPreference === 'gmail' || providerPreference === 'resend')) {
    const transporter = getGmailTransporter();
    if (transporter) {
      try {
        providerUsed = 'gmail';
        const mailOptions = {
          from: `"OneBlood" <${process.env.GMAIL_USER || fromEmail}>`,
          to: to,
          subject: subject,
          html: htmlBody,
        };
        if (attachments) {
          mailOptions.attachments = attachments;
        }
        resultInfo = await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log(`✉️ Email sent successfully via Gmail fallback to ${to}`);
      } catch (err) {
        errorMsg += ` Gmail failed: ${err.message}`;
        console.error(`🔴 Email delivery failed for both paths to ${to}: ${errorMsg}`);
      }
    } else {
      errorMsg += ' Gmail transporter not configured.';
    }
  }

  // 3. Dev log output if completely offline/unconfigured
  if (!emailSent) {
    providerUsed = 'mock';
    console.log('\n=================== DEVELOPMENT EMAIL OUTPUT ===================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------- BODY -------------------------------');
    console.log(htmlBody.replace(/<[^>]*>/g, '').trim());
    console.log('================================================================\n');
    emailSent = true; // Mark sent so we don't spam retry loops in local dev
  }

  // 4. Log execution details to DB
  try {
    await EmailLog.create({
      to,
      templateName,
      subject,
      status: emailSent ? 'sent' : 'failed',
      provider: providerUsed,
      errorMessage: emailSent ? undefined : errorMsg,
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
const sendTemplateEmail = async (to, templateName, defaultSubject, defaultHtml, variables, attachments = null) => {
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

  return sendEmail(to, subject, html, templateName, attachments);
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
  return sendTemplateEmail(to, 'welcome_email', defaultSubject, defaultHtml, { name, onebloodId, role });
};

/**
 * Send critical blood request alert to donor
 */
const sendRequestAlertEmail = async (donorEmail, donorName, requestData) => {
  const urgencyStyle = requestData.urgencyLevel === 'critical' ? 'color: #B91C1C; font-weight: bold;' : 'color: #F59E0B;';

  const defaultSubject = `🚨 EMERGENCY: ${requestData.bloodGroup} Blood Required at ${requestData.hospitalName}`;
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #B91C1C; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; margin-top: 0;">ONEBLOOD EMERGENCY ALERT</h2>
      <p>Dear <strong>{{donorName}}</strong>,</p>
      <p>A critical blood requirement has been reported near you. As an eligible <strong>{{bloodGroup}}</strong> donor, your donation could save a life today.</p>
      
      <div style="background-color: #FEF2F2; border-left: 4px solid #B91C1C; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #7F1D1D;">Requirement Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0;"><strong>Patient:</strong></td><td>{{patientName}}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Blood Type:</strong></td><td><span style="background-color: #B91C1C; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">{{bloodGroup}}</span> ({{bloodComponent}})</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Hospital:</strong></td><td>{{hospitalName}}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Urgency:</strong></td><td><span style="${urgencyStyle}">{{urgencyLevel}}</span></td></tr>
          <tr><td style="padding: 5px 0;"><strong>Required By:</strong></td><td>{{requiredBy}}</td></tr>
        </table>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/donor" style="background-color: #B91C1C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Respond to Request Now</a>
      </p>
    </div>
  `;

  return sendTemplateEmail(donorEmail, 'request_alert', defaultSubject, defaultHtml, {
    donorName,
    patientName: requestData.patientName,
    bloodGroup: requestData.bloodGroup,
    bloodComponent: requestData.bloodComponent || 'Whole Blood',
    hospitalName: requestData.hospitalName,
    urgencyLevel: (requestData.urgencyLevel || 'moderate').toUpperCase(),
    requiredBy: new Date(requestData.requiredBy).toLocaleString()
  });
};

/**
 * Send donor contact details to requester once donor accepts
 */
const sendRequestAcceptedEmail = async (requesterEmail, requesterName, donorName, contactData, requestData) => {
  const defaultSubject = `💖 MATCH FOUND: ${donorName} accepted your request!`;
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">DONOR ACCEPTED MATCH</h2>
      <p>Dear <strong>{{requesterName}}</strong>,</p>
      <p>Good news! Donor <strong>{{donorName}}</strong> has accepted your emergency request for <strong>{{bloodGroup}}</strong> blood.</p>
      
      <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #064E3B;">Donor Contact Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0;"><strong>Name:</strong></td><td>{{donorName}}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Phone Number:</strong></td><td><a href="tel:{{phone}}">{{phone}}</a></td></tr>
          <tr><td style="padding: 5px 0;"><strong>Email Address:</strong></td><td><a href="mailto:{{email}}">{{email}}</a></td></tr>
          <tr><td style="padding: 5px 0;"><strong>Preferred Method:</strong></td><td style="text-transform: capitalize;">{{preferredContactMethod}}</td></tr>
        </table>
      </div>

      <p>Please contact the donor immediately to coordinate transport and donation logistics.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/donor/{{donorId}}/profile" style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Donor Profile</a>
      </p>
    </div>
  `;
  return sendTemplateEmail(requesterEmail, 'request_accepted', defaultSubject, defaultHtml, {
    requesterName,
    donorName,
    phone: contactData.phone,
    email: contactData.email,
    preferredContactMethod: contactData.preferredContactMethod || 'phone',
    donorId: contactData.donorId,
    bloodGroup: requestData.bloodGroup
  });
};

/**
 * Send request fulfillment email
 */
const sendRequestFulfilledEmail = async (email, name, requestData) => {
  const defaultSubject = `✅ Fulfilled: Request for ${requestData.bloodGroup} completed`;
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">Request Fulfilled</h2>
      <p>Dear <strong>{{name}}</strong>,</p>
      <p>The emergency request for <strong>{{bloodGroup}}</strong> has been marked as **fulfilled**. Thank you for your support and coordination in saving a life today!</p>
    </div>
  `;
  return sendTemplateEmail(email, 'request_fulfilled', defaultSubject, defaultHtml, { name, bloodGroup: requestData.bloodGroup });
};

/**
 * Send OTP verification email
 */
const sendOTPEmail = async (to, name, otp) => {
  const defaultSubject = `Your OneBlood verification code — ${otp}`;
  const defaultHtml = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <div style="background: #C0152A; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">One<span style="font-weight:400">Blood</span></h1>
    <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px; letter-spacing: 2px;">EMERGENCY BLOOD RESOURCE PLATFORM</p>
  </div>
  <div style="padding: 32px 24px; background: #fff; border: 1px solid #eee; border-top: none;">
    <p style="color: #333; font-size: 16px;">Hi {{name}},</p>
    <p style="color: #555; font-size: 15px;">Your OneBlood verification code is:</p>
    <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #C0152A;">{{otp}}</span>
    </div>
    <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <p style="color: #888; font-size: 13px;">If you didn't create a OneBlood account, you can safely ignore this email.</p>
  </div>
  <div style="padding: 16px 24px; background: #f9f9f9; text-align: center; border: 1px solid #eee; border-top: none;">
    <p style="color: #aaa; font-size: 11px; margin: 0;">OneBlood — Connecting lives, one drop at a time.</p>
  </div>
</div>
  `;
  return sendTemplateEmail(to, 'otp_email', defaultSubject, defaultHtml, { name, otp });
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
      const res = await sendEmail(log.to, log.subject, log.html || 'Retry body', log.templateName);
      if (res.success) {
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
  sendRequestAlertEmail,
  sendRequestAcceptedEmail,
  sendRequestFulfilledEmail,
  sendOTPEmail,
  runEmailRetryJob
};
