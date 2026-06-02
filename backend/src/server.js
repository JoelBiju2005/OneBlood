require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketService = require('./services/socketService');

const PORT = process.env.PORT || 5000;

// Initialize Server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$/.test(origin);
      if (isLocal || origin === (process.env.FRONTEND_URL || 'http://localhost:5173')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Initialize socket event handlers with JWT authentication
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'oneblood_super_secret_jwt_key_2026_antigravity';

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

socketService.init(io);

// Connect to Database & Listen
const startServer = async () => {
  await connectDB();
  
  // Initialize background tasks
  try {
    const { runEscalationCheck } = require('./services/escalationService');
    const { runEmailRetryJob } = require('./services/emailService');
    runEscalationCheck().catch(err => console.error('Startup escalation check error:', err.message));
    runEmailRetryJob().catch(err => console.error('Startup email retry error:', err.message));
  } catch (taskErr) {
    console.error('Failed to initialize background tasks:', taskErr.message);
  }

  server.listen(PORT, () => {
    console.log(`🚀 OneBlood Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err.message);
  process.exit(1);
});
