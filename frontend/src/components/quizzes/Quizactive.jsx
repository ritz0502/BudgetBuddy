import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Zap, Check, Circle, AlertTriangle } from 'lucide-react';
import "./Quizzes.css";

// ── Exit Confirmation Modal ────────────────────────────────────────────────────
function ExitModal({ onStay, onLeave }) {
  return (
    <div className="exit-modal-overlay">
      <div className="exit-modal">
        <div className="exit-modal-icon">
          <AlertTriangle size={32} />
        </div>
        <h2 className="exit-modal-title">Quit the Quiz?</h2>
        <p className="exit-modal-body">
          Your progress will be lost and this attempt won't be counted.
          You'll have to start from the beginning next time.
        </p>
        <div className="exit-modal-actions">
          <button className="exit-modal-btn exit-modal-btn--stay" onClick={onStay}>
            Keep Going
          </button>
          <button className="exit-modal-btn exit-modal-btn--leave" onClick={onLeave}>
            Leave Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function QuizActive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authLoading, updateXp, updateCompletedQuizzes } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Controls whether navigation is locked
  const [quizLocked, setQuizLocked] = useState(true);
  // Controls our custom exit modal visibility
  const [showExitModal, setShowExitModal] = useState(false);
  // Where to go if the user confirms they want to leave
  const [pendingLeaveUrl, setPendingLeaveUrl] = useState('/quizzes');

  // ── Guard: redirect unauthenticated users to signup ──────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      setQuizLocked(false); // don't block the auth redirect
      navigate('/signup', { state: { from: `/quiz/${id}` } });
    }
  }, [authLoading, user, navigate, id]);

  // ── Add/remove body.quiz-mode to hide navbar (handled by existing CSS) ────────
  useEffect(() => {
    document.body.classList.add('quiz-mode');
    return () => document.body.classList.remove('quiz-mode');
  }, []);

  // ── Block browser refresh / tab close ────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (quizLocked) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quizLocked]);

  // ── Block browser Back button via history state trick ─────────────────────────
  // Push a dummy entry so the browser back button pops it instead of leaving.
  // When popstate fires (back pressed), push the entry again and show our modal.
  useEffect(() => {
    if (!quizLocked) return;

    // Push a state so there's something to pop back to within the quiz
    window.history.pushState({ quizLock: true }, '', window.location.href);

    const handlePopState = (e) => {
      if (quizLocked) {
        // Re-push so repeated back presses still get caught
        window.history.pushState({ quizLock: true }, '', window.location.href);
        setPendingLeaveUrl('/quizzes');
        setShowExitModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [quizLocked]);

  // ── Fetch quiz on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/quizzes/${id}`);
        setQuiz(data);
        setSelectedAnswers(new Array(data.questions.length).fill(null));
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id && !authLoading && user) fetchQuiz();
  }, [id, authLoading, user]);

  // ── Answer / navigation helpers ───────────────────────────────────────────────
  const selectAnswer = (answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length - 1)) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    try {
      const { data } = await axios.post(
        "/api/quizzes/submit",
        { quizId: id, answers: selectedAnswers },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      if (data.newXp !== undefined) updateXp(data.newXp);
      if (data.completedQuizzes !== undefined) updateCompletedQuizzes(data.completedQuizzes);

      // Unlock before navigating so nothing intercepts the results redirect
      setQuizLocked(false);

      navigate("/quiz/results", {
        state: {
          score: data.score,
          total: data.total,
          xpEarned: data.xpEarned,
          quizTitle: quiz.title,
          answerDetails: data.answerDetails,
          quizId: id
        }
      });
    } catch (err) {
      setError("Submission failed. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal handlers ────────────────────────────────────────────────────────────
  const handleStay = () => setShowExitModal(false);

  const handleLeave = () => {
    setShowExitModal(false);
    setQuizLocked(false);
    navigate(pendingLeaveUrl);
  };

  // ── Render states ─────────────────────────────────────────────────────────────
  const currentQuestion = quiz?.questions[currentQuestionIndex];

  if (loading) {
    return (
      <div className="quiz-active-wrapper">
        <div className="quiz-loading">
          <div className="spinner"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz || !currentQuestion) {
    return (
      <div className="quiz-active-wrapper">
        <div className="quiz-error">
          <p>{error || 'Quiz not found'}</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnswered = selectedAnswers[currentQuestionIndex] !== null;

  return (
    <>
      {/* Exit confirmation modal */}
      {showExitModal && (
        <ExitModal onStay={handleStay} onLeave={handleLeave} />
      )}

      <div className="quiz-active-wrapper">
        <div className="quiz-active-container">

          {/* Header — no Back button; quiz is locked */}
          <div className="qa-header">
            <div className="qa-locked-badge">
              🔒 Quiz in Progress
            </div>
            <div className="qa-header-center">
              <span>{quiz.title}</span>
              <div className="qa-xp-badge">
                <Zap size={14} />
                {quiz.xpReward} XP
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="qa-progress-row">
            <div className="qa-progress-indicator">
              Q{currentQuestionIndex + 1} of {quiz.questions.length}
            </div>
            <div className="qa-progress-bar">
              <div className="qa-progress-bar-track" style={{ width: '100%' }}>
                <div
                  className="qa-progress-bar-fill"
                  style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question dots */}
          <div className="qa-dot-row">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                className={`qa-dot ${index === currentQuestionIndex ? 'qa-dot--current' : ''} ${selectedAnswers[index] !== null ? 'qa-dot--answered' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
              />
            ))}
          </div>

          {/* Question Card */}
          <div className="qa-question-card">
            <div className="qa-question-num">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </div>
            <h2 className="qa-question-text">{currentQuestion.questionText}</h2>

            <div className="qa-options-list">
              {currentQuestion.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  className={`qa-option-btn ${selectedAnswers[currentQuestionIndex] === optionIndex ? 'qa-option-btn--selected' : ''}`}
                  onClick={() => selectAnswer(optionIndex)}
                >
                  <div className="qa-option-indicator">
                    {selectedAnswers[currentQuestionIndex] === optionIndex ? (
                      <Check size={18} className="qa-check-icon" />
                    ) : (
                      <Circle size={18} className="qa-circle-icon" />
                    )}
                  </div>
                  <span className="qa-option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="qa-nav-row">
            <button
              className="btn-qa-nav"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button
                className="btn-qa-submit"
                onClick={handleSubmit}
                disabled={!hasAnswered || submitting}
              >
                {submitting ? (
                  <>
                    <div className="spinner spinner--sm"></div>
                    Submitting...
                  </>
                ) : (
                  'Finish Quiz'
                )}
              </button>
            ) : (
              <button
                className="btn-qa-next"
                onClick={nextQuestion}
                disabled={!hasAnswered}
              >
                Next Question
              </button>
            )}
          </div>

          {!hasAnswered && !isLastQuestion && (
            <div className="qa-unanswered-warning">
              Please select an answer before continuing.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
