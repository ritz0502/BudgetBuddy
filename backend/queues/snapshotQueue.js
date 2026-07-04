// backend/queues/snapshotQueue.js
// BullMQ queue for portfolio snapshot jobs.
// Uses the existing Redis instance from docker-compose.

const { Queue } = require('bullmq');

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

const snapshotQueue = new Queue('portfolio-snapshots', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
    removeOnFail: { count: 50 },      // Keep last 50 failed jobs
    attempts: 2,                       // Retry once on failure
    backoff: { type: 'fixed', delay: 5000 },
  },
});

/**
 * Enqueue a snapshot job for all active portfolios.
 */
const addSnapshotJob = async () => {
  await snapshotQueue.add('snapshot-all', {
    triggeredAt: Date.now(),
  });
};

console.log('[SnapshotQueue] Portfolio snapshot queue initialized');

module.exports = { snapshotQueue, addSnapshotJob };
