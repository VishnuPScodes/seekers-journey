import React from 'react';
import { HeartHandshake, ShieldCheck, Moon, Sun, Users } from 'lucide-react';

export default function MandalaSevaCard({ user, mandala, seva = [] }) {
  const hasActiveMandala = mandala && mandala.status === 'active';
  const consistency = mandala?.consistencyPercentage || 92;
  const currentDay = mandala?.currentDay || 1;
  const totalDays = mandala?.totalDays || 40;

  return (
    <div className="pj-card">
      <div style={{ marginBottom: 16 }}>
        <span className="pj-tag" style={{ color: 'var(--pj-olive)' }}>
          Devotion & Action
        </span>
        <h2 className="pj-serif" style={{ fontSize: 23, fontWeight: 700, color: 'var(--pj-text-charcoal)', margin: '2px 0 0' }}>
          Mandala Rhythm & Sacred Seva
        </h2>
        <p style={{ fontSize: 13, color: 'var(--pj-text-muted)', margin: '2px 0 0' }}>
          Consecrating daily practice cycles and offering selfless action in consecrated spaces.
        </p>
      </div>

      <div className="pj-mandala-grid">
        {/* Box 1: Mandala Discipline Cycle */}
        <div className="pj-mandala-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="var(--pj-olive)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pj-text-charcoal)' }}>
                {hasActiveMandala ? mandala.title : 'Consecrated Daily Discipline'}
              </span>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--pj-radius-pill)',
              background: 'rgba(78, 99, 70, 0.15)',
              color: 'var(--pj-olive)',
            }}>
              {hasActiveMandala ? `Day ${currentDay} of ${totalDays}` : 'Active Rhythm'}
            </span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--pj-text-secondary)', margin: '0 0 12px', lineHeight: 1.45 }}>
            {hasActiveMandala
              ? `Walking the ${totalDays}-day mandala for ${mandala.practiceName}. Maintaining unwavering discipline at the sandhya kalas.`
              : `Consecrated to dawn sadhana before sunrise. Sustaining over ${consistency}% rhythmic completion across practice cycles.`}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--pj-text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sun size={13} color="var(--pj-saffron)" /> Dawn Sadhana
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Moon size={13} color="var(--pj-water)" /> Twilight Sandhya
            </span>
          </div>
        </div>

        {/* Box 2: Seva Offerings */}
        <div className="pj-mandala-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeartHandshake size={18} color="var(--pj-terracotta)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pj-text-charcoal)' }}>
                Sacred Seva & Offerings
              </span>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--pj-radius-pill)',
              background: 'var(--pj-terracotta-glow)',
              color: 'var(--pj-terracotta)',
            }}>
              {seva.length > 0 ? `${seva.length} Offerings` : 'Path of Seva'}
            </span>
          </div>

          {seva.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {seva.slice(0, 2).map((s, idx) => (
                <div key={idx} style={{ fontSize: 12, color: 'var(--pj-text-secondary)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--pj-text-charcoal)' }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--pj-text-muted)' }}>{s.location || 'Ashram'}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--pj-text-secondary)', margin: 0, lineHeight: 1.45 }}>
              "Offering yourself without hesitation in action is the fastest way to dissolve personal limitations." Serving at city center activities and ashram consecrated spaces.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
