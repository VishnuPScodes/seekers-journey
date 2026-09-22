import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Shield,
  MessageSquare,
  Send,
  AlertCircle,
  ExternalLink,
  Users,
  Sparkles,
  Lock,
} from 'lucide-react';
import api from '../../../api';
import { useAuth } from '../../../context/AuthContext';

export default function GatheringDetailModal({ gatheringId, onClose, onUpdated }) {
  const { user } = useAuth();
  const [gathering, setGathering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'chat'
  const [requestNote, setRequestNote] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/community/gatherings/${gatheringId}`);
      setGathering(res.data.gathering);
    } catch (err) {
      console.error('Failed to load gathering details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/community/gatherings/${gatheringId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load gathering messages:', err);
    }
  };

  useEffect(() => {
    if (gatheringId) {
      fetchDetail();
    }
  }, [gatheringId]);

  useEffect(() => {
    if (activeTab === 'chat' && gathering?.isAttending) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, gathering?.isAttending]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleRequestJoin = async () => {
    setSubmittingRequest(true);
    try {
      const res = await api.post(`/community/gatherings/${gatheringId}/request-join`, {
        note: requestNote,
      });
      setRequestMsg(res.data.message || 'Request submitted!');
      setShowNoteInput(false);
      await fetchDetail();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Request join error:', err);
      setRequestMsg(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleReviewRequest = async (requestId, action) => {
    try {
      await api.put(`/community/gatherings/${gatheringId}/requests/${requestId}`, { action });
      await fetchDetail();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Error reviewing request:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await api.post(`/community/gatherings/${gatheringId}/messages`, {
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (!gatheringId) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeRange = (start, end) => {
    if (!start) return '';
    const s = new Date(start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (!end) return s;
    const e = new Date(end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${s} – ${e}`;
  };

  const spotsLeft = Math.max(0, (gathering?.capacity || 40) - (gathering?.attendeesCount || 0));

  return (
    <div className="comm-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="comm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 720,
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--comm-radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'var(--comm-bg-card)',
            borderBottom: '1px solid var(--comm-border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>🪷</span>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--comm-terracotta)', fontWeight: 700 }}>
                {gathering?.eventType === 'in_person' ? '🏛️ In-Person Gathering' : gathering?.eventType === 'online' ? '🌐 Online Sanctuary' : '🌲 Retreat'}
              </div>
              <h2 className="comm-serif" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--comm-text-charcoal)' }}>
                {loading ? 'Loading Gathering...' : gathering?.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="comm-btn-ghost"
            style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--comm-border-hairline)',
            background: 'var(--comm-bg-parchment)',
          }}
        >
          <button
            type="button"
            className={`comm-feed-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{ flex: 1, padding: '12px 16px', fontSize: '0.88rem', fontWeight: 600 }}
          >
            Sacred Agenda & Guidelines
          </button>
          <button
            type="button"
            className={`comm-feed-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <MessageSquare size={15} />
            <span>Gathering Chat</span>
            {!gathering?.isAttending && !gathering?.isCreator && (
              <Lock size={12} color="var(--comm-text-muted)" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--comm-text-muted)' }}>
              Loading sacred gathering details...
            </div>
          ) : activeTab === 'overview' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Timing & Venue Banner */}
              <div
                style={{
                  background: 'var(--comm-bg-card)',
                  border: '1px solid var(--comm-border-hairline)',
                  borderRadius: 'var(--comm-radius-md)',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--comm-terracotta)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Calendar size={14} />
                    <span>Date</span>
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--comm-text-charcoal)', marginTop: 2 }}>
                    {formatDate(gathering?.startTime)}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--comm-terracotta)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Clock size={14} />
                    <span>Timing</span>
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--comm-text-charcoal)', marginTop: 2 }}>
                    {formatTimeRange(gathering?.startTime, gathering?.endTime)}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--comm-terracotta)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Users size={14} />
                    <span>Capacity</span>
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--comm-text-charcoal)', marginTop: 2 }}>
                    {gathering?.attendeesCount || 0} attending • <span style={{ color: 'var(--comm-olive)' }}>{spotsLeft} spots left</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {gathering?.description && (
                <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--comm-text-charcoal)' }}>
                  {gathering.description}
                </div>
              )}

              {/* Venue & Location */}
              <div
                style={{
                  background: 'var(--comm-bg-card)',
                  border: '1px solid var(--comm-border-hairline)',
                  borderRadius: 'var(--comm-radius-md)',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-text-charcoal)' }}>
                    <MapPin size={16} color="var(--comm-terracotta)" />
                    <span>Location & Venue</span>
                  </div>
                  {gathering?.venue?.mapLink && (
                    <a
                      href={gathering.venue.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="comm-link-accent"
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      View on Google Maps <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--comm-text-charcoal)' }}>
                  {gathering?.venue?.name || gathering?.locationOrLink || 'To be announced'}
                </div>
                {gathering?.venue?.address && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--comm-text-muted)', marginTop: 2 }}>
                    {gathering.venue.address}, {gathering.venue.city}
                  </div>
                )}
                {gathering?.eventType === 'online' && gathering?.locationOrLink && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(78, 99, 70, 0.08)', borderRadius: 6, fontSize: '0.85rem', color: 'var(--comm-olive)' }}>
                    {gathering?.isAttending || gathering?.isCreator
                      ? <span>Link: <a href={gathering.locationOrLink} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--comm-olive)', textDecoration: 'underline' }}>Join Virtual Room</a></span>
                      : <span>🔒 Meeting link is unlocked once your join request is accepted by the host.</span>}
                  </div>
                )}
              </div>

              {/* Host & Contact Card */}
              <div
                style={{
                  background: 'var(--comm-bg-card)',
                  border: '1px solid var(--comm-border-hairline)',
                  borderRadius: 'var(--comm-radius-md)',
                  padding: '16px 20px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-text-charcoal)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={16} color="var(--comm-terracotta)" />
                  <span>Organized by & Contact</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'var(--comm-gold-light)',
                      border: '1px solid var(--comm-gold)',
                      color: 'var(--comm-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {(gathering?.contactPerson?.name || gathering?.createdBy?.name || 'S')[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--comm-text-charcoal)' }}>
                      {gathering?.contactPerson?.name || gathering?.createdBy?.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--comm-terracotta)', fontWeight: 500 }}>
                      {gathering?.contactPerson?.ishaRole || 'Isha Volunteer & Meditator'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, fontSize: '0.8rem', color: 'var(--comm-text-muted)', flexWrap: 'wrap' }}>
                      {gathering?.contactPerson?.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} />
                          <span>{gathering.contactPerson.phone}</span>
                        </div>
                      )}
                      {gathering?.contactPerson?.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={12} />
                          <span>{gathering.contactPerson.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sacred Agenda Timeline */}
              {gathering?.agenda && gathering.agenda.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--comm-text-charcoal)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="var(--comm-terracotta)" />
                    <span>Sacred Agenda</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {gathering.agenda.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                          padding: '10px 14px',
                          background: 'var(--comm-bg-card)',
                          borderRadius: 'var(--comm-radius-sm)',
                          border: '1px solid var(--comm-border-hairline)',
                        }}
                      >
                        <span
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(217, 87, 43, 0.1)',
                            color: 'var(--comm-terracotta)',
                            borderRadius: 4,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.time}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--comm-text-charcoal)' }}>
                            {item.activity}
                          </div>
                          {item.description && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--comm-text-muted)', marginTop: 2 }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sacred Guidelines Checklist */}
              {gathering?.guidelines && gathering.guidelines.length > 0 && (
                <div
                  style={{
                    background: 'rgba(78, 99, 70, 0.05)',
                    border: '1px solid rgba(78, 99, 70, 0.2)',
                    borderRadius: 'var(--comm-radius-md)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-olive)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} />
                    <span>Sacred Etiquette & Preparation Guidelines</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {gathering.guidelines.map((g, idx) => (
                      <li key={idx} style={{ fontSize: '0.86rem', color: 'var(--comm-text-charcoal)', lineHeight: 1.45 }}>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Host's Pending Join Requests Drawer (Visible only if current user is Creator) */}
              {gathering?.isCreator && (gathering?.joinRequests || []).length > 0 && (
                <div
                  style={{
                    background: 'var(--comm-bg-card)',
                    border: '1px solid var(--comm-gold)',
                    borderRadius: 'var(--comm-radius-md)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-gold)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={16} />
                    <span>Pending Seeker Join Requests ({gathering.joinRequests.filter(r => r.status === 'pending').length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {gathering.joinRequests.map((reqItem) => (
                      <div
                        key={reqItem._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--comm-bg-parchment)',
                          borderRadius: 6,
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--comm-text-charcoal)' }}>
                            {reqItem.userId?.name || 'Seeker'} (Lvl {reqItem.userId?.currentLevel || 1})
                          </div>
                          {reqItem.note && (
                            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--comm-text-muted)' }}>
                              "{reqItem.note}"
                            </div>
                          )}
                          <div style={{ fontSize: '0.74rem', color: 'var(--comm-text-muted)' }}>
                            Status: <strong style={{ textTransform: 'capitalize' }}>{reqItem.status}</strong>
                          </div>
                        </div>

                        {reqItem.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="comm-btn-small joined"
                              onClick={() => handleReviewRequest(reqItem._id, 'accepted')}
                            >
                              Accept 🙏
                            </button>
                            <button
                              type="button"
                              className="comm-btn-small"
                              onClick={() => handleReviewRequest(reqItem._id, 'declined')}
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: reqItem.status === 'accepted' ? 'var(--comm-olive)' : 'var(--comm-text-muted)' }}>
                            {reqItem.status === 'accepted' ? 'Accepted ✅' : 'Declined'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Gathering Live Chat */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
              {!gathering?.isAttending && !gathering?.isCreator ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--comm-text-muted)' }}>
                  <Lock size={36} color="var(--comm-terracotta)" style={{ margin: '0 auto 12px' }} />
                  <h3 className="comm-serif" style={{ fontSize: '1.2rem', color: 'var(--comm-text-charcoal)' }}>
                    Gathering Discussion Sanctuary
                  </h3>
                  <p style={{ maxWidth: 400, margin: '6px auto 16px', fontSize: '0.88rem' }}>
                    Discussion in this gathering is reserved for accepted seekers and the host. Submit a join request to participate in the conversation.
                  </p>
                  {gathering?.myJoinRequest?.status === 'pending' ? (
                    <span className="comm-pill-gold">⏳ Request Pending Host Approval</span>
                  ) : (
                    <button
                      type="button"
                      className="comm-btn-primary"
                      onClick={() => {
                        setActiveTab('overview');
                        setShowNoteInput(true);
                      }}
                    >
                      Request to Join Gathering
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--comm-text-muted)', fontSize: '0.88rem' }}>
                        No messages yet. Greet your fellow seekers! 🙏
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.senderId?._id?.toString() === user?._id?.toString() || m.senderId?.email === user?.email;
                        return (
                          <div
                            key={m._id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isMe ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <div style={{ fontSize: '0.74rem', color: 'var(--comm-text-muted)', marginBottom: 2 }}>
                              {isMe ? 'You' : m.senderId?.name} (Lvl {m.senderId?.currentLevel || 1}) •{' '}
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div
                              style={{
                                maxWidth: '75%',
                                padding: '10px 14px',
                                borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                background: isMe ? 'var(--comm-terracotta)' : 'var(--comm-bg-card)',
                                color: isMe ? '#fff' : 'var(--comm-text-charcoal)',
                                border: isMe ? 'none' : '1px solid var(--comm-border-hairline)',
                                fontSize: '0.9rem',
                                lineHeight: 1.45,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                              }}
                            >
                              {m.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--comm-border-hairline)' }}>
                    <input
                      type="text"
                      className="comm-input"
                      placeholder="Share a quiet reflection or coordinate logistics..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      className="comm-btn-primary"
                      disabled={!newMessage.trim() || sendingMessage}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={15} />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--comm-bg-card)',
            borderTop: '1px solid var(--comm-border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            {gathering?.isAttending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--comm-olive)', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} />
                <span>You are a Confirmed Attendee</span>
              </div>
            ) : gathering?.myJoinRequest?.status === 'pending' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--comm-gold)', fontWeight: 600, fontSize: '0.88rem' }}>
                <Clock size={16} />
                <span>Join Request Pending Host Review</span>
              </div>
            ) : gathering?.isCreator ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--comm-terracotta)', fontWeight: 700, fontSize: '0.9rem' }}>
                <Shield size={16} />
                <span>You are hosting this gathering</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--comm-text-muted)' }}>
                {spotsLeft > 0 ? `${spotsLeft} spots available` : 'Gathering at capacity'}
              </div>
            )}
            {requestMsg && (
              <div style={{ fontSize: '0.8rem', color: 'var(--comm-olive)', marginTop: 2 }}>
                {requestMsg}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {gathering?.isAttending && activeTab === 'overview' && (
              <button
                type="button"
                className="comm-btn-primary"
                onClick={() => setActiveTab('chat')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MessageSquare size={15} />
                <span>Open Gathering Chat 💬</span>
              </button>
            )}

            {!gathering?.isAttending && !gathering?.isCreator && (
              gathering?.myJoinRequest?.status === 'pending' ? (
                <button type="button" className="comm-btn-secondary" disabled>
                  ⏳ Request Submitted
                </button>
              ) : showNoteInput ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    className="comm-input"
                    placeholder="Brief note to host (optional)..."
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    style={{ minWidth: 200, fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                  <button
                    type="button"
                    className="comm-btn-primary"
                    onClick={handleRequestJoin}
                    disabled={submittingRequest}
                  >
                    {submittingRequest ? 'Submitting...' : 'Confirm Request'}
                  </button>
                  <button
                    type="button"
                    className="comm-btn-ghost"
                    onClick={() => setShowNoteInput(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="comm-btn-primary"
                  onClick={() => setShowNoteInput(true)}
                  disabled={spotsLeft <= 0}
                >
                  Request to Join Gathering
                </button>
              )
            )}

            <button type="button" className="comm-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
