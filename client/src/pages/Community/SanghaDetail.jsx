import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  Send,
  Clock,
  Check,
  X,
  Lock,
} from 'lucide-react';
import PostCard from './components/PostCard';
import PostComposer from './components/PostComposer';
import SeekerProfileModal from './components/SeekerProfileModal';
import PrivacySettingsModal from './components/PrivacySettingsModal';
import './Community.css';

export default function SanghaDetail() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [sangha, setSangha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'chat' | 'members' | 'about' | 'requests'

  // Seeker Public Profile & Privacy Modals
  const [profileModalUserId, setProfileModalUserId] = useState(null);
  const [profilePendingRequestId, setProfilePendingRequestId] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Feed state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Members state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Requests state (for creator/admin)
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Circle Chat Sanctuary state
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [newChatText, setNewChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatScrollRef = useRef(null);

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

  // Keep active tab in sync with membership status & URL parameters
  useEffect(() => {
    if (sangha) {
      const tabParam = searchParams.get('tab');
      if (tabParam === 'requests' && sangha.isOwnerOrAdmin) {
        setActiveTab('requests');
      } else if (!sangha.isMember) {
        setActiveTab('about');
      } else if (tabParam === 'chat') {
        setActiveTab('chat');
      } else if (tabParam === 'members') {
        setActiveTab('members');
      } else if (!tabParam && sangha.isMember) {
        setActiveTab('feed');
      }
    }
  }, [sangha?.isMember, sangha?.isOwnerOrAdmin, searchParams]);

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

  // Fetch pending join requests (for creator/admin)
  const fetchRequests = useCallback(async (sanghaId) => {
    if (!sanghaId) return;
    setLoadingRequests(true);
    try {
      const res = await api.get(`/community/sanghas/${sanghaId}/requests`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load join requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // Fetch circle chat messages
  const fetchChatMessages = useCallback(async (sanghaId) => {
    if (!sanghaId) return;
    try {
      const res = await api.get(`/community/sanghas/${sanghaId}/messages`);
      setChatMessages(res.data.messages || []);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Failed to load circle chat:', err);
    }
  }, []);

  useEffect(() => {
    fetchSangha();
  }, [fetchSangha]);

  useEffect(() => {
    if (sangha?._id) {
      if (activeTab === 'feed' && sangha.isMember) fetchGroupFeed(sangha._id);
      if (activeTab === 'members' && sangha.isMember) fetchMembers();
      if (activeTab === 'requests' && sangha.isOwnerOrAdmin) fetchRequests(sangha._id);
      if (activeTab === 'chat' && sangha.isMember) {
        setLoadingChat(true);
        fetchChatMessages(sangha._id).finally(() => setLoadingChat(false));
        const interval = setInterval(() => fetchChatMessages(sangha._id), 5000);
        return () => clearInterval(interval);
      }
    }
  }, [sangha?._id, activeTab, sangha?.isMember, sangha?.isOwnerOrAdmin, fetchGroupFeed, fetchMembers, fetchRequests, fetchChatMessages]);

  // Initial requests count check for creator badge
  useEffect(() => {
    if (sangha?._id && sangha.isOwnerOrAdmin) {
      api.get(`/community/sanghas/${sangha._id}/requests`)
        .then(res => setRequests(res.data.requests || []))
        .catch(() => {});
    }
  }, [sangha?._id, sangha?.isOwnerOrAdmin]);

  // Synchronize applicant modal from URL search params (e.g. ?tab=requests&userId=...)
  useEffect(() => {
    const userParam = searchParams.get('userId');
    if (userParam && requests.length > 0 && sangha?.isOwnerOrAdmin) {
      setProfileModalUserId(userParam);
      const match = requests.find(
        (r) => r.userId?._id?.toString() === userParam || r.userId?.toString() === userParam
      );
      if (match) {
        setProfilePendingRequestId(match._id);
      }
    }
  }, [requests, searchParams, sangha?.isOwnerOrAdmin]);

  // Join/leave or cancel request handler
  const handleJoinToggle = async () => {
    if (!sangha?._id) return;
    try {
      const res = await api.post(`/community/sanghas/${sangha._id}/join`);
      if (res.data) {
        setSangha((prev) => ({
          ...prev,
          isMember: res.data.isMember,
          membershipStatus: res.data.membershipStatus,
          membersCount: res.data.membersCount,
        }));
        if (res.data.isMember) {
          setActiveTab('feed');
        }
      }
    } catch (err) {
      console.error('Failed to toggle sangha membership:', err);
    }
  };

  // Creator approve/decline request
  const handleRequestAction = async (membershipId, action) => {
    if (!sangha?._id) return;
    try {
      const res = await api.put(`/community/sanghas/${sangha._id}/requests/${membershipId}`, { action });
      if (res.data) {
        setRequests(prev => prev.filter(r => r._id !== membershipId));
        if (action === 'approve') {
          setSangha(prev => ({ ...prev, membersCount: (prev.membersCount || 1) + 1 }));
          fetchMembers();
        }
      }
    } catch (err) {
      console.error('Error handling join request:', err);
    }
  };

  // Send message in Circle Sanctuary Chat
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newChatText.trim() || !sangha?._id || sendingChat) return;
    setSendingChat(true);
    try {
      const res = await api.post(`/community/sanghas/${sangha._id}/messages`, {
        content: newChatText.trim(),
      });
      if (res.data?.message) {
        setChatMessages(prev => [...prev, res.data.message]);
        setNewChatText('');
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        }, 80);
      }
    } catch (err) {
      console.error('Failed to send circle message:', err);
    } finally {
      setSendingChat(false);
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
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/community/circles');
              }
            }}
            id="btn-back-to-sanghas"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* ── Sangha Hero Banner ── */}
          <section className="comm-detail-hero">
            <div className="comm-detail-hero-top">
              <div className="comm-detail-hero-info">
                <div className="comm-detail-hero-icon">🏛️</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className="comm-level-badge" style={{ textTransform: 'capitalize' }}>
                      {sangha.type} Sangha
                    </span>
                    <span
                      className="comm-level-badge"
                      style={{
                        background: sangha.isPrivateCircle ? 'rgba(217, 119, 6, 0.14)' : 'rgba(78, 99, 70, 0.14)',
                        color: sangha.isPrivateCircle ? '#92400e' : '#3d5236',
                        border: sangha.isPrivateCircle ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(78, 99, 70, 0.35)',
                      }}
                    >
                      {sangha.isPrivateCircle ? '🔒 Private Circle (Approval Required)' : '🌐 Public Circle (Instant Entry)'}
                    </span>
                    {sangha.isFeatured && (
                      <span className="comm-level-badge" style={{ background: 'var(--comm-terracotta-glow)' }}>
                        Featured Circle
                      </span>
                    )}
                    {sangha.isOwnerOrAdmin && (
                      <span className="comm-level-badge" style={{ background: 'rgba(78, 99, 70, 0.2)', color: '#3d5236', border: '1px solid rgba(78, 99, 70, 0.4)' }}>
                        🛡️ Circle Admin
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
                    background: sangha.isMember
                      ? 'var(--comm-bg-card)'
                      : sangha.membershipStatus === 'pending'
                      ? 'rgba(196, 154, 69, 0.18)'
                      : 'var(--comm-terracotta)',
                    color: sangha.isMember
                      ? 'var(--comm-terracotta-dark)'
                      : sangha.membershipStatus === 'pending'
                      ? '#92400e'
                      : '#ffffff',
                    border: sangha.isMember
                      ? '1px solid var(--comm-terracotta)'
                      : sangha.membershipStatus === 'pending'
                      ? '1px solid #d97706'
                      : 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    borderRadius: 22,
                    fontWeight: 600,
                  }}
                  id="sangha-detail-join-btn"
                >
                  {sangha.isMember ? (
                    <>
                      <UserCheck size={16} /> Joined Circle ✓
                    </>
                  ) : sangha.membershipStatus === 'pending' ? (
                    <>
                      <Clock size={16} /> Request Pending ⏳ (Cancel)
                    </>
                  ) : sangha.isPrivateCircle ? (
                    <>
                      <UserPlus size={16} /> Request to Join Circle 🙏
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Join Circle 🙏 (Instant)
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ── Inner Navigation Tabs ── */}
          <div className="comm-detail-tabs-bar" role="tablist">
            {sangha.isMember && (
              <>
                <button
                  className={`comm-detail-tab-item ${activeTab === 'feed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('feed')}
                  id="tab-sangha-feed"
                >
                  <MessageSquare size={16} />
                  <span>Circle Feed ({sangha.postsCount || 0})</span>
                </button>
                <button
                  className={`comm-detail-tab-item ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                  id="tab-sangha-chat"
                >
                  <span>💬 Circle Chat</span>
                </button>
                <button
                  className={`comm-detail-tab-item ${activeTab === 'members' ? 'active' : ''}`}
                  onClick={() => setActiveTab('members')}
                  id="tab-sangha-members"
                >
                  <Users size={16} />
                  <span>Fellow Seekers ({sangha.membersCount || 1})</span>
                </button>
              </>
            )}

            <button
              className={`comm-detail-tab-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
              id="tab-sangha-about"
            >
              <BookOpen size={16} />
              <span>{sangha.isMember ? 'Sacred Guidelines' : 'Sanctuary & Guidelines'}</span>
            </button>

            {sangha.isOwnerOrAdmin && (
              <button
                className={`comm-detail-tab-item ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
                id="tab-sangha-requests"
                style={{
                  color: requests.length > 0 ? '#b85d36' : 'inherit',
                  fontWeight: requests.length > 0 ? 700 : 'inherit'
                }}
              >
                <Shield size={16} />
                <span>
                  Join Requests {requests.length > 0 ? `(${requests.length}) ⚡` : `(${requests.length})`}
                </span>
              </button>
            )}
          </div>

          {/* ── TAB 1: FEED (Members Only) ── */}
          {activeTab === 'feed' && sangha.isMember && (
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
                    borderRadius: 'var(--comm-radius-md)',
                    border: '1px solid rgba(196, 154, 69, 0.25)',
                    marginBottom: 20,
                    textAlign: 'center',
                    color: 'var(--comm-text-secondary)',
                    fontSize: '0.88rem',
                  }}
                >
                  {sangha.membershipStatus === 'pending'
                    ? 'Your join request has been submitted to the circle creator. Once approved, you can post reflections and connect freely.'
                    : 'Join this circle to share reflections, sadhana updates, and kriya questions with fellow members.'}
                </div>
              )}

              {loadingPosts ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>Loading circle reflections...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="comm-empty-state">
                  <div className="comm-empty-icon">🕊️</div>
                  <h3 className="comm-empty-title">Silence in the Circle</h3>
                  <p className="comm-empty-desc">
                    Be the first seeker to share a sacred insight or daily sadhana reflection in {sangha.name}.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUserId={user?._id || user?.id}
                      onKudosToggle={handleKudosToggle}
                      onAuthorClick={(authorId) => setProfileModalUserId(authorId)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: CIRCLE CHAT SANCTUARY (Members Only) ── */}
          {activeTab === 'chat' && sangha.isMember && (
            <div
              style={{
                background: 'var(--comm-bg-card-pure)',
                border: '1px solid var(--comm-border)',
                borderRadius: 'var(--comm-radius-lg)',
                padding: 20,
                boxShadow: 'var(--comm-shadow-card)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--comm-border-hairline)' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--comm-font-serif)', fontSize: '1.3rem', margin: 0, color: 'var(--comm-text-charcoal)' }}>
                      Circle Chat Sanctuary
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--comm-text-muted)', margin: '2px 0 0' }}>
                      Quiet presence and real-time encouragement among circle seekers
                    </p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#4E6346', background: 'rgba(78, 99, 70, 0.1)', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>
                    Active Sanctuary
                  </span>
                </div>

                {/* Messages stream */}
                <div
                  ref={chatScrollRef}
                  style={{
                    height: 380,
                    overflowY: 'auto',
                    padding: '12px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {loadingChat ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>Entering circle sanctuary...</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--comm-text-muted)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🕊️</div>
                      <p style={{ fontSize: '0.9rem', margin: 0 }}>The sanctuary is peaceful and silent.</p>
                      <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Be the first to offer a greeting or sadhana thought.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isSelf = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                      const senderName = msg.senderId?.name || 'Seeker';
                      const senderLevel = msg.senderId?.currentLevel || 1;
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={msg._id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isSelf ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isSelf ? 'var(--comm-terracotta)' : 'var(--comm-text-secondary)' }}>
                              {isSelf ? 'You' : senderName}
                            </span>
                            <span className="comm-level-badge" style={{ fontSize: '0.66rem', padding: '1px 5px' }}>
                              Lvl {senderLevel}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--comm-text-light)' }}>
                              {timeStr}
                            </span>
                          </div>

                          <div
                            style={{
                              maxWidth: '78%',
                              padding: '8px 14px',
                              borderRadius: isSelf ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                              background: isSelf ? 'var(--comm-terracotta)' : 'var(--comm-bg-card)',
                              color: isSelf ? '#ffffff' : 'var(--comm-text-charcoal)',
                              border: isSelf ? 'none' : '1px solid var(--comm-border-hairline)',
                              fontSize: '0.88rem',
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Composer */}
                <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder="Share a reflection or thought with the circle... (Enter to send)"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 20,
                      border: '1px solid var(--comm-border)',
                      background: 'var(--comm-bg-card)',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                    id="circle-chat-input"
                  />
                  <button
                    type="submit"
                    disabled={!newChatText.trim() || sendingChat}
                    className="comm-btn-share"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 20,
                      opacity: !newChatText.trim() || sendingChat ? 0.6 : 1,
                      cursor: !newChatText.trim() || sendingChat ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    id="circle-chat-send-btn"
                  >
                    <Send size={14} /> Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB 3: MEMBERS (Members Only) ── */}
          {activeTab === 'members' && sangha.isMember && (
            <div>
              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>Loading fellow seekers...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="comm-empty-state">
                  <div className="comm-empty-icon">👥</div>
                  <h3 className="comm-empty-title">No Members Listed Yet</h3>
                  <p className="comm-empty-desc">Be the first to join this sacred circle.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {members.map((m) => {
                    const initials = m.user.name
                      ? m.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                      : '🧘';

                    return (
                      <div
                        key={m._id}
                        style={{
                          background: 'var(--comm-bg-card-pure)',
                          border: '1px solid var(--comm-border)',
                          borderRadius: 'var(--comm-radius-md)',
                          padding: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: 'var(--comm-shadow-card)',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                          onClick={() => {
                            setProfileModalUserId(m.user._id);
                            setProfilePendingRequestId(null);
                          }}
                          title="Click to view seeker's public spiritual profile"
                        >
                          <div className="comm-post-avatar" style={{ width: 40, height: 40 }}>
                            {initials}
                          </div>
                          <div>
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

          {/* ── TAB 4: ABOUT & GUIDELINES ── */}
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
              {!sangha.isMember && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(254, 250, 242, 0.95), rgba(247, 240, 227, 0.9))',
                    border: '1px solid rgba(196, 154, 69, 0.35)',
                    borderRadius: 16,
                    padding: '32px 24px',
                    textAlign: 'center',
                    marginBottom: 28,
                    boxShadow: '0 4px 20px rgba(44, 38, 31, 0.05)',
                  }}
                  id="circle-protected-sanctuary-banner"
                >
                  <div style={{ fontSize: 38, marginBottom: 12 }}>🔒 🪷</div>
                  <h3
                    style={{
                      fontFamily: 'var(--comm-font-serif)',
                      fontSize: '1.6rem',
                      color: 'var(--comm-text-charcoal)',
                      margin: '0 0 8px',
                    }}
                  >
                    Protected Sacred Circle
                  </h3>
                  <p
                    style={{
                      color: 'var(--comm-text-secondary)',
                      fontSize: '0.94rem',
                      maxWidth: 520,
                      margin: '0 auto 20px',
                      lineHeight: 1.6,
                    }}
                  >
                    Feeds, live satsang discussions, and fellow seeker lists in {sangha.name} are consecrated and visible exclusively to approved members. Submit a request to the Circle Guide to join.
                  </p>

                  {sangha.membershipStatus === 'pending' ? (
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(217, 119, 6, 0.12)',
                          border: '1px solid #d97706',
                          color: '#92400e',
                          padding: '8px 22px',
                          borderRadius: 24,
                          fontWeight: 600,
                          fontSize: '0.92rem',
                        }}
                      >
                        <Clock size={16} /> Awaiting Approval from Circle Guide
                      </div>
                      <button
                        type="button"
                        onClick={handleJoinToggle}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--comm-text-muted)',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Cancel join request
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="comm-btn-share"
                      onClick={handleJoinToggle}
                      style={{
                        padding: '10px 28px',
                        fontSize: '0.95rem',
                        borderRadius: 24,
                        boxShadow: '0 4px 14px rgba(217, 87, 43, 0.25)',
                      }}
                      id="circle-sanctuary-join-btn"
                    >
                      <UserPlus size={18} /> Request to Join Circle 🙏
                    </button>
                  )}
                </div>
              )}

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

          {/* ── TAB 5: CREATOR JOIN REQUESTS REVIEW TRAY ── */}
          {activeTab === 'requests' && sangha.isOwnerOrAdmin && (
            <div
              style={{
                background: 'var(--comm-bg-card-pure)',
                border: '1px solid var(--comm-border)',
                borderRadius: 'var(--comm-radius-lg)',
                padding: 24,
                boxShadow: 'var(--comm-shadow-card)',
              }}
            >
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--comm-font-serif)', fontSize: '1.35rem', margin: '0 0 4px' }}>
                  Pending Join Requests
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)', margin: 0 }}>
                  Review seekers wishing to enter "{sangha.name}". Approved seekers receive access to the circle feed and chat.
                </p>
              </div>

              {loadingRequests ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>Loading join requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--comm-text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🕊️</div>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>No pending join requests at this moment.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {requests.map((reqItem) => {
                    const seeker = reqItem.userId;
                    const reqInitials = seeker?.name
                      ? seeker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : '🧘';

                    return (
                      <div
                        key={reqItem._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          background: 'var(--comm-bg-card)',
                          borderRadius: 'var(--comm-radius-md)',
                          border: '1px solid var(--comm-border-hairline)',
                          gap: 16,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}
                          onClick={() => {
                            setProfileModalUserId(seeker?._id);
                            setProfilePendingRequestId(reqItem._id);
                          }}
                          title="Click to view seeker's public profile before approving"
                        >
                          <div className="comm-post-avatar" style={{ width: 42, height: 42 }}>
                            {reqInitials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--comm-text-charcoal)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{seeker?.name || 'Unknown Seeker'}</span>
                              <span style={{ fontSize: '0.72rem', color: '#8b6b1b', background: 'rgba(196, 154, 69, 0.15)', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>
                                👁️ View Profile
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: '0.78rem', color: 'var(--comm-text-muted)' }}>
                              <span className="comm-level-badge">Lvl {seeker?.currentLevel || 1}</span>
                              {seeker?.city && <span>📍 {seeker.city}</span>}
                              {seeker?.selectedPractices?.length > 0 && (
                                <span>• {seeker.selectedPractices.slice(0, 2).join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(reqItem._id, 'approve')}
                            className="comm-btn-small"
                            style={{
                              background: '#4E6346',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: 16,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            id={`approve-btn-${reqItem._id}`}
                          >
                            <Check size={14} /> Approve 🙏
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(reqItem._id, 'decline')}
                            className="comm-btn-small"
                            style={{
                              background: 'transparent',
                              color: 'var(--comm-text-muted)',
                              border: '1px solid var(--comm-border)',
                              padding: '6px 14px',
                              borderRadius: 16,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                            }}
                            id={`decline-btn-${reqItem._id}`}
                          >
                            <X size={14} /> Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Seeker Profile Modal */}
      <SeekerProfileModal
        userId={profileModalUserId}
        isOpen={Boolean(profileModalUserId)}
        onClose={() => {
          setProfileModalUserId(null);
          setProfilePendingRequestId(null);
        }}
        pendingRequestId={profilePendingRequestId}
        requestContext="circle"
        onApprove={(reqId) => handleRequestAction(reqId, 'approve')}
        onDecline={(reqId) => handleRequestAction(reqId, 'decline')}
        onOpenPrivacySettings={() => setShowPrivacyModal(true)}
      />

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </>
  );
}
