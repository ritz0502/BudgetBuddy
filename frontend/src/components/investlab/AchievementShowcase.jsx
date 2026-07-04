// frontend/src/components/investlab/AchievementShowcase.jsx
import React from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import '../../pages/investlab.css';

const ALL_ACHIEVEMENTS = [
  { name: 'FIRST_TRADE', label: 'First Trade', desc: 'Made your first trade', icon: '🚀' },
  { name: 'FIRST_PROFIT', label: 'First Profit', desc: 'Sold a stock for profit', icon: '💰' },
  { name: 'DIVERSIFIER', label: 'Diversifier', desc: 'Built a diversified portfolio', icon: 'pie-chart' }, // using text/emoji
  { name: 'LEARNING_ENTHUSIAST', label: 'Learning Enthusiast', desc: 'Read an educational lesson', icon: '📚' },
  { name: 'AI_EXPLORER', label: 'AI Explorer', desc: 'Consulted the AI Coach', icon: '🤖' },
  { name: 'WEALTH_PLANNER', label: 'Wealth Planner', desc: 'Used the Future Wealth Planner', icon: '📈' },
  { name: 'PORTFOLIO_MASTER', label: 'Portfolio Master', desc: 'Achieved high portfolio health or level 5', icon: '👑' },
];

const AchievementShowcase = ({ achievements }) => {
  const earnedNames = achievements?.map(a => a.name) || [];

  return (
    <div className="card achievement-showcase">
      <div className="card-header">
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} />
          Badges & Achievements
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {ALL_ACHIEVEMENTS.map((ach) => {
          const isEarned = earnedNames.includes(ach.name);
          const earnedData = isEarned ? achievements.find(a => a.name === ach.name) : null;
          const unlockDate = earnedData?.unlockedAt ? new Date(earnedData.unlockedAt).toLocaleDateString() : null;

          return (
            <div 
              key={ach.name} 
              style={{ 
                border: `1px solid ${isEarned ? '#7cb342' : '#eee'}`,
                background: isEarned ? '#f9fdf5' : '#fafafa',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                opacity: isEarned ? 1 : 0.6,
                position: 'relative'
              }}
            >
              {isEarned ? (
                <CheckCircle2 size={16} color="#7cb342" style={{ position: 'absolute', top: 10, right: 10 }} />
              ) : (
                <Lock size={16} color="#bbb" style={{ position: 'absolute', top: 10, right: 10 }} />
              )}
              
              <div style={{ fontSize: '2rem', textAlign: 'center', margin: '8px 0' }}>
                 {ach.icon.length > 2 ? '⭐' : ach.icon} 
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: isEarned ? '#2d5016' : '#666', fontSize: '0.9rem' }}>
                  {ach.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                  {ach.desc}
                </div>
                {unlockDate && (
                  <div style={{ fontSize: '0.7rem', color: '#7cb342', marginTop: '8px', fontWeight: 500 }}>
                    Unlocked: {unlockDate}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementShowcase;
