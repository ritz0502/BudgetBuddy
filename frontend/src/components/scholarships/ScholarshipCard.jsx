import React from 'react';
import { Clock, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';

const CATEGORY_COLORS = {
  'Merit': '#e8f5e9',
  'Need-based': '#e3f2fd',
  'Sports': '#fff3e0',
  'Minority': '#f3e5f5',
  'Research': '#e0f2f1',
  'International': '#e8eaf6',
  'Other': '#f5f5f5'
};

const CATEGORY_TEXT_COLORS = {
  'Merit': '#2e7d32',
  'Need-based': '#1565c0',
  'Sports': '#e65100',
  'Minority': '#6a1b9a',
  'Research': '#00695c',
  'International': '#283593',
  'Other': '#616161'
};

const ScholarshipCard = ({ scholarship, isBookmarked, onBookmarkToggle, onClick }) => {
  const deadlineDate = new Date(scholarship.deadline);
  const now = new Date();
  const diffTime = deadlineDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let deadlineColor = '#888';
  let deadlineWarning = null;

  if (diffDays >= 0 && diffDays <= 7) {
    deadlineColor = '#d32f2f'; // Red
    deadlineWarning = '⚠️ Closing soon';
  } else if (diffDays > 7 && diffDays <= 30) {
    deadlineColor = '#f57c00'; // Amber
  }

  const handleBookmarkClick = (e) => {
    e.stopPropagation(); // Prevent opening modal
    onBookmarkToggle(scholarship._id);
  };

  const handleApplyClick = (e) => {
    e.stopPropagation(); // Prevent opening modal
  };

  return (
    <div 
      onClick={() => onClick(scholarship)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        border: '1px solid #f0f0f0',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
      }}
    >
      {/* Category Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          background: CATEGORY_COLORS[scholarship.category] || CATEGORY_COLORS['Other'],
          color: CATEGORY_TEXT_COLORS[scholarship.category] || CATEGORY_TEXT_COLORS['Other'],
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-block'
        }}>
          {scholarship.category}
        </span>
      </div>

      {/* Title & Provider */}
      <div>
        <h3 style={{ 
          fontSize: '1.1rem', 
          color: '#2d5016', 
          margin: '0 0 4px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {scholarship.title}
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>{scholarship.provider}</p>
      </div>

      {/* Amount & Deadline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ color: '#7cb342', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
          {scholarship.amount || 'Amount not specified'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: deadlineColor, fontSize: '0.85rem' }}>
          <Clock size={14} />
          <span>
            {deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {deadlineWarning && <span style={{ fontWeight: 600, marginLeft: '6px' }}>{deadlineWarning}</span>}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{ 
        color: '#555', 
        fontSize: '0.85rem', 
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexGrow: 1
      }}>
        {scholarship.description}
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto', paddingTop: '12px' }}>
        <button 
          onClick={handleBookmarkClick}
          style={{
            background: isBookmarked ? '#f1f8eb' : 'transparent',
            color: '#7cb342',
            border: '1px solid #7cb342',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease'
          }}
        >
          {isBookmarked ? (
            <>
              <BookmarkCheck size={16} /> Bookmarked ✓
            </>
          ) : (
            <>
              <Bookmark size={16} /> Bookmark
            </>
          )}
        </button>
        <a 
          href={scholarship.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleApplyClick}
          style={{
            background: '#7cb342',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '0.85rem',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          Apply Now <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default ScholarshipCard;
