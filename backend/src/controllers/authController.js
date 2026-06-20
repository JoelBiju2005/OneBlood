const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const Hospital = require('../models/Hospital');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { admin } = require('../config/firebase');
const { createNotification } = require('../services/notificationService');

// Helper to send system notification to all administrators
const notifyAdmins = async (title, message) => {
  try {
    const admins = await User.find({ role: 'admin' });
    if (admins && admins.length > 0) {
      for (const adminUser of admins) {
        await createNotification({
          recipientId: adminUser._id,
          type: 'system',
          title,
          message,
          priority: 'normal'
        });
      }
    }
  } catch (err) {
    console.error('Error notifying admins:', err.message);
  }
};

// Helper to find associated profiles
const getUserProfile = async (user) => {
  let profileId = null;
  if (user.role === 'donor') {
    const donor = await Donor.findOne({ userId: user._id });
    if (donor) profileId = donor._id;
  } else if (user.role === 'blood_bank') {
    const bank = await BloodBank.findOne({ adminUserId: user._id });
    if (bank) profileId = bank._id;
  } else if (user.role === 'hospital') {
    const hospital = await Hospital.findOne({ userId: user._id });
    if (hospital) profileId = hospital._id;
  }
  return profileId;
};

// Build user response payload
const buildUserPayload = async (user) => {
  const profileId = await getUserProfile(user);
  return {
    id: user._id,
    onebloodId: user.onebloodId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    city: user.city,
    avatar: user.avatar,
    isVerified: user.isVerified,
    profileId,
    donorProfileComplete: user.donorProfileComplete,
    bankProfileComplete: user.bankProfileComplete,
    hospitalProfileComplete: user.hospitalProfileComplete || false,
  };
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, city } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate unique OneBlood ID
    let onebloodId;
    try {
      onebloodId = await User.generateOneBloodId();
    } catch (idErr) {
      return res.status(503).json({ message: idErr.message });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      onebloodId,
      name: role === 'hospital' ? req.body.hospitalName : (name || 'Unnamed User'),
      email,
      phone: role === 'hospital' ? req.body.emergencyContact : phone,
      passwordHash,
      role: role || 'seeker',
      city: city || 'Bengaluru',
      hospitalProfileComplete: role === 'hospital'
    });

    if (role === 'hospital') {
      const {
        hospitalName,
        registrationNumber,
        hospitalType,
        address,
        state,
        pincode,
        emergencyContact,
        website,
        authorizedPersonName,
        designation,
        lat,
        lng,
        documents
      } = req.body;

      if (!hospitalName || !registrationNumber || !hospitalType || !emergencyContact) {
        return res.status(400).json({ message: 'Please provide all required hospital fields' });
      }

      const verifyToken = crypto.randomBytes(32).toString('hex');

      await Hospital.create({
        userId: user._id,
        hospitalName,
        registrationNumber,
        hospitalType,
        address: address || 'N/A',
        city: city || 'Bengaluru',
        state: state || 'Karnataka',
        pincode: pincode || '560001',
        emergencyContact,
        website: website || '',
        authorizedPersonName: authorizedPersonName || 'Authorized Person',
        designation: designation || 'Designation',
        verificationStatus: 'pending',
        emailVerified: false,
        emailVerificationToken: verifyToken,
        documents: documents || {},
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng || 0), parseFloat(lat || 0)]
        }
      });

      // Send verification email to hospital
      try {
        const { sendEmail } = require('../services/emailService');
        const getFrontendUrl = () => process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://oneblood-app.web.app' : 'http://localhost:5173');
        const verifyUrl = `${getFrontendUrl()}/auth/verify-hospital?token=${verifyToken}`;
        await sendEmail(
          email,
          'Verify Your Hospital Email — OneBlood',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#C0152A;">Verify Hospital Email</h2>
            <p>Hi ${hospitalName},</p>
            <p>Thank you for registering your hospital with OneBlood. Please verify your email address to receive critical blood request escalations.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${verifyUrl}" style="display:inline-block;background:#C0152A;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Verify Email</a>
            </div>
            <p style="color:#6b7280;font-size:13px;">If you did not register this hospital, please ignore this email.</p>
            <p style="color:#6b7280;font-size:13px;">Support: <a href="mailto:oneblood.officialteam@gmail.com" style="color:#C0152A;">oneblood.officialteam@gmail.com</a></p>
          </div>`,
          'hospital_email_verify',
          null,
          'hospital_email_verify'
        );
      } catch (emailErr) {
        console.error('Failed to send hospital email verification link:', emailErr.message);
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(user);

    // Send Welcome Email
    try {
      const { sendWelcomeEmail } = require('../services/emailService');
      await sendWelcomeEmail(user.email, user.name, user.onebloodId, user.role);
    } catch (welcomeErr) {
      console.warn('Welcome email dispatch failed (non-fatal):', welcomeErr.message);
    }

    // Notify admins of new user registration
    await notifyAdmins(
      'New User Registration',
      `User ${user.name} (${user.onebloodId}) has registered as a ${user.role} in ${user.city}.`
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      user: userPayload,
    });
  } catch (error) {
    console.error('[Register]', error);
    return res.status(500).json({ message: 'Registration failed. Please check your connection and try again.' });
  }
};

const login = async (req, res, next) => {
  try {
    const { onebloodId, email, password } = req.body;
    const identifier = onebloodId || email;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    let user;
    const isSpecialAdmin = 
      (identifier.trim() === 'OB-ADMIN' || identifier.toLowerCase().trim() === 'admin@oneblood.in') && 
      password === 'OneBloodAdmin2026!';

    if (isSpecialAdmin) {
      user = await User.findOne({ role: 'admin' });
      if (!user) {
        user = new User({
          onebloodId: 'OB-ADM1N1',
          name: 'Platform Administrator',
          email: 'admin@oneblood.in',
          phone: '+919999999999',
          passwordHash: 'OB_ADMIN_PROTECTED_PASSWORD',
          role: 'admin',
          city: 'Bengaluru',
          isVerified: true
        });
        await user.save();
      }
    } else {
      user = await User.findOne({
        $or: [
          { onebloodId: identifier.trim() },
          { email: identifier.toLowerCase().trim() }
        ]
      });

      // 14.1 — Generic error for both "user not found" and "wrong password"
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      // 14.2 — Check account lockout
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        // Increment failed attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 10) {
          user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
          await user.save();
          // Send suspicious activity email (non-blocking)
          try {
            const { sendEmail } = require('../services/emailService');
            const getFrontendUrl = () => process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://oneblood-app.web.app' : 'http://localhost:5173');
            await sendEmail(
              user.email,
              'Suspicious Login Activity — OneBlood',
              `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                <h2 style="color:#C0152A;">⚠️ Suspicious Login Activity</h2>
                <p>Hi ${user.name},</p>
                <p>We detected <strong>10 or more failed login attempts</strong> on your OneBlood account. Your account has been temporarily locked for 30 minutes.</p>
                <p>If this was you, please wait and try again later. If this wasn't you, please secure your account immediately.</p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${getFrontendUrl()}/auth/login" style="display:inline-block;background:#C0152A;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">This Wasn't Me — Secure My Account</a>
                </div>
                <p style="color:#6b7280;font-size:13px;">If you need help, contact us at <a href="mailto:oneblood.officialteam@gmail.com" style="color:#C0152A;">oneblood.officialteam@gmail.com</a></p>
              </div>`,
              'suspicious_login',
              null,
              'security_alert'
            );
          } catch (emailErr) {
            console.error('Lockout email failed (non-fatal):', emailErr.message);
          }
        } else {
          await user.save();
        }
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      // Successful login — reset lockout counters
      if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null;
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(user);

    // Notify admins of user login (only for non-admins to avoid self-alerts)
    if (user.role !== 'admin') {
      await notifyAdmins(
        'User Login',
        `User ${user.name} (${user.onebloodId}) has logged in.`
      );
    }

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: userPayload,
    });
  } catch (error) {
    next(error);
  }
};

const adminPortalLogin = async (req, res, next) => {
  try {
    const { onebloodId, password } = req.body;

    if (onebloodId !== 'OB-ADMIN' || password !== 'OneBloodAdmin2026!') {
      return res.status(401).json({ message: 'Invalid Admin Portal credentials' });
    }

    // Find the user with role 'admin'
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      // Create a default admin user if one doesn't exist
      adminUser = new User({
        onebloodId: 'OB-ADM1N1',
        name: 'Platform Administrator',
        email: 'admin@oneblood.in',
        phone: '+919999999999',
        passwordHash: 'OB_ADMIN_PROTECTED_PASSWORD',
        role: 'admin',
        city: 'Bengaluru',
        isVerified: true
      });
      await adminUser.save();
    }

    const accessToken = generateAccessToken(adminUser);
    const refreshToken = generateRefreshToken(adminUser);

    adminUser.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await adminUser.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(adminUser);

    res.status(200).json({
      success: true,
      message: 'Admin Portal Login successful',
      accessToken,
      user: userPayload,
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let isNew = false;

    if (!user) {
      isNew = true;
      let onebloodId;
      try {
        onebloodId = await User.generateOneBloodId();
      } catch (idErr) {
        return res.status(503).json({ message: idErr.message });
      }

      user = await User.create({
        onebloodId,
        name: name || 'Google User',
        email: email.toLowerCase().trim(),
        phone: 'Not provided',
        passwordHash: 'GOOGLE_AUTH_NO_PASSWORD',
        role: 'seeker',
        city: 'Bengaluru',
        avatar: picture || '',
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(user);

    // Notify admins of user login/registration via Google
    if (user.role !== 'admin') {
      const actionText = isNew ? 'registered and logged in' : 'logged in';
      await notifyAdmins(
        isNew ? 'New User Registration (Google)' : 'User Login (Google)',
        `User ${user.name} (${user.onebloodId}) has ${actionText} via Google.`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: userPayload,
    });
  } catch (error) {
    console.error('[GoogleLogin Error]', error);
    res.status(401).json({ message: 'Authentication with Google failed. Invalid token.' });
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshTokenHash = undefined;
        await user.save();
      }
    }
    res.clearCookie('oneblood_refresh', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.oneblood_refresh;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided.' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const validHash = await bcrypt.compare(token, user.refreshTokenHash);
    if (!validHash) {
      return res.status(401).json({ message: 'Refresh token has been revoked.' });
    }

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Always return the same message to prevent email enumeration
    const genericResponse = { message: 'If an account with that email exists, a password reset link has been sent.' };

    if (!email) {
      return res.status(200).json(genericResponse);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const getFrontendUrl = () => process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://oneblood-app.web.app' : 'http://localhost:5173');
    const resetUrl = `${getFrontendUrl()}/auth/reset-password?token=${resetToken}`;

    try {
      const { sendEmail } = require('../services/emailService');
      await sendEmail(
        user.email,
        'Password Reset — OneBlood',
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#C0152A;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset for your OneBlood account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#C0152A;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Reset My Password</a>
          </div>
          <p style="color:#6b7280;font-size:13px;">If you did not request this, ignore this email. Your password will remain unchanged.</p>
          <p style="color:#6b7280;font-size:13px;">Support: <a href="mailto:oneblood.officialteam@gmail.com" style="color:#C0152A;">oneblood.officialteam@gmail.com</a></p>
        </div>`,
        'password_reset',
        null,
        'password_reset'
      );
    } catch (emailErr) {
      // If email fails, clear the reset token so user can try again
      user.resetTokenHash = undefined;
      user.resetTokenExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Password reset email failed:', emailErr.message);
      return res.status(500).json({ message: 'Error sending password reset email. Please try again.' });
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetTokenHash: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired.' });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(password, 10);

    // Invalidate the one-time token immediately
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;

    // Also invalidate all existing refresh tokens
    user.refreshTokenHash = undefined;

    // Reset lockout if any
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const userPayload = await buildUserPayload(user);
    res.status(200).json({ user: userPayload });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, lat, lng } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (lat && lng) {
      user.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
    }

    await user.save();
    const userPayload = await buildUserPayload(user);
    res.status(200).json({ message: 'Profile updated successfully', user: userPayload });
  } catch (error) {
    next(error);
  }
};

const switchRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'donor') {
      user.role = 'seeker';
    } else if (user.role === 'seeker') {
      user.role = 'donor';
    } else {
      return res.status(400).json({ message: 'Role switching is only allowed between donor and seeker accounts.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(user);

    res.status(200).json({
      success: true,
      message: `Successfully switched role to ${user.role}`,
      accessToken,
      user: userPayload,
    });
  } catch (error) {
    next(error);
  }
};

const verifyHospitalEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <div style="font-family:sans-serif;text-align:center;padding:48px;max-width:500px;margin:0 auto;border:1px solid #fca5a5;border-radius:8px;background:#fef2f2;">
          <h1 style="color:#dc2626;margin-top:0;">Verification Failed</h1>
          <p>Verification token is required.</p>
        </div>
      `);
    }

    const hospital = await Hospital.findOne({ emailVerificationToken: token });
    if (!hospital) {
      return res.status(400).send(`
        <div style="font-family:sans-serif;text-align:center;padding:48px;max-width:500px;margin:0 auto;border:1px solid #fca5a5;border-radius:8px;background:#fef2f2;">
          <h1 style="color:#dc2626;margin-top:0;">Verification Failed</h1>
          <p>Invalid or expired verification token.</p>
        </div>
      `);
    }

    hospital.emailVerified = true;
    hospital.emailVerificationToken = undefined;
    await hospital.save();

    res.status(200).send(`
      <div style="font-family:sans-serif;text-align:center;padding:48px;max-width:500px;margin:0 auto;border:1px solid #a7f3d0;border-radius:8px;background:#ecfdf5;">
        <h1 style="color:#059669;margin-top:0;">Email Verified!</h1>
        <p>Your hospital email has been successfully verified.</p>
        <p>You can now receive critical request escalations and proceed on the platform.</p>
      </div>
    `);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminPortalLogin,
  googleLogin,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  switchRole,
  verifyHospitalEmail,
};
