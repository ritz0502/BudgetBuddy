const cron = require('node-cron');
const axios = require('axios');
const ClassifierFeedback = require('../models/ClassifierFeedback');

// Run every Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('[Cron Job] Running weekly ML model retraining...');
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch feedback from the last 7 days
    const feedbackData = await ClassifierFeedback.find({
      createdAt: { $gte: sevenDaysAgo }
    }).lean();

    if (feedbackData.length === 0) {
      console.log('[Cron Job] No new feedback for retraining.');
      return;
    }

    const corrections = feedbackData.map(fb => ({
      description: fb.description,
      category: fb.actualCategory
    }));

    // Send corrections to ML service for retraining
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/retrain`, {
      corrections
    });

    console.log(`[Cron Job] ML Retrain Response: ${mlResponse.data.message}`);

    // Optionally delete processed feedback (since we have a TTL index of 90 days, 
    // it's up to you. Deleting them prevents them from being processed again 
    // if the cron job is run manually or overlaps, but the query uses $gte: sevenDaysAgo)
    // To be safe and prevent duplicate training data over time, we delete processed ones:
    const feedbackIds = feedbackData.map(fb => fb._id);
    await ClassifierFeedback.deleteMany({ _id: { $in: feedbackIds } });
    console.log(`[Cron Job] Deleted ${feedbackIds.length} processed feedback records.`);

  } catch (err) {
    console.error('[Cron Job] Retrain error:', err.message);
  }
});
