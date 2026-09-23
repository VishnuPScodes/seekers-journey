import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { PRACTICE_ICON_EMOJI as PRACTICE_ICONS } from '../utils/practiceIcons';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(dateVal) {
  if (!dateVal) return '';
  let d;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    d = new Date(dateVal + 'T12:00:00Z');
  } else {
    d = new Date(dateVal);
  }
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const TIME_RANGES = [
  { label: '7 Days',   value: '7' },
  { label: '30 Days',  value: '30' },
  { label: 'All Time', value: 'all' },
];

// Build a week-per-row calendar structure from the raw consistencyCalendar array
function buildCalendarWeeks(days) {
  if (!days || days.length === 0) return [];
  const weeks = [];
  let week = [];
  const dateStr = days[0].date.includes('T') ? days[0].date : days[0].date + 'T12:00:00';
  const first = new Date(dateStr);
  const startDow = first.getDay(); // 0=Sun
  for (let i = 0; i < startDow; i++) week.push(null);
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// Dot color logic: no practice → faint, any practice → terracotta gradient by intensity
function dotStyle(day) {
  if (!day) return { background: 'transparent' };
  const count = day.practiceCount || 0;
  const status = day.status;
  if (count === 0) return { background: 'var(--pi-dot-empty)' };
  if (status === 'high_activity') return { background: '#B85D36', boxShadow: '0 0 6px rgba(184,93,54,0.45)' };
  if (status === 'target_achieved') return { background: '#4E6346', boxShadow: '0 0 4px rgba(78,99,70,0.35)' };
  if (status === 'partial') return { background: '#C49A45', opacity: 0.85 };
  return { background: 'rgba(184,93,54,0.5)' };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Progress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState('30');
  const [reportData,    setReportData]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  // Fetch insights report whenever range changes
  const fetchReport = async (range) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/sadhana/insights-report?range=${range}`);
      setReportData(data);
    } catch (err) {
      console.error('Insights report error:', err);
      setError('Could not load your practice data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedRange);
  }, [selectedRange]);

  // ─── Derived Data ──────────────────────────────────────────────────────────
  const summary    = reportData?.summary    || {};
  const insights   = reportData?.insights    || [];
  const breakdown  = reportData?.practiceBreakdown || [];
  const tvaList    = reportData?.targetVsActual || [];
  const calendar   = reportData?.consistencyCalendar || [];
  const milestones = reportData?.milestones  || [];

  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendar), [calendar]);

  // Primary meaningful insight sentence
  const primaryInsight = insights.find(i => i.type === 'consistency' || i.type === 'recent_trend') || insights[0];

  // Max sessions in breakdown for proportional bar widths
  const maxBreakdownCount = useMemo(() => {
    if (!breakdown.length) return 1;
    return Math.max(...breakdown.map(p => p.completedCount), 1);
  }, [breakdown]);

  const firstName = user?.name?.split(' ')[0] || 'Seeker';

  return (
    <>
      <Navbar />
      <div className="page pi-page">
        <div className="pi-container" style={{ maxWidth: 760 }}>
          {/* Back Navigation */}
          <button
            type="button"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            id="btn-back-nav"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: '#d9572b',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginBottom: 14,
              padding: 0,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* ── PAGE HEADER ── */}
          <div className="pi-header" style={{ marginBottom: 18 }}>
            <div className="pi-header-left">
              <p className="pi-greeting">Your practice journey, {firstName} 🙏</p>
              <h1 className="pi-title font-serif">Progress &amp; Insights</h1>
            </div>
            <div className="pi-header-right">
              <Link to="/personal-journey" className="pi-link-pill">
                📜 View River of Time →
              </Link>
            </div>
          </div>

          {/* ── TIME RANGE BAR ── */}
          <div className="pi-range-bar" style={{ marginBottom: 20 }}>
            {TIME_RANGES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedRange(opt.value)}
                className={`pi-range-pill${selectedRange === opt.value ? ' active' : ''}`}
                id={`range-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
            {reportData?.period?.startDate && (
              <span className="pi-period-label">
                {formatShortDate(reportData.period.startDate)} — {formatShortDate(reportData.period.endDate)}
              </span>
            )}
          </div>

          {/* ── LOADING / ERROR / CONTENT ── */}
          {loading ? (
            <div className="pi-loading">
              <div className="spinner" style={{ borderColor: 'var(--accent-terracotta) transparent' }} />
              <p className="pi-loading-text font-serif">Reading your sacred practice records…</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <>
              {/* ══════════════════════════════════════════════════════════ */}
              {/* 1. HERO STATS ROW                                         */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="pi-hero-grid" style={{ marginBottom: 20 }}>
                {/* Streak */}
                <div className="pi-hero-tile" id="hero-streak">
                  <div className="pi-hero-icon">🔥</div>
                  <div className="pi-hero-number font-serif">
                    {summary.currentStreak ?? 0}
                    <span className="pi-hero-unit">days</span>
                  </div>
                  <div className="pi-hero-label">Current streak</div>
                </div>

                {/* Sessions */}
                <div className="pi-hero-tile pi-hero-tile--center" id="hero-sessions">
                  <div className="pi-hero-icon">🧘</div>
                  <div className="pi-hero-number font-serif">
                    {summary.totalSessions ?? 0}
                  </div>
                  <div className="pi-hero-label">
                    {selectedRange === 'all' ? 'Total sessions' : `Sessions in ${selectedRange === '7' ? '7' : '30'} days`}
                  </div>
                </div>

                {/* Consistency */}
                <div className="pi-hero-tile" id="hero-consistency">
                  <div className="pi-hero-icon">📅</div>
                  <div className="pi-hero-number font-serif">
                    {summary.consistency?.percentage ?? 0}
                    <span className="pi-hero-unit">%</span>
                  </div>
                  <div className="pi-hero-label">
                    Active {summary.consistency?.activeDays ?? 0} of {summary.consistency?.totalDays ?? 0} days
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 2. PRIMARY INSIGHT QUOTATION                              */}
              {/* ══════════════════════════════════════════════════════════ */}
              {primaryInsight && (
                <div className="pi-insight-sentence" style={{ marginBottom: 22 }}>
                  <span className="pi-insight-icon">✦</span>
                  <p className="pi-insight-text font-serif">"{primaryInsight.statement}"</p>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 3. UNIFIED SADHANA PRACTICE PERFORMANCE                   */}
              {/* ══════════════════════════════════════════════════════════ */}
              {breakdown.length > 0 && (
                <div className="pi-card" id="practice-performance" style={{ marginBottom: 22 }}>
                  <div className="pi-card-header">
                    <div>
                      <h2 className="pi-card-title font-serif">Sadhana Performance</h2>
                      <span className="pi-card-sub" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Completed sessions &amp; daily target adherence
                      </span>
                    </div>
                    <Link to="/select-practices" className="pi-text-link" style={{ fontSize: '0.8rem', color: '#d9572b', fontWeight: 600 }}>
                      Configure targets →
                    </Link>
                  </div>

                  <div className="pi-practice-list">
                    {breakdown.map((p, idx) => {
                      const tva = tvaList.find(t => t.practiceName === p.practiceName);
                      const dailyTarget = tva?.dailyTarget || 1;
                      const actualAvg = tva?.actualDailyAverage || 0;
                      const isMet = actualAvg >= dailyTarget;
                      const fillPct = Math.min(100, Math.round((p.completedCount / maxBreakdownCount) * 100));

                      return (
                        <div key={p.practiceName} className="pi-practice-row" style={{ padding: '12px 0' }}>
                          <span className="pi-practice-emoji" style={{ fontSize: 24, flexShrink: 0 }}>
                            {PRACTICE_ICONS[p.practiceName] || '🙏'}
                          </span>

                          <div className="pi-practice-info" style={{ flex: 1, minWidth: 0 }}>
                            <div className="pi-practice-name-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span className="pi-practice-name" style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                {p.practiceName}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {p.completedCount} session{p.completedCount !== 1 ? 's' : ''}
                                </span>

                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    background: isMet ? 'rgba(78, 99, 70, 0.16)' : 'rgba(184, 93, 54, 0.14)',
                                    color: isMet ? '#3d5236' : '#b85d36',
                                    border: `1px solid ${isMet ? 'rgba(78, 99, 70, 0.3)' : 'rgba(184, 93, 54, 0.25)'}`,
                                  }}
                                >
                                  {actualAvg} / {dailyTarget} daily {isMet ? '✓' : ''}
                                </span>
                              </div>
                            </div>

                            <div className="pi-bar-bg" style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                              <div
                                className="pi-bar-fill"
                                style={{
                                  width: `${fillPct}%`,
                                  height: '100%',
                                  borderRadius: 3,
                                  background: isMet
                                    ? 'linear-gradient(90deg, #4E6346, #6b8760)'
                                    : 'linear-gradient(90deg, #d9572b, #e67e22)',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 4. ACTIVITY CALENDAR                                      */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="pi-card" id="activity-calendar" style={{ marginBottom: 22 }}>
                <div className="pi-card-header">
                  <div>
                    <h2 className="pi-card-title font-serif">Activity Calendar</h2>
                    <span className="pi-card-sub" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Daily sadhana rhythm over this period
                    </span>
                  </div>
                  <div className="pi-legend">
                    <span className="pi-legend-dot" style={{ background: 'var(--pi-dot-empty)' }} /> None
                    <span className="pi-legend-dot" style={{ background: 'rgba(196,154,69,0.75)' }} /> Partial
                    <span className="pi-legend-dot" style={{ background: '#4E6346' }} /> Met
                    <span className="pi-legend-dot" style={{ background: '#B85D36' }} /> Full+
                  </div>
                </div>

                {calendarWeeks.length === 0 ? (
                  <div className="pi-empty">No sessions recorded for this period yet.</div>
                ) : (
                  <div className="pi-calendar-wrap">
                    {/* Day-of-week headers */}
                    <div className="pi-cal-dow-row">
                      {DAY_LABELS.map((d, i) => (
                        <div key={i} className="pi-cal-dow">{d}</div>
                      ))}
                    </div>
                    {/* Weeks */}
                    <div className="pi-cal-grid">
                      {calendarWeeks.map((week, wi) => (
                        <div key={wi} className="pi-cal-week">
                          {week.map((day, di) => {
                            const ds = dotStyle(day);
                            const tip = day
                              ? `${day.date}: ${day.practiceCount} session${day.practiceCount !== 1 ? 's' : ''}`
                              : '';
                            return (
                              <div
                                key={di}
                                className="pi-dot"
                                style={ds}
                                title={tip}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 5. SACRED MILESTONES (Clean & Minimalist)                 */}
              {/* ══════════════════════════════════════════════════════════ */}
              {milestones.length > 0 && (
                <div className="pi-card" id="milestones">
                  <div className="pi-card-header">
                    <h2 className="pi-card-title font-serif">Recent Milestones</h2>
                    <Link to="/personal-journey" className="pi-text-link" style={{ fontSize: '0.8rem', color: '#d9572b', fontWeight: 600 }}>
                      All milestones →
                    </Link>
                  </div>
                  <div className="pi-milestone-list">
                    {milestones.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="pi-milestone-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                        <span className="pi-milestone-icon" style={{ fontSize: 22, flexShrink: 0 }}>
                          {m.icon || '🪷'}
                        </span>
                        <div>
                          <div className="pi-milestone-title" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {m.title}
                          </div>
                          <div className="pi-milestone-date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {m.date ? formatShortDate(m.date) : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
