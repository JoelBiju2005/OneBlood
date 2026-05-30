const Redis = require('ioredis');

let redisClient;
let isRedisConnected = false;

// In-memory fallback cache
const memoryCache = new Map();
const mockRedis = {
  get: async (key) => memoryCache.get(key) || null,
  set: async (key, value, mode, duration) => {
    memoryCache.set(key, value);
    if (mode === 'EX' && duration) {
      setTimeout(() => memoryCache.delete(key), duration * 1000);
    }
    return 'OK';
  },
  del: async (key) => {
    memoryCache.delete(key);
    return 1;
  },
  keys: async (pattern) => {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(memoryCache.keys()).filter(key => regexPattern.test(key));
  },
  incr: async (key) => {
    let val = parseInt(memoryCache.get(key) || '0', 10);
    val += 1;
    memoryCache.set(key, val.toString());
    return val;
  },
  expire: async (key, duration) => {
    setTimeout(() => memoryCache.delete(key), duration * 1000);
    return 1;
  },
  status: 'mock'
};

try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log(`Connecting to Redis at: ${redisUrl}`);
  
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      // Stop retrying quickly to fallback to memory
      if (times > 2) {
        console.warn('⚠️ Redis connection timed out. Falling back to in-memory store.');
        return null; // Stop retrying
      }
      return 1000;
    }
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('🟢 Redis Connected');
  });

  redisClient.on('error', (err) => {
    console.warn('⚠️ Redis Error:', err.message);
    isRedisConnected = false;
  });

} catch (err) {
  console.warn('⚠️ Could not initialize Redis client. Using in-memory fallback.', err.message);
  redisClient = mockRedis;
}

// Export wrapper helper that dynamically switches based on connectivity
const cache = {
  get: async (key) => {
    if (isRedisConnected && redisClient && redisClient.status !== 'mock') {
      try {
        return await redisClient.get(key);
      } catch (err) {
        return await mockRedis.get(key);
      }
    }
    return await mockRedis.get(key);
  },
  set: async (key, value, mode, duration) => {
    const valString = typeof value === 'object' ? JSON.stringify(value) : value;
    if (isRedisConnected && redisClient && redisClient.status !== 'mock') {
      try {
        if (mode && duration) {
          return await redisClient.set(key, valString, mode, duration);
        }
        return await redisClient.set(key, valString);
      } catch (err) {
        return await mockRedis.set(key, valString, mode, duration);
      }
    }
    return await mockRedis.set(key, valString, mode, duration);
  },
  del: async (key) => {
    if (isRedisConnected && redisClient && redisClient.status !== 'mock') {
      try {
        return await redisClient.del(key);
      } catch (err) {
        return await mockRedis.del(key);
      }
    }
    return await mockRedis.del(key);
  },
  incr: async (key) => {
    if (isRedisConnected && redisClient && redisClient.status !== 'mock') {
      try {
        return await redisClient.incr(key);
      } catch (err) {
        return await mockRedis.incr(key);
      }
    }
    return await mockRedis.incr(key);
  },
  expire: async (key, duration) => {
    if (isRedisConnected && redisClient && redisClient.status !== 'mock') {
      try {
        return await redisClient.expire(key, duration);
      } catch (err) {
        return await mockRedis.expire(key, duration);
      }
    }
    return await mockRedis.expire(key, duration);
  },
  isUsingRedis: () => isRedisConnected
};

module.exports = cache;
