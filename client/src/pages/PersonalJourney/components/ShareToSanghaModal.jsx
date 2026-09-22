import React, { useState, useEffect } from 'react';
import { X, Send, Shield, Globe, Users, Sparkles, Check } from 'lucide-react';
import api from '../../../api';

export default function ShareToSanghaModal({
  isOpen,
  onClose,
  event,
  onSharedSuccess,
}) {
  const [reflection, setReflection] = useState('');
  const [visibility, setVisibility] = useState('followers');
  const [sanghas, setSanghas] = useState([]);
  const [selectedSanghaId, setSelectedSanghaId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMsg('');
      setReflection('');
      // Fetch seeker's joined sanghas
      api.get('/community/sanghas?my=true')
        .then((res) => {
          setSanghas(res.data.sanghas || []);
        })
        .catch((err) => {
          console.error('Failed to load sanghas for sharing:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        body: reflection.trim() || `Reflecting on my milestone: ${event.title}`,
        type: event.category === 'sadhana' ? 'metric' : 'milestone',
        visibility,
        sanghaId: selectedSanghaId || null,
        sharedEntity: {
          entityType: event.category === 'sadhana' ? 'sadhana_log' : 'milestone',
          title: event.title,
          subtitle: `${(event.category || 'journey').toUpperCase()} • Logged on Seeker's Journey`,
          metricValue: event.category === 'program' ? 'Initiated' : 'Milestone',
          icon: event.icon || '🪷',
          originalDate: event.date || new Date(),
        },
      };

      await api.post('/community/posts', payload);
      setSuccess(true);
      setTimeout(() => {
        if (onSharedSuccess) onSharedSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to share to sangha:', err);
      setErrorMsg(err.response?.data?.message || 'Could not share to community.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pj-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="pj-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, background: '#fffdf7' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3
            className="pj-serif"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--pj-text-charcoal)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={18} color="var(--pj-terracotta)" /> Share with Sangha
          </h3>
          <button type="button" onClick={onClose} className="pj-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Milestone Card Preview */}
        <div
          style={{
            padding: 14,
            background: 'linear-gradient(135deg, rgba(247, 238, 216, 0.85) 0%, rgba(238, 231, 211, 0.95) 100%)',
            border: '1px solid rgba(196, 154, 69, 0.4)',
            borderLeft: '4px solid var(--pj-terracotta)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 26 }}>{event.icon || '🪷'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: 'var(--pj-terracotta)', letterSpacing: '0.06em' }}>
              Recorded on Path
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--pj-text-charcoal)' }}>
              {event.title}
            </div>
            {event.date && (
              <div style={{ fontSize: 11, color: 'var(--pj-text-muted)' }}>
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleShare}>
          {/* Reflection Body */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--pj-text-secondary)' }}>
              Add a Reflection or Realization (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What did this milestone or practice open up for you? Share an encouraging word..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="pj-input"
              style={{ resize: 'vertical' }}
              id="share-sangha-reflection-input"
            />
          </div>

          {/* Audience Controls */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--pj-text-secondary)' }}>
              Share Audience
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="pj-input"
              style={{ padding: '8px 12px' }}
              id="share-sangha-audience-select"
            >
              <option value="followers">👥 Followers Only</option>
              <option value="public">🌍 Public (All Seekers)</option>
              {sanghas.length > 0 && <option value="sangha_only">🏛️ Circle Only</option>}
            </select>
          </div>

          {/* Sangha select if sangha_only */}
          {visibility === 'sangha_only' && sanghas.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--pj-text-secondary)' }}>
                Select Sangha
              </label>
              <select
                value={selectedSanghaId}
                onChange={(e) => setSelectedSanghaId(e.target.value)}
                className="pj-input"
                style={{ padding: '8px 12px' }}
                required
                id="share-sangha-target-select"
              >
                <option value="">Choose a circle...</option>
                {sanghas.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p style={{ fontSize: 11, color: 'var(--pj-text-muted)', lineHeight: 1.45, margin: '0 0 16px' }}>
            🔒 <em>Recorded ≠ Shared:</em> Only this explicit post will be shared with the sangha. Your private journal and logs remain confidential.
          </p>

          {errorMsg && (
            <div style={{ color: '#b4421b', fontSize: 12, marginBottom: 12 }}>
              {errorMsg}
            </div>
          )}

          {success ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'rgba(78, 99, 70, 0.12)',
                border: '1px solid #4e6346',
                borderRadius: 8,
                color: '#4e6346',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <Check size={16} /> Shared with your Sangha! 🙏
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--pj-border)',
                  color: 'var(--pj-text-secondary)',
                  borderRadius: 'var(--pj-radius-sm)',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="pj-whisper-trigger-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                id="btn-confirm-share-sangha"
              >
                <Send size={14} />
                <span>{submitting ? 'Sharing...' : 'Share with Sangha 🙏'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
