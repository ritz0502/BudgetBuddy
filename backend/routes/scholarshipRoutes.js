const express = require('express');
const router = express.Router();
const {
  getScholarships,
  getBookmarkedScholarships,
  getScholarshipById,
  toggleBookmark
} = require('../controllers/scholarshipController');
const { protect } = require('../middleware/authMiddleware');

// Must be registered BEFORE /:id route
router.get('/bookmarks', protect, getBookmarkedScholarships);

router.get('/', protect, getScholarships);
router.get('/:id', protect, getScholarshipById);
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
