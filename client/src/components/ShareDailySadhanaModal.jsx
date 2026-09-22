import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Globe, Users, Shield, Sparkles, Check, ArrowRight } from 'lucide-react';
import api from '../api';

export default function ShareDailySadhanaModal({
  isOpen,
  onClose,
  completedPractices = [],
  totalPracticesCount = 0,
  tierInfo = {},
}) {
  const navigate = useNavigate();
  const [reflection, setReflection] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'followers'
  const [sanghas, setSanghas] = useState([]);
  const [selectedSanghaId, setSelectedSanghaId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const completedCount = completedPractices.length;
  const practiceNames = completedPractices.map(p => p.name);

  // Initialize reflection text from tier recommendation
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMsg('');
      setReflection(tierInfo.suggestedReflection || `Consecrated ${completedCount} sacred practices today. Quiet steps along the path. 🙏`);

      // Fetch user's joined circles
      api.get('/community/sanghas?my=true')
        .then((res) => {
          setSanghas(res.data.sanghas || []);
        })
        .catch((err) => {
          console.error('Failed to load user sanghas:', err);
        });
    }
  }, [isOpen, tierInfo, completedCount]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const todayStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const payload = {
        body: reflection.trim() || `Consecrated ${completedCount} sadhanas today. Flowing with peace. 🙏`,
        type: 'metric',
        visibility,
        sanghaId: selectedSanghaId || null,
        sharedEntity: {
          entityType: 'sadhana_log',
          title: `${completedCount} Sacred Sadhanas Consecrated`,
          subtitle: `${practiceNames.join(', ')} • ${todayStr}`,
          metricValue: `${completedCount} / ${totalPracticesCount} Practices`,
          icon: '🪷',
          originalDate: new Date(),
        },
      };

      await api.post('/community/posts', payload);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to share sadhana to sangha:', err);
      setErrorMsg(err.response?.data?.message || 'Could not share to community. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateToFeed = () => {
    onClose();
    navigate('/community');
  };

  return (
    <div className="comm-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="comm-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Share Sadhana to Fellowship"
        style={{ maxWidth: 520, background: '#fffdf7' }}
      >
        {/* Header */}
        <div className="comm-modal-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="comm-header-badge" style={{ marginBottom: 4, display: 'inline-flex' }}>
              <span>🪷</span>
              <span>Fellowship Offering</span>
            </div>
            <h3 className="comm-modal-title" style={{ fontSize: '1.4rem' }}>
              Share Today's Sadhana
            </h3>
          </div>
          <button
            type="button"
            className="comm-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '28px 12px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(78, 99, 70, 0.14)',
                color: '#4e6346',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '1.8rem',
              }}
            >
              ✓
            </div>
            <h4
              style={{
                fontFamily: 'var(--comm-font-serif, "Cormorant Garamond", serif)',
                fontSize: '1.5rem',
                margin: '0 0 8px',
                color: 'var(--comm-text-charcoal, #1e1b15)',
              }}
            >
              Offered to Fellowship!
            </h4>
            <p style={{ color: 'var(--comm-text-muted, #6e6353)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
              Your daily sadhana flow has been published to the sangha feed. Fellow seekers walking the path can now offer silent encouragement and kudos.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="comm-btn-small"
                onClick={onClose}
                style={{ padding: '8px 18px' }}
              >
                Done
              </button>
              <button
                type="button"
                className="comm-btn-primary"
                onClick={handleNavigateToFeed}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  background: 'var(--comm-terracotta, #d9572b)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>View in Sangha Feed</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Sadhana Summary Box */}
            <div
              style={{
                background: '#f7f2e4',
                border: '1px solid rgba(217, 87, 43, 0.2)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-terracotta, #d9572b)' }}>
                  🪷 {completedCount} of {totalPracticesCount} Sadhanas Consecrated
                </span>
                <span
                  style={{
                    fontSize: '0.76rem',
                    background: '#ffffff',
                    border: '1px solid rgba(196, 154, 69, 0.4)',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    color: '#c49a45',
                    fontWeight: 600,
                  }}
                >
                  {tierInfo.badge || 'Steady Flame'}
                </span>
              </div>

              {/* Practice Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {completedPractices.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.78rem',
                      background: '#ffffff',
                      border: '1px solid rgba(217, 87, 43, 0.15)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      color: 'var(--comm-text-secondary, #3d3528)',
                      fontWeight: 500,
                    }}
                  >
                    <span>✓</span> {p.name} {p.count > 1 ? `(${p.count})` : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* Reflection Textarea */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="daily-sadhana-reflection"
                style={{
                  display: 'block',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--comm-text-secondary, #3d3528)',
                  marginBottom: 6,
                }}
              >
                Quiet Reflection (Optional)
              </label>
              <textarea
                id="daily-sadhana-reflection"
                rows={3}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How did today's practice feel? Share a realization or quiet prayer..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(217, 87, 43, 0.25)',
                  background: '#faf8f2',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  color: 'var(--comm-text-charcoal, #1e1b15)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Visibility Selector */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--comm-text-secondary, #3d3528)',
                  marginBottom: 6,
                }}
              >
                Audience & Sacred Privacy
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${visibility === 'public' ? 'var(--comm-terracotta, #d9572b)' : 'rgba(217, 87, 43, 0.2)'}`,
                    background: visibility === 'public' ? 'rgba(217, 87, 43, 0.08)' : '#ffffff',
                    color: visibility === 'public' ? 'var(--comm-terracotta, #d9572b)' : 'var(--comm-text-muted, #6e6353)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Globe size={14} />
                  <span>Public Sangha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('followers')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${visibility === 'followers' ? 'var(--comm-terracotta, #d9572b)' : 'rgba(217, 87, 43, 0.2)'}`,
                    background: visibility === 'followers' ? 'rgba(217, 87, 43, 0.08)' : '#ffffff',
                    color: visibility === 'followers' ? 'var(--comm-terracotta, #d9572b)' : 'var(--comm-text-muted, #6e6353)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Users size={14} />
                  <span>Companions Only</span>
                </button>
              </div>
            </div>

            {/* Optional Specific Circle */}
            {sanghas.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="circle-select"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--comm-text-secondary, #3d3528)',
                    marginBottom: 6,
                  }}
                >
                  Share to a Specific Circle (Optional)
                </label>
                <select
                  id="circle-select"
                  value={selectedSanghaId}
                  onChange={(e) => setSelectedSanghaId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(217, 87, 43, 0.2)',
                    background: '#ffffff',
                    fontSize: '0.84rem',
                    color: 'var(--comm-text-charcoal, #1e1b15)',
                    outline: 'none',
                  }}
                >
                  <option value="">All Fellowship Feed (General)</option>
                  {sanghas.map((s) => (
                    <option key={s._id} value={s._id}>
                      🏛️ {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {errorMsg && (
              <div style={{ color: '#b4421b', fontSize: '0.82rem', marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="comm-btn-small"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="comm-btn-primary"
                disabled={submitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  background: 'var(--comm-terracotta, #d9572b)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: submitting ? 'wait' : 'pointer',
                }}
              >
                {submitting ? (
                  <span>Offering...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Offer to Fellowship 🕊️</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
