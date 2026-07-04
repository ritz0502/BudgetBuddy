// backend/controllers/predictController.js
const mongoose = require('mongoose');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const redis = require('../config/redis');

const getPredictions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const cacheKey = `predict:${userId}`;

    // Step 1: Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Step 2: On cache miss, fetch user's last 90 days of expense transactions
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const aggregationResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: ninetyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          month: '$_id.month',
          year: '$_id.year',
          amount: '$total'
        }
      }
    ]);

    // Step 3: If aggregation returns 0 results, return empty predictions
    if (!aggregationResult || aggregationResult.length === 0) {
      return res.json({ predictions: [], message: 'No transaction data available' });
    }

    // Step 4: POST to ML service predict endpoint with a 10s timeout
    const mlUrl = process.env.ML_SERVICE_URL || 'http://ml-service:5001';
    let flaskResponse;
    try {
      flaskResponse = await axios.post(`${mlUrl}/predict`, {
        userId: userId,
        transactions: aggregationResult
      }, { timeout: 10000 });
    } catch (flaskErr) {
      // Step 6: If Flask is unreachable or times out, catch the error and return fallback
      console.error('[Predict] Flask service error:', flaskErr.message);
      return res.json({ predictions: [], fallback: true });
    }

    const predictionsData = flaskResponse.data;

    // Step 5: Cache the Flask response in Redis for 86400 seconds (24h)
    await redis.setex(cacheKey, 86400, JSON.stringify(predictionsData));

    return res.json(predictionsData);

  } catch (err) {
    console.error('getPredictions error:', err);
    // Never crash the node server, return fallback
    return res.json({ predictions: [], fallback: true });
  }
};

module.exports = {
  getPredictions
};
