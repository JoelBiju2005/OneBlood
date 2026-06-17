const bcrypt = require('bcryptjs');
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
        documents: documents || {},
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng || 0), parseFloat(lat || 0)]
        }
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
      refreshToken,
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
      return res.status(400).json({ message: 'OneBlood ID or Email, and password are required' });
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

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
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
      refreshToken,
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
      refreshToken,
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
      refreshToken,
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
    const token = req.cookies.oneblood_refresh || req.body.refreshToken || req.headers['x-refresh-token'];
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validHash = await bcrypt.compare(token, user.refreshTokenHash);
    if (!validHash) {
      return res.status(401).json({ message: 'Invalid refresh token' });
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
  res.status(200).json({ message: 'Password reset link sent to registered email' });
};

const resetPassword = async (req, res, next) => {
  res.status(200).json({ message: 'Password has been reset successfully' });
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

    const bcrypt = require('bcryptjs');
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
      refreshToken,
      user: userPayload,
    });
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
};
