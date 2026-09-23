import React from 'react';
import { MapPin, Mountain } from 'lucide-react';
import { KundaliniSerpentSpiralMotif } from '../../../components/SadhanaMotifs';

export default function JourneyHero({ user }) {
  const practices = user?.selectedPractices || [];
  const level = user?.currentLevel || 1;
  const score = user?.totalCumulativeScore || 0;
  const locationText = [user?.city, user?.region].filter(Boolean).join(', ');

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
            {locationText && (
              <>
                <span style={{ color: 'var(--pj-border-strong)' }}>•</span>
                <span style={{ fontSize: 12, color: 'var(--pj-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} color="var(--pj-terracotta)" /> {locationText}
                </span>
              </>
            )}
          </div>

          <h1 className="pj-serif pj-hero-title">
            {user?.name || 'Seeker'}
          </h1>

          <p className="pj-hero-time-label">
            Walking the consecrated path for <strong>{user?.timeOnPathLabel || 'this sacred journey'}</strong>
          </p>
        </div>
      </div>

      {/* Active Practices & Rhythm Banner */}
      <div className="pj-hero-banner">
        <div>
          <span className="pj-tag" style={{ color: 'var(--pj-text-muted)', fontSize: 10 }}>
            Active Daily Sadhana
          </span>
          <div className="pj-practice-pills-wrap">
            {practices.length > 0 ? (
              practices.map((pName) => (
                <span key={pName} className="pj-practice-pill">
                  <span style={{ fontSize: 13 }}>🪷</span> {pName}
                </span>
              ))
            ) : (
              <span style={{ fontSize: 12, color: 'var(--pj-text-muted)', fontStyle: 'italic' }}>
                No active practices recorded yet
              </span>
            )}
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
