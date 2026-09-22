import React, { useState } from 'react';
import { Sparkles, Send, Image, Compass, Globe, Users, Shield } from 'lucide-react';
import api from '../../../api';

export default function PostComposer({ onPostCreated, joinedSanghas = [] }) {
  const [postType, setPostType] = useState('standard');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('followers');
  const [selectedSanghaId, setSelectedSanghaId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  // Sadhana entity attachment fields
  const [attachSadhana, setAttachSadhana] = useState(false);
  const [sadhanaTitle, setSadhanaTitle] = useState('');
  const [sadhanaMetric, setSadhanaMetric] = useState('');
  const [sadhanaIcon, setSadhanaIcon] = useState('🪷');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTypeSelect = (type) => {
    setPostType(type);
    if (type === 'metric') {
      setAttachSadhana(true);
      if (!sadhanaTitle) setSadhanaTitle('Daily Sadhana');
      if (!sadhanaMetric) setSadhanaMetric('Completed');
    } else if (type === 'photo') {
      setShowImageInput(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim() && !imageUrl && (!attachSadhana || !sadhanaTitle.trim())) {
      setErrorMsg('Please share a reflection or sadhana practice.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        body: body.trim(),
        type: postType,
        visibility,
        sanghaId: selectedSanghaId || null,
        media: imageUrl ? [{ url: imageUrl.trim() }] : [],
      };

      if (attachSadhana && sadhanaTitle.trim()) {
        payload.sharedEntity = {
          entityType: 'sadhana_log',
          title: sadhanaTitle.trim(),
          subtitle: 'Logged on Seeker’s Journey',
          metricValue: sadhanaMetric.trim() || 'Completed',
          icon: sadhanaIcon,
          originalDate: new Date(),
        };
        // Auto-elevate to metric if sadhana attached
        if (payload.type === 'standard') payload.type = 'metric';
      }

      const res = await api.post('/community/posts', payload);
      if (res.data) {
        onPostCreated(res.data);
        // Reset form
        setBody('');
        setImageUrl('');
        setShowImageInput(false);
        setAttachSadhana(false);
        setSadhanaTitle('');
        setSadhanaMetric('');
        setPostType('standard');
      }
    } catch (err) {
      console.error('Failed to publish post:', err);
      setErrorMsg(err.response?.data?.message || 'Could not publish post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comm-composer-card" id="community-post-composer">
      {/* Type selection pills */}
      <div className="comm-composer-types">
        <button
          type="button"
          className={`comm-type-pill ${postType === 'standard' ? 'active' : ''}`}
          onClick={() => handleTypeSelect('standard')}
        >
          🕊️ Reflection
        </button>
        <button
          type="button"
          className={`comm-type-pill ${postType === 'metric' ? 'active' : ''}`}
          onClick={() => handleTypeSelect('metric')}
        >
          🪷 Share Sadhana
        </button>
        <button
          type="button"
          className={`comm-type-pill ${postType === 'experience' ? 'active' : ''}`}
          onClick={() => handleTypeSelect('experience')}
        >
          🌅 Experience
        </button>
        <button
          type="button"
          className={`comm-type-pill ${postType === 'photo' ? 'active' : ''}`}
          onClick={() => handleTypeSelect('photo')}
        >
          📸 Sacred Moment
        </button>
      </div>

      {/* Main Textarea */}
      <textarea
        className="comm-composer-textarea"
        placeholder={
          postType === 'metric'
            ? 'Share what practice you did today and what realization or stillness arose...'
            : postType === 'experience'
            ? 'Share a moment of grace, devotion, or insight from your walk...'
            : 'What is alive in your journey today? Share an insight with fellow seekers...'
        }
        value={body}
        onChange={(e) => setBody(e.target.value)}
        id="composer-body-input"
      />

      {/* Optional Photo URL Input */}
      {showImageInput && (
        <div style={{ marginTop: 10 }}>
          <input
            type="url"
            placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
            className="comm-input-field"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            id="composer-image-url-input"
          />
        </div>
      )}

      {/* Sadhana / Milestone Attachment Block */}
      {attachSadhana && (
        <div className="comm-composer-attachment">
          <div className="comm-attachment-title">
            <Sparkles size={16} /> Attach Sadhana Record
          </div>

          <div className="comm-attachment-grid">
            <input
              type="text"
              placeholder="Practice name (e.g. 16 Rounds Japa, Surya Kriya)"
              className="comm-input-field"
              value={sadhanaTitle}
              onChange={(e) => setSadhanaTitle(e.target.value)}
              id="composer-sadhana-title-input"
            />
            <input
              type="text"
              placeholder="Metric / Count (e.g. 45 mins, 21 Days Streak)"
              className="comm-input-field"
              value={sadhanaMetric}
              onChange={(e) => setSadhanaMetric(e.target.value)}
              id="composer-sadhana-metric-input"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--comm-text-muted)' }}>
            <span>Sacred Icon:</span>
            {['🪷', '📿', '☀️', '🏔️', '🔥'].map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSadhanaIcon(icon)}
                style={{
                  background: sadhanaIcon === icon ? 'var(--comm-gold-light)' : 'transparent',
                  border: sadhanaIcon === icon ? '1px solid var(--comm-gold)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{ color: '#b4421b', fontSize: '0.84rem', marginTop: 8 }}>
          {errorMsg}
        </div>
      )}

      {/* Footer controls */}
      <div className="comm-composer-footer">
        <div className="comm-composer-controls">
          {/* Audience Selector */}
          <select
            className="comm-select-audience"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            id="composer-audience-select"
          >
            <option value="followers">👥 Followers Only</option>
            <option value="public">🌍 Public (All Seekers)</option>
            {joinedSanghas.length > 0 && (
              <option value="sangha_only">🏛️ Sangha Only</option>
            )}
          </select>

          {/* Sangha dropdown if Sangha Only is selected */}
          {visibility === 'sangha_only' && joinedSanghas.length > 0 && (
            <select
              className="comm-select-audience"
              value={selectedSanghaId}
              onChange={(e) => setSelectedSanghaId(e.target.value)}
              id="composer-sangha-select"
            >
              <option value="">Select Sangha...</option>
              {joinedSanghas.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Toggle photo input button */}
          {!showImageInput && (
            <button
              type="button"
              className="comm-action-btn"
              onClick={() => setShowImageInput(true)}
              title="Add Image"
            >
              <Image size={15} /> Add Image
            </button>
          )}

          {/* Toggle sadhana attachment */}
          {!attachSadhana && (
            <button
              type="button"
              className="comm-action-btn"
              onClick={() => setAttachSadhana(true)}
              title="Attach Practice"
            >
              <Sparkles size={15} /> Attach Sadhana
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || (!body.trim() && !imageUrl && (!attachSadhana || !sadhanaTitle.trim()))}
          className="comm-btn-share"
          id="composer-submit-btn"
        >
          <Send size={15} />
          <span>{submitting ? 'Sharing...' : 'Share with Sangha'}</span>
        </button>
      </div>
    </div>
  );
}
