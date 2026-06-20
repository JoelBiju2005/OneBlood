const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error(err); // always log internally

  // ─── Joi validation errors ──────────────────────────────────────────────────
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.details.map(d => d.message),
    });
  }

  // ─── Mongoose validation errors ─────────────────────────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // ─── Mongoose cast errors ──────────────────────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`,
    });
  }

  // ─── Mongoose duplicate key ────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // ─── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired.',
    });
  }

  // ─── Multer errors ─────────────────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum allowed size is 10 MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  // ─── Fallback ──────────────────────────────────────────────────────────────
  res.status(err.statusCode || err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Something went wrong. Please try again.',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorHandler;
