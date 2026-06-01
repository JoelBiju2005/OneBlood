const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const bankRoutes = require('./routes/bankRoutes');
const requestRoutes = require('./routes/requestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const donationRoutes = require('./routes/donationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const noticeBoardRoutes = require('./routes/noticeBoardRoutes');
const seedRoute = require('./routes/seedRoute'); // temp seed route

const app = express();

// Trust proxy settings (required for Render/Heroku to get real client IPs)
app.set('trust proxy', 1);

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: isDev ? 10000 : 500, // Increased to 500 to prevent false limits on production
  message: { error: 'Too many requests. Try again in 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100, // Increased to 100 to allow normal navigation/refresh cycles
  message: { error: 'Too many requests. Try again in 15 minutes.' }
});

// CORS allowed origins config
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://oneblood-app.web.app',
  'https://oneblood-app.firebaseapp.com',
];

// CORS must be registered early so rate limiters and auth filters send proper CORS headers on termination
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$/.test(origin);
    if (isLocal || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true,
}));

// Standard express and security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(cookieParser());
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local static uploaded files in dev when no S3 is configured
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    redis: require('./config/redis').isUsingRedis() ? 'connected' : 'in-memory-fallback'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/noticeboard', noticeBoardRoutes);
app.use('/api/seed', seedRoute); // temp – remove after seeding
app.get('/api/stats/public', require('./controllers/analyticsController').getPublicStats);
app.get('/api/directions', require('./controllers/searchController').getDirections);

// Fallback 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Central error handler
app.use(errorHandler);

module.exports = app;
