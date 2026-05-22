// backend/controllers/quizController.js
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// ──────────────────────────────────────────────
// GET /api/quizzes  — list all (no answers)
// ──────────────────────────────────────────────
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().select('-questions').sort({ topicOrder: 1, seriesOrder: 1 });
    //omit questions array (not needed for cards) - The dashboard only needs quiz metadata (title, description, category, XP, difficulty) to render the quiz cards. Sending 10 full questions per quiz would mean transferring hundreds of extra fields on every page load — wasteful and slow.

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching quizzes' });
  }
};

// ──────────────────────────────────────────────
// GET /api/quizzes/daily  — today's daily quiz
// ──────────────────────────────────────────────
exports.getDailyQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ isDaily: true }).select('-questions.correctAnswer');
    if (!quiz) return res.status(404).json({ message: 'No daily quiz today' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/quizzes/:id  — single quiz for active play
// ──────────────────────────────────────────────
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Strip correctAnswer from response so client can't cheat
    const safeQuiz = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      topic: quiz.topic,
      topicOrder: quiz.topicOrder,
      difficulty: quiz.difficulty,
      xpReward: quiz.xpReward,
      isDaily: quiz.isDaily,
      questions: quiz.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options
        // correctAnswer intentionally omitted
      }))
    };
    res.json(safeQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching quiz' });
  }
};

// ──────────────────────────────────────────────
// POST /api/quizzes/submit
// Body: { quizId, answers: [0,1,null,...] }
// ──────────────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.user?.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let score = 0;
    const answerDetails = [];

    quiz.questions.forEach((question, index) => {
      const userAnswerIndex = answers[index];
      const isCorrect = userAnswerIndex === question.correctAnswer;
      if (isCorrect) score++;

      answerDetails.push({
        questionText: question.questionText,
        userAnswer: userAnswerIndex !== null && userAnswerIndex !== undefined
          ? question.options[userAnswerIndex]
          : 'Skipped',
        correctAnswer: question.options[question.correctAnswer],
        isCorrect
      });
    });

    const totalQuestions = quiz.questions.length;
    const xpPerQuestion = totalQuestions > 0 ? quiz.xpReward / totalQuestions : 0;
    let xpEarned = Math.round(score * xpPerQuestion);

    // Daily bonus
    if (quiz.isDaily) xpEarned += 100;

    // Update user XP and history in DB if logged in
    if (userId) {
      // Only push if not already completed (prevent duplicate entries)
      const user = await User.findById(userId);
      const alreadyCompleted = user.completedQuizzes.some(
        c => c.quizId.toString() === quizId.toString()
      );

      if (!alreadyCompleted) {
        await User.findByIdAndUpdate(userId, {
          $inc: { xp: xpEarned },
          $push: {
            completedQuizzes: {
              quizId: quiz._id,
              score,
              total: quiz.questions.length,
              xpEarned,
              completedAt: new Date()
            }
          }
        });
      } else {
        // Still update XP on retries (but don't duplicate completion entry)
        await User.findByIdAndUpdate(userId, { $inc: { xp: xpEarned } });
      }

      const updatedUser = await User.findById(userId).select('xp completedQuizzes');
      return res.json({
        score,
        total: quiz.questions.length,
        xpEarned,
        answerDetails,
        newXp: updatedUser?.xp,
        completedQuizzes: updatedUser?.completedQuizzes || []
      });
    }

    res.json({ score, total: quiz.questions.length, xpEarned, answerDetails });

  } catch (error) {
    console.error('submitQuiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/quizzes/leaderboard  — top 20 by XP
// ──────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .select('name xp completedQuizzes')
      .sort({ xp: -1 }) //highest xp first
      .limit(20);

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      xp: u.xp,
      quizzesCompleted: u.completedQuizzes?.length || 0,
      level: Math.floor(u.xp / 100) + 1 // every 100 XP = 1 level
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
};

// ──────────────────────────────────────────────
// POST /api/quizzes/seed  — 6 topics × 3 difficulty × 10 questions
// ──────────────────────────────────────────────
exports.seedQuizzes = async (req, res) => {
  try {
    await Quiz.deleteMany({});

    const quizzes = [

      // ═══════════════════════════════════════
      // TOPIC 1: BUDGETING FUNDAMENTALS
      // ═══════════════════════════════════════
      {
        title: 'Budgeting Basics',
        description: 'Master the core concepts of personal budgeting and money management.',
        category: 'budgeting',
        topic: 'Budgeting Fundamentals',
        topicOrder: 1,
        seriesOrder: 1,
        difficulty: 'easy',
        xpReward: 50,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What does the 50/30/20 rule refer to?',
            options: ['Saving 50%, spending 30%, investing 20%', 'Needs 50%, wants 30%, savings 20%', 'Housing 50%, food 30%, fun 20%', 'Income 50%, tax 30%, take-home 20%'],
            correctAnswer: 1
          },
          {
            questionText: 'Which of these is a FIXED expense?',
            options: ['Groceries', 'Entertainment', 'Rent', 'Fuel'],
            correctAnswer: 2
          },
          {
            questionText: 'What is a "zero-based budget"?',
            options: ['A budget where you spend nothing', 'Income minus expenses equals zero', 'A budget with no savings', 'A budget for people with no income'],
            correctAnswer: 1
          },
          {
            questionText: 'An emergency fund should ideally cover how many months of expenses?',
            options: ['1 month', '2 months', '3–6 months', '12 months'],
            correctAnswer: 2
          },
          {
            questionText: 'What is discretionary spending?',
            options: ['Essential bills like rent and electricity', 'Money spent on non-essential wants', 'Money set aside for retirement', 'Tax deductions'],
            correctAnswer: 1
          },
          {
            questionText: 'Which budgeting approach tracks every single rupee you spend?',
            options: ['50/30/20 rule', 'Zero-based budgeting', 'Pay-yourself-first', 'Casual tracking'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the first step in creating a budget?',
            options: ['Cut all subscriptions', 'Calculate your net income', 'Open a savings account', 'List your debts'],
            correctAnswer: 1
          },
          {
            questionText: 'Variable expenses are best described as:',
            options: ['Expenses that never change', 'Expenses that fluctuate month to month', 'Only luxury purchases', 'Government-mandated costs'],
            correctAnswer: 1
          },
          {
            questionText: 'Which tool is most commonly used for personal budgeting?',
            options: ['A spreadsheet or budgeting app', 'A savings bond', 'A loan calculator', 'A stock portfolio'],
            correctAnswer: 0
          },
          {
            questionText: 'What does "living within your means" imply?',
            options: ['Earning more than your neighbours', 'Spending less than or equal to your income', 'Avoiding all investments', 'Taking no loans ever'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Budget Optimisation',
        description: 'Advanced techniques to stretch every rupee further with smart budget strategies.',
        category: 'budgeting',
        topic: 'Budgeting Fundamentals',
        topicOrder: 1,
        seriesOrder: 2,
        difficulty: 'medium',
        xpReward: 100,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'Which budgeting method uses physical envelopes of cash for each category?',
            options: ['Zero-based budgeting', 'Envelope budgeting', 'Pay-yourself-first', '50/30/20 rule'],
            correctAnswer: 1
          },
          {
            questionText: 'What is "lifestyle creep"?',
            options: ['Moving to a more expensive neighbourhood', 'Gradually increasing spending as income rises', 'Creeping interest on credit cards', 'Hidden subscription fees'],
            correctAnswer: 1
          },
          {
            questionText: 'The "pay yourself first" strategy means:',
            options: ['Paying bills before anything else', 'Transferring savings automatically before spending', 'Giving yourself a salary from your business', 'Treating yourself with every paycheck'],
            correctAnswer: 1
          },
          {
            questionText: 'Which ratio is used by banks to assess creditworthiness?',
            options: ['Debt-to-income ratio', 'Savings-to-expense ratio', 'Net worth ratio', 'Cash flow ratio'],
            correctAnswer: 0
          },
          {
            questionText: 'Sinking funds are best used for:',
            options: ['Daily grocery purchases', 'Predictable future large expenses like vacations', 'Emergency medical bills', 'Paying off credit card debt'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a budget variance?',
            options: ['The difference between budgeted and actual amounts', 'A type of bank penalty', 'Monthly fluctuation in interest rates', 'Tax return discrepancy'],
            correctAnswer: 0
          },
          {
            questionText: 'Which expense category should you cut first when reducing spending?',
            options: ['Rent', 'Insurance', 'Subscriptions and luxuries', 'Utility bills'],
            correctAnswer: 2
          },
          {
            questionText: 'What does "cash flow positive" mean for an individual?',
            options: ['More income than expenses', 'Having cash in hand', 'Owning stocks', 'Saving over 50% of income'],
            correctAnswer: 0
          },
          {
            questionText: 'A "needs vs wants" analysis helps you:',
            options: ['Determine your tax bracket', 'Prioritise essential over discretionary spending', 'Calculate interest rates', 'Compare bank accounts'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the benefit of tracking daily expenses?',
            options: ['It increases your income', 'It reveals spending patterns and triggers', 'It reduces taxes', 'It automatically saves money'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Advanced Budget Mastery',
        description: 'Deep-dive into budgeting psychology and complex financial planning scenarios.',
        category: 'budgeting',
        topic: 'Budgeting Fundamentals',
        topicOrder: 1,
        seriesOrder: 3,
        difficulty: 'hard',
        xpReward: 150,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is "mental accounting" in behavioural finance?',
            options: ['Tracking expenses mentally without an app', 'Treating money differently based on its source or intended use', 'Calculating compound interest in your head', 'A budgeting app feature'],
            correctAnswer: 1
          },
          {
            questionText: 'Which of the following best describes the "latte factor"?',
            options: ['Inflation in coffee prices', 'Small daily expenses that accumulate significantly over time', 'A tax on luxury beverages', 'A ratio of income spent on beverages'],
            correctAnswer: 1
          },
          {
            questionText: 'If your net monthly income is ₹60,000 and total debt payments are ₹18,000, your DTI is:',
            options: ['20%', '30%', '33%', '40%'],
            correctAnswer: 1
          },
          {
            questionText: 'What is hedonic adaptation in the context of budgeting?',
            options: ['Adapting your budget to seasonal changes', 'The tendency to return to a baseline happiness level despite financial changes', 'Spending more on experiences than goods', 'Reducing hedging costs in a portfolio'],
            correctAnswer: 1
          },
          {
            questionText: 'In YNAB, what does "give every rupee a job" mean?',
            options: ['Invest 100% of income', 'Assign all income to specific categories before spending it', 'Track every expense after spending', 'Only spend money you earned last month'],
            correctAnswer: 1
          },
          {
            questionText: 'What is "opportunity cost" in personal finance?',
            options: ['The fee charged by financial advisors', 'The value of the next-best alternative you give up', 'Interest lost on savings accounts', 'Transaction fee on investments'],
            correctAnswer: 1
          },
          {
            questionText: 'Which cognitive bias causes people to spend more money received as a gift vs earned?',
            options: ['Confirmation bias', 'Mental accounting / house money effect', 'Loss aversion', 'Anchoring'],
            correctAnswer: 1
          },
          {
            questionText: 'An anti-budget focuses on:',
            options: ['Tracking every rupee', 'Saving first, then spending freely with the rest', 'Minimising all expenses', 'Using cash-only payment'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the purpose of a "buffer" in a personal budget?',
            options: ['To invest in stocks', 'To absorb irregular or unexpected expenses', 'To earn interest on surplus funds', 'To delay tax payments'],
            correctAnswer: 1
          },
          {
            questionText: 'The "death by a thousand cuts" budget phenomenon refers to:',
            options: ['Bank charges on multiple accounts', 'Many small recurring expenses that collectively drain finances', 'High medical expenses', 'Loan default penalties'],
            correctAnswer: 1
          }
        ]
      },

      // ═══════════════════════════════════════
      // TOPIC 2: INVESTING
      // ═══════════════════════════════════════
      {
        title: 'Investing 101',
        description: 'Start your investment journey with essential concepts and terminology.',
        category: 'investing',
        topic: 'Investing',
        topicOrder: 2,
        seriesOrder: 1,
        difficulty: 'easy',
        xpReward: 50,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is a stock?',
            options: ['A loan to a company', 'A share of ownership in a company', 'A government bond', 'A fixed deposit'],
            correctAnswer: 1
          },
          {
            questionText: 'What does "diversification" mean in investing?',
            options: ['Investing all money in one winning stock', 'Spreading investments across different assets to reduce risk', 'Changing your investment strategy every month', 'Investing only in foreign markets'],
            correctAnswer: 1
          },
          {
            questionText: 'What is compound interest?',
            options: ['Interest paid only on the principal', 'Interest earned on both principal and previously earned interest', 'A type of bank fee', 'Tax on investment returns'],
            correctAnswer: 1
          },
          {
            questionText: 'What does SIP stand for in Indian investing?',
            options: ['Stock Investment Plan', 'Systematic Investment Plan', 'Secured Interest Portfolio', 'Standard Index Price'],
            correctAnswer: 1
          },
          {
            questionText: 'Which of these is generally considered the LEAST risky investment?',
            options: ['Small-cap stocks', 'Cryptocurrency', 'Government bonds', 'Startup equity'],
            correctAnswer: 2
          },
          {
            questionText: 'What is a mutual fund?',
            options: ['A bank fixed deposit', 'A pooled investment managed by professionals', 'A government savings scheme', 'A single-stock investment'],
            correctAnswer: 1
          },
          {
            questionText: 'What does "bull market" mean?',
            options: ['Prices are declining', 'Prices are rising over time', 'High volatility in the market', 'A market with only bonds'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the primary risk of investing in stocks?',
            options: ['Guaranteed loss', 'Market volatility causing price fluctuations', 'No returns at all', 'Mandatory withdrawal penalties'],
            correctAnswer: 1
          },
          {
            questionText: 'PPF stands for:',
            options: ['Personal Provident Fund', 'Public Provident Fund', 'Preferred Portfolio Fund', 'Protected Pension Fund'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a dividend?',
            options: ['A loss on a stock', 'A portion of company profits paid to shareholders', 'A fee charged by brokers', 'A type of bond'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Understanding Mutual Funds & ETFs',
        description: 'Explore mutual funds, ETFs, NAV, and tax-saving investment options.',
        category: 'investing',
        topic: 'Investing',
        topicOrder: 2,
        seriesOrder: 2,
        difficulty: 'medium',
        xpReward: 100,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is NAV in a mutual fund?',
            options: ['Net Asset Value — price per unit of a fund', 'National Average Valuation', 'Net Annual Yield', 'Nominal Asset Volume'],
            correctAnswer: 0
          },
          {
            questionText: 'An index fund aims to:',
            options: ['Beat the market by active stock picking', 'Replicate the performance of a specific market index', 'Only invest in government securities', 'Guarantee returns above inflation'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the expense ratio of a mutual fund?',
            options: ['Profit-to-cost ratio of the fund', 'Annual fee charged by the fund as a % of assets', 'The ratio of equity to debt in the fund', 'Tax rate applied to fund gains'],
            correctAnswer: 1
          },
          {
            questionText: 'ELSS funds qualify for tax deductions under which section in India?',
            options: ['Section 80C', 'Section 10(10D)', 'Section 24', 'Section 44AB'],
            correctAnswer: 0
          },
          {
            questionText: 'What is the lock-in period for ELSS funds?',
            options: ['1 year', '2 years', '3 years', '5 years'],
            correctAnswer: 2
          },
          {
            questionText: 'ETF stands for:',
            options: ['Electronic Transfer Fund', 'Exchange Traded Fund', 'Equity Tax Fund', 'European Trade Finance'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the difference between growt and dividend plan in mutual funds?',
            options: ['Growth reinvests returns; dividend distributes them', 'Growth only invests in equities', 'Dividend plans always outperform growth plans', 'Growth plans have higher fees'],
            correctAnswer: 0
          },
          {
            questionText: 'What does "AUM" stand for in the context of mutual funds?',
            options: ['Annual Utility Measurement', 'Assets Under Management', 'Allotted Unit Margin', 'Average Unit Market-price'],
            correctAnswer: 1
          },
          {
            questionText: 'Which type of mutual fund primarily invests in short-term debt instruments?',
            options: ['Equity fund', 'Liquid fund', 'ELSS fund', 'Index fund'],
            correctAnswer: 1
          },
          {
            questionText: 'What is rupee-cost averaging in SIPs?',
            options: ['Locking into one price for all units', 'Buying more units when prices are low and fewer when prices are high', 'Averaging daily closing prices', 'A penalty avoidance strategy'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Advanced Investment Strategies',
        description: 'Portfolio theory, risk management, and advanced investment vehicles.',
        category: 'investing',
        topic: 'Investing',
        topicOrder: 2,
        seriesOrder: 3,
        difficulty: 'hard',
        xpReward: 150,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is the Rule of 72?',
            options: ['You need 72 months to pay off any loan', 'Divide 72 by interest rate to estimate doubling time', 'Invest 72% of income for retirement', 'A tax rule for senior citizens'],
            correctAnswer: 1
          },
          {
            questionText: 'What does alpha represent in portfolio management?',
            options: ['Market risk level', 'Excess return over a benchmark index', 'Total return of a fund', 'Expense ratio percentage'],
            correctAnswer: 1
          },
          {
            questionText: 'Beta in investing measures:',
            options: ['Fund manager performance', 'A stocks sensitivity to overall market movements', 'Bond coupon rate', 'Annual return percentage'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the Sharpe Ratio?',
            options: ['Ratio of fund expenses to returns', 'Risk-adjusted return measure (return per unit of risk)', 'Annual dividend yield', 'Debt-to-equity ratio for stocks'],
            correctAnswer: 1
          },
          {
            questionText: 'Which concept describes reducing risk by holding uncorrelated assets?',
            options: ['Leverage', 'Modern Portfolio Theory diversification', 'Short selling', 'Market timing'],
            correctAnswer: 1
          },
          {
            questionText: 'Long-term capital gains (LTCG) tax in India for equity mutual funds above ₹1 lakh is:',
            options: ['0%', '10%', '15%', '20%'],
            correctAnswer: 1
          },
          {
            questionText: 'What is dollar-cost averaging equivalent to in Indian investing?',
            options: ['Lump-sum investment', 'SIP (Systematic Investment Plan)', 'Fixed Deposit', 'Arbitrage fund investing'],
            correctAnswer: 1
          },
          {
            questionText: 'Rebalancing a portfolio means:',
            options: ['Switching all investments to bonds', 'Restoring the original asset allocation by buying/selling', 'Withdrawing profits monthly', 'Changing your broker'],
            correctAnswer: 1
          },
          {
            questionText: 'What is an "exit load" in a mutual fund?',
            options: ['A charge for entering the fund', 'A fee for redeeming units before a specified period', 'The annual management expense', 'Tax on capital gains'],
            correctAnswer: 1
          },
          {
            questionText: 'What does the P/E (Price-to-Earnings) ratio indicate?',
            options: ['Total profit of a company', 'How much investors pay per rupee of earnings', 'Company debt levels', 'Dividend payment frequency'],
            correctAnswer: 1
          }
        ]
      },

      // ═══════════════════════════════════════
      // TOPIC 3: SAVING STRATEGIES
      // ═══════════════════════════════════════
      {
        title: 'Smart Saving Habits',
        description: 'Build habits that grow your savings effortlessly and consistently.',
        category: 'saving',
        topic: 'Saving Strategies',
        topicOrder: 3,
        seriesOrder: 1,
        difficulty: 'easy',
        xpReward: 50,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is the primary purpose of an emergency fund?',
            options: ['To earn high interest', 'To cover unexpected expenses without going into debt', 'To save for a vacation', 'To invest in stocks'],
            correctAnswer: 1
          },
          {
            questionText: 'Which account type typically offers the highest interest in India for savings?',
            options: ['Current account', 'Savings account', 'Fixed Deposit', 'Demat account'],
            correctAnswer: 2
          },
          {
            questionText: 'What does "paying yourself first" mean?',
            options: ['Treating yourself before budgeting', 'Saving a portion of income before spending on anything else', 'Paying your own salary from business', 'Buying what you want first'],
            correctAnswer: 1
          },
          {
            questionText: 'Automating your savings helps because:',
            options: ['It earns more interest', 'It removes the temptation to spend before saving', 'It qualifies for tax benefits', 'It grows your credit score'],
            correctAnswer: 1
          },
          {
            questionText: 'A recurring deposit (RD) is best for:',
            options: ['One-time large investments', 'Regular monthly savings with guaranteed returns', 'High-risk high-reward investments', 'Paying off debt'],
            correctAnswer: 1
          },
          {
            questionText: 'How much of your income is typically recommended to save each month?',
            options: ['At least 5%', 'At least 20%', 'At least 50%', 'At least 70%'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a "high-yield savings account"?',
            options: ['A risky investment account', 'A savings account offering significantly higher interest than average', 'An account only for businesses', 'A government pension scheme'],
            correctAnswer: 1
          },
          {
            questionText: 'Which of these is not a good savings strategy?',
            options: ['Automating monthly transfers to savings', 'Using windfalls to boost savings', 'Spending first, saving whatever is left', 'Setting specific savings goals'],
            correctAnswer: 2
          },
          {
            questionText: 'What is a savings goal?',
            options: ['A minimum balance requirement', 'A specific target amount to save by a set date', 'An interest rate benchmark', 'A government savings limit'],
            correctAnswer: 1
          },
          {
            questionText: 'Which type of savings is most liquid?',
            options: ['Fixed deposit with 5-year lock-in', 'PPF account', 'Standard savings bank account', 'ELSS fund'],
            correctAnswer: 2
          }
        ]
      },
      {
        title: 'Savings Vehicles & Tax Benefits',
        description: 'Explore tax-advantaged saving schemes and how to maximise returns.',
        category: 'saving',
        topic: 'Saving Strategies',
        topicOrder: 3,
        seriesOrder: 2,
        difficulty: 'medium',
        xpReward: 100,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'PPF has a lock-in period of:',
            options: ['3 years', '5 years', '10 years', '15 years'],
            correctAnswer: 3
          },
          {
            questionText: 'Sukanya Samriddhi Yojana is designed for:',
            options: ['Senior citizens', 'The girl child', 'Agricultural workers', 'Defence personnel'],
            correctAnswer: 1
          },
          {
            questionText: 'Interest earned on PPF is:',
            options: ['Fully taxable', 'Partially taxable', 'Tax-exempt under EEE category', 'Taxable only above ₹10,000'],
            correctAnswer: 2
          },
          {
            questionText: 'What is the maximum annual investment in a PPF account?',
            options: ['₹50,000', '₹1,00,000', '₹1,50,000', '₹2,00,000'],
            correctAnswer: 2
          },
          {
            questionText: 'NPS (National Pension System) is primarily designed for:',
            options: ['Emergency savings', 'Children\'s education', 'Retirement planning', 'Short-term goals'],
            correctAnswer: 2
          },
          {
            questionText: 'What does "EEE" mean in the context of tax classification for savings?',
            options: ['Exempt-Exempt-Exempt (contribution, growth, withdrawal all tax-free)', 'Earned-Earned-Earned', 'Eligible-Exempt-Earned', 'None of the above'],
            correctAnswer: 0
          },
          {
            questionText: 'Fixed Deposits are insured up to how much per depositor per bank in India?',
            options: ['₹1 lakh', '₹5 lakh', '₹10 lakh', '₹25 lakh'],
            correctAnswer: 1
          },
          {
            questionText: 'Which savings scheme offers the highest guaranteed interest rate in India currently?',
            options: ['PPF', 'Sukanya Samriddhi Yojana', 'Senior Citizens Savings Scheme', 'Savings Bank Account'],
            correctAnswer: 2
          },
          {
            questionText: 'What is the minimum monthly amount you can deposit in PPF?',
            options: ['₹100', '₹500', '₹1,000', '₹5,000'],
            correctAnswer: 0
          },
          {
            questionText: 'A "flexi" or "sweep-in" fixed deposit allows you to:',
            options: ['Withdraw funds anytime without penalty', 'Automatically move excess savings from a current account to FD', 'Invest in stocks automatically', 'Roll over the FD indefinitely'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Mastering Long-Term Saving',
        description: 'Goal-based saving, inflation impact, and building lasting financial security.',
        category: 'saving',
        topic: 'Saving Strategies',
        topicOrder: 3,
        seriesOrder: 3,
        difficulty: 'hard',
        xpReward: 150,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'Inflation erodes purchasing power. If inflation is 6%, ₹100 today will be worth approximately how much in 12 years?',
            options: ['₹90', '₹75', '~₹50', '₹80'],
            correctAnswer: 2
          },
          {
            questionText: 'What is the "real rate of return" on savings?',
            options: ['Nominal interest rate', 'Interest rate minus inflation rate', 'Returns after tax', 'Average return over 5 years'],
            correctAnswer: 1
          },
          {
            questionText: 'For retirement saved in an FD at 7%, with 6% inflation, your real return is approximately:',
            options: ['13%', '7%', '1%', '0.5%'],
            correctAnswer: 2
          },
          {
            questionText: 'Goal-based savings means:',
            options: ['Saving without a specific target', 'Creating separate savings pools for specific life goals', 'Investing all savings in one instrument', 'Matching your neighbour\'s savings rate'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the "three-jar method" for savings?',
            options: ['Dividing money into spending, saving, and giving/investing jars', 'Three bank accounts for tax purposes', 'Keeping three months of FDs', 'A triple-interest scheme'],
            correctAnswer: 0
          },
          {
            questionText: 'If you save ₹5,000/month for 20 years at 10% annual return, what is the approximate corpus?',
            options: ['₹12 lakh', '₹38 lakh', '₹1.2 crore', '₹57 lakh'],
            correctAnswer: 1
          },
          {
            questionText: 'Which savings strategy protects best against inflation over the long term?',
            options: ['Keeping cash at home', 'Bank savings account', 'Equity-linked savings with long horizon', 'Short-term fixed deposits'],
            correctAnswer: 2
          },
          {
            questionText: 'The concept of "paying yourself the interest" involves:',
            options: ['Taking interest earned from FD and reinvesting it', 'Not paying interest on loans', 'Getting cashback from banks', 'Reducing loan EMIs'],
            correctAnswer: 0
          },
          {
            questionText: 'Which milestone savings goal should be achieved FIRST?',
            options: ['Buying a house', '3-6 month emergency fund', 'Retirement corpus', 'Child\'s education fund'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the "savings paradox" at the macro level?',
            options: ['More saving by individuals leads to lower national income growth', 'Saving always improves economic output', 'Savings rates and GDP are unrelated', 'High government savings cause inflation'],
            correctAnswer: 0
          }
        ]
      },

      // ═══════════════════════════════════════
      // TOPIC 4: DEBT MANAGEMENT
      // ═══════════════════════════════════════
      {
        title: 'Understanding Debt',
        description: 'Know the difference between good debt and bad debt, and manage effectively.',
        category: 'debt',
        topic: 'Debt Management',
        topicOrder: 4,
        seriesOrder: 1,
        difficulty: 'easy',
        xpReward: 50,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'Which of these is an example of "good debt"?',
            options: ['Credit card debt for shopping', 'A loan for a depreciating asset', 'A student loan that increases earning potential', 'Buy-now-pay-later for gadgets'],
            correctAnswer: 2
          },
          {
            questionText: 'What is an EMI?',
            options: ['Early Money Instalment', 'Equated Monthly Instalment — fixed monthly loan payment', 'Electronic Money Issue', 'Extra Monthly Income'],
            correctAnswer: 1
          },
          {
            questionText: 'Which type of debt typically has the highest interest rate?',
            options: ['Home loan', 'Education loan', 'Credit card revolving debt', 'Car loan'],
            correctAnswer: 2
          },
          {
            questionText: 'What does "defaulting on a loan" mean?',
            options: ['Paying before the due date', 'Failing to make required loan payments on time', 'Refinancing your loan', 'Paying extra towards the principal'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a debt trap?',
            options: ['A government debt scheme', 'A situation where debt keeps growing faster than you can repay it', 'A type of investment product', 'A bank penalty'],
            correctAnswer: 1
          },
          {
            questionText: 'Paying only the minimum due on a credit card will:',
            options: ['Clear the debt quickly', 'Result in paying significantly more in interest over time', 'Improve your credit score', 'Have no financial impact'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the debt snowball method?',
            options: ['Taking more loans to pay off existing ones', 'Paying off smallest debts first for motivation', 'Paying off highest interest debts first', 'Consolidating all debts into one'],
            correctAnswer: 1
          },
          {
            questionText: 'What is debt consolidation?',
            options: ['Taking multiple loans simultaneously', 'Combining multiple debts into one, usually at a lower interest rate', 'Cancelling debt through bankruptcy', 'Asking a family member to take over your debt'],
            correctAnswer: 1
          },
          {
            questionText: 'A secured loan requires:',
            options: ['A guarantor only', 'Collateral such as property or a vehicle', 'A minimum credit score of 800', 'Two references'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a prepayment penalty on a loan?',
            options: ['A fee for late payment', 'A charge for paying off a loan before its term ends', 'Tax on interest paid', 'Processing fee on new loans'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Debt Repayment Strategies',
        description: 'Proven methods to eliminate debt faster and save thousands in interest.',
        category: 'debt',
        topic: 'Debt Management',
        topicOrder: 4,
        seriesOrder: 2,
        difficulty: 'medium',
        xpReward: 100,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'The debt avalanche method prioritises:',
            options: ['Paying off smallest balance first', 'Paying highest interest rate debt first', 'Paying the newest debt first', 'Making only minimum payments'],
            correctAnswer: 1
          },
          {
            questionText: 'What is debt refinancing?',
            options: ['Taking a new loan to pay off an existing one at better terms', 'Increasing your existing loan amount', 'Cancelling a loan early', 'Switching from credit card to cash payments'],
            correctAnswer: 0
          },
          {
            questionText: 'Making bi-weekly instead of monthly loan payments can:',
            options: ['Increase total interest paid', 'Have no effect on total repayment', 'Reduce the loan term by making one extra monthly payment per year', 'Increase the principal balance'],
            correctAnswer: 2
          },
          {
            questionText: 'What is a balance transfer?',
            options: ['Moving funds between bank accounts', 'Moving credit card debt to a card with lower interest rate', 'Transferring a loan to another borrower', 'Converting debt to equity'],
            correctAnswer: 1
          },
          {
            questionText: 'In debt management, "principal" refers to:',
            options: ['The interest portion of your EMI', 'The original loan amount borrowed', 'The penalty for late payment', 'The monthly minimum payment'],
            correctAnswer: 1
          },
          {
            questionText: 'Why is the debt avalanche mathematically superior to the snowball method?',
            options: ['It removes motivational incentives', 'It minimises total interest paid over time', 'It always pays off more debts faster', 'It improves credit scores faster'],
            correctAnswer: 1
          },
          {
            questionText: 'What does TDS (Total Debt Service) ratio mean?',
            options: ['Tax at source on debt payments', 'Percentage of gross income going towards all debt payments', 'Total interest paid in a year', 'Debt balance divided by salary'],
            correctAnswer: 1
          },
          {
            questionText: 'Which strategy helps pay off a home loan faster?',
            options: ['Paying only EMI with no prepayments', 'Making lump-sum prepayments when available', 'Extending the loan tenure', 'Refinancing to a longer term'],
            correctAnswer: 1
          },
          {
            questionText: 'Debt restructuring involves:',
            options: ['Hiring a debt collector', 'Negotiating modified repayment terms with lenders', 'Filing for bankruptcy', 'Transferring debt to family members'],
            correctAnswer: 1
          },
          {
            questionText: 'If you have home loan at 8.5%, car loan at 12%, and credit card at 36%, which should you pay off first using the avalanche method?',
            options: ['Home loan', 'Car loan', 'Credit card', 'All equally'],
            correctAnswer: 2
          }
        ]
      },
      {
        title: 'Advanced Debt & Financial Recovery',
        description: 'Credit rehabilitation, bankruptcy law, and advanced debt optimisation.',
        category: 'debt',
        topic: 'Debt Management',
        topicOrder: 4,
        seriesOrder: 3,
        difficulty: 'hard',
        xpReward: 150,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is the CIBIL score range in India?',
            options: ['300–700', '300–900', '550–850', '600–1000'],
            correctAnswer: 1
          },
          {
            questionText: 'A CIBIL score above which value is generally considered excellent?',
            options: ['650', '700', '750', '900'],
            correctAnswer: 2
          },
          {
            questionText: 'What impact does a loan write-off have on your credit score?',
            options: ['Improves it significantly', 'Has no effect', 'Severely damages it for years', 'Only temporarily lowers it'],
            correctAnswer: 2
          },
          {
            questionText: 'Under the SARFAESI Act in India, banks can:',
            options: ['Issue new loans without approval', 'Seize collateral without a court order after default', 'Write off any loan above ₹10 lakh', 'Offer interest-free restructuring'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the IBC (Insolvency and Bankruptcy Code) primarily designed for?',
            options: ['Providing government loans', 'Time-bound resolution of insolvency and bankruptcy cases', 'Regulating credit card rates', 'Managing income tax disputes'],
            correctAnswer: 1
          },
          {
            questionText: 'In behavioural economics, "debt aversion" causes people to:',
            options: ['Take on excessive debt', 'Avoid loans even when economically beneficial', 'Prefer credit over cash', 'Default on loans intentionally'],
            correctAnswer: 1
          },
          {
            questionText: 'How long does a bad debt record typically stay on credit reports in India?',
            options: ['1 year', '3 years', '7 years', 'Permanently'],
            correctAnswer: 2
          },
          {
            questionText: 'What is a "haircut" in the context of debt settlement?',
            options: ['A fee charged by debt counsellors', 'The reduction in debt amount accepted by a lender in settlement', 'Interest rate reduction', 'Early repayment discount'],
            correctAnswer: 1
          },
          {
            questionText: 'Which of the following best describes a "secured creditor" during bankruptcy?',
            options: ['A creditor with a high credit score', 'A creditor with a claim backed by specific collateral', 'A government-backed lender', 'A creditor owed less than ₹1 lakh'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the most effective long-term strategy to remain debt-free?',
            options: ['Never borrowing money', 'Using only credit cards', 'Maintaining emergency funds and living within means', 'Investing all income in gold'],
            correctAnswer: 2
          }
        ]
      },

      // ═══════════════════════════════════════
      // TOPIC 5: CREDIT & LOANS
      // ═══════════════════════════════════════
      {
        title: 'Credit Card Basics',
        description: 'Understand how credit cards work, rewards, and avoiding the debt trap.',
        category: 'credit',
        topic: 'Credit & Loans',
        topicOrder: 5,
        seriesOrder: 1,
        difficulty: 'easy',
        xpReward: 50,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is a credit card\'s "grace period"?',
            options: ['Time to apply for a credit card', 'Interest-free period between purchase and due date', 'Time allowed to dispute a charge', 'The time before card expiry'],
            correctAnswer: 1
          },
          {
            questionText: 'What happens when you carry a credit card balance over to the next month?',
            options: ['You earn bonus points', 'Interest is charged on the outstanding amount', 'The balance is waived', 'Your credit limit increases'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a credit score primarily based on?',
            options: ['Your income level', 'Your repayment history and credit utilisation', 'Your educational qualifications', 'Your employer'],
            correctAnswer: 1
          },
          {
            questionText: 'Credit utilisation ratio above which percentage negatively impacts your score?',
            options: ['10%', '20%', '30%', '50%'],
            correctAnswer: 2
          },
          {
            questionText: 'Which activity IMPROVES your credit score over time?',
            options: ['Paying bills late occasionally', 'Maxing out credit cards monthly', 'Making all payments on time consistently', 'Opening many new credit accounts at once'],
            correctAnswer: 2
          },
          {
            questionText: 'What is an annual fee on a credit card?',
            options: ['Interest charged on balances', 'Yearly fee charged by the issuer for card membership', 'Penalty for late payment', 'Foreign transaction fee'],
            correctAnswer: 1
          },
          {
            questionText: 'Cash advances on credit cards typically:',
            options: ['Have no fee and low interest', 'Have higher interest rates and immediate interest with no grace period', 'Earn reward points', 'Improve credit score'],
            correctAnswer: 1
          },
          {
            questionText: 'What does "minimum due" on a credit card statement mean?',
            options: ['The full outstanding balance', 'The minimum amount you must pay to avoid a late fee', 'Your credit limit', 'Your monthly spending limit'],
            correctAnswer: 1
          },
          {
            questionText: 'Co-branded credit cards are offered by:',
            options: ['Government banks only', 'Banks partnered with specific brands (airlines, retail)', 'Insurance companies', 'NBFCs exclusively'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the safest credit card payment strategy?',
            options: ['Pay only minimum due each month', 'Pay full outstanding balance before the due date', 'Pay 50% of the balance each month', 'Never use the credit card'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Loan Types & Interest',
        description: 'Home loans, personal loans, interest types, and smart borrowing decisions.',
        category: 'credit',
        topic: 'Credit & Loans',
        topicOrder: 5,
        seriesOrder: 2,
        difficulty: 'medium',
        xpReward: 100,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is the difference between flat rate and reducing balance interest?',
            options: ['Flat rate is always lower', 'Flat rate charges interest on original principal; reducing balance on outstanding balance', 'Reducing balance is only for personal loans', 'They are the same calculation'],
            correctAnswer: 1
          },
          {
            questionText: 'REPO rate is set by:',
            options: ['SEBI', 'Finance Ministry', 'Reserve Bank of India (RBI)', 'Commercial banks collectively'],
            correctAnswer: 2
          },
          {
            questionText: 'How does a home loan EMI change when the repo rate increases?',
            options: ['EMI decreases', 'EMI stays the same', 'EMI increases for floating-rate loans', 'EMI always changes regardless of loan type'],
            correctAnswer: 2
          },
          {
            questionText: 'What is a moratorium period on a loan?',
            options: ['The final 3 months of repayment', 'A waiting period before repayment begins (no EMI required)', 'A penalty-free prepayment window', 'The grace period after default'],
            correctAnswer: 1
          },
          {
            questionText: 'Which factor most significantly affects your loan interest rate?',
            options: ['Your age', 'Your credit score and repayment history', 'Your educational qualification', 'The bank you choose'],
            correctAnswer: 1
          },
          {
            questionText: 'What does LTV (Loan to Value) ratio represent in home loans?',
            options: ['Loan interest as a percentage of home value', 'Maximum loan amount as a percentage of property value', 'Your income relative to property cost', 'Monthly EMI relative to loan tenure'],
            correctAnswer: 1
          },
          {
            questionText: 'Under Section 24 of Income Tax Act, deduction for home loan interest is up to:',
            options: ['₹1 lakh per year', '₹1.5 lakh per year', '₹2 lakh per year', '₹3 lakh per year'],
            correctAnswer: 2
          },
          {
            questionText: 'Personal loans are unsecured, meaning:',
            options: ['They have lower interest rates', 'No collateral is required', 'They cannot be used for travel', 'They require a guarantor'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a co-applicant on a home loan primarily useful for?',
            options: ['Getting better rewards', 'Increasing loan eligibility by combining incomes', 'Avoiding stamp duty', 'Reducing credit checks'],
            correctAnswer: 1
          },
          {
            questionText: 'Which loan type has the lowest interest rate in India overall?',
            options: ['Personal loan', 'Credit card loan', 'Gold loan', 'Home loan'],
            correctAnswer: 3
          }
        ]
      },
      {
        title: 'Credit Mastery & Advanced Borrowing',
        description: 'Credit scoring algorithms, advanced loan strategies, and financial leverage.',
        category: 'credit',
        topic: 'Credit & Loans',
        topicOrder: 5,
        seriesOrder: 3,
        difficulty: 'hard',
        xpReward: 150,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'CIBIL score is calculated based on weights. Which factor has the HIGHEST weight (approximately 35%)?',
            options: ['Length of credit history', 'Types of credit used', 'Payment history', 'Credit enquiries'],
            correctAnswer: 2
          },
          {
            questionText: 'A "hard inquiry" on your credit report occurs when:',
            options: ['You check your own credit score', 'A lender checks your score for a loan application', 'A utility company checks your score', 'You open a savings account'],
            correctAnswer: 1
          },
          {
            questionText: 'What is "credit mixing" and why does it help your credit score?',
            options: ['Combining credit cards from multiple banks for rewards', 'Having a diverse mix of credit types (secured + unsecured) showing management ability', 'Using both debit and credit cards', 'Applying for loans at multiple banks'],
            correctAnswer: 1
          },
          {
            questionText: 'If you are applying for a home loan with an existing personal loan, the lender will primarily assess:',
            options: ['Your marital status', 'Your FOIR (Fixed Obligation to Income Ratio)', 'Your educational background', 'Whether you own a vehicle'],
            correctAnswer: 1
          },
          {
            questionText: 'What is "negative amortisation"?',
            options: ['Paying off debt before maturity', 'When minimum payments don\'t cover interest, causing loan balance to grow', 'A tax benefit on loan repayment', 'Early prepayment penalty'],
            correctAnswer: 1
          },
          {
            questionText: 'Which credit bureau is NOT present in India?',
            options: ['CIBIL (TransUnion)', 'Equifax', 'CRIF High Mark', 'Experian UK'],
            correctAnswer: 3
          },
          {
            questionText: 'What is "leverage" in personal finance?',
            options: ['Using debt to potentially amplify investment returns', 'Negotiating lower interest rates', 'Having multiple income streams', 'A risk management product'],
            correctAnswer: 0
          },
          {
            questionText: 'MCLR (Marginal Cost of Funds Lending Rate) replaced which benchmark?',
            options: ['LIBOR', 'PLR (Prime Lending Rate)', 'SOFR', 'SIBOR'],
            correctAnswer: 1
          },
          {
            questionText: 'In a loan foreclosure, the borrower:',
            options: ['Defaults on the loan', 'Pays off the entire outstanding loan before the tenure ends', 'Gets an extension on repayment', 'Transfers the loan to another bank'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the primary advantage of taking a loan against Fixed Deposit (FD)?',
            options: ['Lower credit score requirement with low interest (FD rate + 1-2%)', 'No repayment required', 'Higher loan amount than FD value', 'Interest-free for the first year'],
            correctAnswer: 0
          }
        ]
      },

      // ═══════════════════════════════════════
      // TOPIC 6: FINANCIAL PLANNING
      // ═══════════════════════════════════════
      {
        title: 'Financial Planning Fundamentals',
        description: 'Learn the building blocks of a sound financial plan for life.',
        category: 'planning',
        topic: 'Financial Planning',
        topicOrder: 6,
        seriesOrder: 1,
        difficulty: 'easy',
        xpReward: 50,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'What is a financial plan?',
            options: ['A list of your expenses', 'A comprehensive strategy for managing income, savings, investments, and goals', 'A government-approved investment account', 'A loan repayment schedule'],
            correctAnswer: 1
          },
          {
            questionText: 'What is net worth?',
            options: ['Your annual income', 'Your savings account balance', 'Total assets minus total liabilities', 'Monthly take-home salary'],
            correctAnswer: 2
          },
          {
            questionText: 'The first step in financial planning is:',
            options: ['Investing in stocks', 'Assessing your current financial situation', 'Getting a credit card', 'Taking out a loan'],
            correctAnswer: 1
          },
          {
            questionText: 'What does "SMART goals" stand for in financial planning?',
            options: ['Specific, Measurable, Achievable, Realistic, Time-bound', 'Saving More And Reducing Tax', 'Smart Money And Reward Tracking', 'Systematic Money Allocation Roadmap Tool'],
            correctAnswer: 0
          },
          {
            questionText: 'Term life insurance is best for:',
            options: ['Growing wealth', 'Building a corpus over time', 'Providing pure life cover at low cost', 'Saving tax only'],
            correctAnswer: 2
          },
          {
            questionText: 'What is the rule of thumb for life insurance coverage?',
            options: ['Cover equal to one year\'s salary', '5× your annual income', '10× your annual income', '20× your net worth'],
            correctAnswer: 2
          },
          {
            questionText: 'Health insurance is important because:',
            options: ['It earns dividends', 'Medical emergencies can deplete savings rapidly', 'It improves credit score', 'It is mandatory by law'],
            correctAnswer: 1
          },
          {
            questionText: 'At what age should you ideally start retirement planning?',
            options: ['40s', '50s', 'As early as possible — in your 20s', 'Only after 60'],
            correctAnswer: 2
          },
          {
            questionText: 'What is a will (testament) in financial planning?',
            options: ['A monthly savings plan', 'A legal document specifying how your assets should be distributed after death', 'An insurance product', 'A government regulation'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the purpose of a power of attorney in personal finance?',
            options: ['To borrow money on behalf of someone', 'To authorise someone to manage your financial affairs', 'To negotiate lower tax rates', 'To open offshore bank accounts'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Tax Planning & Insurance',
        description: 'Understand income tax, deductions, and essential insurance policies.',
        category: 'planning',
        topic: 'Financial Planning',
        topicOrder: 6,
        seriesOrder: 2,
        difficulty: 'medium',
        xpReward: 100,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'Section 80C allows tax deduction up to:',
            options: ['₹50,000', '₹1,00,000', '₹1,50,000', '₹2,00,000'],
            correctAnswer: 2
          },
          {
            questionText: 'The new tax regime (post-2020) eliminated most deductions. Which is still available?',
            options: ['Section 80C', 'Section 80D (health insurance)', 'HRA exemption', 'Section 80C and NPS employer contribution (80CCD(2))'],
            correctAnswer: 3
          },
          {
            questionText: 'What is the additional NPS deduction available under Section 80CCD(1B)?',
            options: ['₹25,000', '₹50,000', '₹75,000', '₹1,00,000'],
            correctAnswer: 1
          },
          {
            questionText: 'Term insurance premiums compared to ULIPs are:',
            options: ['Always higher', 'Significantly lower for the same coverage', 'Identical', 'Not applicable — they serve different purposes only'],
            correctAnswer: 1
          },
          {
            questionText: 'Which insurance policy combines investment with insurance?',
            options: ['Term plan', 'ULIP (Unit Linked Insurance Plan)', 'Health insurance', 'Critical illness rider'],
            correctAnswer: 1
          },
          {
            questionText: 'Capital gains tax is charged on:',
            options: ['Regular salary income', 'Profits from selling assets like stocks, property, or gold', 'Bank interest', 'Rental income only'],
            correctAnswer: 1
          },
          {
            questionText: 'Short-term capital gains (STCG) on equity in India are taxed at:',
            options: ['10%', '15%', '20%', '30%'],
            correctAnswer: 1
          },
          {
            questionText: 'What is HRA (House Rent Allowance) used for in Indian tax planning?',
            options: ['Tax deduction on home loan interest', 'Exemption on rent paid under specific conditions', 'Subsidy for first-time homebuyers', 'Tax on rental income earned'],
            correctAnswer: 1
          },
          {
            questionText: 'Filing income tax returns on time avoids:',
            options: ['Health insurance premium hikes', 'Interest under Section 234A and loss of certain deductions', 'Loan rejections forever', 'CIBIL score drop'],
            correctAnswer: 1
          },
          {
            questionText: 'What is tax harvesting?',
            options: ['Earning income without taxes', 'Strategically booking losses to offset capital gains and reduce tax liability', 'Applying for all available tax deductions', 'Filing for a tax refund'],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Retirement & Estate Planning Mastery',
        description: 'Retirement corpus calculations, estate planning, and legacy wealth creation.',
        category: 'planning',
        topic: 'Financial Planning',
        topicOrder: 6,
        seriesOrder: 3,
        difficulty: 'hard',
        xpReward: 150,
        unlockRequirement: 0,
        isDaily: false,
        questions: [
          {
            questionText: 'To retire at 60 with ₹1 crore/year expenses adjusted for inflation, which formula gives corpus needed?',
            options: ['Corpus = Annual Expenses × 10', 'Corpus = Annual Expenses × 25 (4% withdrawal rule)', 'Corpus = Annual Expenses × 50', 'Corpus = Annual Expenses × 100'],
            correctAnswer: 1
          },
          {
            questionText: 'The "4% rule" for retirement withdrawal assumes:',
            options: ['Withdrawing 4% of savings weekly', 'Withdrawing 4% annually from a balanced portfolio makes it last ~30 years', 'Investing in 4% fixed-return instruments only', 'Earning 4% net of inflation'],
            correctAnswer: 1
          },
          {
            questionText: 'What is "sequence of returns risk" in retirement?',
            options: ['The risk of running out of sequence numbers in banking', 'The danger that poor returns in early retirement years permanently reduce portfolio longevity', 'Risk of not getting returns in sequence', 'Market timing risk in accumulation phase'],
            correctAnswer: 1
          },
          {
            questionText: 'At what age does withdrawal from EPF become fully tax-free in India?',
            options: ['45', '50', '55', '58'],
            correctAnswer: 3
          },
          {
            questionText: 'What is the primary benefit of estate planning?',
            options: ['Maximising inheritance taxes', 'Ensuring orderly transfer of assets and minimising disputes', 'Getting higher returns on investments', 'Qualifying for government subsidies'],
            correctAnswer: 1
          },
          {
            questionText: 'A "nominee" in a financial account is:',
            options: ['The legal heir who inherits per a will', 'A person designated to receive assets in case of account holder\'s death (not necessarily the legal heir)', 'A co-applicant on a loan', 'A financial advisor'],
            correctAnswer: 1
          },
          {
            questionText: 'What is the difference between a nominee and a legal heir?',
            options: ['There is no difference', 'A nominee receives the assets as trustee; legal heirs are the true inheritors per law', 'A nominee always trumps the will', 'Legal heirs are defined only by the government'],
            correctAnswer: 1
          },
          {
            questionText: 'A "living will" or advance directive is used to:',
            options: ['Transfer wealth to heirs while alive', 'Express your healthcare and financial wishes if incapacitated', 'Avoid paying estate taxes', 'Set up a trust fund'],
            correctAnswer: 1
          },
          {
            questionText: 'NPS Tier I account withdrawal at retirement allows tax-free withdrawal of:',
            options: ['25% of corpus', '40% of corpus', '60% of corpus', '100% of corpus'],
            correctAnswer: 2
          },
          {
            questionText: 'Which financial planning concept helps account for the fact that ₹1 received today is worth more than ₹1 in the future?',
            options: ['Compound interest', 'Time Value of Money (TVM)', 'Net Present Value alone', 'Inflation adjustment'],
            correctAnswer: 1
          }
        ]
      }
    ];

    await Quiz.insertMany(quizzes); //pushes entire array into the db
    res.json({ message: `Seeded ${quizzes.length} quizzes successfully (${quizzes.reduce((a, q) => a + q.questions.length, 0)} questions total).` });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Seed failed', error: error.message });
  }
};