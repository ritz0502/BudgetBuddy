const cron = require('node-cron');
const Scholarship = require('../models/Scholarship');
const User = require('../models/User');
const Notification = require('../models/Notification');

const runScholarshipAlertJob = async () => {
  try {
    console.log('[ScholarshipAlertJob] Running daily deadline check...');
    const now = new Date();
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // 7 days from now (end of the day)
    const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find scholarships that have deadlines coming up within 7 days and are active
    const upcomingScholarships = await Scholarship.find({
      isActive: true,
      deadline: { $gte: startOfToday, $lte: sevenDaysFromNow }
    });

    if (upcomingScholarships.length === 0) {
      console.log('[ScholarshipAlertJob] No upcoming deadlines found.');
      return;
    }

    let notificationsCreated = 0;

    for (const scholarship of upcomingScholarships) {
      // Find all users who have bookmarked this scholarship
      const interestedUsers = await User.find({ bookmarkedScholarships: scholarship._id });
      
      // Calculate remaining days
      const diffTime = scholarship.deadline.getTime() - startOfToday.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const message = `Deadline approaching: ${scholarship.title} closes in ${diffDays} days`;

      for (const user of interestedUsers) {
        // Prevent duplicate notifications on the same day for the same scholarship
        const todayNotification = await Notification.findOne({
          userId: user._id,
          type: 'scholarship_deadline',
          message: message,
          createdAt: { $gte: startOfToday }
        });

        if (!todayNotification) {
          await Notification.create({
            userId: user._id,
            type: 'scholarship_deadline',
            message: message,
            read: false
          });
          notificationsCreated++;
        }
      }
    }

    console.log(`[ScholarshipAlertJob] Created ${notificationsCreated} new notifications.`);
  } catch (error) {
    console.error('[ScholarshipAlertJob] Error running job:', error);
  }
};

// Run every day at 9:00 AM
const startScholarshipAlertJob = () => {
  cron.schedule('0 9 * * *', runScholarshipAlertJob);
  console.log('[ScholarshipAlertJob] Scheduled to run daily at 9:00 AM');
};

module.exports = { startScholarshipAlertJob, runScholarshipAlertJob };
