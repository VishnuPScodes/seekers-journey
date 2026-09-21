import React, { useState } from 'react';
import { Compass, ChevronDown, ChevronRight, Sparkles, Video } from 'lucide-react';

export default function OriginStoryCard({ user, onEditStory }) {
  const [isOpen, setIsOpen] = useState(true);
  const story = user?.originStory || {};

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
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--pj-terracotta)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
            id="btn-edit-origin-story"
          >
            Reflect & Edit
          </button>
          <div style={{ color: 'var(--pj-text-muted)', display: 'flex', alignItems: 'center' }}>
            {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--pj-border-hairline)' }}>
          <p className="pj-serif pj-origin-quote">
            "{story.originStoryText || 'First encountered Sadhguru during a pivotal life transition. The razor-sharp clarity and practical yogic technologies dismantled intellectual resistance, inspiring daily devotion to dawn sadhana.'}"
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
                {story.initialMotivation || 'Inner balance and conscious awakening'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
