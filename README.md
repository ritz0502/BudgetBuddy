# BudgetBuddy 💰
### Smart Student Finance Platform

A full-stack web application that helps college students track expenses, build financial literacy, and develop healthy money habits — with smart features like OCR receipt scanning, AI-powered category suggestions, and gamified quizzes.

## Features

### ✅ Built & Working

**Authentication**
- JWT access tokens (15min expiry) + httpOnly refresh token rotation (7 days)
- bcrypt password hashing
- Protected routes with auto-silent refresh on page load

**Personalized Dashboard**
- Real-time financial snapshot: current balance, monthly expenses, Quiz XP
- Spending by category donut chart
- Recent transactions feed
- Monthly spending overview bar chart (last 6 months)

**Smart Expense Tracker**
- Full CRUD for income and expense transactions
- Category budget limits with visual progress bars (green → amber → red)
- Google Cloud Vision OCR — photograph a receipt and auto-extract merchant, amount, and date
- Cloudinary receipt image storage linked to each transaction
- Subscription detection via MongoDB aggregation (flags recurring charges)
- Month navigation to browse transaction history
- Daily spending bar chart + category breakdown pie chart
- Redis caching on monthly summary with automatic cache invalidation

**Gamified Quiz Engine**
- Topic-based quizzes (Investing, Credit Scores, Tax Basics, and more)
- XP rewards, daily bonuses, level progression
- Progressive topic unlocking — harder quizzes unlock as you level up
- Server-side answer stripping to prevent client-side cheating

---

### 🔄 In Progress

**ML Microservices (Python Flask)**
- Naive Bayes auto-category tagger — type "Zomato" and category auto-suggests "Food"
- Online learning feedback loop — user corrections retrain the model weekly
- scikit-learn Linear Regression spend predictor trained on 90 days of per-user data
- Dashboard forecast card: "You're predicted to overspend Food by ₹800 next month"

**Paper Trading Simulator**
- Finnhub WebSocket → Node.js → Socket.io real-time price pipeline
- Mock ₹10,000 portfolio per user — buy and sell with live prices
- Bull.js job queue for portfolio valuation refresh
- Portfolio performance line chart

**Scholarship Finder**
- Puppeteer scraper → MongoDB Atlas
- Full-text search with MongoDB Atlas Search (Lucene)
- Bookmark scholarships to profile
- Web Push API deadline alerts

**Phase 5 Additions**
- Student loan EMI + grace period calculator
- Savings goals with ML-powered "on track?" projections
- Low-balance push notifications

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Caching | Redis (ioredis) |
| ML Service | Python, Flask, scikit-learn, pandas |
| Auth | JWT, bcrypt, httpOnly cookies |
| File Storage | Cloudinary |
| OCR | Google Cloud Vision API |
| Real-time | Socket.io, Finnhub WebSocket |
| Job Queue | Bull.js |
| Scraping | Puppeteer |
| Search | MongoDB Atlas Search |
| DevOps | Docker Compose, GitHub Actions |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│  Node / Express  │────▶│  MongoDB Atlas  │
│   (Port 5173)   │     │   (Port 5000)    │     └─────────────────┘
└─────────────────┘     │                  │     ┌─────────────────┐
                        │                  │────▶│      Redis      │
                        │                  │     └─────────────────┘
                        │                  │     ┌─────────────────┐
                        │                  │────▶│  Python Flask   │
                        └──────────────────┘     │  ML Service     │
                                                 │  (Port 5001)    │
                                                 └─────────────────┘
```

## Project Structure

```
BudgetBuddy/
├── backend/
│   ├── config/          # DB, Redis, Cloudinary setup
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── services/        # OCR, external APIs
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level pages
│   │   ├── context/     # Auth context
│   │   └── App.jsx
├── ml-service/          # Python Flask (coming soon)
│   ├── app.py
│   ├── classifier/
│   └── predictor/
├── docker-compose.yml
└── README.md
```
