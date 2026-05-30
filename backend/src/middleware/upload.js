const multer = require('multer');

// Memory storage is optimal because we process files (e.g. sharp image optimization or pdf parsing) 
// before deciding whether to upload to S3 or write locally
const storage = multer.memoryStorage();

// Acceptable file type extensions
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
