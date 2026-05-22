import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Trophy,
  Zap,
  ChevronLeft,
  Medal,
  Crown,
  TrendingUp,
  Star,
  Award,
  Users,
} from "lucide-react";
import "./Quizzes.css";

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const myInfo = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/quizzes/leaderboard");
        setBoard(data);
      } catch {
        setError("Could not load leaderboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const myEntry = board.find((u) => u.name === myInfo.name);

  const rankIcon = (rank) => {
    if (rank === 1)
      return <Crown size={18} className="rank-crown rank-gold" />;
    if (rank === 2)
      return <Medal size={16} className="rank-crown rank-silver" />;
    if (rank === 3)
      return <Medal size={16} className="rank-crown rank-bronze" />;
    return <span className="rank-num">{rank}</span>;
  };

  const getRankChange = () => {
    const changes = ["+2", "+1", "—", "-1", "+3", "—", "+1", "-2"];
    return changes[Math.floor(Math.random() * changes.length)];
  };

  return (
    <div className="lb2-page">
      {/* Hero header */}
      <div className="lb2-hero">
        <div className="lb2-hero-bg" />
        <div className="lb2-hero-inner">
          <button
            className="btn-back-quiz"
            onClick={() => navigate("/quizzes")}
            style={{ alignSelf: "flex-start" }}
          >
            <ChevronLeft size={15} /> Back
          </button>

          <div className="lb2-hero-title">
            <div className="lb2-trophy-ring">
              <Trophy size={28} />
            </div>
            <div>
              <h1 className="lb2-h1">Leaderboard</h1>
              <p className="lb2-subtitle">
                {board.length} players competing this week
              </p>
            </div>
          </div>

          {/* Quick stats */}
          {!loading && !error && myEntry && (
            <div className="lb2-my-stat-bar">
              <div className="lb2-my-stat">
                <span className="lb2-my-stat-label">Your rank</span>
                <span className="lb2-my-stat-val">#{myEntry.rank}</span>
              </div>
              <div className="lb2-my-stat-divider" />
              <div className="lb2-my-stat">
                <span className="lb2-my-stat-label">Your XP</span>
                <span className="lb2-my-stat-val lb2-stat-xp">
                  <Zap size={13} />
                  {myEntry.xp}
                </span>
              </div>
              <div className="lb2-my-stat-divider" />
              <div className="lb2-my-stat">
                <span className="lb2-my-stat-label">Level</span>
                <span className="lb2-my-stat-val">{myEntry.level}</span>
              </div>
              <div className="lb2-my-stat-divider" />
              <div className="lb2-my-stat">
                <span className="lb2-my-stat-label">Quizzes</span>
                <span className="lb2-my-stat-val">{myEntry.quizzesCompleted}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lb2-body">
        {loading && (
          <div className="quiz-loading">
            <div className="spinner" />
            <p>Loading…</p>
          </div>
        )}
        {error && (
          <div className="quiz-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Podium */}
            {board.length >= 3 && (
              <div className="lb2-podium-section">
                <div className="lb2-podium">
                  {/* 2nd place */}
                  <div className="lb2-podium-slot lb2-podium-slot--2">
                    <div className="lb2-podium-avatar lb2-podium-avatar--2">
                      {board[1].name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="lb2-podium-name">
                      {board[1].name?.split(" ")[0]}
                    </div>
                    <div className="lb2-podium-xp">
                      <Zap size={11} />
                      {board[1].xp}
                    </div>
                    <div className="lb2-podium-stand lb2-podium-stand--2">
                      <Medal size={20} className="rank-silver" />
                    </div>
                  </div>

                  {/* 1st place */}
                  <div className="lb2-podium-slot lb2-podium-slot--1">
                    <div className="lb2-podium-crown-wrap">
                      <Crown size={20} className="rank-gold" />
                    </div>
                    <div className="lb2-podium-avatar lb2-podium-avatar--1">
                      {board[0].name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="lb2-podium-name lb2-podium-name--1">
                      {board[0].name?.split(" ")[0]}
                    </div>
                    <div className="lb2-podium-xp lb2-podium-xp--1">
                      <Zap size={12} />
                      {board[0].xp}
                    </div>
                    <div className="lb2-podium-stand lb2-podium-stand--1">
                      <Crown size={22} className="rank-gold" />
                    </div>
                  </div>

                  {/* 3rd place */}
                  <div className="lb2-podium-slot lb2-podium-slot--3">
                    <div className="lb2-podium-avatar lb2-podium-avatar--3">
                      {board[2].name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="lb2-podium-name">
                      {board[2].name?.split(" ")[0]}
                    </div>
                    <div className="lb2-podium-xp">
                      <Zap size={11} />
                      {board[2].xp}
                    </div>
                    <div className="lb2-podium-stand lb2-podium-stand--3">
                      <Award size={18} className="rank-bronze" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div className="lb2-filter-row">
              {["all", "top10", "nearby"].map((f) => (
                <button
                  key={f}
                  className={`lb2-filter-tab ${filter === f ? "lb2-filter-tab--active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" && <Users size={13} />}
                  {f === "top10" && <Star size={13} />}
                  {f === "nearby" && <TrendingUp size={13} />}
                  {f === "all" ? "All Players" : f === "top10" ? "Top 10" : "Near You"}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="lb2-list">
              {board
                .filter((u) => {
                  if (filter === "top10") return u.rank <= 10;
                  if (filter === "nearby" && myEntry)
                    return Math.abs(u.rank - myEntry.rank) <= 3;
                  return true;
                })
                .map((user, idx) => {
                  const isMe = user.name === myInfo.name;
                  const isTop3 = user.rank <= 3;
                  return (
                    <div
                      key={user.rank}
                      className={`lb2-row ${isMe ? "lb2-row--me" : ""} ${isTop3 ? "lb2-row--top3" : ""}`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Rank */}
                      <div className="lb2-rank-col">
                        {rankIcon(user.rank)}
                      </div>

                      {/* Avatar */}
                      <div
                        className={`lb2-avatar-col ${isTop3 ? `lb2-avatar-col--rank${user.rank}` : ""}`}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="lb2-info-col">
                        <div className="lb2-name-row">
                          <span className="lb2-name">{user.name}</span>
                          {isMe && <span className="lb2-you-chip">You</span>}
                          {user.rank === 1 && (
                            <span className="lb2-leader-chip">Leader</span>
                          )}
                        </div>
                        <div className="lb2-meta-row">
                          <span className="lb2-level-pill">
                            Lvl {user.level}
                          </span>
                          <span className="lb2-quiz-count">
                            {user.quizzesCompleted} quizzes
                          </span>
                        </div>
                      </div>

                      {/* XP bar + score */}
                      <div className="lb2-xp-col">
                        <div className="lb2-xp-score">
                          <Zap size={12} className="xp-icon" />
                          <span>{user.xp}</span>
                        </div>
                        <div className="lb2-xp-bar-track">
                          <div
                            className="lb2-xp-bar-fill"
                            style={{
                              width: `${Math.min(100, (user.xp / (board[0]?.xp || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {board.length === 0 && (
              <div className="quiz-empty">
                <Trophy size={40} />
                <p>No players yet. Complete a quiz to appear here!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline styles for new classes */}
      <style>{`
        /* ── Page shell ── */
        .lb2-page {
          min-height: 100vh;
          background: #f8fdf4;
          font-family: inherit;
        }

        /* ── Hero ── */
        .lb2-hero {
          position: relative;
          background: linear-gradient(145deg, #1c3a0a 0%, #2d5016 55%, #3e6b1d 100%);
          padding: 32px 20px 36px;
          overflow: hidden;
        }
        .lb2-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at 90% 20%, rgba(245,166,35,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 60% at 10% 90%, rgba(124,179,66,0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        .lb2-hero-inner {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .lb2-hero-title {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .lb2-trophy-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(245,166,35,0.18);
          border: 1.5px solid rgba(245,166,35,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f5a623;
          flex-shrink: 0;
        }
        .lb2-h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 3px;
          line-height: 1.15;
        }
        .lb2-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          margin: 0;
        }

        /* My stats bar */
        .lb2-my-stat-bar {
          display: flex;
          align-items: center;
          gap: 0;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          padding: 14px 20px;
          backdrop-filter: blur(6px);
        }
        .lb2-my-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .lb2-my-stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .lb2-my-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .lb2-my-stat-val {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .lb2-stat-xp {
          color: #f5a623;
        }

        /* ── Body ── */
        .lb2-body {
          max-width: 720px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        /* ── Podium ── */
        .lb2-podium-section {
          margin-bottom: 36px;
        }
        .lb2-podium {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0;
        }
        .lb2-podium-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          flex: 1;
          max-width: 180px;
        }
        .lb2-podium-slot--1 {
          z-index: 2;
          position: relative;
          top: 0;
        }
        .lb2-podium-slot--2,
        .lb2-podium-slot--3 {
          margin-bottom: 0;
        }
        .lb2-podium-crown-wrap {
          height: 26px;
          display: flex;
          align-items: center;
          margin-bottom: 2px;
        }
        .lb2-podium-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #4a7c23, #2d5016);
          border: 2.5px solid rgba(255,255,255,0.2);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .lb2-podium-avatar--1 {
          width: 64px;
          height: 64px;
          font-size: 22px;
          border-color: #f5a623;
          background: linear-gradient(135deg, #c47d0e, #f5a623);
          box-shadow: 0 6px 24px rgba(245,166,35,0.4);
        }
        .lb2-podium-avatar--2 {
          border-color: #b0b8c1;
          background: linear-gradient(135deg, #7a8a96, #b0b8c1);
        }
        .lb2-podium-avatar--3 {
          border-color: #cd7f32;
          background: linear-gradient(135deg, #8b5a1e, #cd7f32);
        }
        .lb2-podium-name {
          font-size: 13px;
          font-weight: 700;
          color: #2d5016;
          text-align: center;
          margin-top: 2px;
        }
        .lb2-podium-name--1 {
          font-size: 14px;
        }
        .lb2-podium-xp {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 700;
          color: #888;
        }
        .lb2-podium-xp--1 {
          color: #c47d0e;
          font-size: 12px;
        }
        .lb2-podium-stand {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px 10px 0 0;
          padding: 12px 0 10px;
          margin-top: 8px;
        }
        .lb2-podium-stand--1 {
          background: linear-gradient(180deg, #fff8e1, #fff3cc);
          border: 1.5px solid #f5a623;
          border-bottom: none;
          min-height: 68px;
        }
        .lb2-podium-stand--2 {
          background: linear-gradient(180deg, #f5f6f7, #e8eaed);
          border: 1.5px solid #b0b8c1;
          border-bottom: none;
          min-height: 50px;
        }
        .lb2-podium-stand--3 {
          background: linear-gradient(180deg, #fdf0e4, #f5e4cf);
          border: 1.5px solid #cd7f32;
          border-bottom: none;
          min-height: 40px;
        }

        /* ── Filter tabs ── */
        .lb2-filter-row {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .lb2-filter-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1.5px solid #e0e0e0;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.18s;
          font-family: inherit;
        }
        .lb2-filter-tab:hover {
          border-color: #7cb342;
          color: #2d5016;
          background: #f4fce8;
        }
        .lb2-filter-tab--active {
          background: #2d5016;
          border-color: #2d5016;
          color: #fff;
        }
        .lb2-filter-tab--active:hover {
          background: #2d5016;
          color: #fff;
        }

        /* ── Rows ── */
        .lb2-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lb2-row {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 14px;
          padding: 14px 18px;
          transition: transform 0.18s, box-shadow 0.18s;
          animation: lb2RowIn 0.3s ease both;
        }
        @keyframes lb2RowIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lb2-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(45,80,22,0.08);
        }
        .lb2-row--me {
          border-color: #7cb342;
          background: linear-gradient(135deg, #f6fff2 70%, #f0fae7 100%);
          box-shadow: 0 2px 12px rgba(124,179,66,0.15);
        }
        .lb2-row--top3 {
          border-color: #e8e4d0;
        }

        .lb2-rank-col {
          width: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lb2-avatar-col {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7cb342, #4a7c23);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
        }
        .lb2-avatar-col--rank1 {
          background: linear-gradient(135deg, #f5a623, #c47d0e);
          box-shadow: 0 3px 12px rgba(245,166,35,0.35);
        }
        .lb2-avatar-col--rank2 {
          background: linear-gradient(135deg, #c0c8d0, #8a96a0);
        }
        .lb2-avatar-col--rank3 {
          background: linear-gradient(135deg, #cd7f32, #8b5a1e);
        }

        .lb2-info-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .lb2-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .lb2-name {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lb2-you-chip {
          font-size: 10px;
          font-weight: 700;
          background: #2d5016;
          color: #fff;
          padding: 2px 8px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .lb2-leader-chip {
          font-size: 10px;
          font-weight: 700;
          background: #fff8e1;
          color: #c47d0e;
          border: 1px solid #f5a623;
          padding: 2px 8px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .lb2-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lb2-level-pill {
          font-size: 11px;
          font-weight: 700;
          background: #f0f7e8;
          color: #4a7c23;
          padding: 2px 8px;
          border-radius: 20px;
        }
        .lb2-quiz-count {
          font-size: 12px;
          color: #aaa;
        }

        /* XP column */
        .lb2-xp-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
          flex-shrink: 0;
          min-width: 72px;
        }
        .lb2-xp-score {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 800;
          color: #c47d0e;
        }
        .lb2-xp-bar-track {
          width: 72px;
          height: 4px;
          background: #f0f0f0;
          border-radius: 99px;
          overflow: hidden;
        }
        .lb2-xp-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #7cb342, #a5d63a);
          border-radius: 99px;
          transition: width 0.6s ease;
        }

        /* Responsive */
        @media (max-width: 540px) {
          .lb2-my-stat-bar {
            flex-wrap: wrap;
            gap: 12px;
          }
          .lb2-my-stat-divider { display: none; }
          .lb2-my-stat { flex: 1 1 40%; }
          .lb2-filter-row { flex-wrap: wrap; }
          .lb2-xp-bar-track { display: none; }
          .lb2-podium-stand--1 { min-height: 54px; }
          .lb2-podium-stand--2 { min-height: 38px; }
          .lb2-podium-stand--3 { min-height: 30px; }
        }
      `}</style>
    </div>
  );
}