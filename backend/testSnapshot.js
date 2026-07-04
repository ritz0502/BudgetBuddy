const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const PortfolioSnapshot = require('./models/PortfolioSnapshot');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const count = await PortfolioSnapshot.countDocuments();
    console.log(`Total snapshots: ${count}`);
    const latest = await PortfolioSnapshot.findOne().sort({ timestamp: -1 });
    if (latest) {
      console.log(`Latest snapshot timestamp: ${latest.timestamp}`);
      console.log(`Portfolio Value: ${latest.portfolioValue}, Cash: ${latest.cashBalance}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
