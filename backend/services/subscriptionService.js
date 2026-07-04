// backend/services/subscriptionService.js
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CancelledSubscription = require('../models/CancelledSubscription');

/**
 * Detect recurring subscriptions for a user.
 * A subscription is defined as the same normalized description appearing
 * as an 'expense' in at least 2 different calendar months.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<{ subscriptions: Array, totalMonthly: number }>}
 */
const detectSubscriptions = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Fetch cancelled subscription descriptions for this user
  const cancelled = await CancelledSubscription.find({ userId: userObjectId }).select('description');
  const cancelledDescriptions = new Set(cancelled.map((c) => c.description.toLowerCase().trim()));

  const pipeline = [
    // Only expense transactions with a non-empty description
    {
      $match: {
        userId: userObjectId,
        type: 'expense',
        description: { $nin: ['', null] },
      },
    },
    // Normalize description (lowercase, trim)
    {
      $addFields: {
        normalizedDescription: { $trim: { input: { $toLower: '$description' } } },
        calendarMonth: {
          $dateToString: { format: '%Y-%m', date: '$date' },
        },
      },
    },
    // Group by normalizedDescription + calendarMonth to get distinct months
    {
      $group: {
        _id: {
          description: '$normalizedDescription',
          month: '$calendarMonth',
        },
        category: { $last: '$category' },
        amount: { $last: '$amount' },
        lastCharged: { $max: '$date' },
      },
    },
    // Group by description to count distinct months
    {
      $group: {
        _id: '$_id.description',
        monthsDetected: { $sum: 1 },
        category: { $last: '$category' },
        amount: { $last: '$amount' },
        lastCharged: { $max: '$lastCharged' },
      },
    },
    // Only keep descriptions appearing in 2+ distinct months
    {
      $match: {
        monthsDetected: { $gte: 2 },
      },
    },
    // Shape output
    {
      $project: {
        _id: 0,
        description: '$_id',
        amount: 1,
        category: 1,
        lastCharged: 1,
        monthsDetected: 1,
        frequency: { $literal: 'monthly' },
      },
    },
    // Sort by lastCharged descending (most recent first)
    { $sort: { lastCharged: -1 } },
  ];

  const results = await Transaction.aggregate(pipeline);

  // Filter out cancelled subscriptions
  const subscriptions = results.filter(
    (s) => !cancelledDescriptions.has(s.description.toLowerCase().trim())
  );

  // Capitalize description for display
  const formatted = subscriptions.map((s) => ({
    ...s,
    description:
      s.description.charAt(0).toUpperCase() + s.description.slice(1),
  }));

  const totalMonthly = formatted.reduce((sum, s) => sum + s.amount, 0);

  return { subscriptions: formatted, totalMonthly };
};

module.exports = { detectSubscriptions };
