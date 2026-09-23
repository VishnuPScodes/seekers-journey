import React, { useState } from 'react';
import { X, Sparkles, Check, Heart, Send, Feather } from 'lucide-react';
import api from '../api';
import { getPracticeIcon } from '../utils/practiceIcons';

export default function DoneForDayModal({
  isOpen,
  onClose,
  todayCounts = {},
  selectedPractices = [],
  user = {},
}) {
  const [reflection, setReflection] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculate today's sadhana statistics
  const completedPractices = selectedPractices.filter(
    (name) => (todayCounts[name] || 0) > 0
  );
  const completedCount = completedPractices.length;
  const totalSessions = Object.values(todayCounts).reduce(
    (acc, val) => acc + (val || 0),
    0
  );

  const handleShareToFeed = async () => {
    setSharing(true);
    setError('');
    try {
      const postText =
        reflection.trim() ||
        `Completed my daily sadhana in deep stillness and gratitude 🙏 (${completedCount} of ${selectedPractices.length} practices completed).`;

      await api.post('/community/posts', {
        body: postText,
        type: 'milestone',
        visibility: 'public',
        sharedEntity: {
          entityType: 'sadhana_log',
          title: "Completed Today's Consecrated Sadhana",
          subtitle: `${completedCount} of ${selectedPractices.length} practices completed`,
          metricValue: `${totalSessions} Sessions`,
          icon: '🪷',
          originalDate: new Date(),
        },
      });

      setShared(true);
      setTimeout(() => {
        onClose();
        setShared(false);
        setReflection('');
      }, 1400);
    } catch (err) {
      console.error('Error sharing sadhana to feed:', err);
      setError(err.response?.data?.message || 'Failed to share to Sangha feed');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="done-for-day-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 1250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="done-for-day-card animate-in"
        style={{
          background: 'linear-gradient(180deg, #18120d 0%, #110e0b 100%)',
          border: '1px solid rgba(217, 87, 43, 0.45)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 24px rgba(217, 87, 43, 0.18)',
          width: '100%',
          maxWidth: 500,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f4efd8',
          fontFamily: 'Outfit, sans-serif',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            zIndex: 10,
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Top Header Motif & Glow */}
        <div
          style={{
            padding: '24px 20px 14px',
            textAlign: 'center',
            background: 'radial-gradient(circle at 50% 0%, rgba(217, 87, 43, 0.22) 0%, transparent 70%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              fontSize: 32,
              marginBottom: 4,
              filter: 'drop-shadow(0 0 10px rgba(217, 87, 43, 0.5))',
            }}
          >
            🪷
          </div>
          <h2
            style={{
              margin: '0 0 4px',
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.65rem',
              fontWeight: 700,
              color: '#f4efd8',
              letterSpacing: '0.02em',
            }}
          >
            A Day Consecrated in Stillness
          </h2>
          <div style={{ fontSize: 12, color: 'var(--amber-400)', fontWeight: 600 }}>
            ✨ Done for the day 🙏
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Sadhguru Quote Blessing */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              borderLeft: '3px solid #d9572b',
              borderRadius: '0 10px 10px 0',
              padding: '10px 14px',
              fontSize: 12,
              fontStyle: 'italic',
              color: '#ded3be',
              lineHeight: 1.5,
            }}
          >
            “When you do your sadhana, you are not doing it for anybody. It is your privilege to sit quietly and explore your inner nature.”
            <div
              style={{
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: 10,
                color: '#e88f5f',
                marginTop: 4,
                textAlign: 'right',
              }}
            >
              — Sadhguru
            </div>
          </div>

          {/* Today's Sacred Offering Summary Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Practices</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#e88f5f',
                  fontFamily: '"Cormorant Garamond", serif',
                  marginTop: 2,
                }}
              >
                {completedCount} / {selectedPractices.length}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total Cycles</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f4efd8',
                  fontFamily: '"Cormorant Garamond", serif',
                  marginTop: 2,
                }}
              >
                {totalSessions}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Station</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#c49a45',
                  fontFamily: '"Cormorant Garamond", serif',
                  marginTop: 2,
                }}
              >
                Lvl {user.currentLevel || 1}
              </div>
            </div>
          </div>

          {/* Practices Checkmarks List */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              Today's Daily Sadhanas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {selectedPractices.map((name) => {
                const count = todayCounts[name] || 0;
                const isDone = count > 0;
                return (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: isDone ? 'rgba(93, 117, 80, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isDone ? '1px solid rgba(93, 117, 80, 0.4)' : '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16 }}>{getPracticeIcon(name)}</span>
                      <span style={{ fontSize: 12, color: isDone ? '#f4efd8' : '#887d6d', fontWeight: isDone ? 600 : 400 }}>
                        {name}
                      </span>
                    </div>
                    {isDone ? (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--emerald-400)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontWeight: 600,
                        }}
                      >
                        <Check size={12} strokeWidth={2.5} /> {count} {count === 1 ? 'cycle' : 'cycles'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        resting today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Sangha Share Textarea */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Feather size={12} color="#e88f5f" />
              <label
                htmlFor="sadhana-reflection"
                style={{ fontSize: 11, color: '#f4efd8', fontWeight: 600 }}
              >
                Share an Offering or Prayer with the Sangha
              </label>
            </div>
            <textarea
              id="sadhana-reflection"
              rows={2}
              placeholder="Share a thought, feeling, or prayer with fellow seekers in the feed..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                padding: '8px 10px',
                color: '#f4efd8',
                fontSize: 12,
                fontFamily: 'Outfit, sans-serif',
                resize: 'none',
              }}
            />
          </div>

          {/* Status Message */}
          {error && (
            <div style={{ fontSize: 11, color: '#fca5a5', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}
          {shared && (
            <div
              style={{
                fontSize: 12,
                color: '#86efac',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              ✓ Offered to the Sangha community feed 🙏
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 10,
              padding: '8px 14px',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              flex: 1,
            }}
          >
            Keep in Silence 🙏
          </button>

          <button
            type="button"
            onClick={handleShareToFeed}
            disabled={sharing || shared}
            style={{
              background: 'linear-gradient(135deg, #d9572b 0%, #b8441d 100%)',
              border: '1px solid #f09268',
              borderRadius: 10,
              padding: '8px 18px',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: sharing || shared ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(217, 87, 43, 0.35)',
              flex: 1.5,
            }}
          >
            <Send size={13} />
            <span>{sharing ? 'Sharing...' : shared ? 'Shared 🙏' : 'Share to Sangha 🕊️'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
