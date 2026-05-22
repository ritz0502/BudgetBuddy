import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Zap, Trophy, Star, RotateCcw, Home, CheckCircle, XCircle } from "lucide-react";
import "./Quizzes.css";

function ScoreCircle({ score, total }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const getGrade = () => {
    if (pct >= 90) return { label: "Outstanding!", className: "grade-outstanding" };
    if (pct >= 70) return { label: "Great Job!", className: "grade-great" };
    if (pct >= 50) return { label: "Good Effort!", className: "grade-good" };
    return { label: "Keep Practising!", className: "grade-keep-going" };
  };

  const grade = getGrade();
  return (
    <div className="score-circle-wrapper">
      <svg className="score-ring" viewBox="0 0 128 128" width="128" height="128">
        <circle cx="64" cy="64" r={radius} className="score-ring-track" />
        <circle
          cx="64" cy="64" r={radius}
          className="score-ring-fill"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-ring-pct">{pct}%</span>
      </div>
      <span className={`grade-badge ${grade.className}`}>{grade.label}</span>
    </div>
  );
}

export default function QuizResults() {
  const location = useLocation();
  const navigate = useNavigate();

  //reading data passed from quiz active page via navigate() after quiz submission. This includes the user's score, total questions, XP earned, quiz title, and answer details for review.
  const {
    score = 0,
    total = 0,
    xpEarned = 0,
    quizTitle = "Quiz",
    answerDetails = [],
    quizId = null
  } = location.state || {};

  // ── Hide navbar on results page too ───────────────────────────────
  useEffect(() => {
    document.body.classList.add("quiz-mode");
    return () => document.body.classList.remove("quiz-mode");
  }, []);

  const stars = total > 0 ? Math.ceil((score / total) * 3) : 0;

  return (
    <div className="results-wrapper">
      <div className="results-container">
        {/* Confetti */}
        <div className="confetti-field" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className={`confetti-dot confetti-dot--${(i % 5) + 1}`} />
          ))}
        </div>

        <div className="results-trophy"><Trophy size={40} /></div>
        <h1 className="results-heading">Quiz Complete!</h1>
        {quizTitle && <p className="results-quiz-name">{quizTitle}</p>}

        <ScoreCircle score={score} total={total} />

        <p className="results-score-text">
          You scored <strong>{score}</strong> out of <strong>{total}</strong>
        </p>

        {/* Stars */}
        <div className="results-stars">
          {[1, 2, 3].map(s => (
            <Star
              key={s} size={28}
              className={s <= stars ? "result-star result-star--earned" : "result-star result-star--empty"}
            />
          ))}
        </div>

        {/* XP Banner */}
        <div className="xp-earned-banner">
          <Zap size={22} className="xp-earned-icon" />
          <div>
            <span className="xp-earned-amount">+{xpEarned} XP</span>
            <span className="xp-earned-label">Earned</span>
          </div>
        </div>

        {/* ── Answer Breakdown ── */}
        {answerDetails && answerDetails.length > 0 && (
          <div className="results-breakdown">
            <h3 className="breakdown-title">Answer Review</h3>
            {answerDetails.map((detail, idx) => (
              <div key={idx} className={`result-item ${detail.isCorrect ? "result-item--correct" : "result-item--wrong"}`}>
                <div className="result-item-header">
                  <span className="result-item-num">Q{idx + 1}</span>
                  {detail.isCorrect
                    ? <CheckCircle size={16} className="result-icon-correct" />
                    : <XCircle size={16} className="result-icon-wrong" />}
                </div>
                <p className="result-item-question">{detail.questionText}</p>
                <div className="result-item-answers">
                  <span className={`result-answer-tag ${detail.isCorrect ? "result-answer-tag--correct" : "result-answer-tag--wrong"}`}>
                    Your answer: {detail.userAnswer}
                  </span>
                  {!detail.isCorrect && (
                    <span className="result-answer-tag result-answer-tag--correct">
                      Correct: {detail.correctAnswer}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="results-actions">
          <button className="btn-results-home" onClick={() => navigate("/quizzes")}>
            <Home size={16} /> Return to Learning Hub
          </button>
          <button className="btn-results-retry" onClick={() => quizId ? navigate(`/quiz/${quizId}`) : navigate('/quizzes')}>
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
}