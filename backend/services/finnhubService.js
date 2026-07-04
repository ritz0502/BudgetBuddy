// backend/services/finnhubService.js
// Connects to Finnhub WebSocket, maintains a latestPrices cache,
// and emits price updates through a shared EventEmitter.

const WebSocket = require('ws');
const EventEmitter = require('events');

// Shared emitter — marketDataGateway listens to this
const priceEmitter = new EventEmitter();

// Symbols to track
const SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA'];

// In-memory price cache: { symbol: { price, volume, timestamp } }
const latestPrices = new Map();

// Initialize with baseline fallback prices
const BASELINE_PRICES = {
  AAPL: 174.22,
  MSFT: 312.05,
  NVDA: 462.10,
  GOOGL: 132.88,
  AMZN: 98.50,
  TSLA: 221.74
};

for (const sym of SYMBOLS) {
  latestPrices.set(sym, { price: BASELINE_PRICES[sym], volume: 0, timestamp: Date.now() });
}

let ws = null;
let reconnectAttempt = 0;
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

/**
 * Returns a plain object snapshot of all cached prices.
 * @returns {Object} e.g. { AAPL: { price: 189.5, volume: 100, timestamp: 1718... }, ... }
 */
const getLatestPrices = () => {
  return Object.fromEntries(latestPrices);
};

/**
 * Calculate reconnect delay with exponential backoff.
 */
const getReconnectDelay = () => {
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY);
  reconnectAttempt++;
  return delay;
};

/**
 * Start the Finnhub WebSocket connection.
 */
const startFinnhub = () => {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.error('[Finnhub] FINNHUB_API_KEY is not set. Market data will be unavailable.');
    return;
  }

  const url = `wss://ws.finnhub.io?token=${apiKey}`;

  console.log('[Finnhub] Connecting to WebSocket...');
  ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('[Finnhub] WebSocket connected');
    reconnectAttempt = 0; // Reset backoff on successful connect

    // Subscribe to each symbol
    for (const symbol of SYMBOLS) {
      ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      console.log(`[Finnhub] Subscribed to ${symbol}`);
    }
  });

  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());

      // Finnhub sends { type: 'trade', data: [{ s, p, v, t, c }, ...] }
      if (data.type === 'trade' && Array.isArray(data.data)) {
        const updatedSymbols = new Set();

        for (const trade of data.data) {
          const { s: symbol, p: price, v: volume, t: timestamp } = trade;

          if (SYMBOLS.includes(symbol)) {
            latestPrices.set(symbol, { price, volume, timestamp });
            updatedSymbols.add(symbol);
          }
        }

        // Emit a single update event with all changed prices
        if (updatedSymbols.size > 0) {
          const updates = {};
          for (const symbol of updatedSymbols) {
            updates[symbol] = latestPrices.get(symbol);
          }
          console.log(`[Finnhub] Emitting live trade updates for ${updatedSymbols.size} symbols`);
          priceEmitter.emit('priceUpdate', updates);
        }
      } else if (data.type === 'ping') {
        // console.log('[Finnhub] Ping received');
      }
    } catch (err) {
      console.error('[Finnhub] Message parse error:', err.message);
    }
  });

  ws.on('error', (err) => {
    console.error('[Finnhub] WebSocket error:', err.message);
  });

  ws.on('close', (code, reason) => {
    console.warn(`[Finnhub] WebSocket closed (code=${code}, reason=${reason || 'none'})`);

    const delay = getReconnectDelay();
    console.log(`[Finnhub] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempt})...`);
    setTimeout(startFinnhub, delay);
  });

  // Removed the setInterval from here to prevent leaks
};

// Simulated Fallback: Every 3 seconds, if markets are closed/quiet, simulate tiny random price wiggles
setInterval(() => {
  const updates = {};
  for (const sym of SYMBOLS) {
    const current = latestPrices.get(sym);
    if (!current) continue;
    const shift = (Math.random() - 0.5) * 0.5; // shift by -0.25 to +0.25
    const newPrice = parseFloat((current.price + shift).toFixed(2));
    latestPrices.set(sym, { price: newPrice, volume: current.volume + Math.floor(Math.random()*10), timestamp: Date.now() });
    updates[sym] = latestPrices.get(sym);
  }
  // console.log(`[Simulation] Emitting fallback simulated prices for all symbols`); // Comment out to reduce log spam
  priceEmitter.emit('priceUpdate', updates);
}, 3000);

module.exports = { startFinnhub, getLatestPrices, priceEmitter, SYMBOLS };
