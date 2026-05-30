const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { admin } = require('../config/firebase');

// Helper to find associated profiles
const getUserProfile = async (user) => {
  let profileId = null;
  if (user.role === 'donor') {
    const donor = await Donor.findOne({ userId: user._id });
    if (donor) profileId = donor._id;
  } else if (user.role === 'blood_bank') {
    const bank = await BloodBank.findOne({ adminUserId: user._id });
    if (bank) profileId = bank._id;
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
  };
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, city } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
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
      name,
      email,
      phone,
      passwordHash,
      role: role || 'patient',
      city: city || 'Bengaluru',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(user);

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
      return res.status(400).json({ message: 'OneBlood ID or Email, and password are required' });
    }

    const user = await User.findOne({
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(user);

    res.status(200).json({
      message: 'Login successful',
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

    if (!user) {
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
        role: 'patient',
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
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userPayload = await buildUserPayload(user);

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
    res.clearCookie('oneblood_refresh');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.oneblood_refresh;
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
      user.role = 'patient';
    } else if (user.role === 'patient') {
      user.role = 'donor';
    } else {
      return res.status(400).json({ message: 'Role switching is only allowed between donor and patient (seeker) accounts.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const bcrypt = require('bcryptjs');
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('oneblood_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  switchRole,
};
