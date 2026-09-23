import React, { useState, useEffect } from 'react';
import { X, MapPin, Check, Shield, Lock, Sparkles, User, Award, Flower2, HeartHandshake } from 'lucide-react';
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
        .split(' ')
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

  return (
    <div className="comm-modal-backdrop" onClick={onClose} style={{ zIndex: 1300 }}>
      <div
        className="comm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: '92%',
          background: '#fffdf8',
          border: '1px solid var(--comm-border-gold)',
          borderRadius: 20,
          boxShadow: '0 12px 40px rgba(44, 38, 31, 0.22)',
          padding: 24,
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        {/* Modal Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#8b6b1b', fontWeight: 700 }}>
            <Sparkles size={14} />
            <span>Seeker Spiritual Profile</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="var(--comm-text-muted)" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--comm-terracotta)', fontSize: '0.88rem' }}>Loading seeker presence...</p>
          </div>
        ) : error || !profile ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--comm-text-muted)' }}>
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
                borderBottom: '1px solid var(--comm-border-hairline)',
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--comm-terracotta), #b85d36)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(217, 87, 43, 0.28)',
                  marginBottom: 10,
                }}
              >
                {initials}
              </div>

              <h2
                style={{
                  fontFamily: 'var(--comm-font-serif)',
                  fontSize: '1.45rem',
                  color: 'var(--comm-text-charcoal)',
                  margin: '0 0 4px',
                }}
              >
                {profile.name} {profile.isSelf && <span style={{ fontSize: '0.85rem', color: 'var(--comm-text-muted)' }}>(You)</span>}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="comm-level-badge" style={{ fontSize: '0.74rem', padding: '2px 9px' }}>
                  Level {profile.currentLevel} • {profile.levelTitle || 'Sadhak'}
                </span>
                {profile.city ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--comm-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={12} /> {profile.city}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.74rem', color: 'var(--comm-text-light)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Lock size={11} /> Location Private
                  </span>
                )}
              </div>

              {/* Bio & Intention */}
              {profile.bio ? (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    color: 'var(--comm-text-secondary)',
                    fontStyle: 'italic',
                    background: 'var(--comm-gold-light)',
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--comm-border-gold)',
                    maxWidth: 380,
                  }}
                >
                  "{profile.bio}"
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--comm-text-light)' }}>
                  🔒 Bio kept private
                </div>
              )}
            </div>

            {/* Profile Attributes Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Daily Sadhana Practices */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--comm-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Daily Sadhana Practices
                </div>
                {profile.selectedPractices && profile.selectedPractices.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile.selectedPractices.map((p, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(78, 99, 70, 0.1)',
                          border: '1px solid rgba(78, 99, 70, 0.25)',
                          color: '#3d5236',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Flower2 size={12} /> {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--comm-text-light)' }}>
                    🔒 Practices kept private by seeker
                  </div>
                )}
              </div>

              {/* Completed & Initiated Programs */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--comm-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Initiated Programs & Sadhana
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
                          padding: '6px 10px',
                          background: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 8,
                          border: '1px solid var(--comm-border-hairline)',
                          fontSize: '0.82rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--comm-text-charcoal)' }}>
                          ✓ {prog.programName}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--comm-text-light)' }}>
                          {prog.completionDate ? new Date(prog.completionDate).getFullYear() : 'Initiated'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--comm-text-light)' }}>
                    🔒 Programs kept private by seeker
                  </div>
                )}
              </div>

              {/* Sacred Pradakshina */}
              {profile.pradakshinaCount !== null && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--comm-gold-light)', borderRadius: 10, border: '1px solid var(--comm-border-gold)' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#8b6b1b' }}>
                    🏔️ Sacred Pradakshina Count
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--comm-terracotta)' }}>
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
                  padding: 16,
                  borderRadius: 14,
                  background: 'rgba(196, 154, 69, 0.12)',
                  border: '1px solid rgba(196, 154, 69, 0.35)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#8b6b1b', marginBottom: 10 }}>
                  Reviewing Join Request for Circle
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={acting}
                    className="comm-btn-small"
                    style={{
                      background: '#4E6346',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={16} /> Approve Seeker 🙏
                  </button>

                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={acting}
                    className="comm-btn-small"
                    style={{
                      background: 'transparent',
                      color: 'var(--comm-text-muted)',
                      border: '1px solid var(--comm-border)',
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
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
                    border: '1px solid var(--comm-border)',
                    padding: '6px 14px',
                    borderRadius: 16,
                    fontSize: '0.78rem',
                    color: 'var(--comm-terracotta)',
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
