import React, { useState, useEffect } from 'react';
import { X, Users, Mountain, Shield, Sparkles, UserPlus, UserCheck, Calendar, Heart } from 'lucide-react';
import api from '../../../api';

export default function SeekerProfileModal({
  seekerId,
  onClose,
  onFollowToggle,
  currentUserId,
}) {
  const [loading, setLoading] = useState(true);
  const [seeker, setSeeker] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('reflections'); // 'reflections' | 'practices' | 'circles'

  useEffect(() => {
    if (!seekerId) return;

    let isMounted = true;
    const fetchSeeker = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/community/seekers/${seekerId}`);
        if (isMounted) {
          setSeeker(res.data.seeker || null);
        }
      } catch (err) {
        console.error('Failed to load seeker profile:', err);
        if (isMounted) {
          setError('Could not load seeker details. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSeeker();
    return () => {
      isMounted = false;
    };
  }, [seekerId]);

  if (!seekerId) return null;

  const handleToggleFollow = async () => {
    if (!seeker) return;
    const newFollowState = !seeker.isFollowing;
    const newFollowersCount = newFollowState
      ? seeker.stats.followersCount + 1
      : Math.max(0, seeker.stats.followersCount - 1);

    // Optimistic local state update
    setSeeker((prev) => ({
      ...prev,
      isFollowing: newFollowState,
      stats: {
        ...prev.stats,
        followersCount: newFollowersCount,
      },
    }));

    if (onFollowToggle) {
      await onFollowToggle(seekerId);
    }
  };

  const initials = (seeker?.name || 'S')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isSelf = seeker?.isSelf || (currentUserId && currentUserId.toString() === seekerId.toString());

  return (
    <div className="comm-modal-backdrop" onClick={onClose}>
      <div
        className="comm-modal-card comm-profile-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Seeker Profile"
      >
        {/* Close Button */}
        <button
          type="button"
          className="comm-modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div
              className="spinner"
              style={{
                width: 36,
                height: 36,
                margin: '0 auto 12px',
                borderColor: 'var(--comm-terracotta) transparent var(--comm-terracotta) transparent',
              }}
            />
            <p style={{ color: 'var(--comm-terracotta)', fontSize: '0.9rem', fontWeight: 600 }}>
              Opening spiritual scroll...
            </p>
          </div>
        ) : error || !seeker ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p style={{ color: '#b4421b', fontSize: '0.9rem' }}>{error || 'Seeker details unavailable'}</p>
            <button
              type="button"
              className="comm-btn-small"
              onClick={onClose}
              style={{ marginTop: 12 }}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="comm-profile-modal-body">
            {/* ── Top Hero ── */}
            <div className="comm-profile-hero">
              <div className="comm-profile-avatar-large">
                {initials}
              </div>

              <div className="comm-profile-title-block">
                <h2 className="comm-profile-name">{seeker.name}</h2>
                <div className="comm-profile-level-badge">
                  <Mountain size={13} />
                  <span>Level {seeker.currentLevel || 1} Seeker</span>
                  <span>•</span>
                  <span>{seeker.pradakshinaCount || 0} Pradakshinas</span>
                </div>
              </div>

              {/* Action Button */}
              {!isSelf ? (
                <button
                  type="button"
                  className={`comm-walk-btn ${seeker.isFollowing ? 'following' : ''}`}
                  onClick={handleToggleFollow}
                  id="profile-modal-follow-btn"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  {seeker.isFollowing ? (
                    <>
                      <UserCheck size={16} />
                      <span>Walking Together</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Walk With</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="comm-self-profile-tag">
                  🕊️ Your Presence
                </span>
              )}
            </div>

            {/* ── 3-Cell Statistics Row ── */}
            <div className="comm-profile-stats-grid">
              <div className="comm-profile-stat-box">
                <span className="comm-pstat-num">{seeker.stats?.followingCount || 0}</span>
                <span className="comm-pstat-lbl">Walking With</span>
              </div>
              <div className="comm-profile-stat-divider" />
              <div className="comm-profile-stat-box">
                <span className="comm-pstat-num">{seeker.stats?.followersCount || 0}</span>
                <span className="comm-pstat-lbl">Companions</span>
              </div>
              <div className="comm-profile-stat-divider" />
              <div className="comm-profile-stat-box">
                <span className="comm-pstat-num">{seeker.stats?.sanghasCount || 0}</span>
                <span className="comm-pstat-lbl">Circles</span>
              </div>
            </div>

            {/* ── Inner Tabs Bar ── */}
            <div className="comm-profile-nav-tabs">
              <button
                type="button"
                className={`comm-pnav-tab ${activeTab === 'reflections' ? 'active' : ''}`}
                onClick={() => setActiveTab('reflections')}
              >
                📜 Reflections ({(seeker.recentPosts || []).length})
              </button>
              <button
                type="button"
                className={`comm-pnav-tab ${activeTab === 'practices' ? 'active' : ''}`}
                onClick={() => setActiveTab('practices')}
              >
                🪷 Practices ({(seeker.selectedPractices || []).length})
              </button>
              <button
                type="button"
                className={`comm-pnav-tab ${activeTab === 'circles' ? 'active' : ''}`}
                onClick={() => setActiveTab('circles')}
              >
                🏛️ Circles ({(seeker.sanghas || []).length})
              </button>
            </div>

            {/* ── Tab Panels ── */}
            <div className="comm-profile-tab-content">
              {activeTab === 'reflections' && (
                <div>
                  {(seeker.recentPosts || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--comm-text-muted)', fontSize: '0.86rem' }}>
                      🕊️ Quiet along this path — no reflections shared yet.
                    </div>
                  ) : (
                    <div className="comm-profile-posts-list">
                      {seeker.recentPosts.map((post) => (
                        <div key={post._id} className="comm-profile-post-item">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span className="comm-post-type-tag">
                              {post.type === 'metric'
                                ? '🪷 Sadhana'
                                : post.type === 'milestone'
                                ? '🏔️ Milestone'
                                : post.type === 'photo'
                                ? '📸 Sacred Moment'
                                : '🕊️ Reflection'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--comm-text-muted)' }}>
                              {new Date(post.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          {post.sharedEntity?.title && (
                            <div className="comm-profile-post-entity">
                              <span>{post.sharedEntity.icon || '🪷'}</span>
                              <strong>{post.sharedEntity.title}</strong>
                              {post.sharedEntity.metricValue && (
                                <span className="comm-level-badge">{post.sharedEntity.metricValue}</span>
                              )}
                            </div>
                          )}

                          <p className="comm-profile-post-body">{post.body}</p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'var(--comm-text-muted)', marginTop: 8 }}>
                            <span>🙏 {post.kudosCount || 0} Kudos</span>
                            <span>•</span>
                            <span>💬 {post.commentsCount || 0} Comments</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'practices' && (
                <div>
                  {(seeker.selectedPractices || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--comm-text-muted)', fontSize: '0.86rem' }}>
                      No dedicated practices publicly shared.
                    </div>
                  ) : (
                    <div className="comm-profile-practices-grid">
                      {seeker.selectedPractices.map((practice, idx) => (
                        <div key={idx} className="comm-profile-practice-card">
                          <span style={{ fontSize: '1.2rem' }}>🪷</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--comm-text-charcoal)' }}>
                              {practice}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--comm-text-muted)' }}>
                              Consecrated Sadhana
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'circles' && (
                <div>
                  {(seeker.sanghas || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--comm-text-muted)', fontSize: '0.86rem' }}>
                      Not yet joined any public circles.
                    </div>
                  ) : (
                    <div className="comm-profile-circles-list">
                      {seeker.sanghas.map((sangha) => (
                        <div key={sangha._id} className="comm-profile-circle-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="comm-circle-mini-icon">🏛️</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--comm-text-charcoal)' }}>
                                {sangha.name}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--comm-text-muted)' }}>
                                {sangha.type}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
