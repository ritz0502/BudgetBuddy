import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, ChevronLeft, ChevronRight, BookmarkX } from 'lucide-react';
import ScholarshipCard from '../components/scholarships/ScholarshipCard';
import ScholarshipDetailModal from '../components/scholarships/ScholarshipDetailModal';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Merit', 'Need-based', 'Sports', 'Minority', 'International', 'Research', 'Other'];

const ScholarshipsPage = () => {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [bookmarkedScholarships, setBookmarkedScholarships] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const debounceTimeout = useRef(null);

  // Initial load of bookmarks
  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Fetch scholarships when dependencies change
  useEffect(() => {
    fetchScholarships();
  }, [search, selectedCategory, page]);

  const getAuthHeader = () => ({
    Authorization: `Bearer ${user?.token}`,
  });

  const fetchBookmarks = async () => {
    try {
      const res = await axios.get(`/api/scholarships/bookmarks`, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      setBookmarkedScholarships(res.data);
      setBookmarkedIds(new Set(res.data.map(s => s._id)));
    } catch (err) {
      console.error('Error fetching bookmarks', err);
    }
  };

  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      params.append('page', page.toString());
      params.append('limit', '9');

      const res = await axios.get(`/api/scholarships?${params.toString()}`, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      
      setScholarships(res.data.scholarships || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);
    } catch (err) {
      console.error('Error fetching scholarships', err);
      setError('Failed to load scholarships. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    
    // Debounce
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearch(e.target.value);
      setPage(1); // Reset page on new search
    }, 500);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1); // Reset page on category change
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBookmarkToggle = async (scholarshipId) => {
    const isCurrentlyBookmarked = bookmarkedIds.has(scholarshipId);
    
    // Optimistic UI update
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyBookmarked) {
        newSet.delete(scholarshipId);
      } else {
        newSet.add(scholarshipId);
      }
      return newSet;
    });

    try {
      await axios.post(`/api/scholarships/${scholarshipId}/bookmark`, {}, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      // Re-fetch full bookmark list to ensure details are up-to-date in the header slider
      fetchBookmarks();
    } catch (err) {
      console.error('Error toggling bookmark', err);
      // Revert optimistic update
      setBookmarkedIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyBookmarked) {
          newSet.add(scholarshipId);
        } else {
          newSet.delete(scholarshipId);
        }
        return newSet;
      });
      showToast('Failed to update bookmark. Try again.');
    }
  };

  const scrollToScholarship = (id) => {
    // If it's already on the screen, scroll to it. Otherwise, it might be on a different page.
    const el = document.getElementById(`scholarship-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporary highlight effect
      el.style.transition = 'box-shadow 0.3s';
      el.style.boxShadow = '0 0 0 3px #7cb342';
      setTimeout(() => el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)', 2000);
    } else {
      showToast('Scholarship is on a different page.');
    }
  };

  // Skeleton Loader
  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{
        background: '#fff', borderRadius: '12px', padding: '20px', 
        height: '300px', border: '1px solid #f0f0f0',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}>
        <div style={{ background: '#e0e0e0', height: '20px', width: '60px', borderRadius: '10px', marginBottom: '12px' }}></div>
        <div style={{ background: '#e0e0e0', height: '24px', width: '90%', borderRadius: '4px', marginBottom: '8px' }}></div>
        <div style={{ background: '#e0e0e0', height: '16px', width: '50%', borderRadius: '4px', marginBottom: '24px' }}></div>
        <div style={{ background: '#e0e0e0', height: '20px', width: '40%', borderRadius: '4px', marginBottom: '8px' }}></div>
        <div style={{ background: '#e0e0e0', height: '20px', width: '40%', borderRadius: '4px', marginBottom: '24px' }}></div>
        <div style={{ background: '#e0e0e0', height: '60px', width: '100%', borderRadius: '4px' }}></div>
      </div>
    ));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fdf4',
      paddingTop: '90px',
      paddingBottom: '60px',
      color: '#333',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          .grid-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          @media (max-width: 992px) {
            .grid-container { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 768px) {
            .grid-container { grid-template-columns: 1fr; }
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#323232', color: 'white', padding: '12px 24px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, fontWeight: 500
        }}>
          {toastMessage}
        </div>
      )}

      <div className="container">
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#2d5016', marginBottom: '8px' }}>Scholarships & Grants</h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Discover funding opportunities for your education</p>
          
          {/* Search Bar */}
          <div style={{ maxWidth: '600px', margin: '24px auto 0', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search by name, provider, or eligibility..."
              value={searchInput}
              onChange={handleSearchChange}
              style={{
                width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px',
                border: '1px solid #e0e0e0', fontSize: '1rem', outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7cb342'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
          {CATEGORIES.map(category => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #7cb342' : '1px solid #dcdcdc',
                  background: isActive ? '#7cb342' : '#fff',
                  color: isActive ? '#fff' : '#666',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Bookmarks Horizontal Scroll */}
        {bookmarkedScholarships.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: '#2d5016', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              Your Bookmarked Scholarships 🔖
              <span style={{ background: '#7cb342', color: '#fff', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px' }}>
                {bookmarkedScholarships.length}
              </span>
            </h3>
            <div className="hide-scrollbar" style={{ 
              display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px'
            }}>
              {bookmarkedScholarships.map(b => (
                <div 
                  key={`bookmark-${b._id}`}
                  onClick={() => scrollToScholarship(b._id)}
                  style={{
                    minWidth: '280px', maxWidth: '280px', background: '#fff', padding: '16px',
                    borderRadius: '12px', border: '1px solid #e0e0e0', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ color: '#2d5016', fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.title}
                    </h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(b._id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}
                    >
                      <BookmarkX size={16} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
                    Deadline: {new Date(b.deadline).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        {error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f', background: '#ffebee', borderRadius: '12px' }}>
            <p>{error}</p>
            <button onClick={fetchScholarships} style={{ marginTop: '16px', padding: '8px 16px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Try Again</button>
          </div>
        ) : loading ? (
          <div className="grid-container">
            {renderSkeletons()}
          </div>
        ) : scholarships.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ color: '#2d5016', marginBottom: '8px' }}>No scholarships found</h3>
            <p style={{ color: '#888' }}>Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <>
            <div className="grid-container">
              {scholarships.map(scholarship => (
                <div key={scholarship._id} id={`scholarship-${scholarship._id}`}>
                  <ScholarshipCard 
                    scholarship={scholarship}
                    isBookmarked={bookmarkedIds.has(scholarship._id)}
                    onBookmarkToggle={handleBookmarkToggle}
                    onClick={setSelectedScholarship}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px',
                    borderRadius: '8px', border: '1px solid #dcdcdc', background: '#fff',
                    color: page === 1 ? '#aaa' : '#333', cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={18} /> Prev
                </button>
                
                <span style={{ color: '#666', fontWeight: 500 }}>
                  Page {page} of {totalPages}
                </span>

                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px',
                    borderRadius: '8px', border: '1px solid #dcdcdc', background: '#fff',
                    color: page === totalPages ? '#aaa' : '#333', cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* Modal */}
      <ScholarshipDetailModal 
        scholarship={selectedScholarship}
        isBookmarked={selectedScholarship ? bookmarkedIds.has(selectedScholarship._id) : false}
        onClose={() => setSelectedScholarship(null)}
        onBookmarkToggle={handleBookmarkToggle}
      />
    </div>
  );
};

export default ScholarshipsPage;
