// backend/server.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const classifyRoutes = require('./routes/classifyRoutes');
const investlabRoutes = require('./routes/investlabRoutes');
const predictRoutes = require('./routes/predictRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');

// InvestLab services
const { startFinnhub, getLatestPrices } = require('./services/finnhubService');
const { startMarketDataGateway } = require('./services/marketDataGateway');
const { subscriber, MARKET_CHANNEL } = require('./config/redisPubSub');

require('./jobs/retrainJob'); // Start the ML retraining cron job
const { startScholarshipAlertJob } = require('./jobs/scholarshipAlertJob');
startScholarshipAlertJob(); // Start the scholarship deadline cron job

// InvestLab Day 3: Snapshot infrastructure
const { startSnapshotScheduler } = require('./jobs/snapshotJob');
const { startSnapshotWorker } = require('./workers/snapshotWorker');

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser()); // Needed to read req.cookies (refresh token)

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/classify', classifyRoutes);
app.use('/api/investlab', investlabRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/scholarships', scholarshipRoutes);

// ── HTTP Server + Socket.io ──────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

// ── Redis Pub/Sub → Socket.io bridge ─────────────────────────────────────────
// Market data flows: Finnhub → finnhubService → EventEmitter → marketDataGateway
//   → Redis Pub/Sub (market:prices) → here → Socket.io broadcast
subscriber.subscribe(MARKET_CHANNEL);
subscriber.on('message', (channel, message) => {
  if (channel === MARKET_CHANNEL) {
    try {
      io.emit('priceUpdate', JSON.parse(message));
      console.log(`[Socket.io] Broadcasted priceUpdate to clients`);
    } catch (err) {
      console.error('[Socket.io] Failed to broadcast price update:', err.message);
    }
  }
});

// ── Socket.io connection handler ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  // Send latest cached prices on connect
  const snapshot = getLatestPrices();
  console.log(`[Socket.io] Sending priceSnapshot to ${socket.id}`);
  socket.emit('priceSnapshot', snapshot);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start real-time market data pipeline
  startFinnhub();
  startMarketDataGateway();
  // Start portfolio snapshot infrastructure
  startSnapshotWorker();
  startSnapshotScheduler();
});