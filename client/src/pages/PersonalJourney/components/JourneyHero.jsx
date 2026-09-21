import React from 'react';
import { MapPin, Feather, Mountain } from 'lucide-react';
import PersonaSwitcher from '../../../components/PersonaSwitcher';
import { KundaliniSerpentSpiralMotif } from '../../../components/SadhanaMotifs';

export default function JourneyHero({ user, onOpenReflection, onPersonaSwitched }) {
  const practices = user?.selectedPractices || ['Shambhavi Mahamudra'];
  const level = user?.currentLevel || 1;
  const score = user?.totalCumulativeScore || 0;

  return (
    <div className="pj-card pj-hero-card">
      {/* Background Sacred Motif */}
      <div className="pj-hero-motif-bg">
        <KundaliniSerpentSpiralMotif size={160} color="#d9572b" strokeWidth={1.8} />
      </div>

      <div className="pj-hero-top-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="pj-tag" style={{ color: 'var(--pj-terracotta)' }}>
              Sacred Chronicle
            </span>
            <span style={{ color: 'var(--pj-border-strong)' }}>•</span>
            <span style={{ fontSize: 12, color: 'var(--pj-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color="var(--pj-terracotta)" /> {user?.city || 'Bengaluru'}, {user?.region || 'India'}
            </span>
          </div>

          <h1 className="pj-serif pj-hero-title">
            {user?.name || 'Seeker of Grace'}
          </h1>

          <p className="pj-hero-time-label">
            Walking the consecrated path for <strong>{user?.timeOnPathLabel || '4 years, 6 months'}</strong>
          </p>
        </div>

        {/* Action Controls: Persona Switcher + Whisper of Grace */}
        <div className="pj-hero-actions">
          <PersonaSwitcher onSwitched={onPersonaSwitched} />
          <button
            type="button"
            onClick={onOpenReflection}
            className="pj-whisper-trigger-btn"
            title="Record a micro-reflection of your sadhana"
            id="btn-whisper-grace"
          >
            <Feather size={14} /> Whisper of Grace
          </button>
        </div>
      </div>

      {/* Active Practices & Rhythm Banner */}
      <div className="pj-hero-banner">
        <div>
          <span className="pj-tag" style={{ color: 'var(--pj-text-muted)', fontSize: 10 }}>
            Active Daily Sadhana
          </span>
          <div className="pj-practice-pills-wrap">
            {practices.map((pName) => (
              <span key={pName} className="pj-practice-pill">
                <span style={{ fontSize: 13 }}>🪷</span> {pName}
              </span>
            ))}
          </div>
        </div>

        {/* Level & Kailash Ascent Progress */}
        <div className="pj-rhythm-badge">
          <span className="pj-tag" style={{ color: 'var(--pj-text-muted)', fontSize: 10, display: 'block' }}>
            Pilgrimage Standing
          </span>
          <div className="pj-rhythm-value" style={{ marginTop: 4 }}>
            <Mountain size={14} color="var(--pj-terracotta)" />
            <span style={{ color: 'var(--pj-text-charcoal)' }}>Level {level} Seeker</span>
            <span style={{ color: 'var(--pj-text-muted)', fontWeight: 500, fontSize: 12 }}>
              ({score.toLocaleString()} pts)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
