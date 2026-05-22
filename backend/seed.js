// backend/seed.js
require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const connectDB = require('./config/db'); // Assuming db.js is in your config folder
const Quiz = require('./models/Quiz'); // Import the Quiz model we made earlier

// 1. Define your starting data
const sampleQuizzes = [
  {
    title: "Budgeting Basics",
    description: "Learn the 50/30/20 rule and basic money management.",
    category: "budgeting",
    difficulty: "easy",
    xpReward: 100,
    unlockRequirement: 0,
    questions: [
      {
        questionText: "What does the 50 stand for in the 50/30/20 rule?",
        options: ["Wants", "Needs", "Savings", "Taxes"],
        correctAnswer: 1 // "Needs" is index 1 of the options array
      },
      {
        questionText: "Which of these is considered a 'Want'?",
        options: ["Rent", "Groceries", "Netflix Subscription", "Electricity Bill"],
        correctAnswer: 2
      }
    ]
  },
  {
    title: "Intro to Investing",
    description: "Understand the basics of stocks, bonds, and compounding.",
    category: "investing",
    difficulty: "medium",
    xpReward: 250,
    unlockRequirement: 50, // Locked until user gets 50 XP
    questions: [
      {
        questionText: "What is a stock?",
        options: ["A loan to a company", "A slice of ownership in a company", "A government bond", "A type of savings account"],
        correctAnswer: 1
      }
    ]
  }
];

// 2. Function to push data to MongoDB
const seedDatabase = async () => {
  try {
    await connectDB(); // Connect to MongoDB

    console.log("Clearing old quizzes...");
    await Quiz.deleteMany(); // Deletes all existing quizzes so we don't get duplicates

    console.log("Inserting new quizzes...");
    await Quiz.insertMany(sampleQuizzes); // Injects our array above

    console.log("✅ Database seeded successfully!");
    process.exit(); // Closes the script
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();