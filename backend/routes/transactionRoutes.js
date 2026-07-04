// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getMonthlyOverview,
  getSubscriptions,
  cancelSubscription,
} = require('../controllers/transactionController');

// IMPORTANT: /summary, /monthly-overview, /subscriptions/* MUST be registered before /:id
// to prevent Express treating them as an id param
router.get('/summary', protect, getMonthlySummary);
router.get('/monthly-overview', protect, getMonthlyOverview);

// Subscription routes
router.get('/subscriptions', protect, getSubscriptions);
router.patch('/subscriptions/cancel', protect, cancelSubscription);

router.get('/', protect, getTransactions);
router.post('/', protect, upload.single('receipt'), createTransaction);
router.put('/:id', protect, upload.single('receipt'), updateTransaction);
router.delete('/:id', protect, deleteTransaction);

module.exports = router;
