// backend/config/redis.js
const Redis = require('ioredis');

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // Retry every 500 ms, up to 10 times, then stop retrying
  maxRetriesPerRequest: null,          // required for some queue libs; harmless here
  lazyConnect: false,                  // connect immediately on import
});

client.on('connect', () => {
  console.log('Redis connected successfully');
});

client.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

module.exports = client;
