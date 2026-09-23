import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import SeekerProfileModal from './components/SeekerProfileModal';
import PrivacySettingsModal from './components/PrivacySettingsModal';
import './Community.css';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  Send,
  ArrowLeft,
  Sparkles,
  Lock,
  UserCheck,
  Check,
  X,
  MessageSquare,
  Shield,
  Compass,
} from 'lucide-react';

export default function GatheringDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [gathering, setGathering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attendees' | 'chat' | 'requests'

  // Request to attend state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Seeker Profile Modal state
  const [profileModalUserId, setProfileModalUserId] = useState(null);
  const [profilePendingRequestId, setProfilePendingRequestId] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  const fetchGathering = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/community/gatherings/${id}`);
      setGathering(res.data.gathering);
    } catch (err) {
      console.error('Failed to load gathering details:', err);
      setError(err.response?.data?.message || 'Gathering not found or unable to load.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/community/gatherings/${id}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load gathering chat messages:', err);
    }
  };

  useEffect(() => {
    fetchGathering();
  }, [id]);

  // Synchronize activeTab and applicant modal from URL search params (e.g. ?tab=requests&userId=...)
  useEffect(() => {
    if (gathering) {
      const tabParam = searchParams.get('tab');
      const userParam = searchParams.get('userId');
      const isHost =
        gathering.isCreator ||
        gathering.createdBy?._id === user?._id ||
        gathering.createdBy === user?._id;

      if (tabParam === 'requests' && isHost) {
        setActiveTab('requests');
      }

      if (userParam && isHost) {
        setProfileModalUserId(userParam);
        const matchingReq = (gathering.joinRequests || []).find(
          (r) =>
            (r.userId?._id?.toString() === userParam || r.userId?.toString() === userParam) &&
            r.status === 'pending'
        );
        if (matchingReq) {
          setProfilePendingRequestId(matchingReq._id);
        }
      }
    }
  }, [gathering, searchParams, user?._id]);

  useEffect(() => {
    if (activeTab === 'chat' && (gathering?.isAttending || gathering?.isCreator)) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, gathering?.isAttending, gathering?.isCreator, id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Request to Attend
  const handleRequestJoin = async () => {
    setSubmittingAction(true);
    setActionSuccessMsg('');
    try {
      const res = await api.post(`/community/gatherings/${id}/request-join`, {
        note: requestNote,
      });
      setShowNoteModal(false);
      setRequestNote('');
      setActionSuccessMsg(res.data.message || 'Request submitted for host approval! 🙏');
      await fetchGathering();
    } catch (err) {
      console.error('Request join error:', err);
      alert(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Leave or Withdraw Request
  const handleLeaveOrWithdraw = async () => {
    const isAttending = gathering?.isAttending;
    const confirmPrompt = isAttending
      ? 'Are you sure you wish to withdraw your attendance from this sacred gathering?'
      : 'Cancel your pending request to attend this gathering?';
    if (!window.confirm(confirmPrompt)) return;

    setSubmittingAction(true);
    try {
      await api.post(`/community/gatherings/${id}/leave`);
      setActionSuccessMsg(isAttending ? 'Attendance canceled.' : 'Request withdrawn.');
      await fetchGathering();
    } catch (err) {
      console.error('Leave error:', err);
      alert(err.response?.data?.message || 'Could not update attendance.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Host reviews request (Approve / Decline)
  const handleReviewRequest = async (requestId, action) => {
    try {
      await api.put(`/community/gatherings/${id}/requests/${requestId}`, { action });
      await fetchGathering();
    } catch (err) {
      console.error('Review request error:', err);
      alert(err.response?.data?.message || 'Failed to process request.');
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await api.post(`/community/gatherings/${id}/messages`, {
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (start, end) => {
    if (!start) return '';
    const s = new Date(start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (!end) return s;
    const e = new Date(end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${s} – ${e}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="comm-root-container" style={{ textAlign: 'center', padding: '120px 20px' }}>
          <div className="comm-empty-icon" style={{ animation: 'spin 3s linear infinite', fontSize: '3rem' }}>🪷</div>
          <h2 className="comm-serif" style={{ color: 'var(--comm-terracotta)', marginTop: 16, fontSize: '1.6rem' }}>
            Entering the Sacred Gathering Sanctuary...
          </h2>
        </main>
      </>
    );
  }

  if (error || !gathering) {
    return (
      <>
        <Navbar />
        <main className="comm-root-container" style={{ padding: '80px 20px' }}>
          <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center', background: 'var(--comm-bg-card-pure)', padding: '40px 32px', borderRadius: 20, border: '1px solid var(--comm-border-gold)', boxShadow: 'var(--comm-shadow-card)' }}>
            <AlertCircle size={48} color="var(--comm-terracotta)" style={{ margin: '0 auto 16px' }} />
            <h2 className="comm-serif" style={{ fontSize: '1.8rem', color: 'var(--comm-text-charcoal)' }}>{error || 'Gathering Not Found'}</h2>
            <p style={{ color: 'var(--comm-text-muted)', marginBottom: 24, fontSize: '0.95rem' }}>
              The gathering you are looking for may have concluded or been relocated.
            </p>
            <button
              type="button"
              className="comm-btn-primary"
              onClick={() => navigate('/community/gatherings')}
            >
              ← Return to Gatherings Directory
            </button>
          </div>
        </main>
      </>
    );
  }

  const isCreator = gathering.isCreator;
  const isAttending = gathering.isAttending;
  const isPending = gathering.myJoinRequest?.status === 'pending';
  const pendingRequests = (gathering.joinRequests || []).filter((r) => r.status === 'pending');
  const spotsLeft = Math.max(0, (gathering.capacity || 40) - (gathering.attendeesCount || 0));

  return (
    <>
      <Navbar />

      <main className="comm-root-container">
        <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {/* ── Top Navigation Bar ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              className="comm-back-nav"
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/community/gatherings');
                }
              }}
              style={{ margin: 0 }}
              id="btn-back-from-gathering-detail"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {gathering.sanghaId && (
              <Link
                to={`/community/circles/${gathering.sanghaId._id || gathering.sanghaId}`}
                className="comm-back-nav"
                style={{ margin: 0, color: 'var(--comm-olive)', gap: 4 }}
              >
                <span>Circle: {gathering.sanghaId.name || 'View Sangha'}</span>
                <span>→</span>
              </Link>
            )}
          </div>

          {/* ── Feedback Alert Notice ── */}
          {actionSuccessMsg && (
            <div
              style={{
                background: 'rgba(78, 99, 70, 0.12)',
                border: '1px solid #4E6346',
                borderRadius: 12,
                padding: '12px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#344530',
                fontWeight: 600,
                fontSize: '0.92rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#4E6346" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccessMsg('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#344530' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ── 1. Sacred Gathering Hero Card ── */}
          <section
            className="comm-detail-hero"
            style={{
              padding: '32px 36px',
              borderRadius: 20,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--comm-shadow-card)',
              marginBottom: 26,
            }}
          >
            {/* Top Metadata Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: gathering.eventType === 'in_person' ? 'rgba(78,99,70,0.12)' : 'rgba(196,154,69,0.18)',
                    color: gathering.eventType === 'in_person' ? 'var(--comm-olive)' : '#8b6b1b',
                    border: gathering.eventType === 'in_person' ? '1px solid rgba(78,99,70,0.25)' : '1px solid rgba(196,154,69,0.3)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {gathering.eventType === 'in_person' ? '🏛️ In-Person Gathering' : gathering.eventType === 'online' ? '🌐 Online Sanctuary' : '🌲 Sacred Retreat'}
                </span>

                {gathering.requiresApproval ? (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: 'rgba(217, 87, 43, 0.1)',
                      color: 'var(--comm-terracotta)',
                      border: '1px solid rgba(217, 87, 43, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Lock size={12} /> Host Blessing / Approval Required
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: 'rgba(78,99,70,0.1)',
                      color: 'var(--comm-olive)',
                      border: '1px solid rgba(78,99,70,0.25)',
                    }}
                  >
                    🌐 Open Attendance
                  </span>
                )}
              </div>

              {/* Attendance Status Badges */}
              <div>
                {isCreator && (
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '5px 14px',
                      borderRadius: 20,
                      background: 'rgba(196, 154, 69, 0.22)',
                      color: '#8b6b1b',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    👑 You Are the Host
                  </span>
                )}
                {!isCreator && isAttending && (
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '5px 16px',
                      borderRadius: 20,
                      background: '#4E6346',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(78, 99, 70, 0.3)',
                    }}
                  >
                    <CheckCircle2 size={14} /> Confirmed Attendee 🙏
                  </span>
                )}
                {!isCreator && isPending && (
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '5px 14px',
                      borderRadius: 20,
                      background: 'rgba(217, 87, 43, 0.15)',
                      color: 'var(--comm-terracotta)',
                      border: '1px solid rgba(217, 87, 43, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    ⏳ Request Pending Host Blessing
                  </span>
                )}
              </div>
            </div>

            {/* Gathering Main Title */}
            <h1
              className="comm-detail-hero-title"
              style={{
                fontSize: '2.3rem',
                margin: '0 0 14px',
                lineHeight: 1.2,
                color: 'var(--comm-text-charcoal)',
              }}
            >
              {gathering.title}
            </h1>

            {/* Description */}
            {gathering.description && (
              <p
                className="comm-detail-hero-tagline"
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  margin: '0 0 24px',
                  maxWidth: 820,
                }}
              >
                {gathering.description}
              </p>
            )}

            {/* Key Facts Pill Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 14,
                background: 'rgba(255, 255, 255, 0.72)',
                border: '1px solid rgba(196, 154, 69, 0.25)',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(44, 38, 31, 0.03)',
              }}
            >
              {/* Date & Day */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(217, 87, 43, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--comm-terracotta)',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--comm-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Date of Satsang
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--comm-text-charcoal)' }}>
                    {formatDateLong(gathering.startTime)}
                  </div>
                </div>
              </div>

              {/* Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(196, 154, 69, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8b6b1b',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--comm-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Time Window
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--comm-text-charcoal)' }}>
                    {formatTime(gathering.startTime, gathering.endTime)}
                  </div>
                </div>
              </div>

              {/* Location / Platform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(78, 99, 70, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--comm-olive)',
                    flexShrink: 0,
                  }}
                >
                  {gathering.eventType === 'in_person' ? <MapPin size={20} /> : <Video size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--comm-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Venue Location
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--comm-text-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                    {gathering.venue?.name || gathering.locationOrLink || 'Ashram Sanctuary'}
                  </div>
                </div>
              </div>

              {/* Capacity & Attendance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(44, 38, 31, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--comm-text-charcoal)',
                    flexShrink: 0,
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--comm-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Capacity
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--comm-text-charcoal)' }}>
                    {gathering.attendeesCount || 0} attending • <span style={{ color: spotsLeft > 0 ? 'var(--comm-olive)' : 'var(--comm-terracotta)' }}>{spotsLeft} spots open</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                paddingTop: 18,
                borderTop: '1px solid rgba(217, 87, 43, 0.15)',
              }}
            >
              {/* Host info snippet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(217, 87, 43, 0.15) 0%, rgba(196, 154, 69, 0.2) 100%)',
                    border: '2px solid var(--comm-terracotta)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: 'var(--comm-terracotta)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(217, 87, 43, 0.2)',
                  }}
                  onClick={() => gathering.createdBy?._id && setProfileModalUserId(gathering.createdBy._id)}
                  title="View Host Spiritual Profile"
                >
                  {gathering.createdBy?.name
                    ? gathering.createdBy.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '🧘'}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--comm-text-charcoal)' }}>
                    Guided by {gathering.contactPerson?.name || gathering.createdBy?.name || 'Isha Volunteer'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--comm-text-muted)' }}>
                    {gathering.contactPerson?.ishaRole || 'Consecrated Space Coordinator'}
                  </div>
                </div>
              </div>

              {/* Attendance Call To Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isCreator ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="comm-btn-primary"
                      onClick={() => setActiveTab('requests')}
                      style={{ background: '#8b6b1b', borderColor: '#8b6b1b', padding: '10px 22px', borderRadius: 24 }}
                    >
                      ⚡ Review Requests ({pendingRequests.length})
                    </button>
                  </div>
                ) : isAttending ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      className="comm-btn-small joined"
                      onClick={() => setActiveTab('chat')}
                      style={{ padding: '9px 20px', fontSize: '0.9rem', borderRadius: 20 }}
                    >
                      💬 Enter Satsang Chat
                    </button>
                    <button
                      type="button"
                      onClick={handleLeaveOrWithdraw}
                      disabled={submittingAction}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--comm-border-medium)',
                        padding: '8px 16px',
                        borderRadius: 20,
                        fontSize: '0.84rem',
                        color: 'var(--comm-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel Attendance
                    </button>
                  </div>
                ) : isPending ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        padding: '8px 18px',
                        borderRadius: 20,
                        background: 'rgba(196, 154, 69, 0.2)',
                        color: '#8b6b1b',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        border: '1px solid rgba(196, 154, 69, 0.35)',
                      }}
                    >
                      ⏳ Request Pending Approval
                    </span>
                    <button
                      type="button"
                      onClick={handleLeaveOrWithdraw}
                      disabled={submittingAction}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--comm-border-medium)',
                        padding: '8px 16px',
                        borderRadius: 20,
                        fontSize: '0.84rem',
                        color: 'var(--comm-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Withdraw Request
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(true)}
                    disabled={submittingAction}
                    className="comm-btn-primary"
                    style={{
                      padding: '11px 26px',
                      fontSize: '0.96rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 24,
                      boxShadow: '0 4px 16px rgba(217, 87, 43, 0.32)',
                    }}
                    id="gathering-wish-to-attend-btn"
                  >
                    <Sparkles size={16} /> Wish to Attend 🙏
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── 2. Segmented Navigation Tabs ── */}
          <div className="comm-tabs-bar" style={{ maxWidth: 760, margin: '0 auto 28px' }}>
            <button
              type="button"
              className={`comm-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📜 Overview & Guidelines
            </button>

            <button
              type="button"
              className={`comm-tab-btn ${activeTab === 'attendees' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendees')}
            >
              🪷 Confirmed Seekers ({gathering.attendeesCount || 0})
            </button>

            <button
              type="button"
              className={`comm-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <span>💬 Satsang Chat</span>
              {!isAttending && !isCreator && <Lock size={12} />}
            </button>

            {isCreator && (
              <button
                type="button"
                className={`comm-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
                style={{
                  color: pendingRequests.length > 0 && activeTab !== 'requests' ? 'var(--comm-terracotta)' : undefined,
                  fontWeight: pendingRequests.length > 0 ? 800 : undefined,
                }}
              >
                ⚡ Requests ({pendingRequests.length})
              </button>
            )}
          </div>

          {/* ── 3. Tab Contents ── */}

          {/* ── TAB 1: OVERVIEW & SACRED GUIDELINES ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)', gap: 24 }}>
              {/* Left Column: Agenda & Guidelines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Agenda / Schedule Timeline */}
                <div
                  style={{
                    background: 'var(--comm-bg-card-pure)',
                    border: '1px solid var(--comm-border-gold)',
                    borderRadius: 18,
                    padding: '24px 28px',
                    boxShadow: 'var(--comm-shadow-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: '1.3rem' }}>⏳</span>
                    <h3 className="comm-serif" style={{ fontSize: '1.35rem', color: 'var(--comm-text-charcoal)', margin: 0, fontWeight: 700 }}>
                      Flow of Sacred Schedule
                    </h3>
                  </div>

                  {gathering.agenda && gathering.agenda.length > 0 ? (
                    <div style={{ position: 'relative', paddingLeft: 22, borderLeft: '2px solid rgba(217, 87, 43, 0.25)', marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {gathering.agenda.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          {/* Glowing dot on timeline */}
                          <div
                            style={{
                              position: 'absolute',
                              left: -29,
                              top: 4,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: 'var(--comm-terracotta)',
                              border: '2px solid #fffdf7',
                              boxShadow: '0 0 6px rgba(217, 87, 43, 0.45)',
                            }}
                          />
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(196, 154, 69, 0.16)', color: '#8b6b1b', padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: '0.78rem', marginBottom: 6 }}>
                            <Clock size={12} />
                            <span>{item.time}</span>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--comm-text-charcoal)', fontSize: '1rem', lineHeight: 1.3 }}>
                            {item.activity}
                          </div>
                          {item.description && (
                            <div style={{ fontSize: '0.88rem', color: 'var(--comm-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--comm-text-muted)', fontSize: '0.9rem' }}>
                      Standard satsang schedule: Guru Pooja, collective chants, guided sadhana alignment, followed by quiet contemplation.
                    </div>
                  )}
                </div>

                {/* Sacred Preparation Guidelines */}
                <div
                  style={{
                    background: 'var(--comm-bg-card-pure)',
                    border: '1px solid var(--comm-border-gold)',
                    borderRadius: 18,
                    padding: '24px 28px',
                    boxShadow: 'var(--comm-shadow-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: '1.3rem' }}>🪷</span>
                    <h3 className="comm-serif" style={{ fontSize: '1.35rem', color: 'var(--comm-text-charcoal)', margin: 0, fontWeight: 700 }}>
                      Consecrated Space Guidelines
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(gathering.guidelines && gathering.guidelines.length > 0
                      ? gathering.guidelines
                      : [
                          'Please wear light-colored or white natural fiber clothing suitable for sitting on the floor.',
                          'Arrive 15 minutes prior to start time to settle in quiet stillness.',
                          'Maintain empty stomach condition (4 hours after full meal, 2.5 hours after snack) if practicing kriyas.',
                          'Keep mobile phones switched off or in sacred silence throughout the session.',
                          'Bring your sadhana asana (cotton/silk mat) if attending in person.',
                        ]
                    ).map((rule, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'rgba(78, 99, 70, 0.12)',
                            color: 'var(--comm-olive)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <Check size={13} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '0.92rem', color: 'var(--comm-text-charcoal)', lineHeight: 1.55 }}>
                          {rule}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Venue Map / Link & Isha Coordinator Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Venue Card */}
                <div
                  style={{
                    background: 'var(--comm-bg-card-pure)',
                    border: '1px solid var(--comm-border-gold)',
                    borderRadius: 18,
                    padding: '22px 24px',
                    boxShadow: 'var(--comm-shadow-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(217, 87, 43, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--comm-terracotta)' }}>
                      <MapPin size={17} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', color: 'var(--comm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      {gathering.eventType === 'in_person' ? 'Location & Directions' : 'Online Platform'}
                    </h4>
                  </div>

                  <div style={{ fontWeight: 700, color: 'var(--comm-text-charcoal)', fontSize: '1.05rem', marginBottom: 6 }}>
                    {gathering.venue?.name || gathering.locationOrLink || 'Ashram Sanctuary'}
                  </div>

                  {gathering.venue?.address && (
                    <div style={{ fontSize: '0.88rem', color: 'var(--comm-text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                      {gathering.venue.address}, {gathering.venue.city}
                    </div>
                  )}

                  {gathering.eventType === 'in_person' && gathering.venue?.mapLink && (
                    <a
                      href={gathering.venue.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.88rem',
                        color: 'var(--comm-terracotta)',
                        textDecoration: 'none',
                        fontWeight: 700,
                        background: 'rgba(217, 87, 43, 0.08)',
                        padding: '8px 14px',
                        borderRadius: 8,
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink size={14} />
                    </a>
                  )}

                  {gathering.eventType === 'online' && (
                    <div>
                      {isAttending || isCreator ? (
                        <a
                          href={gathering.locationOrLink?.startsWith('http') ? gathering.locationOrLink : `https://${gathering.locationOrLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="comm-btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: '0.88rem', borderRadius: 20 }}
                        >
                          <Video size={16} /> Enter Live Online Sanctuary
                        </a>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'var(--comm-text-muted)', fontStyle: 'italic', background: 'var(--comm-bg-parchment)', padding: '10px 14px', borderRadius: 8 }}>
                          🔒 Online meeting link is revealed upon confirmed attendance approval.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Isha Coordinator / Contact Person */}
                <div
                  style={{
                    background: 'var(--comm-bg-card-pure)',
                    border: '1px solid var(--comm-border-gold)',
                    borderRadius: 18,
                    padding: '22px 24px',
                    boxShadow: 'var(--comm-shadow-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(196, 154, 69, 0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b6b1b' }}>
                      <Users size={17} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', color: 'var(--comm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      Gathering Coordinator
                    </h4>
                  </div>

                  <div style={{ fontWeight: 700, color: 'var(--comm-text-charcoal)', fontSize: '1.05rem', marginBottom: 2 }}>
                    {gathering.contactPerson?.name || gathering.createdBy?.name || 'Isha Seva Team'}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--comm-olive)', fontWeight: 600, marginBottom: 14 }}>
                    {gathering.contactPerson?.ishaRole || 'Dedicated Sadhana Volunteer'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
                    {gathering.contactPerson?.phone && (
                      <a
                        href={`tel:${gathering.contactPerson.phone}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--comm-text-charcoal)', textDecoration: 'none' }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(217, 87, 43, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Phone size={13} color="var(--comm-terracotta)" />
                        </div>
                        <span style={{ fontWeight: 500 }}>{gathering.contactPerson.phone}</span>
                      </a>
                    )}
                    {gathering.contactPerson?.email && (
                      <a
                        href={`mailto:${gathering.contactPerson.email}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--comm-text-charcoal)', textDecoration: 'none' }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(217, 87, 43, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Mail size={13} color="var(--comm-terracotta)" />
                        </div>
                        <span style={{ fontWeight: 500 }}>{gathering.contactPerson.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ── TAB 2: CONFIRMED SEEKERS ── */}
        {activeTab === 'attendees' && (
          <div
            style={{
              background: 'var(--comm-bg-card-pure)',
              border: '1px solid var(--comm-border)',
              borderRadius: 'var(--comm-radius-lg)',
              padding: 24,
              boxShadow: 'var(--comm-shadow-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 className="comm-serif" style={{ fontSize: '1.35rem', margin: 0 }}>
                  Fellow Seekers in Presence
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--comm-text-muted)' }}>
                  Click any seeker to view their public sadhana journey and practices.
                </p>
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--comm-text-muted)', fontWeight: 600 }}>
                {gathering.attendees?.length || 0} Sadhakas Confirmed
              </div>
            </div>

            {(!gathering.attendees || gathering.attendees.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--comm-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🧘</div>
                <div>Be the first seeker to confirm attendance for this gathering.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {gathering.attendees.map((attendee) => {
                  const attInitials = attendee.name
                    ? attendee.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '🧘';

                  return (
                    <div
                      key={attendee._id}
                      onClick={() => setProfileModalUserId(attendee._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: 'var(--comm-bg-card)',
                        border: '1px solid var(--comm-border-hairline)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                      title={`Click to view ${attendee.name}'s spiritual profile`}
                    >
                      <div className="comm-post-avatar" style={{ width: 42, height: 42, fontSize: '0.88rem' }}>
                        {attInitials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-text-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {attendee.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--comm-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Level {attendee.currentLevel || 1}</span>
                          {attendee.city && <span>• 📍 {attendee.city}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: IN-GATHERING SATSANG CHAT ── */}
        {activeTab === 'chat' && (
          <div
            style={{
              background: 'var(--comm-bg-card-pure)',
              border: '1px solid var(--comm-border)',
              borderRadius: 'var(--comm-radius-lg)',
              padding: 24,
              boxShadow: 'var(--comm-shadow-card)',
            }}
          >
            {(!isAttending && !isCreator) ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', maxWidth: 500, margin: '0 auto' }}>
                <Lock size={36} color="var(--comm-gold)" style={{ marginBottom: 14 }} />
                <h3 className="comm-serif" style={{ fontSize: '1.35rem', marginBottom: 8 }}>
                  Satsang Discussion Reserved for Attendees
                </h3>
                <p style={{ color: 'var(--comm-text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                  This interactive chat sanctuary is reserved for seekers whose attendance has been confirmed by the gathering host.
                </p>
                {!isPending ? (
                  <button
                    type="button"
                    className="comm-btn-primary"
                    onClick={() => setShowNoteModal(true)}
                  >
                    Wish to Attend 🙏
                  </button>
                ) : (
                  <span style={{ fontSize: '0.86rem', color: '#8b6b1b', fontWeight: 600 }}>
                    ⏳ Your attendance request is awaiting blessing from the host.
                  </span>
                )}
              </div>
            ) : (
              <div>
                <div style={{ borderBottom: '1px solid var(--comm-border-hairline)', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="comm-serif" style={{ margin: 0, fontSize: '1.25rem' }}>
                      Gathering Satsang Stream
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--comm-text-muted)' }}>
                      Connect with fellow practitioners, ask ride-shares, or coordinate seva.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--comm-olive)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> Sacred Stream Active
                  </span>
                </div>

                {/* Messages Container */}
                <div
                  style={{
                    height: 380,
                    overflowY: 'auto',
                    padding: '12px 14px',
                    background: 'var(--comm-bg-parchment)',
                    border: '1px solid var(--comm-border-hairline)',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--comm-text-muted)', fontSize: '0.9rem' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🕊️</div>
                      Quietness in the gathering. Be the first to share a question or note with fellow attendees.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                      const senderInitials = msg.senderId?.name
                        ? msg.senderId.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                        : '🧘';

                      return (
                        <div
                          key={msg._id}
                          style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                          }}
                        >
                          {!isMe && (
                            <div
                              className="comm-post-avatar"
                              style={{ width: 32, height: 32, fontSize: '0.75rem', cursor: 'pointer' }}
                              onClick={() => msg.senderId?._id && setProfileModalUserId(msg.senderId._id)}
                              title={`View ${msg.senderId?.name}'s profile`}
                            >
                              {senderInitials}
                            </div>
                          )}

                          <div
                            style={{
                              background: isMe ? 'rgba(78, 99, 70, 0.15)' : '#ffffff',
                              border: isMe ? '1px solid #4E6346' : '1px solid var(--comm-border-hairline)',
                              borderRadius: 12,
                              padding: '8px 14px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--comm-text-charcoal)' }}>
                                {isMe ? 'You' : msg.senderId?.name || 'Seeker'}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--comm-text-muted)' }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--comm-text-charcoal)', lineHeight: 1.45 }}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Share a reflection or coordinate with attendees..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 20,
                      border: '1px solid var(--comm-border)',
                      background: '#ffffff',
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="comm-btn-primary"
                    style={{ borderRadius: 20, padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={15} /> Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: ATTENDANCE REQUESTS TRAY (Host Only) ── */}
        {activeTab === 'requests' && isCreator && (
          <div
            style={{
              background: 'var(--comm-bg-card-pure)',
              border: '1px solid var(--comm-border-gold)',
              borderRadius: 'var(--comm-radius-lg)',
              padding: 24,
              boxShadow: 'var(--comm-shadow-card)',
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <h3 className="comm-serif" style={{ fontSize: '1.35rem', margin: 0, color: 'var(--comm-text-charcoal)' }}>
                Seekers Awaiting Attendance Approval ({pendingRequests.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--comm-text-muted)' }}>
                Review applicants' spiritual background and intentions before granting entrance to the consecrated space.
              </p>
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--comm-text-muted)' }}>
                <CheckCircle2 size={36} color="var(--comm-olive)" style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 600, fontSize: '0.96rem' }}>All requests have been blessed and reviewed!</div>
                <div style={{ fontSize: '0.84rem', marginTop: 4 }}>New requests to attend will appear here in real time.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pendingRequests.map((reqItem) => {
                  const seeker = reqItem.userId || {};
                  const initials = seeker.name
                    ? seeker.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '🧘';

                  return (
                    <div
                      key={reqItem._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: 'var(--comm-bg-card)',
                        border: '1px solid var(--comm-border-hairline)',
                        borderRadius: 14,
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Left: Applicant details (Clickable to view profile) */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', flex: 1, minWidth: 260 }}
                        onClick={() => {
                          if (seeker._id) {
                            setProfileModalUserId(seeker._id);
                            setProfilePendingRequestId(reqItem._id);
                          }
                        }}
                        title="Click to view seeker's complete spiritual profile"
                      >
                        <div className="comm-post-avatar" style={{ width: 46, height: 46, fontSize: '0.95rem' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--comm-text-charcoal)' }}>
                              {seeker.name || 'Fellow Seeker'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#8b6b1b', background: 'rgba(196, 154, 69, 0.15)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                              👁️ View Profile
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontSize: '0.8rem', color: 'var(--comm-text-muted)' }}>
                            <span>Level {seeker.currentLevel || 1}</span>
                            {seeker.city && <span>• 📍 {seeker.city}</span>}
                            <span>• Requested {new Date(reqItem.requestedAt).toLocaleDateString()}</span>
                          </div>

                          {reqItem.note && (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: '0.84rem',
                                color: 'var(--comm-text-charcoal)',
                                background: 'rgba(196, 154, 69, 0.08)',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontStyle: 'italic',
                              }}
                            >
                              "{reqItem.note}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(reqItem._id, 'accepted')}
                          className="comm-btn-small"
                          style={{
                            background: '#4E6346',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 18px',
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={16} /> Approve Attendee 🙏
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReviewRequest(reqItem._id, 'declined')}
                          className="comm-btn-small"
                          style={{
                            background: 'transparent',
                            color: 'var(--comm-text-muted)',
                            border: '1px solid var(--comm-border)',
                            padding: '8px 14px',
                            borderRadius: 20,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={15} /> Decline
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

      {/* ── 4. Wish to Attend Note Modal ── */}
      {showNoteModal && (
        <div className="comm-modal-backdrop" onClick={() => setShowNoteModal(false)}>
          <div
            className="comm-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, width: '92%', borderRadius: 18 }}
          >
            <div className="comm-modal-header">
              <h3 className="comm-modal-title" style={{ fontSize: '1.25rem' }}>
                Wish to Attend Gathering 🙏
              </h3>
              <button
                type="button"
                className="comm-modal-close-btn"
                onClick={() => setShowNoteModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--comm-text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
              Your request will be submitted to <strong>{gathering.contactPerson?.name || gathering.createdBy?.name || 'the coordinator'}</strong> for blessing and space confirmation.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 6, color: 'var(--comm-text-charcoal)' }}>
                Note to Host (Optional):
              </label>
              <textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="E.g., I have been practicing Shambhavi daily for 6 months and look forward to chanting in group presence..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--comm-border)',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="comm-btn-outline"
                onClick={() => setShowNoteModal(false)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="comm-btn-primary"
                onClick={handleRequestJoin}
                disabled={submittingAction}
              >
                {submittingAction ? 'Submitting...' : 'Submit Request 🙏'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Seeker Profile Modal ── */}
      <SeekerProfileModal
        userId={profileModalUserId}
        isOpen={Boolean(profileModalUserId)}
        onClose={() => {
          setProfileModalUserId(null);
          setProfilePendingRequestId(null);
        }}
        pendingRequestId={profilePendingRequestId}
        requestContext="gathering"
        onApprove={async (reqId) => {
          await handleReviewRequest(reqId, 'accepted');
          setProfileModalUserId(null);
          setProfilePendingRequestId(null);
        }}
        onDecline={async (reqId) => {
          await handleReviewRequest(reqId, 'declined');
          setProfileModalUserId(null);
          setProfilePendingRequestId(null);
        }}
        onOpenPrivacySettings={() => setShowPrivacyModal(true)}
      />

      {/* ── 6. Privacy Settings Modal ── */}
      <PrivacySettingsModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </>
  );
}
