const Scholarship = require('../models/Scholarship');
const User = require('../models/User');
const redis = require('../config/redis');

// @desc    Get paginated and filtered scholarships
// @route   GET /api/scholarships
// @access  Private
exports.getScholarships = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    // Build Cache Key
    const cacheKey = `scholarships:${search || 'all'}:${category || 'all'}:${page}:${limit}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      // If searching, sort by text score, else sort by deadline ascending
      sort: search ? { score: { $meta: "textScore" } } : { deadline: 1 },
      projection: search ? { score: { $meta: "textScore" } } : {}
    };

    const result = await Scholarship.paginate(query, options);

    const response = {
      scholarships: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    res.status(500).json({ message: 'Server error fetching scholarships' });
  }
};

// @desc    Get user's bookmarked scholarships
// @route   GET /api/scholarships/bookmarks
// @access  Private
exports.getBookmarkedScholarships = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookmarkedScholarships');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.bookmarkedScholarships);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Server error fetching bookmarks' });
  }
};

// @desc    Get single scholarship by ID
// @route   GET /api/scholarships/:id
// @access  Private
exports.getScholarshipById = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }
    res.json(scholarship);
  } catch (error) {
    console.error('Error fetching scholarship:', error);
    res.status(500).json({ message: 'Server error fetching scholarship' });
  }
};

// @desc    Toggle bookmark for a scholarship
// @route   POST /api/scholarships/:id/bookmark
// @access  Private
exports.toggleBookmark = async (req, res) => {
  try {
    const scholarshipId = req.params.id;
    const userId = req.user._id;

    // Check if scholarship exists
    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }

    const user = await User.findById(userId);
    
    const isBookmarked = user.bookmarkedScholarships.includes(scholarshipId);

    if (isBookmarked) {
      // Unbookmark
      user.bookmarkedScholarships = user.bookmarkedScholarships.filter(id => id.toString() !== scholarshipId.toString());
      await user.save();
      return res.json({ bookmarked: false, message: 'Removed' });
    } else {
      // Bookmark
      user.bookmarkedScholarships.push(scholarshipId);
      await user.save();
      return res.json({ bookmarked: true, message: 'Bookmarked' });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Server error toggling bookmark' });
  }
};
