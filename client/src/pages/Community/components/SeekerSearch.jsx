import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, UserPlus, UserCheck, X, Sparkles, Filter, Mountain } from 'lucide-react';
import api from '../../../api';

export default function SeekerSearch({ onFollowToggle, currentUserId, onSeekerClick }) {
  const [query, setQuery] = useState('');
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'walking' | 'discover'
  const debounceTimerRef = useRef(null);

  const fetchSeekers = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/community/seekers?q=${encodeURIComponent(searchQuery)}&limit=24`);
      setSeekers(res.data.seekers || []);
    } catch (err) {
      console.error('Failed to search seekers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchSeekers(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, fetchSeekers]);

  const handleClear = () => {
    setQuery('');
    fetchSeekers('');
  };

  const handleToggle = async (seekerId) => {
    // Optimistic UI update
    setSeekers((prev) =>
      prev.map((s) => (s._id === seekerId ? { ...s, isFollowing: !s.isFollowing } : s))
    );
    if (onFollowToggle) {
      await onFollowToggle(seekerId);
    }
  };

  // Filtered list based on filterMode
  const filteredSeekers = seekers.filter((s) => {
    if (filterMode === 'walking') return s.isFollowing;
    if (filterMode === 'discover') return !s.isFollowing;
    return true;
  });

  return (
    <div className="comm-seeker-search-container" id="seeker-search-section">
      {/* Search Header Bar */}
      <div className="comm-search-header-box">
        <div className="comm-search-input-wrapper">
          <Search size={18} className="comm-search-icon" />
          <input
            type="text"
            className="comm-search-input"
            placeholder="Search fellow seekers by name, email, or practice (e.g. Somani, Priya, Kriya)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="seeker-search-input"
          />
          {query && (
            <button
              type="button"
              className="comm-search-clear-btn"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="comm-search-filter-pills">
          <button
            type="button"
            className={`comm-search-pill ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All Fellow Seekers ({seekers.length})
          </button>
          <button
            type="button"
            className={`comm-search-pill ${filterMode === 'walking' ? 'active' : ''}`}
            onClick={() => setFilterMode('walking')}
          >
            Walking With ({seekers.filter((s) => s.isFollowing).length})
          </button>
          <button
            type="button"
            className={`comm-search-pill ${filterMode === 'discover' ? 'active' : ''}`}
            onClick={() => setFilterMode('discover')}
          >
            Discover New ({seekers.filter((s) => !s.isFollowing).length})
          </button>
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <div
            className="spinner"
            style={{
              width: 32,
              height: 32,
              margin: '0 auto 10px',
              borderColor: 'var(--comm-terracotta) transparent var(--comm-terracotta) transparent',
            }}
          />
          <p style={{ color: 'var(--comm-text-muted)', fontSize: '0.86rem' }}>
            Seeking fellow travelers on the path...
          </p>
        </div>
      ) : filteredSeekers.length === 0 ? (
        <div className="comm-empty-state" style={{ padding: '36px 20px' }}>
          <div className="comm-empty-icon">🕊️</div>
          <h3 className="comm-empty-title">
            {query ? `No seekers found for "${query}"` : 'No seekers in this view'}
          </h3>
          <p className="comm-empty-desc">
            {query
              ? 'Try searching with a different spelling, email prefix, or practice name.'
              : filterMode === 'walking'
              ? "You aren't walking with any seekers yet. Switch to 'Discover New' to connect with practitioners."
              : 'Fellow seekers will appear here as more practitioners join the sangha.'}
          </p>
        </div>
      ) : (
        <div className="comm-seekers-grid">
          {filteredSeekers.map((seeker) => {
            const initials = (seeker.name || 'S')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={seeker._id} className="comm-seeker-card">
                <div className="comm-seeker-card-top">
                  <div
                    className="comm-seeker-avatar-wrap"
                    onClick={() => onSeekerClick && onSeekerClick(seeker._id)}
                    style={{ cursor: onSeekerClick ? 'pointer' : 'default' }}
                    title={onSeekerClick ? `View ${seeker.name}'s profile` : undefined}
                  >
                    <div className="comm-seeker-avatar">{initials}</div>
                    {seeker.isFollowing && (
                      <span className="comm-walking-badge" title="Walking together">
                        🕊️
                      </span>
                    )}
                  </div>

                  <div
                    className="comm-seeker-info"
                    onClick={() => onSeekerClick && onSeekerClick(seeker._id)}
                    style={{ cursor: onSeekerClick ? 'pointer' : 'default' }}
                    title={onSeekerClick ? `View ${seeker.name}'s profile` : undefined}
                  >
                    <div className="comm-seeker-name" title={seeker.name}>
                      {seeker.name}
                    </div>
                    <div className="comm-seeker-level-tag">
                      <Mountain size={12} /> Level {seeker.currentLevel || 1} Seeker
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`comm-walk-btn ${seeker.isFollowing ? 'following' : ''}`}
                    onClick={() => handleToggle(seeker._id)}
                    id={`walk-btn-${seeker._id}`}
                  >
                    {seeker.isFollowing ? (
                      <>
                        <UserCheck size={14} />
                        <span>Walking</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        <span>Walk With</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Practices List */}
                {Array.isArray(seeker.selectedPractices) && seeker.selectedPractices.length > 0 && (
                  <div className="comm-seeker-practices-row">
                    {seeker.selectedPractices.slice(0, 3).map((practice, idx) => (
                      <span key={idx} className="comm-practice-tag">
                        🪷 {practice}
                      </span>
                    ))}
                    {seeker.selectedPractices.length > 3 && (
                      <span className="comm-practice-tag-more">
                        +{seeker.selectedPractices.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
