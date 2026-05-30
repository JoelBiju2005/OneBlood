const fs = require('fs');
const path = require('path');

// Fallback upload directory for local uploads
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let s3Client = null;
let PutObjectCommand = null;
let GetObjectCommand = null;
let getSignedUrl = null;

const isS3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

if (isS3Configured) {
  try {
    const { S3Client: Client, PutObjectCommand: PutCmd, GetObjectCommand: GetCmd } = require('@aws-sdk/client-s3');
    const { getSignedUrl: signUrl } = require('@aws-sdk/s3-request-presigner');
    
    PutObjectCommand = PutCmd;
    GetObjectCommand = GetCmd;
    getSignedUrl = signUrl;

    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    console.log('🟢 AWS S3 Storage Service Initialized');
  } catch (error) {
    console.error('🔴 Failed to initialize S3 Client or modules not installed. Falling back to local storage.', error.message);
    s3Client = null;
  }
} else {
  console.log('ℹ️ AWS S3 not configured. Using local storage for uploads.');
}

/**
 * Uploads a file (either to S3 or local directory)
 * @param {Object} file Multer file object
 * @returns {Promise<string>} File URL
 */
const uploadFile = async (file) => {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${path.extname(file.originalname)}`;
  
  if (isS3Configured && s3Client && PutObjectCommand) {
    try {
      const bucketName = process.env.AWS_S3_BUCKET;
      const uploadParams = {
        Bucket: bucketName,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      
      await s3Client.send(new PutObjectCommand(uploadParams));
      return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${filename}`;
    } catch (error) {
      console.error('🔴 S3 upload failed, falling back to local', error);
    }
  }

  // Local file storage fallback
  const localFilePath = path.join(UPLOADS_DIR, filename);
  await fs.promises.writeFile(localFilePath, file.buffer);
  
  // Return local API access URL
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}/uploads/${filename}`;
};

/**
 * Generates a pre-signed S3 URL if private access is required
 */
const getPresignedUrl = async (filename) => {
  if (isS3Configured && s3Client && GetObjectCommand && getSignedUrl) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Failed to generate pre-signed URL', error);
    }
  }
  
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}/uploads/${filename}`;
};

module.exports = {
  uploadFile,
  getPresignedUrl,
  UPLOADS_DIR
};
