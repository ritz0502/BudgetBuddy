import React from 'react';
import { Calculator, TrendingUp, CreditCard, PiggyBank, Book, Award } from 'lucide-react';

const QuizPage = () => {
  const quizzes = [
    {
      icon: <PiggyBank size={40} />,
      title: "Budgeting Basics",
      description: "Learn the essentials of budgeting and how to manage your finances effectively.",
      difficulty: "Beginner"
    },
    {
      icon: <TrendingUp size={40} />,
      title: "Investing 101",
      description: "Understand the basics of investing and how to grow your wealth over time.",
      difficulty: "Intermediate"
    },
    {
      icon: <CreditCard size={40} />,
      title: "Credit Scores Explained",
      description: "Discover what affects your credit score and why it's important.",
      difficulty: "Beginner"
    },
    {
      icon: <Calculator size={40} />,
      title: "Financial Planning",
      description: "Master the art of long-term financial planning and goal setting.",
      difficulty: "Advanced"
    },
    {
      icon: <Book size={40} />,
      title: "Student Loans Guide",
      description: "Everything you need to know about student loans and repayment strategies.",
      difficulty: "Intermediate"
    },
    {
      icon: <Award size={40} />,
      title: "Scholarship Strategies",
      description: "Learn how to find and apply for scholarships successfully.",
      difficulty: "Beginner"
    }
  ];

  const resourceLinks = [
    "Investment Guide for Beginners",
    "Complete Budgeting Handbook",
    "Credit Score Improvement Tips",
    "Student Financial Aid Resources",
    "Scholarship Application Templates",
    "Emergency Fund Building Guide",
    "Tax Tips for Students",
    "Side Hustle Ideas for Students",
    "Money Management Apps Review",
    "Financial Planning Worksheets",
    "Stock Market Basics",
    "Retirement Planning 101",
    "Debt Management Strategies",
    "Personal Finance Books List",
    "Financial Literacy Courses"
  ];

  return (
    <main>
      {/* Quiz Hero Section */}
      <section className="quiz-hero">
        <div className="container">
          <h1>Financial Literacy Quizzes</h1>
          <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            Test your knowledge and learn about personal finance through our interactive quizzes
          </p>
        </div>
      </section>

      {/* Quizzes Grid */}
      <section style={{ padding: '40px 0' }}>
        <div className="container">
          <div className="quiz-grid">
            {quizzes.map((quiz, index) => (
              <div key={index} className="quiz-card">
                <div style={{ color: '#7cb342', marginBottom: '1rem' }}>
                  {quiz.icon}
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '1rem'
                }}>
                  <span style={{ 
                    background: '#e8f5e8', 
                    color: '#2d5016', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>
                    {quiz.difficulty}
                  </span>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    Start Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Resources Section */}
      <section className="resources-links">
        <div className="container">
          <h2 className="section-title">Financial Resources</h2>
          <p style={{ 
            textAlign: 'center', 
            marginBottom: '3rem', 
            color: '#666',
            fontSize: '1.1rem'
          }}>
            Explore our curated collection of financial resources and guides
          </p>
          <ul className="resources-list">
            {resourceLinks.map((link, index) => (
              <li key={index}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};

export default QuizPage;