import React, { useState } from 'react';
import { Compass, ChevronDown, ChevronRight, Sparkles, Video } from 'lucide-react';

export default function OriginStoryCard({ user, onEditStory }) {
  const [isOpen, setIsOpen] = useState(true);
  const story = user?.originStory || {};
  const hasStory = Boolean(story.originStoryText?.trim());

  return (
    <div className="pj-card pj-origin-card">
      <div className="pj-origin-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="pj-origin-icon-badge">
            <Compass size={20} />
          </div>
          <div>
            <h2 className="pj-serif pj-origin-title">
              Where I Started — The Origin Story
            </h2>
            <span style={{ fontSize: 12, color: 'var(--pj-text-muted)' }}>
              The initial spark that opened the doorway of inner seeking
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditStory();
            }}
            style={{
              background: hasStory ? 'none' : 'linear-gradient(135deg, #d9572b 0%, #b85d36 100%)',
              border: hasStory ? 'none' : 'none',
              fontSize: 12,
              fontWeight: 700,
              color: hasStory ? 'var(--pj-terracotta)' : '#ffffff',
              cursor: 'pointer',
              textDecoration: hasStory ? 'underline' : 'none',
              padding: hasStory ? '4px 8px' : '5px 14px',
              borderRadius: hasStory ? 0 : 16,
              boxShadow: hasStory ? 'none' : '0 2px 8px rgba(217, 87, 43, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            id="btn-edit-origin-story"
          >
            {hasStory ? 'Review & Edit' : '+ Create'}
          </button>
          <div style={{ color: 'var(--pj-text-muted)', display: 'flex', alignItems: 'center' }}>
            {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--pj-border-hairline)' }}>
          {hasStory ? (
            <>
              <p className="pj-serif pj-origin-quote">
                "{story.originStoryText}"
              </p>

              <div className="pj-origin-grid">
                <div className="pj-origin-box">
                  <span className="pj-origin-box-label">Discovery Pathway</span>
                  <div className="pj-origin-box-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Video size={15} color="var(--pj-terracotta)" />
                    <span>{story.discoveryChannel || 'YouTube Video Discourse'}</span>
                  </div>
                </div>

                <div className="pj-origin-box">
                  <span className="pj-origin-box-label">Initial Attraction</span>
                  <div className="pj-origin-box-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={15} color="var(--pj-gold)" />
                    <span>{story.firstAttraction || 'Clarity and profound logic of Sadhguru'}</span>
                  </div>
                </div>

                <div className="pj-origin-box">
                  <span className="pj-origin-box-label">Initial Motivation</span>
                  <div className="pj-origin-box-val">
                    {story.initialMotivation || 'Inner balance and conscious growth'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '24px 20px',
              backgroundColor: 'var(--pj-bg-card-subtle)',
              borderRadius: 'var(--pj-radius-sm)',
              border: '1px dashed var(--pj-border)',
            }}>
              <p className="pj-serif" style={{ fontSize: 16, color: 'var(--pj-text-charcoal)', margin: '0 0 6px', fontStyle: 'italic' }}>
                "Every seeker's journey begins with an initial spark."
              </p>
              <p style={{ fontSize: 13, color: 'var(--pj-text-muted)', margin: '0 0 16px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                You haven't inscribed your origin story yet. Capture the moment you first encountered Sadhguru and what opened the doorway of inner seeking.
              </p>
              <button
                type="button"
                onClick={onEditStory}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, #d9572b 0%, #b85d36 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 20,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(217, 87, 43, 0.22)',
                  transition: 'all 0.15s ease',
                }}
                id="btn-create-origin-story"
              >
                + Create Origin Story
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
