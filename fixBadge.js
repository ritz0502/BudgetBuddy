const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Trade = require('./backend/models/Trade');
const InvestLabXP = require('./backend/models/InvestLabXP');
require('dotenv').config({ path: './.env' });

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const users = await User.find();
  for (const user of users) {
    const tradesCount = await Trade.countDocuments({ userId: user._id });
    if (tradesCount > 0) {
      let xpDoc = await InvestLabXP.findOne({ userId: user._id });
      if (xpDoc) {
        const hasBadge = xpDoc.badges.some(b => b.name === 'FIRST_TRADE');
        if (!hasBadge) {
          xpDoc.badges.push({ name: 'FIRST_TRADE', description: 'Made your first trade' });
          xpDoc.xp += 50; // Give them the 50 XP they missed
          await xpDoc.save();
          console.log(`Fixed badge for user ${user.email}`);
        } else {
          console.log(`User ${user.email} already has the badge.`);
        }
      }
    }
  }
  process.exit(0);
}

fix();
