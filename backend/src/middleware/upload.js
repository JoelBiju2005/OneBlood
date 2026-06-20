const multer = require('multer');

// ─── Allowed MIME types ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Memory storage — we process files before writing to disk / uploading to cloud
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

/**
 * Wraps a multer upload call and translates Multer-specific errors into
 * proper HTTP responses (400 / 413) so controllers don't have to handle them.
 *
 * @param {'single'|'array'|'fields'} method  — multer method name
 * @param  {...any} args — arguments forwarded to the multer method
 * @returns Express middleware
 */
const handleUpload = (method, ...args) => {
  const multerMiddleware = upload[method](...args);

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: `File too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.` });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      if (err) {
        // Custom fileFilter rejection or unknown error
        return res.status(400).json({ message: err.message || 'File upload failed.' });
      }
      next();
    });
  };
};

module.exports = upload;
module.exports.handleUpload = handleUpload;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
