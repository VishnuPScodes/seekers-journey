import React, { useState } from 'react';
import { X, Mic, Feather, Calendar, Share2 } from 'lucide-react';
import { CATEGORY_COLORS } from '../journeyDataUtils';
import ShareToSanghaModal from './ShareToSanghaModal';

export function WhisperModal({
  isOpen,
  onClose,
  onSave,
  saving,
}) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen) return null;

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your reflection.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave(text.trim());
    setText('');
  };

  return (
    <div className="pj-modal-backdrop" onClick={onClose}>
      <div className="pj-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="pj-serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--pj-text-charcoal)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Feather size={18} color="var(--pj-terracotta)" /> Whisper of Grace
          </h3>
          <button type="button" onClick={onClose} className="pj-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--pj-text-secondary)', marginBottom: 14, lineHeight: 1.45 }}>
          Capture a quiet sentence of what you felt, noticed, or touched during your sadhana today.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <textarea
              className="pj-input"
              rows={4}
              placeholder="After Shambhavi today, a deep wave of stillness settled in the breath..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
            <button
              type="button"
              onClick={startSpeechRecognition}
              title="Speak your reflection"
              style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                background: isRecording ? 'var(--pj-terracotta)' : 'var(--pj-bg-card-subtle)',
                color: isRecording ? '#fff' : 'var(--pj-text-secondary)',
                border: '1px solid var(--pj-border)',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Mic size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--pj-border)',
                color: 'var(--pj-text-secondary)',
                borderRadius: 'var(--pj-radius-sm)',
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pj-whisper-trigger-btn"
            >
              {saving ? 'Recording...' : '✓ Record Whisper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditOriginModal({
  isOpen,
  onClose,
  initialForm,
  onSave,
}) {
  const [form, setForm] = useState(initialForm);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="pj-modal-backdrop" onClick={onClose}>
      <div className="pj-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="pj-serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--pj-text-charcoal)', margin: 0 }}>
            Reflect on Your Origins
          </h3>
          <button type="button" onClick={onClose} className="pj-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 5 }}>
              How did you first encounter Sadhguru?
            </label>
            <input
              type="text"
              className="pj-input"
              value={form.discoveryChannel}
              onChange={(e) => setForm({ ...form, discoveryChannel: e.target.value })}
              placeholder="e.g. YouTube Video, A Friend, Mystic's Musings"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 5 }}>
              What initially attracted you?
            </label>
            <input
              type="text"
              className="pj-input"
              value={form.firstAttraction}
              onChange={(e) => setForm({ ...form, firstAttraction: e.target.value })}
              placeholder="e.g. Logic and clarity, longing for inner peace"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 5 }}>
              Personal Origin Narrative
            </label>
            <textarea
              className="pj-input"
              rows={4}
              value={form.originStoryText}
              onChange={(e) => setForm({ ...form, originStoryText: e.target.value })}
              placeholder="Describe the moment the doorway opened for you..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--pj-border)',
                color: 'var(--pj-text-secondary)',
                borderRadius: 'var(--pj-radius-sm)',
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button type="submit" className="pj-whisper-trigger-btn">
              ✓ Save Story
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EventDetailModal({
  event,
  onClose,
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  if (!event) return null;
  const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.personal;

  return (
    <>
      <div className="pj-modal-backdrop" onClick={onClose}>
        <div className="pj-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 22 }}>{event.icon || '🪷'}</span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 'var(--pj-radius-pill)',
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}>
                {colors.label || event.category}
              </span>
            </div>
            <button type="button" onClick={onClose} className="pj-modal-close-btn">
              <X size={18} />
            </button>
          </div>

          <h3 className="pj-serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--pj-text-charcoal)', margin: '0 0 6px' }}>
            {event.title}
          </h3>

          <div style={{ fontSize: 12, color: 'var(--pj-text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={13} color="var(--pj-terracotta)" />
            {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Sacred Moment'}
          </div>

          {event.description && (
            <p className="pj-serif" style={{
              fontSize: 16,
              fontStyle: 'italic',
              color: 'var(--pj-text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 16px',
              borderLeft: `3px solid ${colors.text}`,
              paddingLeft: 12,
              background: 'var(--pj-bg-card-subtle)',
              padding: '10px 14px',
              borderRadius: 'var(--pj-radius-sm)',
            }}>
              "{event.description}"
            </p>
          )}

          {/* Share to Sangha Bridge */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--pj-border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="pj-whisper-trigger-btn"
              onClick={() => setShowShareModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px' }}
              id="event-detail-share-sangha-btn"
            >
              <Share2 size={13} />
              <span>Share to Sangha 🙏</span>
            </button>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareToSanghaModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          event={event}
          onSharedSuccess={() => {
            setShowShareModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
