import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './Community.css';

import { Link, useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, MapPin, MessageSquare, CheckCircle2 } from 'lucide-react';
import FeedTabs from './components/FeedTabs';
import PostComposer from './components/PostComposer';
import PostCard from './components/PostCard';
import CommunitySidebar from './components/CommunitySidebar';
import NotificationsPopover from './components/NotificationsPopover';
import SeekerSearch from './components/SeekerSearch';
import SeekerProfileModal from './components/SeekerProfileModal';
import PrivacySettingsModal from './components/PrivacySettingsModal';

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('following');
  const [posts, setPosts] = useState([]);
  const [gatherings, setGatherings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarData, setSidebarData] = useState(null);
  const [selectedSeekerId, setSelectedSeekerId] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Fetch feed or gatherings based on active tab
  const fetchFeed = useCallback(async (tabToFetch = activeTab) => {
    setLoading(true);
    try {
      if (tabToFetch === 'gatherings') {
        const res = await api.get('/community/gatherings');
        setGatherings(res.data.gatherings || []);
      } else {
        const res = await api.get(`/community/feed?tab=${tabToFetch}`);
        setPosts(res.data.feed || []);
      }
    } catch (err) {
      console.error('Failed to fetch community feed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch sidebar data (stats, suggested sanghas & seekers)
  const fetchSidebar = useCallback(async () => {
    try {
      const res = await api.get('/community/sidebar');
      setSidebarData(res.data);
    } catch (err) {
      console.error('Failed to fetch community sidebar:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeed(activeTab);
  }, [activeTab, fetchFeed]);

  useEffect(() => {
    fetchSidebar();
  }, [fetchSidebar]);

  // Handle new post created
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Handle Kudos toggle
  const handleKudosToggle = async (postId) => {
    try {
      const res = await api.post(`/community/posts/${postId}/kudos`);
      if (res.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, hasKudos: res.data.hasKudos, kudosCount: res.data.kudosCount }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle kudos:', err);
    }
  };

  // Handle follow toggle
  const handleFollowToggle = async (targetUserId) => {
    try {
      const res = await api.post(`/community/follow/${targetUserId}`);
      if (res.data) {
        // Update sidebar state
        setSidebarData((prev) => {
          if (!prev) return prev;
          const updatedSeekers = (prev.suggestedSeekers || []).map((s) =>
            s._id === targetUserId ? { ...s, isFollowing: res.data.isFollowing } : s
          );
          const newFollowingCount = res.data.isFollowing
            ? prev.stats.followingCount + 1
            : Math.max(0, prev.stats.followingCount - 1);

          return {
            ...prev,
            stats: { ...prev.stats, followingCount: newFollowingCount },
            suggestedSeekers: updatedSeekers,
          };
        });

        // If on following feed, refresh to incorporate new posts
        if (activeTab === 'following') {
          fetchFeed('following');
        }
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  // Handle sangha join/leave toggle
  const handleSanghaJoinToggle = async (sanghaId) => {
    try {
      const res = await api.post(`/community/sanghas/${sanghaId}/join`);
      if (res.data) {
        setSidebarData((prev) => {
          if (!prev) return prev;
          const updatedSanghas = (prev.recommendedSanghas || []).map((s) =>
            s._id === sanghaId
              ? { ...s, isMember: res.data.isMember, membersCount: res.data.membersCount }
              : s
          );
          const newSanghasCount = res.data.isMember
            ? prev.stats.sanghasCount + 1
            : Math.max(0, prev.stats.sanghasCount - 1);

          return {
            ...prev,
            stats: { ...prev.stats, sanghasCount: newSanghasCount },
            recommendedSanghas: updatedSanghas,
          };
        });

        if (activeTab === 'sanghas') {
          fetchFeed('sanghas');
        }
      }
    } catch (err) {
      console.error('Failed to toggle sangha membership:', err);
    }
  };

  const joinedSanghas = (sidebarData?.recommendedSanghas || []).filter((s) => s.isMember);

  return (
    <>
      <Navbar />

      <main className="comm-root-container">
        <div className="comm-layout-grid">
          {/* ── Left Column: Feed & Composer ── */}
          <section className="comm-feed-column">
            <header className="comm-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div className="comm-header-badge">
                  <span>🕊️</span>
                  <span>Sangha & Fellowship</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Link
                    to="/community/sanghas"
                    className="comm-btn-small"
                    style={{ fontSize: '0.82rem', padding: '6px 12px', textDecoration: 'none' }}
                  >
                    🏛️ Circles Directory
                  </Link>
                  <NotificationsPopover />
                </div>
              </div>

              <h1 className="comm-header-title">The Seeker’s Sangha</h1>
              <p className="comm-header-subtitle">
                Walking the inner journey together. Celebrate daily sadhanas, share milestones, and offer silent encouragement.
              </p>
            </header>

            {/* Post Composer */}
            <PostComposer
              onPostCreated={handlePostCreated}
              joinedSanghas={joinedSanghas}
            />

            {/* Feed Tabs */}
            <FeedTabs activeTab={activeTab} onSelectTab={setActiveTab} />

            {/* Feed Content */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div
                  className="spinner"
                  style={{
                    width: 38,
                    height: 38,
                    margin: '0 auto 12px',
                    borderColor: 'var(--comm-terracotta) transparent var(--comm-terracotta) transparent',
                  }}
                />
                <p style={{ color: 'var(--comm-terracotta)', fontWeight: 600, fontSize: '0.92rem' }}>
                  {activeTab === 'gatherings' ? 'Finding sacred gatherings...' : 'Loading sacred reflections...'}
                </p>
              </div>
            ) : activeTab === 'gatherings' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: 'var(--comm-bg-card)',
                    borderRadius: 'var(--comm-radius-md)',
                    border: '1px solid var(--comm-border-hairline)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--comm-text-charcoal)', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={16} color="var(--comm-terracotta)" />
                      <span>Upcoming Sangha Gatherings</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--comm-text-muted)', marginTop: 2 }}>
                      Dawn sadhanas, silence meditations & live virtual practice rooms.
                    </div>
                  </div>

                  <Link to="/community/gatherings" className="comm-btn-primary" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                    Full Directory ↗
                  </Link>
                </div>

                {gatherings.length === 0 ? (
                  <div className="comm-empty-state">
                    <div className="comm-empty-icon">🪷</div>
                    <h3 className="comm-empty-title">No scheduled gatherings</h3>
                    <p className="comm-empty-desc">Check back soon or explore the Circles directory to see where seekers gather.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {gatherings.map((g) => (
                      <div
                        key={g._id}
                        className="comm-post-card"
                        style={{
                          padding: '16px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          cursor: 'pointer',
                          borderRadius: 'var(--comm-radius-md)',
                        }}
                        onClick={() => navigate(`/community/gatherings/${g._id}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: g.eventType === 'in_person' ? 'rgba(78,99,70,0.1)' : 'rgba(196,154,69,0.15)',
                                  color: g.eventType === 'in_person' ? 'var(--comm-olive)' : 'var(--comm-gold)',
                                }}
                              >
                                {g.eventType === 'in_person' ? '🏛️ In-Person' : '🌐 Online'}
                              </span>
                              {g.isAttending && (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--comm-olive)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <CheckCircle2 size={12} /> Confirmed
                                </span>
                              )}
                              {g.myJoinRequest?.status === 'pending' && (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--comm-gold)' }}>
                                  ⏳ Request Pending
                                </span>
                              )}
                            </div>
                            <h3 className="comm-serif" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--comm-text-charcoal)' }}>
                              {g.title}
                            </h3>
                          </div>

                          <button
                            type="button"
                            className={`comm-btn-small ${g.isAttending ? 'joined' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/community/gatherings/${g._id}${g.isAttending ? '?tab=chat' : ''}`);
                            }}
                          >
                            {g.isAttending ? 'Open Chat 💬' : 'Details →'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.82rem', color: 'var(--comm-text-muted)', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={13} color="var(--comm-terracotta)" />
                            <span>
                              {new Date(g.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })},{' '}
                              {new Date(g.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={13} color="var(--comm-terracotta)" />
                            <span>{g.venue?.name || g.locationOrLink || 'Bengaluru'}</span>
                          </div>
                          {g.contactPerson?.name && (
                            <div style={{ color: 'var(--comm-text-charcoal)' }}>
                              Host: <strong>{g.contactPerson.name}</strong>
                            </div>
                          )}
                        </div>

                        {g.description && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--comm-text-charcoal)', lineHeight: 1.45 }}>
                            {g.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : posts.length === 0 ? (
              <div className="comm-empty-state">
                <div className="comm-empty-icon">🕊️</div>
                <h3 className="comm-empty-title">
                  {activeTab === 'following'
                    ? 'Quiet along this path'
                    : activeTab === 'sanghas'
                    ? 'No circle reflections yet'
                    : 'A clean slate'}
                </h3>
                <p className="comm-empty-desc">
                  {activeTab === 'following'
                    ? "Your circle hasn't shared any reflections today. Explore the Discover tab or connect with fellow seekers on the right!"
                    : activeTab === 'sanghas'
                    ? "You haven't joined any circles yet, or no updates have been posted. Browse circles on the right to connect with group practices."
                    : 'No public reflections have been shared yet. Be the first to share your practice or realization with the sangha!'}
                </p>
              </div>
            ) : (
              <div className="comm-feed-list">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={user?._id}
                    onKudosToggle={handleKudosToggle}
                    onAuthorClick={(authorId) => setSelectedSeekerId(authorId)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Right Column: Sidebar ── */}
          <CommunitySidebar
            user={user}
            sidebarData={sidebarData}
            onFollowToggle={handleFollowToggle}
            onSanghaJoinToggle={handleSanghaJoinToggle}
            onSwitchToSeekersTab={() => setShowSearchModal(true)}
            onSeekerClick={(seekerId) => setSelectedSeekerId(seekerId)}
          />
        </div>

        {selectedSeekerId && (
          <SeekerProfileModal
            seekerId={selectedSeekerId}
            onClose={() => setSelectedSeekerId(null)}
            onFollowToggle={handleFollowToggle}
            currentUserId={user?._id || user?.id}
            onOpenPrivacySettings={() => setShowPrivacyModal(true)}
          />
        )}

        <PrivacySettingsModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />

        {/* ── Full Seeker Search Modal ── */}
        {showSearchModal && (
          <div className="comm-modal-backdrop" onClick={() => setShowSearchModal(false)}>
            <div
              className="comm-modal-card comm-search-modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Seeker Search Sanctuary"
              style={{ maxWidth: 680, maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div className="comm-modal-header" style={{ marginBottom: 14 }}>
                <h3 className="comm-modal-title" style={{ fontSize: '1.35rem' }}>
                  Walk With Fellow Seekers
                </h3>
                <button
                  type="button"
                  className="comm-modal-close-btn"
                  onClick={() => setShowSearchModal(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <SeekerSearch
                onFollowToggle={handleFollowToggle}
                currentUserId={user?._id || user?.id}
                onSeekerClick={(seekerId) => {
                  setShowSearchModal(false);
                  setSelectedSeekerId(seekerId);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
