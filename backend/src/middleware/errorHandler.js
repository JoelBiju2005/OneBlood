const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error(err); // log internally always

  // Handle Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.details.map(d => d.message),
    });
  }

  // Handle Mongoose cast errors or duplicate keys
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  res.status(err.statusCode || err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Something went wrong. Please try again.',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorHandler;
