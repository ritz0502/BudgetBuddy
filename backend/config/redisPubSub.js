// backend/config/redisPubSub.js
// Dedicated Redis connections for Pub/Sub.
// The existing config/redis.js client is used for caching (GET/SET).
// Redis does NOT allow Pub/Sub and regular commands on the same connection
// once SUBSCRIBE is called, so we need separate instances.

const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Publisher — used by marketDataGateway to publish price updates
const publisher = new Redis(redisUrl, {
  lazyConnect: false,
  maxRetriesPerRequest: null,
});

// Subscriber — used by server.js to receive price updates and forward to Socket.io
const subscriber = new Redis(redisUrl, {
  lazyConnect: false,
  maxRetriesPerRequest: null,
});

publisher.on('connect', () => {
  console.log('[Redis PubSub] Publisher connected');
});

publisher.on('error', (err) => {
  console.error('[Redis PubSub] Publisher error:', err.message);
});

subscriber.on('connect', () => {
  console.log('[Redis PubSub] Subscriber connected');
});

subscriber.on('error', (err) => {
  console.error('[Redis PubSub] Subscriber error:', err.message);
});

// Channel constant — single source of truth
const MARKET_CHANNEL = 'market:prices';

module.exports = { publisher, subscriber, MARKET_CHANNEL };
