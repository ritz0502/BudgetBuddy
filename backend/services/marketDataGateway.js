// backend/services/marketDataGateway.js
// Listens to priceEmitter events from finnhubService and publishes
// them to Redis Pub/Sub. This decouples market data ingestion from
// Socket.io delivery — the Socket.io layer subscribes to Redis
// independently in server.js.

const { priceEmitter } = require('./finnhubService');
const { publisher, MARKET_CHANNEL } = require('../config/redisPubSub');

/**
 * Start the market data gateway.
 * Bridges EventEmitter → Redis Pub/Sub.
 */
const startMarketDataGateway = () => {
  priceEmitter.on('priceUpdate', (updates) => {
    const payload = JSON.stringify({
      type: 'priceUpdate',
      data: updates,
      timestamp: Date.now(),
    });

    publisher.publish(MARKET_CHANNEL, payload).catch((err) => {
      console.error('[MarketGateway] Redis publish error:', err.message);
    });
  });

  console.log('[MarketGateway] Listening to priceEmitter → Redis Pub/Sub');
};

module.exports = { startMarketDataGateway };
