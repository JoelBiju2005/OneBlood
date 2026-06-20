const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }

  try {
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth protect error:', error.message);
    res.status(500).json({ message: 'Internal authentication server error' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
    }
    next();
  };
};

/**
 * Optional authentication — sets req.user if valid token present, otherwise continues.
 * Used for endpoints that return different data based on auth status (e.g., noticeboard redaction).
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();

  const decoded = verifyAccessToken(token);
  if (!decoded) return next();

  try {
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user) req.user = user;
  } catch (_) {
    // silently continue as unauthenticated
  }
  next();
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};
