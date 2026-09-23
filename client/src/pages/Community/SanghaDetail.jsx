import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Users,
  MapPin,
  Calendar,
  ArrowLeft,
  MessageSquare,
  BookOpen,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import PostCard from './components/PostCard';
import PostComposer from './components/PostComposer';
import './Community.css';

export default function SanghaDetail() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sangha, setSangha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'members' | 'about'

  // Feed state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Members state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch Sangha details
  const fetchSangha = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/community/sanghas/${slugOrId}`);
      setSangha(res.data.sangha);
    } catch (err) {
      console.error('Failed to load sangha:', err);
    } finally {
      setLoading(false);
    }
  }, [slugOrId]);

  // Fetch group posts
  const fetchGroupFeed = useCallback(async (sanghaId) => {
    if (!sanghaId) return;
    setLoadingPosts(true);
    try {
      const res = await api.get(`/community/feed?sanghaId=${sanghaId}`);
      setPosts(res.data.feed || []);
    } catch (err) {
      console.error('Failed to load group feed:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Fetch group members
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get(`/community/sanghas/${slugOrId}/members`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    fetchSangha();
  }, [fetchSangha]);

  useEffect(() => {
    if (sangha?._id) {
      if (activeTab === 'feed') fetchGroupFeed(sangha._id);
      if (activeTab === 'members') fetchMembers();
    }
  }, [sangha?._id, activeTab, fetchGroupFeed, fetchMembers]);

  // Join/leave sangha
  const handleJoinToggle = async () => {
    if (!sangha?._id) return;
    try {
      const res = await api.post(`/community/sanghas/${sangha._id}/join`);
      if (res.data) {
        setSangha((prev) => ({
          ...prev,
          isMember: res.data.isMember,
          membersCount: res.data.membersCount,
        }));
      }
    } catch (err) {
      console.error('Failed to toggle sangha membership:', err);
    }
  };

  // Follow toggle on a member
  const handleFollowToggle = async (targetUserId) => {
    try {
      const res = await api.post(`/community/follow/${targetUserId}`);
      if (res.data) {
        setMembers((prev) =>
          prev.map((m) =>
            m.user._id === targetUserId
              ? { ...m, user: { ...m.user, isFollowing: res.data.isFollowing } }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  // Kudos toggle
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

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    if (sangha) {
      setSangha((prev) => ({ ...prev, postsCount: (prev.postsCount || 0) + 1 }));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="comm-root-container" style={{ textAlign: 'center', padding: '100px 0' }}>
          <div
            className="spinner"
            style={{
              width: 40,
              height: 40,
              margin: '0 auto 16px',
              borderColor: 'var(--comm-terracotta) transparent var(--comm-terracotta) transparent',
            }}
          />
          <p style={{ color: 'var(--comm-terracotta)', fontWeight: 600 }}>Gathering circle presence...</p>
        </main>
      </>
    );
  }

  if (!sangha) {
    return (
      <>
        <Navbar />
        <main className="comm-root-container">
          <div className="comm-empty-state" style={{ maxWidth: 600, margin: '60px auto' }}>
            <div className="comm-empty-icon">🏛️</div>
            <h3 className="comm-empty-title">Sangha Not Found</h3>
            <p className="comm-empty-desc">The circle you are seeking has either moved or does not exist.</p>
            <Link to="/community/sanghas" className="comm-btn-share">
              Return to Directory
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="comm-root-container">
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* Back button */}
          <button
            type="button"
            className="comm-back-nav"
            onClick={() => navigate('/community/sanghas')}
            id="btn-back-to-sanghas"
          >
            <ArrowLeft size={16} /> Back to Sangha Directory
          </button>

          {/* ── Sangha Hero Banner ── */}
          <section className="comm-detail-hero">
            <div className="comm-detail-hero-top">
              <div className="comm-detail-hero-info">
                <div className="comm-detail-hero-icon">🏛️</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="comm-level-badge" style={{ textTransform: 'capitalize' }}>
                      {sangha.type} Sangha
                    </span>
                    {sangha.isFeatured && (
                      <span className="comm-level-badge" style={{ background: 'var(--comm-terracotta-glow)' }}>
                        Featured Circle
                      </span>
                    )}
                  </div>
                  <h1 className="comm-detail-hero-title">{sangha.name}</h1>
                  <p className="comm-detail-hero-tagline">
                    {sangha.tagline || 'A sacred space for collective practice, sadhana sharing, and quiet encouragement.'}
                  </p>

                  <div className="comm-detail-hero-meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={15} /> <strong>{sangha.membersCount || 1}</strong> {sangha.membersCount === 1 ? 'Seeker' : 'Seekers'}
                    </span>
                    {sangha.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={15} /> {sangha.location}
                      </span>
                    )}
                    <span>• <strong>{sangha.postsCount || 0}</strong> Reflections</span>
                    {sangha.createdBy && (
                      <span>• Founded by {sangha.createdBy.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  className={`comm-btn-share ${sangha.isMember ? 'joined' : ''}`}
                  onClick={handleJoinToggle}
                  style={{
                    background: sangha.isMember ? 'var(--comm-bg-card)' : 'var(--comm-terracotta)',
                    color: sangha.isMember ? 'var(--comm-terracotta-dark)' : '#ffffff',
                    border: sangha.isMember ? '1px solid var(--comm-terracotta)' : 'none',
                  }}
                  id="sangha-detail-join-btn"
                >
                  {sangha.isMember ? 'Joined Circle ✓' : 'Join Circle'}
                </button>
              </div>
            </div>
          </section>

          {/* ── Inner Navigation Tabs ── */}
          <div className="comm-detail-tabs-bar" role="tablist">
            <button
              className={`comm-detail-tab-item ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
              id="tab-sangha-feed"
            >
              <MessageSquare size={16} />
              <span>Circle Feed ({sangha.postsCount || 0})</span>
            </button>
            <button
              className={`comm-detail-tab-item ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
              id="tab-sangha-members"
            >
              <Users size={16} />
              <span>Fellow Seekers ({sangha.membersCount || 1})</span>
            </button>
            <button
              className={`comm-detail-tab-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
              id="tab-sangha-about"
            >
              <BookOpen size={16} />
              <span>Sacred Guidelines</span>
            </button>
          </div>

          {/* ── TAB 1: FEED ── */}
          {activeTab === 'feed' && (
            <div>
              {sangha.isMember ? (
                <PostComposer
                  onPostCreated={handlePostCreated}
                  joinedSanghas={[sangha]}
                />
              ) : (
                <div
                  style={{
                    padding: 16,
                    background: 'var(--comm-gold-light)',
                    border: '1px solid var(--comm-border-gold)',
                    borderRadius: 'var(--comm-radius-md)',
                    marginBottom: 20,
                    textAlign: 'center',
                    fontSize: '0.92rem',
                    color: 'var(--comm-text-secondary)',
                  }}
                >
                  Join this circle to share reflections and sadhanas directly with fellow members.
                </div>
              )}

              {loadingPosts ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div
                    className="spinner"
                    style={{
                      width: 32,
                      height: 32,
                      margin: '0 auto 8px',
                      borderColor: 'var(--comm-terracotta) transparent var(--comm-terracotta) transparent',
                    }}
                  />
                  <p style={{ color: 'var(--comm-terracotta)', fontSize: '0.88rem' }}>Loading reflections...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="comm-empty-state">
                  <div className="comm-empty-icon">🕊️</div>
                  <h3 className="comm-empty-title">Silence in this Circle</h3>
                  <p className="comm-empty-desc">
                    No reflections have been posted to this sangha yet. Be the first to share an insight or practice!
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
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: MEMBERS ── */}
          {activeTab === 'members' && (
            <div>
              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div
                    className="spinner"
                    style={{
                      width: 32,
                      height: 32,
                      margin: '0 auto 8px',
                      borderColor: 'var(--comm-terracotta) transparent var(--comm-terracotta) transparent',
                    }}
                  />
                  <p style={{ color: 'var(--comm-terracotta)', fontSize: '0.88rem' }}>Gathering members...</p>
                </div>
              ) : (
                <div className="comm-members-grid">
                  {members.map((m) => {
                    const mInitials = (m.user.name || 'S')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <div key={m._id} className="comm-member-card-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: 'var(--comm-terracotta)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              flexShrink: 0,
                            }}
                          >
                            {mInitials}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-text-charcoal)' }}>
                              {m.user.name} {m.user.isSelf && '(You)'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span className="comm-level-badge">
                                Level {m.user.currentLevel || 1}
                              </span>
                              {m.role === 'owner' && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--comm-terracotta)', fontWeight: 700 }}>
                                  Founder
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!m.user.isSelf && (
                          <button
                            type="button"
                            className={`comm-btn-small ${m.user.isFollowing ? 'following' : ''}`}
                            onClick={() => handleFollowToggle(m.user._id)}
                            id={`member-follow-btn-${m.user._id}`}
                          >
                            {m.user.isFollowing ? 'Walking' : 'Walk With'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: ABOUT & GUIDELINES ── */}
          {activeTab === 'about' && (
            <div
              style={{
                background: 'var(--comm-bg-card-pure)',
                border: '1px solid var(--comm-border)',
                borderRadius: 'var(--comm-radius-lg)',
                padding: 28,
                boxShadow: 'var(--comm-shadow-card)',
              }}
            >
              <h3 style={{ fontFamily: 'var(--comm-font-serif)', fontSize: '1.5rem', margin: '0 0 12px' }}>
                About this Sacred Circle
              </h3>
              <p style={{ lineHeight: 1.6, color: 'var(--comm-text-secondary)', marginBottom: 24, fontSize: '0.96rem' }}>
                {sangha.description ||
                  'This circle exists for seekers walking the path in mutual support and spiritual discipline. Here we share insights from our daily sadhana, encourage one another, and hold a quiet space of collective intention.'}
              </p>

              <h4 style={{ fontFamily: 'var(--comm-font-serif)', fontSize: '1.25rem', margin: '0 0 10px', color: 'var(--comm-terracotta)' }}>
                Circle Principles & Norms
              </h4>
              <ul style={{ paddingLeft: 20, lineHeight: 1.7, color: 'var(--comm-text-secondary)', fontSize: '0.92rem' }}>
                <li><strong>Silence and Authenticity:</strong> Share what is real in your journey, not what sounds spiritual.</li>
                <li><strong>No Competition:</strong> Sadhana is between you and the infinite. No comparison of practices or milestones.</li>
                <li><strong>Quiet Encouragement:</strong> Offer Kudos (🙏) and thoughtful reflections to uplift fellow seekers.</li>
                <li><strong>Sacred Privacy:</strong> What is shared within this circle is honored and kept sacred.</li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
