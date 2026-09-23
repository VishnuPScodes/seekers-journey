import React, { useState, useEffect } from 'react';
import { X, MapPin, Check, Shield, Lock, Sparkles, Flower2, Calendar } from 'lucide-react';
import api from '../../../api';

export default function SeekerProfileModal({
  userId,
  seekerId,
  isOpen,
  onClose,
  pendingRequestId = null,
  onApprove = null,
  onDecline = null,
  onOpenPrivacySettings = null,
  onFollowToggle = null,
  currentUserId = null,
  requestContext = 'circle', // 'gathering' | 'circle'
}) {
  const activeUserId = userId || seekerId;
  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(activeUserId);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (isModalOpen && activeUserId) {
      setLoading(true);
      setError('');
      api
        .get(`/user/${activeUserId}/public`)
        .then((res) => {
          setProfile(res.data.seeker);
        })
        .catch((err) => {
          console.error('Failed to load seeker profile:', err);
          setError('Could not load seeker details.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProfile(null);
    }
  }, [isModalOpen, activeUserId]);

  if (!isModalOpen) return null;

  const initials = profile?.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '🧘';

  const handleApprove = async () => {
    if (!onApprove || !pendingRequestId) return;
    setActing(true);
    try {
      await onApprove(pendingRequestId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline || !pendingRequestId) return;
    setActing(true);
    try {
      await onDecline(pendingRequestId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  const isGathering = requestContext === 'gathering';

  return (
    <div
      className="comm-modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1300,
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 23, 18, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="comm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          width: '100%',
          minHeight: 'auto',
          height: 'auto',
          background: 'linear-gradient(180deg, #fdfaf2 0%, #f6efdc 100%)',
          border: '1.5px solid rgba(217, 87, 43, 0.28)',
          borderRadius: 20,
          boxShadow: '0 20px 48px rgba(35, 26, 18, 0.32), 0 0 0 1px rgba(196, 154, 69, 0.2)',
          padding: '16px 20px 16px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid rgba(217, 87, 43, 0.12)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.72rem',
              color: '#b4421b',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              background: 'rgba(217, 87, 43, 0.08)',
              border: '1px solid rgba(217, 87, 43, 0.22)',
              padding: '2px 8px',
              borderRadius: 12,
            }}
          >
            <Sparkles size={12} color="#d9572b" />
            <span>Seeker Profile</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8c7e6c',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d9572b')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8c7e6c')}
          >
            <X size={17} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <div
              className="spinner"
              style={{
                width: 30,
                height: 30,
                margin: '0 auto 10px',
                borderColor: '#d9572b transparent #d9572b transparent',
              }}
            />
            <p style={{ color: '#d9572b', fontSize: '0.84rem', fontWeight: 600, margin: 0 }}>
              Gathering seeker's consecrated presence...
            </p>
          </div>
        ) : error || !profile ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#6e6353' }}>
            <p>{error || 'Seeker details unavailable.'}</p>
          </div>
        ) : (
          <div>
            {/* Seeker Identity Header */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                paddingBottom: 12,
                borderBottom: '1px solid rgba(217, 87, 43, 0.12)',
                marginBottom: 10,
              }}
            >
              {/* Consecrated Avatar */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d9572b 0%, #a23512 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  border: '2px solid #fffdf9',
                  boxShadow: '0 0 0 2px rgba(217, 87, 43, 0.35), 0 4px 14px rgba(217, 87, 43, 0.25)',
                  letterSpacing: '1px',
                  marginBottom: 6,
                  position: 'relative',
                  userSelect: 'none',
                }}
              >
                {initials}
              </div>

              {/* Seeker Name */}
              <h2
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: '#1e1b15',
                  margin: '0 0 4px',
                  lineHeight: 1.2,
                }}
              >
                {profile.name}{' '}
                {profile.isSelf && (
                  <span style={{ fontSize: '0.78rem', color: '#6e6353', fontWeight: 500 }}>(You)</span>
                )}
              </h2>

              {/* Level, Title & Location Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span
                  style={{
                    background: 'linear-gradient(135deg, rgba(196, 154, 69, 0.18), rgba(217, 87, 43, 0.12))',
                    border: '1px solid rgba(196, 154, 69, 0.4)',
                    color: '#8b6b1b',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 16,
                    fontSize: '0.72rem',
                  }}
                >
                  Level {profile.currentLevel} • {profile.levelTitle || 'Sadhak'}
                </span>

                {profile.city ? (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#6e6353',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(0,0,0,0.03)',
                      padding: '2px 8px',
                      borderRadius: 16,
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <MapPin size={11} color="#d9572b" /> {profile.city}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#948674',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      background: 'rgba(0,0,0,0.03)',
                      padding: '2px 8px',
                      borderRadius: 16,
                    }}
                  >
                    <Lock size={10} /> Location Private
                  </span>
                )}
              </div>

              {/* Bio quote if present */}
              {profile.bio && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: '0.78rem',
                    lineHeight: 1.35,
                    color: '#3d3528',
                    fontStyle: 'italic',
                    background: 'rgba(251, 245, 230, 0.75)',
                    border: '1px solid rgba(196, 154, 69, 0.28)',
                    borderLeft: '3px solid #d9572b',
                    padding: '5px 12px',
                    borderRadius: 8,
                    maxWidth: 380,
                    textAlign: 'center',
                  }}
                >
                  "{profile.bio}"
                </div>
              )}
            </div>

            {/* Profile Attributes Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Daily Sadhana Disciplines */}
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#6e6353',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Flower2 size={11} color="#4E6346" />
                  <span>Daily Sadhana Practices</span>
                </div>

                {profile.selectedPractices && profile.selectedPractices.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {profile.selectedPractices.map((p, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(78, 99, 70, 0.08)',
                          border: '1px solid rgba(78, 99, 70, 0.25)',
                          color: '#34482e',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 14,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Flower2 size={10} color="#4E6346" /> {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.74rem', color: '#948674' }}>
                    🔒 Practices kept private by seeker
                  </div>
                )}
              </div>

              {/* Completed & Initiated Programs */}
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#6e6353',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Shield size={11} color="#d9572b" />
                  <span>Initiated Programs & Sadhana</span>
                </div>

                {profile.programs && profile.programs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {profile.programs.map((prog, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 10px',
                          background: 'rgba(255, 255, 255, 0.65)',
                          borderRadius: 8,
                          border: '1px solid rgba(196, 154, 69, 0.22)',
                          fontSize: '0.78rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1e1b15', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Check size={12} color="#4E6346" strokeWidth={2.5} /> {prog.programName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: '#8b6b1b',
                            fontWeight: 700,
                            background: 'rgba(196, 154, 69, 0.12)',
                            padding: '1px 6px',
                            borderRadius: 6,
                          }}
                        >
                          {prog.completionDate ? new Date(prog.completionDate).getFullYear() : 'Initiated'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.74rem', color: '#948674' }}>
                    🔒 Programs kept private by seeker
                  </div>
                )}
              </div>

              {/* Sacred Pradakshina Milestone */}
              {profile.pradakshinaCount !== null && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 11px',
                    background: 'linear-gradient(135deg, rgba(196, 154, 69, 0.1), rgba(217, 87, 43, 0.06))',
                    borderRadius: 10,
                    border: '1px solid rgba(196, 154, 69, 0.25)',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8b6b1b', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>🏔️</span> Sacred Pradakshina Count
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#d9572b' }}>
                    {profile.pradakshinaCount} Rounds
                  </span>
                </div>
              )}
            </div>

            {/* Admin Review Action Tray if opened from Join Requests */}
            {pendingRequestId && onApprove && onDecline && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(251, 245, 230, 0.95), rgba(247, 238, 216, 0.75))',
                  border: '1px solid rgba(196, 154, 69, 0.35)',
                  boxShadow: '0 2px 8px rgba(196, 154, 69, 0.1)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#92400e',
                    background: 'rgba(217, 119, 6, 0.12)',
                    padding: '2px 7px',
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                >
                  <span>⚡</span>
                  <span>
                    {isGathering
                      ? 'Reviewing Gathering Attendance Request'
                      : 'Reviewing Circle Join Request'}
                  </span>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#6e6353', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {isGathering
                    ? 'Review seeker’s alignment and practices before confirming presence.'
                    : 'Review seeker’s alignment and practices before blessing entry.'}
                </p>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={acting}
                    style={{
                      background: 'linear-gradient(135deg, #4E6346 0%, #3d5236 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: 18,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(78, 99, 70, 0.25)',
                    }}
                  >
                    <Check size={14} />
                    <span>{isGathering ? 'Approve Attendee 🙏' : 'Approve Seeker 🙏'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={acting}
                    style={{
                      background: 'transparent',
                      color: '#6e6353',
                      border: '1px solid rgba(110, 99, 83, 0.32)',
                      padding: '6px 14px',
                      borderRadius: 18,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <X size={13} /> Decline
                  </button>
                </div>
              </div>
            )}

            {/* If Viewing Self: Option to edit privacy */}
            {profile.isSelf && onOpenPrivacySettings && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrivacySettings();
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(217, 87, 43, 0.3)',
                    padding: '6px 14px',
                    borderRadius: 16,
                    fontSize: '0.78rem',
                    color: '#d9572b',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ Adjust What You Share Publicly
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
