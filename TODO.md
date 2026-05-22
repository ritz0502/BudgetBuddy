# BudgetBuddy security fixes - TODO

- [x] Remove console.log("MONGO_URI:", process.env.MONGO_URI) from backend/server.js
- [x] Fix CORS configuration in backend/server.js to use CLIENT_URL with credentials
- [x] Add express-validator dependency to backend
- [x] Create backend/middleware/validators/authValidators.js with signup/login validators
- [x] Wire validators into backend/routes/authRoutes.js (keep routes working)
- [x] Ensure authController keeps existing signup/login logic intact
- [x] Build frontend to ensure no breakage
- [ ] Add CLIENT_URL to root .env (cannot be edited via tool; user must set it locally)
- [x] Provide final report: files changed, what to add to .env, and command to run tests

