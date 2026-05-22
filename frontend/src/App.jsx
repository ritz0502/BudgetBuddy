// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import HomePage from './components/HomePage';
import QuizDashboard from './components/quizzes/Quizdashboard';
import QuizActive from './components/quizzes/Quizactive';
import QuizResults from './components/quizzes/Quizresults';
import Leaderboard from './components/quizzes/Leaderboard';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TrackerPage from './pages/TrackerPage';
import StocksPage from './pages/StocksPage';
import ScholarshipsPage from './pages/ScholarshipsPage';

// ── Protected Route ────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  return user ? children : <Navigate to={redirectTo} replace />;
};

// ── Smart Home ──────────────────────────────────────────────────────────────────
// Logged-in users  → /dashboard (personalised)
// Guests / visitors → old marketing HomePage
const SmartHome = () => {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <HomePage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes WITH Navbar/Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<SmartHome />} />

            {/* Protected pages */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <TrackerPage />
                </ProtectedRoute>
              }
            />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/scholarships" element={<ScholarshipsPage />} />

            {/* Quiz routes */}
            <Route path="/quizzes" element={<QuizDashboard />} />
            <Route path="/quiz/results" element={<QuizResults />} />
            <Route path="/quiz/:id" element={<QuizActive />} />
          </Route>

          {/* Routes WITHOUT Navbar */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;