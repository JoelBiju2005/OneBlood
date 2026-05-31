const { onRequest } = require('firebase-functions/v2/https');
const app = require('./src/app');

// Expose the Express app as a single Cloud Function named 'api'
exports.api = onRequest({
  cors: true,
  maxInstances: 15,
  timeoutSeconds: 120,
  memory: '512MiB',
}, app);
