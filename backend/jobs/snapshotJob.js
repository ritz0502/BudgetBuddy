// backend/jobs/snapshotJob.js
// Scheduler that enqueues BullMQ snapshot jobs every 60 seconds using setInterval.

const { addSnapshotJob } = require('../queues/snapshotQueue');

// Run every 60 seconds
const startSnapshotScheduler = () => {
  setInterval(async () => {
    try {
      await addSnapshotJob();
      console.log('[SnapshotJob] Enqueued portfolio snapshot job via interval');
    } catch (err) {
      console.error('[SnapshotJob] Failed to enqueue:', err.message);
    }
  }, 60 * 1000);

  console.log('[SnapshotJob] Scheduler started — snapshots every 60 seconds (setInterval)');
};

module.exports = { startSnapshotScheduler };
