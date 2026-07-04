// backend/services/xpService.js
const InvestLabXP = require('../models/InvestLabXP');

// ── Configuration ────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Beginner Investor', xp: 0 },
  { level: 2, name: 'Market Explorer', xp: 100 },
  { level: 3, name: 'Portfolio Builder', xp: 250 },
  { level: 4, name: 'Wealth Strategist', xp: 500 },
  { level: 5, name: 'Financial Scholar', xp: 1000 },
];

const ACTIONS = {
  FIRST_TRADE: { xp: 50, badge: 'FIRST_TRADE', desc: 'Made your first trade' },
  BUY_STOCK: { xp: 10, badge: null, desc: '' },
  SELL_STOCK: { xp: 10, badge: null, desc: '' },
  SELL_PROFIT: { xp: 0, badge: 'FIRST_PROFIT', desc: 'Sold a stock for profit' },
  READ_LESSON: { xp: 20, badge: 'LEARNING_ENTHUSIAST', desc: 'Read an educational lesson' },
  AI_COACH_REFRESH: { xp: 5, badge: 'AI_EXPLORER', desc: 'Consulted the AI Coach' },
  READINESS_HIGH: { xp: 50, badge: null, desc: '' }, // Just XP, maybe PORTFOLIO_MASTER handles badges
  DIVERSIFIED_PORTFOLIO: { xp: 30, badge: 'DIVERSIFIER', desc: 'Built a diversified portfolio' },
  WEALTH_PLANNER_USE: { xp: 10, badge: 'WEALTH_PLANNER', desc: 'Used the Future Wealth Planner' },
  PORTFOLIO_MASTER: { xp: 0, badge: 'PORTFOLIO_MASTER', desc: 'Achieved high portfolio health or level 5' }
};

// ── Helper: Calculate Level ──────────────────────────────────────────────────
const calculateLevel = (currentXP) => {
  let currentLevel = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (currentXP >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i].level;
    } else {
      break;
    }
  }
  return currentLevel;
};

// ── Helper: Update Streak ────────────────────────────────────────────────────
const updateStreak = (xpDoc) => {
  const now = new Date();
  const lastDate = new Date(xpDoc.lastActivityDate);
  
  // Normalize dates to midnight to compare days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActivity = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  
  const diffTime = Math.abs(today - lastActivity);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    xpDoc.streakDays += 1;
  } else if (diffDays > 1) {
    // Streak broken
    xpDoc.streakDays = 1;
  }
  
  if (xpDoc.streakDays > xpDoc.longestStreak) {
    xpDoc.longestStreak = xpDoc.streakDays;
  }
  
  xpDoc.lastActivityDate = now;
};

// ── Main XP Awarding Function ────────────────────────────────────────────────
/**
 * Award XP to a user and handle badges, levels, and streaks.
 * @param {ObjectId} userId
 * @param {string} actionName
 * @returns {Object} result { xpAdded, newTotal, levelUp, newBadge }
 */
const awardXP = async (userId, actionName) => {
  try {
    let xpDoc = await InvestLabXP.findOne({ userId });
    
    if (!xpDoc) {
      xpDoc = new InvestLabXP({ userId });
    }

    const action = ACTIONS[actionName];
    if (!action) {
      console.warn(`Unknown XP action: ${actionName}`);
      return { xpAdded: 0 };
    }

    let xpAdded = action.xp;
    let newBadge = null;
    let levelUp = false;

    // Handle Badge
    if (action.badge) {
      const hasBadge = xpDoc.badges.some(b => b.name === action.badge);
      if (!hasBadge) {
        xpDoc.badges.push({ name: action.badge, description: action.desc });
        newBadge = action.badge;
      } else {
        // If it's an action that ONLY gives a badge once (and maybe XP once),
        // we might prevent double XP. But for now, we grant the XP every time
        // except for FIRST_TRADE which we should only grant once.
        if (actionName === 'FIRST_TRADE' || actionName === 'DIVERSIFIED_PORTFOLIO') {
           xpAdded = 0; // Already awarded
        }
      }
    }

    // Update XP and Level
    if (xpAdded > 0) {
      xpDoc.xp += xpAdded;
    }

    const oldLevel = xpDoc.level;
    const newLevel = calculateLevel(xpDoc.xp);
    
    if (newLevel > oldLevel) {
      xpDoc.level = newLevel;
      levelUp = true;

      // Check for Portfolio Master badge on level 5
      if (newLevel === 5) {
        const hasMaster = xpDoc.badges.some(b => b.name === 'PORTFOLIO_MASTER');
        if (!hasMaster) {
          xpDoc.badges.push({ name: 'PORTFOLIO_MASTER', description: ACTIONS.PORTFOLIO_MASTER.desc });
          newBadge = newBadge ? `${newBadge}, PORTFOLIO_MASTER` : 'PORTFOLIO_MASTER';
        }
      }
    }

    // Update Streak
    updateStreak(xpDoc);

    await xpDoc.save();

    return {
      xpAdded,
      newTotal: xpDoc.xp,
      level: xpDoc.level,
      levelUp,
      newBadge
    };

  } catch (error) {
    console.error('Error awarding XP:', error);
    return { xpAdded: 0, error: error.message };
  }
};

module.exports = {
  LEVEL_THRESHOLDS,
  awardXP
};
