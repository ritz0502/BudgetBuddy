// frontend/src/components/investlab/ProgressHub.jsx
import React from 'react';
import { Award, Zap, Star } from 'lucide-react';
import '../../pages/investlab.css'; // Will reuse existing or add new styles

const ProgressHub = ({ xpData, streakData, achievements }) => {
  if (!xpData || !streakData) return null;

  const { xp, level, currentLevelXP, nextLevelXP, progress } = xpData;
  const { streakDays, longestStreak } = streakData;

  const levelTitles = {
    1: 'Beginner Investor',
    2: 'Market Explorer',
    3: 'Portfolio Builder',
    4: 'Wealth Strategist',
    5: 'Financial Scholar',
  };

  const currentTitle = levelTitles[level] || `Level ${level}`;
  const recentAchievement = achievements?.length > 0 ? achievements[achievements.length - 1] : null;

  return (
    <div className="card progress-hub" style={{ background: 'linear-gradient(135deg, #f1f8eb 0%, #ffffff 100%)', border: '1px solid #c8e6c9' }}>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2d5016' }}>
          <Star size={24} style={{ color: '#ffc107', fill: '#ffc107' }} />
          InvestLab Journey
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Side: Level & XP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>Level {level}</div>
              <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>{currentTitle}</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7cb342' }}>
              {xp} <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 600 }}>XP</span>
            </div>
          </div>

          <div style={{ background: '#e0e0e0', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div 
              style={{ 
                background: 'linear-gradient(90deg, #7cb342, #4a7c1f)', 
                height: '100%', 
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 0.5s ease-out'
              }} 
            />
          </div>
          {nextLevelXP && (
            <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>
              {nextLevelXP - xp} XP to Level {level + 1}
            </div>
          )}
        </div>

        {/* Right Side: Streaks & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={20} color="#f57c00" fill={streakDays > 0 ? "#f57c00" : "none"} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333' }}>{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Streak</div>
              </div>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Award size={20} color="#7cb342" />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333' }}>{achievements?.length || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Badges Earned</div>
              </div>
            </div>
          </div>

          {recentAchievement && (
            <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <Star size={16} color="#ffc107" fill="#ffc107" style={{ flexShrink: 0 }} />
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                <span style={{ color: '#666' }}>Latest: </span>
                <span style={{ fontWeight: 600, color: '#333' }}>{recentAchievement.name.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressHub;
