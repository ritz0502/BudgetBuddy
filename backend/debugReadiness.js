const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const user = await User.findOne();
    if (!user) {
      console.log('No user found');
      return process.exit(0);
    }
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const budget = await Budget.findOne({ month, year });
    if (!budget) {
      console.log('No budgets found for any user this month');
      return process.exit(0);
    }
    const userId = budget.userId;

    const budgets = await Budget.find({ userId, month, year });
    console.log(`Budgets found for this month: ${budgets.length}`);
    console.log(budgets);

    const categoryExpenses = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    console.log('Category Expenses:');
    console.log(categoryExpenses);

    const expenseMap = new Map();
    categoryExpenses.forEach((ce) => expenseMap.set(ce._id, ce.total));

    let withinBudget = 0;
    for (const budget of budgets) {
      const spent = expenseMap.get(budget.category) || 0;
      console.log(`Budget ${budget.category}: Limit = ${budget.limit}, Spent = ${spent}`);
      if (spent <= budget.limit) {
        withinBudget++;
      }
    }
    const { calculateReadiness } = require('./services/readinessEngine');
    const result = calculateReadiness({
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      budgetAdherence: budgets.length > 0 ? withinBudget / budgets.length : 1,
      subscriptionBurden: 0,
      spendingConsistency: 0.5
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
