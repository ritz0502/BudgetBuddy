require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { runScholarshipAlertJob } = require('./jobs/scholarshipAlertJob');

async function testCron() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/budget_buddy_db');
  console.log("Connected to MongoDB");
  await runScholarshipAlertJob();
  process.exit(0);
}
testCron();
