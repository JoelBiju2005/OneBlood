const { Resend } = require('resend');
const nodemailer = require('nodemailer');

let resend = null;
let gmailTransporter = null;
const emailProvider = process.env.EMAIL_PROVIDER || 'resend';

if (emailProvider === 'resend' && process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('🟢 Resend Email Service Initialized');
  } catch (error) {
    console.error('Failed to initialize Resend. Fallback to console logging.', error.message);
  }
} else if (emailProvider === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
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
    console.error('Failed to initialize Gmail Transporter.', error.message);
  }
} else {
  console.log(`ℹ️ Email provider (${emailProvider}) not fully configured. Email outputs will be logged to console in dev mode.`);
}

/**
 * Sends a transaction email using Resend or Gmail
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} htmlBody Styled HTML content
 */
const sendEmail = async (to, subject, htmlBody) => {
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  if (provider === 'resend' && resend) {
    try {
      const data = await resend.emails.send({
        from: 'OneBlood <no-reply@oneblood.in>',
        to: [to],
        subject: subject,
        html: htmlBody,
      });
      console.log(`✉️ Email sent successfully via Resend: ${data.id || data.messageId}`);
      return data;
    } catch (error) {
      console.error(`🔴 Failed to send email to ${to} via Resend:`, error.message);
    }
  } else if (provider === 'gmail' && gmailTransporter) {
    try {
      const info = await gmailTransporter.sendMail({
        from: `"OneBlood" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlBody,
      });
      console.log(`✉️ Email sent successfully via Gmail: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`🔴 Failed to send email to ${to} via Gmail:`, error.message);
    }
  }

  // Console fallback logs for local development
  console.log('\n=================== DEVELOPMENT EMAIL OUTPUT ===================');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('--------------------------- BODY -------------------------------');
  console.log(htmlBody.replace(/<[^>]*>/g, '').trim());
  console.log('================================================================\n');
  return { mock: true, id: `mock-${Date.now()}` };
};

/**
 * Send welcome email to user
 */
const sendWelcomeEmail = async (to, name) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #B91C1C; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; margin-top: 0;">Welcome to OneBlood</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for registering on the OneBlood platform. We are building the fastest real-time blood coordination network in South India.</p>
      <p>Whether you need to request blood in an emergency or want to save lives as a donor, you now have access to a verified network of donors and blood banks.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/search" style="background-color: #B91C1C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Search Map & Inventory</a>
      </p>
    </div>
  `;
  return sendEmail(to, 'Welcome to OneBlood!', htmlBody);
};

/**
 * Send critical blood request alert to donor
 */
const sendRequestAlertEmail = async (donorEmail, donorName, requestData) => {
  const urgencyStyle = requestData.urgencyLevel === 'critical' ? 'color: #B91C1C; font-weight: bold;' : 'color: #F59E0B;';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #B91C1C; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; margin-top: 0;">ONEBLOOD EMERGENCY ALERT</h2>
      <p>Dear <strong>${donorName}</strong>,</p>
      <p>A critical blood requirement has been reported near you. As an eligible <strong>${requestData.bloodGroup}</strong> donor, your donation could save a life today.</p>
      
      <div style="background-color: #FEF2F2; border-left: 4px solid #B91C1C; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #7F1D1D;">Requirement Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0;"><strong>Patient:</strong></td><td>${requestData.patientName}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Blood Type:</strong></td><td><span style="background-color: #B91C1C; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${requestData.bloodGroup}</span> (${requestData.bloodComponent})</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Hospital:</strong></td><td>${requestData.hospitalName}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Urgency:</strong></td><td><span style="${urgencyStyle}">${requestData.urgencyLevel.toUpperCase()}</span></td></tr>
          <tr><td style="padding: 5px 0;"><strong>Required By:</strong></td><td>${new Date(requestData.requiredBy).toLocaleString()}</td></tr>
        </table>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/donor" style="background-color: #B91C1C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Respond to Request Now</a>
      </p>
    </div>
  `;

  return sendEmail(donorEmail, `🚨 EMERGENCY: ${requestData.bloodGroup} Blood Required at ${requestData.hospitalName}`, htmlBody);
};

/**
 * Send donor contact details to requester once donor accepts
 */
const sendRequestAcceptedEmail = async (requesterEmail, requesterName, donorName, contactData, requestData) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">DONOR ACCEPTED MATCH</h2>
      <p>Dear <strong>${requesterName}</strong>,</p>
      <p>Good news! Donor <strong>${donorName}</strong> has accepted your emergency request for <strong>${requestData.bloodGroup}</strong> blood.</p>
      
      <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #064E3B;">Donor Contact Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0;"><strong>Name:</strong></td><td>${donorName}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Phone Number:</strong></td><td><a href="tel:${contactData.phone}">${contactData.phone}</a></td></tr>
          <tr><td style="padding: 5px 0;"><strong>Email Address:</strong></td><td><a href="mailto:${contactData.email}">${contactData.email}</a></td></tr>
          <tr><td style="padding: 5px 0;"><strong>Preferred Method:</strong></td><td style="text-transform: capitalize;">${contactData.preferredContactMethod}</td></tr>
        </table>
      </div>

      <p>Please contact the donor immediately to coordinate transport and donation logistics.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/donor/${contactData.donorId}/profile" style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Donor Profile</a>
      </p>
    </div>
  `;
  return sendEmail(requesterEmail, `💖 MATCH FOUND: ${donorName} accepted your request!`, htmlBody);
};

/**
 * Send request fulfillment email
 */
const sendRequestFulfilledEmail = async (email, name, requestData) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">Request Fulfilled</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>The emergency request for <strong>${requestData.bloodGroup}</strong> has been marked as **fulfilled**. Thank you for your support and coordination in saving a life today!</p>
    </div>
  `;
  return sendEmail(email, `✅ Fulfilled: Request for ${requestData.bloodGroup} completed`, htmlBody);
};

/**
 * Send OTP verification email
 */
const sendOTPEmail = async (to, name, otp) => {
  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <div style="background: #C0152A; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">One<span style="font-weight:400">Blood</span></h1>
    <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px; letter-spacing: 2px;">EMERGENCY BLOOD RESOURCE PLATFORM</p>
  </div>
  <div style="padding: 32px 24px; background: #fff; border: 1px solid #eee; border-top: none;">
    <p style="color: #333; font-size: 16px;">Hi ${name},</p>
    <p style="color: #555; font-size: 15px;">Your OneBlood verification code is:</p>
    <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #C0152A;">${otp}</span>
    </div>
    <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <p style="color: #888; font-size: 13px;">If you didn't create a OneBlood account, you can safely ignore this email.</p>
  </div>
  <div style="padding: 16px 24px; background: #f9f9f9; text-align: center; border: 1px solid #eee; border-top: none;">
    <p style="color: #aaa; font-size: 11px; margin: 0;">OneBlood — Connecting lives, one drop at a time.</p>
  </div>
</div>
  `;
  return sendEmail(to, `Your OneBlood verification code — ${otp}`, htmlBody);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendRequestAlertEmail,
  sendRequestAcceptedEmail,
  sendRequestFulfilledEmail,
  sendOTPEmail
};
