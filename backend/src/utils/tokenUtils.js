const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'oneblood_super_secret_jwt_key_2026_antigravity';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'oneblood_super_refresh_jwt_key_2026_antigravity';
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
