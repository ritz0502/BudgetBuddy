// backend/workers/snapshotWorker.js
// BullMQ worker that processes portfolio snapshot jobs.
// Fetches all portfolios with holdings, valuates each, and saves snapshots.

const { Worker } = require('bullmq');
const Portfolio = require('../models/Portfolio');
const PortfolioSnapshot = require('../models/PortfolioSnapshot');
const { valuatePortfolio } = require('../services/portfolioValuationService');
const { getLatestPrices } = require('../services/finnhubService');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL into connection options for BullMQ
const parseRedisUrl = (url) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port, 10) || 6379,
    password: parsed.password || undefined,
  };
};

const connection = parseRedisUrl(redisUrl);

const startSnapshotWorker = () => {
  const worker = new Worker(
    'portfolio-snapshots',
    async (job) => {
      const startTime = Date.now();
      console.log(`[SnapshotWorker] Processing job ${job.id}...`);

      try {
        // Fetch all portfolios (with at least one holding or non-default cash)
        const portfolios = await Portfolio.find({
          $or: [
            { 'holdings.0': { $exists: true } },
            { cashBalance: { $ne: 10000 } },
          ],
        });

        if (portfolios.length === 0) {
          console.log('[SnapshotWorker] No active portfolios to snapshot');
          return { snapshotCount: 0 };
        }

        const prices = getLatestPrices();
        const snapshots = [];

        for (const portfolio of portfolios) {
          const valuation = valuatePortfolio(portfolio, prices);

          snapshots.push({
            userId: portfolio.userId,
            portfolioValue: valuation.portfolioValue,
            cashBalance: valuation.cashBalance,
            holdingsValue: valuation.holdingsValue,
            timestamp: new Date(),
          });
        }

        // Bulk insert for efficiency
        await PortfolioSnapshot.insertMany(snapshots);

        const elapsed = Date.now() - startTime;
        console.log(
          `[SnapshotWorker] Saved ${snapshots.length} snapshots in ${elapsed}ms`
        );

        return { snapshotCount: snapshots.length, elapsed };
      } catch (err) {
        console.error('[SnapshotWorker] Job failed:', err.message);
        throw err; // Let BullMQ handle retries
      }
    },
    {
      connection,
      concurrency: 1, // Process one job at a time
    }
  );

  worker.on('completed', (job, result) => {
    console.log(
      `[SnapshotWorker] Job ${job.id} completed: ${result.snapshotCount} snapshots`
    );
  });

  worker.on('failed', (job, err) => {
    console.error(`[SnapshotWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log('[SnapshotWorker] Worker started, listening for jobs...');
  return worker;
};

module.exports = { startSnapshotWorker };
