import React, { useEffect } from 'react';
import { X, Clock, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';

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

const ScholarshipDetailModal = ({ scholarship, isBookmarked, onClose, onBookmarkToggle }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!scholarship) return null;

  const deadlineDate = new Date(scholarship.deadline);
  
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative'
        }}>
          <div style={{ paddingRight: '40px' }}>
            <span style={{
              background: CATEGORY_COLORS[scholarship.category] || CATEGORY_COLORS['Other'],
              color: CATEGORY_TEXT_COLORS[scholarship.category] || CATEGORY_TEXT_COLORS['Other'],
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              {scholarship.category}
            </span>
            <h2 style={{ color: '#2d5016', margin: '0 0 8px 0', fontSize: '1.4rem' }}>{scholarship.title}</h2>
            <p style={{ color: '#666', margin: 0, fontWeight: 500 }}>{scholarship.provider}</p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#555',
              position: 'absolute',
              top: '24px',
              right: '24px',
              transition: 'background 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fdf4', padding: '16px', borderRadius: '12px' }}>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Amount</p>
              <p style={{ color: '#7cb342', fontWeight: 700, margin: 0 }}>{scholarship.amount || 'Not specified'}</p>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Deadline</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#333', fontWeight: 600 }}>
                <Clock size={16} color="#7cb342" />
                {deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#2d5016', marginBottom: '8px', fontSize: '1.05rem' }}>Description</h4>
            <p style={{ color: '#444', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>{scholarship.description}</p>
          </div>

          {scholarship.eligibility && (
            <div>
              <h4 style={{ color: '#2d5016', marginBottom: '8px', fontSize: '1.05rem' }}>Eligibility Criteria</h4>
              <p style={{ color: '#444', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-line' }}>
                {scholarship.eligibility}
              </p>
            </div>
          )}
          
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #f0f0f0',
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '12px',
          background: '#fff'
        }}>
          <button 
            onClick={() => onBookmarkToggle(scholarship._id)}
            style={{
              background: isBookmarked ? '#f1f8eb' : 'transparent',
              color: '#7cb342',
              border: '2px solid #7cb342',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck size={20} /> Bookmarked
              </>
            ) : (
              <>
                <Bookmark size={20} /> Bookmark
              </>
            )}
          </button>
          <a 
            href={scholarship.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#7cb342',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Apply Now <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetailModal;
