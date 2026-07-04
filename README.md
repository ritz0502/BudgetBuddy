# BudgetBuddy 💰
### Smart Student Finance Platform

A full-stack web application that helps college students track expenses, build financial literacy, and develop healthy money habits — featuring OCR receipt scanning, AI-powered category suggestions, a paper trading simulator, a scholarship finder, and gamified financial quizzes.

---

## Features

### ✅ Authentication & Security
- JWT access tokens (15 min expiry) + httpOnly refresh token rotation (7 days)
- bcrypt password hashing
- `express-validator` input validation on all auth routes
- Protected routes with silent token refresh on page load
- Secure CORS with `CLIENT_URL` environment variable

---

### ✅ Personalized Dashboard
- Real-time financial snapshot: current balance, monthly expenses, Quiz XP
- Spending by category donut chart
- Recent transactions feed
- Monthly spending overview bar chart (last 6 months)
- ML spend prediction card: *"You're predicted to overspend Food by ₹800 next month"*

---

### ✅ Smart Expense Tracker
- Full CRUD for income and expense transactions
- Category budget limits with visual progress bars (green → amber → red)
- **Google Cloud Vision OCR** — photograph a receipt and auto-extract merchant, amount, and date
- Cloudinary receipt image storage linked to each transaction
- Subscription detection via MongoDB aggregation (flags recurring charges)
- Month navigation to browse transaction history
- Daily spending bar chart + category breakdown pie chart
- Redis caching on monthly summaries with automatic cache invalidation

---

### ✅ ML Microservices (Python / Flask)
- **Naive Bayes auto-category tagger** — type "Zomato" → category auto-suggests "Food"
- Online learning feedback loop — user corrections retrain the model via a weekly cron job
- **Linear Regression spend predictor** trained on 90 days of per-user data
- Classifier feedback model stored in `ml-service/models/`

---

### ✅ Gamified Quiz Engine
- Topic-based quizzes (Investing, Credit Scores, Tax Basics, and more)
- XP rewards, daily bonuses, and level progression
- Progressive topic unlocking — harder quizzes unlock as you level up
- Server-side answer stripping to prevent client-side cheating
- Leaderboard page

---

### ✅ InvestLab — Paper Trading Simulator
- **Finnhub WebSocket → Node.js → Redis Pub/Sub → Socket.io** real-time price pipeline
- Mock ₹10,000 portfolio per user — buy and sell at live prices
- Holdings table, trade history, watchlist
- Portfolio performance line chart & allocation pie chart
- **BullMQ** job queue for periodic portfolio valuation refresh
- Scheduled portfolio snapshots (BullMQ + snapshot worker/scheduler)
- **Portfolio Health Card** — concentration risk, readiness score
- **Future Wealth Planner** — compound interest projections
- **Gemini AI Coach** — powered by `@google/genai`, gives personalised investment advice based on portfolio & XP
- **Educational Insights** — contextual finance lessons inside the simulator
- **Achievement Showcase** — milestone badges for trading activity
- **InvestLab XP** — separate XP track for trading milestones
- **Investment Readiness Engine** — scores user readiness based on quiz XP, portfolio diversity, and activity

---

### ✅ Scholarship Finder
- Puppeteer scraper → MongoDB Atlas
- Full-text search with MongoDB Atlas Search (Lucene)
- Bookmark scholarships to your profile
- **Web Push API** deadline alerts via `alertService`
- Scholarship alert cron job for upcoming deadlines

---

### ✅ Notifications System
- In-app notification bell (real-time badge)
- Push notification subscription management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 7, Recharts, Lucide React, Spline |
| Backend | Node.js, Express.js 5 |
| Database | MongoDB Atlas, Mongoose, mongoose-paginate-v2 |
| Caching | Redis (ioredis), Redis Pub/Sub |
| ML Service | Python 3, Flask, scikit-learn, pandas |
| Auth | JWT, bcryptjs, httpOnly cookies, express-validator |
| File Storage | Cloudinary, Multer |
| OCR | Google Cloud Vision API |
| AI Coach | Google Gemini API (`@google/genai`) |
| Real-time | Socket.io, Finnhub WebSocket |
| Job Queue | BullMQ |
| Scraping | Puppeteer |
| Search | MongoDB Atlas Search (Lucene) |
| Push Alerts | Web Push API |
| DevOps | Docker Compose |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│  Node / Express  │────▶│  MongoDB Atlas  │
│   (Port 5173)   │◀────│   (Port 5000)    │     └─────────────────┘
└─────────────────┘     │                  │     ┌─────────────────┐
    Socket.io client    │                  │────▶│  Redis          │
                        │                  │     │  (cache+pubsub) │
                        │                  │     └─────────────────┘
                        │                  │     ┌─────────────────┐
                        │                  │────▶│  Python Flask   │
                        └──────────────────┘     │  ML Service     │
                                │                │  (Port 5001)    │
                          Finnhub WS             └─────────────────┘
                          BullMQ Workers
                          Gemini API
                          Google Vision API
                          Cloudinary
```

---

## Project Structure

```
BudgetBuddy/
├── backend/
│   ├── config/              # DB, Redis, Cloudinary, Redis Pub/Sub setup
│   ├── controllers/         # Route handlers (auth, quiz, tracker, investlab, etc.)
│   ├── jobs/                # Cron jobs (retrainJob, scholarshipAlertJob, snapshotJob)
│   ├── middleware/          # Auth middleware, error handling, validators
│   │   └── validators/      # express-validator schemas
│   ├── models/              # Mongoose schemas (User, Transaction, Quiz, Portfolio,
│   │                        #   Trade, Scholarship, Notification, InvestLabXP, etc.)
│   ├── queues/              # BullMQ queue definitions
│   ├── routes/              # Express routers
│   ├── scripts/             # One-off utility scripts
│   ├── services/            # OCR, Gemini AI, Finnhub, Readiness Engine,
│   │                        #   Portfolio Valuation, XP, Subscription detection, Alerts
│   ├── workers/             # BullMQ workers (snapshotWorker)
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── dashboard/       # Dashboard widgets
│       │   ├── investlab/       # InvestLab UI (18 components)
│       │   │   ├── AICoachCard.jsx
│       │   │   ├── FutureWealthPlanner.jsx
│       │   │   ├── PortfolioHealthCard.jsx
│       │   │   ├── ReadinessCard.jsx
│       │   │   └── ...
│       │   ├── quizzes/         # Quiz UI (dashboard, active, results, leaderboard)
│       │   ├── scholarships/    # Scholarship UI
│       │   ├── tracker/         # Expense tracker UI
│       │   ├── Navbar.jsx
│       │   ├── NotificationBell.jsx
│       │   └── HomePage.jsx
│       ├── context/             # AuthContext
│       ├── hooks/               # Custom React hooks
│       ├── pages/               # Route-level pages
│       │   ├── DashboardPage.jsx
│       │   ├── TrackerPage.jsx
│       │   ├── InvestLabPage.jsx
│       │   └── ScholarshipsPage.jsx
│       └── App.jsx
├── ml-service/
│   ├── app.py               # Flask server (classify + predict endpoints)
│   ├── train.py             # Initial model training script
│   ├── predictor/           # Linear Regression predictor module
│   ├── models/              # Persisted scikit-learn model files
│   ├── data/                # Training data
│   └── requirements.txt
├── docker-compose.yml       # Backend + Redis + ML service
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Python 3.10+
- MongoDB (local or Atlas)
- Redis (local or via Docker)
- Docker Desktop (optional, for containerised dev)

### Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/budget_buddy_db

# JWT
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=./backend/credentials/service-account.json

# Gemini AI
GEMINI_API_KEY=

# Finnhub (real-time stock prices)
FINNHUB_API_KEY=

# CORS
CLIENT_URL=http://localhost:5173

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

---

### Running Locally (without Docker)

```bash
# 1. Install root-level dependencies
npm install

# 2. Start the backend
cd backend
npm install
npm run dev          # runs on http://localhost:5000

# 3. Start the ML service
cd ml-service
pip install -r requirements.txt
python train.py      # train models first
python app.py        # runs on http://localhost:5001

# 4. Start the frontend
cd frontend
npm install
npm run dev          # runs on http://localhost:5173
```

### Running with Docker (Backend + Redis + ML)

```bash
docker-compose up --build
# Then start the frontend separately:
cd frontend && npm run dev
```

> **Note:** MongoDB is NOT included in Docker Compose — run it locally or use MongoDB Atlas.

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/refresh` | Silent token refresh |
| GET | `/api/transactions` | List transactions (with month filter) |
| POST | `/api/transactions` | Add a transaction (supports OCR upload) |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/budgets` | Get category budgets |
| PUT | `/api/budgets` | Set category budget limits |
| GET | `/api/quizzes` | List available quiz topics |
| POST | `/api/quizzes/:id/submit` | Submit quiz answers |
| GET | `/api/investlab/portfolio` | Get portfolio + holdings |
| POST | `/api/investlab/buy` | Buy a stock |
| POST | `/api/investlab/sell` | Sell a stock |
| GET | `/api/investlab/coach` | Get Gemini AI coaching message |
| GET | `/api/scholarships` | Search & list scholarships |
| POST | `/api/scholarships/:id/bookmark` | Bookmark a scholarship |
| GET | `/api/notifications` | List notifications |
| POST | `/api/classify` | ML category classification |
| GET | `/api/predict` | ML spend prediction |
