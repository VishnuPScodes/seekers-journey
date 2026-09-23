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
          maxWidth: 470,
          width: '100%',
          background: '#fffdf9',
          border: '1px solid rgba(196, 154, 69, 0.35)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(44, 38, 31, 0.28), 0 2px 8px rgba(44, 38, 31, 0.08)',
          padding: '24px 26px',
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
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(217, 87, 43, 0.1)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.72rem',
              color: '#b85d36',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(217, 87, 43, 0.08)',
              padding: '3px 10px',
              borderRadius: 12,
            }}
          >
            <Sparkles size={13} color="#d9572b" />
            <span>Seeker Profile</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.04)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)')}
          >
            <X size={17} color="#6e6353" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '52px 0' }}>
            <div
              className="spinner"
              style={{
                width: 36,
                height: 36,
                margin: '0 auto 14px',
                borderColor: '#d9572b transparent #d9572b transparent',
              }}
            />
            <p style={{ color: '#d9572b', fontSize: '0.9rem', fontWeight: 600 }}>
              Gathering seeker's consecrated presence...
            </p>
          </div>
        ) : error || !profile ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#6e6353' }}>
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
                paddingBottom: 20,
                borderBottom: '1px solid rgba(217, 87, 43, 0.1)',
                marginBottom: 20,
              }}
            >
              {/* Vibrant Consecrated Avatar */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d9572b 0%, #a23512 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  border: '3px solid #fffdf9',
                  boxShadow: '0 0 0 3px rgba(217, 87, 43, 0.35), 0 8px 24px rgba(217, 87, 43, 0.3)',
                  letterSpacing: '1px',
                  marginBottom: 12,
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
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  color: '#1e1b15',
                  margin: '0 0 6px',
                  lineHeight: 1.2,
                }}
              >
                {profile.name}{' '}
                {profile.isSelf && (
                  <span style={{ fontSize: '0.82rem', color: '#6e6353', fontWeight: 500 }}>(You)</span>
                )}
              </h2>

              {/* Level, Title & Location Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span
                  style={{
                    background: 'linear-gradient(135deg, rgba(196, 154, 69, 0.18), rgba(217, 87, 43, 0.12))',
                    border: '1px solid rgba(196, 154, 69, 0.4)',
                    color: '#8b6b1b',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: '0.76rem',
                  }}
                >
                  Level {profile.currentLevel} • {profile.levelTitle || 'Sadhak'}
                </span>

                {profile.city ? (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#6e6353',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(0,0,0,0.03)',
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <MapPin size={12} color="#d9572b" /> {profile.city}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: '#948674',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(0,0,0,0.03)',
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}
                  >
                    <Lock size={11} /> Location Private
                  </span>
                )}
              </div>

              {/* Spiritual Bio / Sacred Intention */}
              {profile.bio ? (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    color: '#3d3528',
                    fontStyle: 'italic',
                    background: '#fbf5e6',
                    borderLeft: '4px solid #d9572b',
                    border: '1px solid rgba(196, 154, 69, 0.28)',
                    borderLeftWidth: 4,
                    borderLeftColor: '#d9572b',
                    padding: '10px 16px',
                    borderRadius: 12,
                    maxWidth: 400,
                    textAlign: 'center',
                  }}
                >
                  "{profile.bio}"
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#948674' }}>
                  🔒 Bio kept private by seeker
                </div>
              )}
            </div>

            {/* Profile Attributes Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Daily Sadhana Disciplines */}
              <div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#6e6353',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Flower2 size={13} color="#4E6346" />
                  <span>Daily Sadhana Practices</span>
                </div>

                {profile.selectedPractices && profile.selectedPractices.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile.selectedPractices.map((p, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(78, 99, 70, 0.1)',
                          border: '1px solid rgba(78, 99, 70, 0.28)',
                          color: '#34482e',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Flower2 size={12} color="#4E6346" /> {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#948674' }}>
                    🔒 Practices kept private by seeker
                  </div>
                )}
              </div>

              {/* Completed & Initiated Programs */}
              <div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#6e6353',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Shield size={13} color="#d9572b" />
                  <span>Initiated Programs & Sadhana</span>
                </div>

                {profile.programs && profile.programs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {profile.programs.map((prog, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#faf6eb',
                          borderRadius: 10,
                          border: '1px solid rgba(196, 154, 69, 0.22)',
                          fontSize: '0.84rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1e1b15', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Check size={14} color="#4E6346" strokeWidth={2.5} /> {prog.programName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            color: '#8b6b1b',
                            fontWeight: 700,
                            background: 'rgba(196, 154, 69, 0.12)',
                            padding: '2px 8px',
                            borderRadius: 8,
                          }}
                        >
                          {prog.completionDate ? new Date(prog.completionDate).getFullYear() : 'Initiated'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#948674' }}>
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
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, rgba(196, 154, 69, 0.12), rgba(217, 87, 43, 0.08))',
                    borderRadius: 12,
                    border: '1px solid rgba(196, 154, 69, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#8b6b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🏔️</span> Sacred Pradakshina Count
                  </span>
                  <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#d9572b' }}>
                    {profile.pradakshinaCount} Rounds
                  </span>
                </div>
              )}
            </div>

            {/* Admin Review Action Tray if opened from Join Requests */}
            {pendingRequestId && onApprove && onDecline && (
              <div
                style={{
                  marginTop: 24,
                  padding: '16px 18px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(251, 245, 230, 0.95), rgba(247, 238, 216, 0.75))',
                  border: '1px solid rgba(196, 154, 69, 0.4)',
                  boxShadow: '0 4px 16px rgba(196, 154, 69, 0.12)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#92400e',
                    background: 'rgba(217, 119, 6, 0.12)',
                    padding: '3px 10px',
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                >
                  <span>⚡</span>
                  <span>
                    {isGathering
                      ? 'Reviewing Gathering Attendance Request'
                      : 'Reviewing Circle Join Request'}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#6e6353', margin: '0 0 14px', lineHeight: 1.4 }}>
                  {isGathering
                    ? 'Review seeker’s alignment and practices before confirming presence in the sacred convocation.'
                    : 'Review seeker’s alignment and practices before blessing their entry into the circle.'}
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={acting}
                    className="comm-btn-small"
                    style={{
                      background: 'linear-gradient(135deg, #4E6346 0%, #3d5236 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 22px',
                      borderRadius: 24,
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(78, 99, 70, 0.3)',
                    }}
                  >
                    <Check size={16} />
                    <span>{isGathering ? 'Approve Attendee 🙏' : 'Approve Seeker 🙏'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={acting}
                    className="comm-btn-small"
                    style={{
                      background: 'transparent',
                      color: '#6e6353',
                      border: '1px solid rgba(110, 99, 83, 0.35)',
                      padding: '9px 18px',
                      borderRadius: 24,
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <X size={15} /> Decline
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
