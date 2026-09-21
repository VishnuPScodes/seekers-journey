import React, { useMemo } from 'react';
import { CheckCircle2, Compass, ArrowRight, Lock, Sparkles } from 'lucide-react';

export default function CurriculumPathways({
  user,
  programs = [],
  officialPrograms = [],
}) {
  // Completed programs list matching official programs
  const completedPrograms = useMemo(() => {
    return officialPrograms.filter(prog => programs.some(p => p.programId === prog.id));
  }, [officialPrograms, programs]);

  // Upcoming programs not yet completed
  const upcomingPrograms = useMemo(() => {
    return officialPrograms.filter(prog => !programs.some(p => p.programId === prog.id));
  }, [officialPrograms, programs]);

  // Count eligible advanced programs
  const eligibleCount = useMemo(() => {
    return upcomingPrograms.filter(prog => {
      const prereqs = prog.prerequisites || [];
      return prereqs.every(preId => programs.some(p => p.programId === preId));
    }).length;
  }, [upcomingPrograms, programs]);

  return (
    <div className="pj-card pj-curriculum-card">
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <span className="pj-tag" style={{ color: 'var(--pj-terracotta)' }}>
            Sacred Curriculum
          </span>
          <h2 className="pj-serif" style={{ fontSize: 25, fontWeight: 700, color: 'var(--pj-text-charcoal)', margin: '2px 0 0' }}>
            Program Journey & Sacred Ascent
          </h2>
          <p style={{ fontSize: 13, color: 'var(--pj-text-muted)', margin: '3px 0 0' }}>
            From foundational technologies of inner well-being to advanced residential silence immersions.
          </p>
        </div>

        {/* Metric Badges */}
        <div className="pj-curriculum-metrics">
          <div className="pj-curriculum-metric-box" style={{ background: 'var(--pj-olive-light)', border: '1px solid rgba(78, 99, 70, 0.3)' }}>
            <span className="pj-serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--pj-olive)', display: 'block' }}>
              {completedPrograms.length}
            </span>
            <span className="pj-tag" style={{ fontSize: 9, color: 'var(--pj-olive)' }}>Completed</span>
          </div>

          <div className="pj-curriculum-metric-box" style={{ background: 'var(--pj-terracotta-glow)', border: '1px solid rgba(217, 87, 43, 0.35)' }}>
            <span className="pj-serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--pj-terracotta)', display: 'block' }}>
              {eligibleCount}
            </span>
            <span className="pj-tag" style={{ fontSize: 9, color: 'var(--pj-terracotta)' }}>Eligible Next</span>
          </div>
        </div>
      </div>

      {/* ── Sub-section 1: Completed Programs ── */}
      {completedPrograms.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--pj-olive)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
          }}>
            <CheckCircle2 size={16} color="var(--pj-olive)" />
            Completed Sacred Programs ({completedPrograms.length})
          </div>

          <div className="pj-completed-grid">
            {completedPrograms.map(prog => {
              const userProg = programs.find(p => p.programId === prog.id);
              const completionYear = userProg?.completionDate
                ? new Date(userProg.completionDate).getFullYear()
                : 'Consecrated';

              return (
                <div key={prog.id} className="pj-completed-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{prog.icon}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--pj-radius-pill)',
                      background: 'rgba(78, 99, 70, 0.18)',
                      color: 'var(--pj-olive)',
                    }}>
                      ✓ {completionYear}
                    </span>
                  </div>

                  <div className="pj-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--pj-text-charcoal)', marginBottom: 4 }}>
                    {prog.name}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--pj-text-secondary)', margin: '0 0 10px', lineHeight: 1.45 }}>
                    {prog.description}
                  </p>

                  {prog.transmitsPractices && prog.transmitsPractices.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--pj-terracotta)', fontWeight: 600 }}>
                      Transmitted: {prog.transmitsPractices.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sub-section 2: The Ascent Ahead & Prerequisite Pathways ── */}
      <div>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--pj-terracotta)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}>
          <Compass size={16} color="var(--pj-terracotta)" />
          Sacred Pathways & Prerequisite Stepping Stones
        </div>

        <div className="pj-upcoming-grid">
          {upcomingPrograms.map(prog => {
            const prereqList = (prog.prerequisites || []).map(preId => {
              const preProg = officialPrograms.find(p => p.id === preId);
              const isDone = programs.some(p => p.programId === preId);
              return {
                id: preId,
                name: preProg ? preProg.name : preId.replace('_', ' ').toUpperCase(),
                isDone,
              };
            });

            const isEligible = prereqList.length === 0 || prereqList.every(p => p.isDone);

            return (
              <div key={prog.id} className={`pj-prereq-card ${isEligible ? 'eligible' : ''}`}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{prog.icon}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--pj-radius-pill)',
                      background: isEligible ? 'var(--pj-terracotta-glow)' : 'rgba(44, 38, 31, 0.08)',
                      color: isEligible ? 'var(--pj-terracotta)' : 'var(--pj-text-muted)',
                      border: `1px solid ${isEligible ? 'var(--pj-border-strong)' : 'transparent'}`,
                    }}>
                      {isEligible ? '✨ Eligible to Attend' : '⏳ Prerequisites Pending'}
                    </span>
                  </div>

                  <div className="pj-serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--pj-text-charcoal)', marginBottom: 4 }}>
                    {prog.name}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--pj-text-muted)', marginBottom: 8 }}>
                    {prog.duration || 'Residential Program'}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--pj-text-secondary)', margin: '0 0 12px', lineHeight: 1.45 }}>
                    {prog.description}
                  </p>
                </div>

                {/* Prerequisite Stepping Stones */}
                <div className="pj-prereq-checklist">
                  <span className="pj-tag" style={{ fontSize: 9, color: 'var(--pj-text-muted)', display: 'block', marginBottom: 6 }}>
                    Pathway Prerequisites:
                  </span>

                  {prereqList.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--pj-olive)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      ✓ Open Registration (No prerequisites required)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {prereqList.map(pr => (
                        <div
                          key={pr.id}
                          style={{
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: pr.isDone ? 'var(--pj-text-charcoal)' : 'var(--pj-text-muted)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: pr.isDone ? 'var(--pj-olive)' : 'var(--pj-text-muted)', fontWeight: 700 }}>
                              {pr.isDone ? '✓' : '○'}
                            </span>{' '}
                            {pr.name}
                          </span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: pr.isDone ? 'var(--pj-olive)' : 'var(--pj-saffron)',
                          }}>
                            {pr.isDone ? 'Complete' : 'Pending'}
                          </span>
                        </div>
                      ))}

                      {prog.id === 'samyama' && (
                        <div style={{
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: 'var(--pj-text-charcoal)',
                          borderTop: '1px dashed var(--pj-border-hairline)',
                          paddingTop: 4,
                          marginTop: 2,
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: 'var(--pj-olive)', fontWeight: 700 }}>✓</span> 60 Days Daily Practice
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--pj-olive)' }}>
                            Active
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
