import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Lock, Star, Zap, Award, BookOpen, TrendingUp,
  Shield, Trophy, Calendar, ChevronRight, Users,
  CheckCircle, Unlock, Target, CreditCard, PiggyBank,
  BarChart2, AlertTriangle
} from "lucide-react";
import "./Quizzes.css";
import { useAuth } from "../../context/AuthContext";

// Topic icon map keyed by category
const ICON_MAP = {
  budgeting: <BookOpen size={26} />,
  investing: <TrendingUp size={26} />,
  saving: <PiggyBank size={26} />,
  debt: <AlertTriangle size={26} />,
  credit: <CreditCard size={26} />,
  planning: <BarChart2 size={26} />,
  general: <Star size={26} />,
  default: <Star size={26} />,
};

const DIFFICULTY_LABELS = {
  easy: { label: "Easy", className: "badge-easy" },
  medium: { label: "Medium", className: "badge-medium" },
  hard: { label: "Hard", className: "badge-hard" },
};

// Ordered difficulty path
const DIFF_ORDER = ["easy", "medium", "hard"];

export default function QuizDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, completedQuizzes } = useAuth();

  const USER_XP = user?.xp ?? 0;

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/quizzes");
        setQuizzes(data);
      } catch (err) {
        setError("Failed to load quizzes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  // ── Completion & Lock Logic ───────────────────────────────
  const completedIds = useMemo(
    () => new Set(completedQuizzes.map((c) => c.quizId?.toString())),
    [completedQuizzes]
  );

  const isQuizCompleted = (quizId) => completedIds.has(quizId?.toString());

  /**
   * Returns true if this quiz should be LOCKED.
   * Rules:
   *  - Easy: unlocked if topicOrder === 1, OR if ALL quizzes in (topicOrder - 1) are completed
   *  - Medium: locked unless Easy in SAME topic is completed
   *  - Hard:   locked unless Medium in SAME topic is completed
   */
  const computeLockStatus = useMemo(() => {
    // Group non-daily quizzes by topicOrder
    const byTopicOrder = {};
    quizzes.filter(q => !q.isDaily).forEach((q) => {
      if (!byTopicOrder[q.topicOrder]) byTopicOrder[q.topicOrder] = [];
      byTopicOrder[q.topicOrder].push(q);
    });

    // Check if ALL quizzes in a topicOrder are completed
    const isTopicFullyCompleted = (topicOrder) => {
      const topicQuizzes = byTopicOrder[topicOrder] || [];
      return topicQuizzes.length > 0 && topicQuizzes.every(q => completedIds.has(q._id?.toString()));
    };

    // Build a lock map: quizId → boolean
    const lockMap = {};
    quizzes.forEach((quiz) => {
      if (quiz.isDaily) { lockMap[quiz._id] = false; return; }

      const topicOrder = quiz.topicOrder || 1;
      const topicQuizzes = byTopicOrder[topicOrder] || [];

      // Check topic unlocked
      const topicUnlocked = topicOrder === 1 || isTopicFullyCompleted(topicOrder - 1);

      if (!topicUnlocked) {
        lockMap[quiz._id] = true;
        return;
      }

      // Within the topic, check difficulty progression
      if (quiz.difficulty === 'easy') {
        lockMap[quiz._id] = false;
      } else if (quiz.difficulty === 'medium') {
        const easyQuiz = topicQuizzes.find(q => q.difficulty === 'easy');
        lockMap[quiz._id] = easyQuiz ? !completedIds.has(easyQuiz._id?.toString()) : false;
      } else if (quiz.difficulty === 'hard') {
        const mediumQuiz = topicQuizzes.find(q => q.difficulty === 'medium');
        lockMap[quiz._id] = mediumQuiz ? !completedIds.has(mediumQuiz._id?.toString()) : false;
      } else {
        lockMap[quiz._id] = false;
      }
    });

    return lockMap;
  }, [quizzes, completedIds]);

  const isLocked = (quiz) => computeLockStatus[quiz._id] ?? false;

  const getIcon = (cat) => ICON_MAP[cat?.toLowerCase()] || ICON_MAP.default;
  const getDiff = (d) => DIFFICULTY_LABELS[d?.toLowerCase()] || { label: d, className: "badge-easy" };

  // Separate daily from regular quizzes
  const dailyQuiz = quizzes.find((q) => q.isDaily);
  const regularQuizzes = quizzes.filter((q) => !q.isDaily);

  // Check all quizzes completed (for "Unlock More" section)
  const allCompleted = regularQuizzes.length > 0 &&
    regularQuizzes.every(q => completedIds.has(q._id?.toString()));

  // Group by topicOrder → then topic name
  const groupedByTopic = useMemo(() => {
    const map = {};
    regularQuizzes.forEach((quiz) => {
      const order = quiz.topicOrder || 1;
      if (!map[order]) map[order] = { topic: quiz.topic, category: quiz.category, quizzes: [] };
      map[order].quizzes.push(quiz);
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([order, val]) => ({ topicOrder: Number(order), ...val }));
  }, [regularQuizzes]);

  // ── Quiz Card Component ───────────────────────────────────
  const QuizCard = ({ quiz }) => {
    const locked = isLocked(quiz);
    const completed = isQuizCompleted(quiz._id);
    const diff = getDiff(quiz.difficulty);

    return (
      <div className={`quiz-card ${locked ? "quiz-card--locked" : ""} ${completed ? "quiz-card--completed" : ""}`}>
        {locked && (
          <div className="lock-overlay">
            <Lock size={18} />
            <span>Complete previous quiz to unlock</span>
          </div>
        )}
        {completed && !locked && (
          <div className="completed-badge-corner">
            <CheckCircle size={16} />
            <span>Done</span>
          </div>
        )}
        <div className="quiz-card-icon">{getIcon(quiz.category)}</div>
        <div className="quiz-card-body">
          <div className="quiz-card-meta">
            <span className={`difficulty-badge ${diff.className}`}>{diff.label}</span>
            <span className="xp-reward"><Zap size={12} />{quiz.xpReward} XP</span>
            {quiz.seriesOrder && (
              <span className="series-badge">#{quiz.seriesOrder}</span>
            )}
          </div>
          <h3 className="quiz-card-title">{quiz.title}</h3>
          <p className="quiz-card-desc">{quiz.description}</p>
        </div>
        <button
          className={`btn-start-quiz ${locked ? "btn-start-quiz--locked" : ""} ${completed ? "btn-start-quiz--completed" : ""}`}
          disabled={locked}
          onClick={() => !locked && navigate(`/quiz/${quiz._id}`)}
        >
          {locked
            ? <><Lock size={14} /> Locked</>
            : completed
              ? <><CheckCircle size={14} /> Retry Quiz</>
              : "Start Quiz →"}
        </button>
      </div>
    );
  };

  // ── Topic Progress Bar ────────────────────────────────────
  const TopicProgress = ({ topicQuizzes }) => {
    const total = topicQuizzes.length;
    const done = topicQuizzes.filter(q => isQuizCompleted(q._id)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
      <div className="topic-progress-row">
        <div className="topic-progress-bar">
          <div className="topic-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="topic-progress-label">{done}/{total} completed</span>
      </div>
    );
  };

  return (
    <div className="quiz-dashboard">
      {/* ── Stats Banner ── */}
      <div className="stats-banner">
        <div className="stats-banner-inner">
          <div className="stats-banner-title">
            <Trophy size={22} className="stats-title-icon" />
            <span>Your Learning Progress</span>
          </div>
          <div className="stats-cards-row">
            <div className="stat-card">
              <span className="stat-label">Total XP</span>
              <div className="stat-value-row">
                <Zap size={16} className="xp-icon" />
                <span className="stat-value stat-value--xp">{USER_XP} XP</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completed</span>
              <div className="stat-value-row">
                <CheckCircle size={16} className="xp-icon" style={{ color: '#b8e07a' }} />
                <span className="stat-value stat-value--xp">
                  {completedQuizzes.length}/{regularQuizzes.length} Quizzes
                </span>
              </div>
            </div>
            {/* <div className="stat-card">
              <span className="stat-label">Badges</span>
              <div className="badges-placeholder">
                <Award size={20} className={USER_XP >= 100 ? "badge-icon badge-icon--earned" : "badge-icon badge-icon--locked"} />
                <Award size={20} className={USER_XP >= 500 ? "badge-icon badge-icon--earned" : "badge-icon badge-icon--locked"} />
                <Award size={20} className={USER_XP >= 1000 ? "badge-icon badge-icon--earned" : "badge-icon badge-icon--locked"} />
              </div>
            </div> */}
            <button className="stat-card stat-card--leaderboard" onClick={() => navigate("/leaderboard")}>
              <Users size={20} className="leaderboard-icon" />
              <span className="stat-label" style={{ color: "#b8e07a" }}>Leaderboard</span>
              <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="quiz-loading" style={{ marginTop: 60 }}>
          <div className="spinner" />
          <p>Loading quizzes…</p>
        </div>
      )}
      {error && (
        <div className="quiz-error" style={{ marginTop: 60 }}>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Daily Quiz Banner ── */}
          {dailyQuiz && (
            <div className="quiz-section">
              <div className="daily-quiz-banner">
                <div className="daily-quiz-left">
                  <Calendar size={32} className="daily-icon" />
                  <div>
                    <div className="daily-quiz-label">🌟 Daily Challenge</div>
                    <div className="daily-quiz-title">{dailyQuiz.title}</div>
                    <div className="daily-quiz-sub">{dailyQuiz.description}</div>
                  </div>
                </div>
                <div className="daily-quiz-right">
                  <div className="daily-xp-badge">
                    <Zap size={16} />
                    +{dailyQuiz.xpReward + 50} XP today
                  </div>
                  <button
                    className="btn-daily-start"
                    onClick={() => navigate(`/quiz/${dailyQuiz._id}`)}
                  >
                    Play Now →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Topics (sequential, topicOrder 1→6) ── */}
          {groupedByTopic.map(({ topicOrder, topic, category, quizzes: topicQuizzes }, tIdx) => {
            // Is this topic unlocked? Topic 1 always yes; otherwise all quizzes of prev topic done
            const prevTopicQuizzes = tIdx > 0 ? groupedByTopic[tIdx - 1].quizzes : [];
            const topicUnlocked = topicOrder === 1 || prevTopicQuizzes.every(q => isQuizCompleted(q._id));
            const topicCompleted = topicQuizzes.every(q => isQuizCompleted(q._id));

            return (
              <div key={topicOrder} className={`quiz-section ${!topicUnlocked ? 'quiz-section--locked' : ''}`}>
                <h2 className="quiz-section-title category-title">
                  <span className="category-icon-sm">{getIcon(category)}</span>
                  <span className="topic-order-num">Topic {topicOrder}</span>
                  {topic}
                  {!topicUnlocked && <Lock size={16} className="topic-lock-icon" />}
                  {topicCompleted && <CheckCircle size={16} className="topic-check-icon" />}
                </h2>

                {!topicUnlocked && (
                  <div className="topic-locked-banner">
                    <Lock size={18} />
                    <span>Complete all quizzes in <strong>Topic {topicOrder - 1}: {groupedByTopic[tIdx - 1]?.topic}</strong> to unlock this topic.</span>
                  </div>
                )}

                <TopicProgress topicQuizzes={topicQuizzes} />

                {/* Difficulty columns: Easy → Medium → Hard */}
                <div className="quiz-series-row">
                  {DIFF_ORDER.map((diff) => {
                    const diffQuizzes = topicQuizzes.filter(q => q.difficulty === diff);
                    if (diffQuizzes.length === 0) return null;
                    return (
                      <div key={diff} className="diff-column">
                        <div className={`diff-column-header diff-header-${diff}`}>
                          {diff.toUpperCase()}
                        </div>
                        <div className="diff-quiz-list">
                          {diffQuizzes.map(quiz => (
                            <QuizCard key={quiz._id} quiz={quiz} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Unlock More Quizzes CTA ── */}
          <div className={`quiz-section unlock-more-section ${!allCompleted ? 'unlock-more--disabled' : 'unlock-more--active'}`}>
            <div className="unlock-more-card">
              <div className="unlock-more-icon">
                {allCompleted ? <Unlock size={36} /> : <Lock size={36} />}
              </div>
              <div className="unlock-more-content">
                <h3 className="unlock-more-title">
                  {allCompleted ? "🎉 You've Mastered All Topics!" : "Unlock More Quizzes"}
                </h3>
                <p className="unlock-more-desc">
                  {allCompleted
                    ? "Amazing! You've completed all 6 topics. More advanced quizzes are coming soon — check back later!"
                    : `Complete all ${regularQuizzes.length} quizzes across 6 topics to unlock bonus content.`}
                </p>
                {!allCompleted && (
                  <div className="unlock-more-progress">
                    <div className="unlock-progress-bar">
                      <div
                        className="unlock-progress-fill"
                        style={{ width: `${regularQuizzes.length > 0 ? (completedQuizzes.length / regularQuizzes.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="unlock-progress-label">
                      {completedQuizzes.length} / {regularQuizzes.length} quizzes completed
                    </span>
                  </div>
                )}
              </div>
              <Target size={20} className="unlock-more-target-icon" />
            </div>
          </div>

          {quizzes.length === 0 && (
            <div className="quiz-empty" style={{ marginTop: 60 }}>
              <BookOpen size={40} />
              <p>No quizzes yet. <button className="btn-seed" onClick={async () => {
                try {
                  await axios.post('/api/quizzes/seed');
                  window.location.reload();
                } catch (err) {
                  alert('Seed failed. Ensure backend is running.');
                }
              }}>Seed DB →</button></p>
            </div>
          )}
        </>
      )}
    </div>
  );
}