import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Flame, Calendar, ChevronRight, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import PersonaSwitcher from '../components/PersonaSwitcher';
import api from '../api';
import { useAuth } from '../context/AuthContext';
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
  // Pad start so the first day lands on the correct column
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
  if (status === 'high_activity') return { background: '#B85D36', boxShadow: '0 0 4px rgba(184,93,54,0.5)' };
  if (status === 'target_achieved') return { background: '#4E6346' };
  if (status === 'partial') return { background: '#C49A45', opacity: 0.75 };
  // has sessions but no target set
  return { background: 'rgba(184,93,54,0.5)' };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Progress() {
  const { user } = useAuth();
  const location  = useLocation();

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

  useEffect(() => { fetchReport(selectedRange); }, [selectedRange]);

  // ─── Derived Data ──────────────────────────────────────────────────────────

  const summary    = reportData?.summary    || {};
  const progression = reportData?.progression || {};
  const insights   = reportData?.insights    || [];
  const breakdown  = reportData?.practiceBreakdown || [];
  const calendar   = reportData?.consistencyCalendar || [];
  const milestones = reportData?.milestones  || [];

  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendar), [calendar]);

  // Pick the single most meaningful insight sentence
  const primaryInsight = insights.find(i => i.type === 'consistency' || i.type === 'recent_trend') || insights[0];

  // Max sessions in breakdown for relative bar widths
  const maxBreakdownCount = useMemo(() => {
    if (!breakdown.length) return 1;
    return Math.max(...breakdown.map(p => p.completedCount), 1);
  }, [breakdown]);

  // Level progress percentage
  const levelPercent = Math.min(100, progression.currentLevelScore ?? 0);

  // ─── Empty / Loading State ────────────────────────────────────────────────

  const firstName = user?.name?.split(' ')[0] || 'Seeker';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <div className="page pi-page">
        <div className="pi-container">

          {/* ── PAGE HEADER ── */}
          <div className="pi-header">
            <div className="pi-header-left">
              <p className="pi-greeting">Your practice, {firstName}</p>
              <h1 className="pi-title font-serif">Progress &amp; Insights</h1>
            </div>
            <div className="pi-header-right">
              <PersonaSwitcher onSwitched={() => fetchReport(selectedRange)} />
              <Link to="/personal-journey" className="pi-link-pill">
                📜 Journey
              </Link>
            </div>
          </div>

          {/* ── TIME RANGE PILLS ── */}
          <div className="pi-range-bar">
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

          {/* ── LOADING / ERROR ── */}
          {loading ? (
            <div className="pi-loading">
              <div className="spinner" style={{ borderColor: 'var(--accent-terracotta) transparent' }} />
              <p className="pi-loading-text font-serif">Reading your practice records…</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <>
              {/* ══════════════════════════════════════════════════════════ */}
              {/* 1. HERO STATS ROW                                         */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="pi-hero-grid">
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
                    {selectedRange === 'all' ? 'Total sessions' : `Sessions in ${selectedRange === '7' ? '7' : selectedRange === '30' ? '30' : '?'} days`}
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
                    Days practiced &nbsp;·&nbsp; {summary.consistency?.activeDays ?? 0}/{summary.consistency?.totalDays ?? 0}
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 2. PRIMARY INSIGHT SENTENCE                               */}
              {/* ══════════════════════════════════════════════════════════ */}
              {primaryInsight && (
                <div className="pi-insight-sentence">
                  <span className="pi-insight-icon">✦</span>
                  <p className="pi-insight-text font-serif">"{primaryInsight.statement}"</p>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 3. ACTIVITY CALENDAR                                      */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="pi-card" id="activity-calendar">
                <div className="pi-card-header">
                  <h2 className="pi-card-title font-serif">Activity Calendar</h2>
                  <div className="pi-legend">
                    <span className="pi-legend-dot" style={{ background: 'var(--pi-dot-empty)' }} /> None
                    <span className="pi-legend-dot" style={{ background: 'rgba(196,154,69,0.75)' }} /> Partial
                    <span className="pi-legend-dot" style={{ background: '#4E6346' }} /> Target met
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
              {/* 4. LEVEL PROGRESSION (compact)                           */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="pi-card pi-level-card" id="level-progression">
                <div className="pi-level-row">
                  <div className="pi-level-left">
                    <span className="pi-level-badge">Level {progression.currentLevel ?? 1}</span>
                    <span className="pi-level-arrow">→</span>
                    <span className="pi-level-next">Level {(progression.currentLevel ?? 1) + 1}</span>
                  </div>
                  <span className="pi-level-pts">
                    <strong>{progression.pointsToNextLevel ?? '—'}</strong> pts to go
                  </span>
                </div>
                <div className="pi-level-bar-bg">
                  <div
                    className="pi-level-bar-fill"
                    style={{ width: `${levelPercent}%` }}
                  />
                </div>
                <div className="pi-level-sub">
                  {progression.totalCumulativeScore ?? 0} lifetime points
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 5. PRACTICE BREAKDOWN (CSS bars, no chart.js)            */}
              {/* ══════════════════════════════════════════════════════════ */}
              {breakdown.length > 0 && (
                <div className="pi-card" id="practice-breakdown">
                  <div className="pi-card-header">
                    <h2 className="pi-card-title font-serif">Your Practices</h2>
                    <Link to="/select-practices" className="pi-text-link">
                      Edit practices →
                    </Link>
                  </div>
                  <div className="pi-practice-list">
                    {breakdown.map((p, idx) => {
                      const fillPct = Math.round((p.completedCount / maxBreakdownCount) * 100);
                      const isTop = idx === 0;
                      return (
                        <div key={p.practiceName} className="pi-practice-row">
                          <span className="pi-practice-emoji">
                            {PRACTICE_ICONS[p.practiceName] || '🙏'}
                          </span>
                          <div className="pi-practice-info">
                            <div className="pi-practice-name-row">
                              <span className="pi-practice-name">{p.practiceName}</span>
                              <span className="pi-practice-count">
                                {p.completedCount} session{p.completedCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="pi-bar-bg">
                              <div
                                className={`pi-bar-fill${isTop ? ' pi-bar-fill--top' : ''}`}
                                style={{ width: `${fillPct}%` }}
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
              {/* 6. TARGET VS ACTUAL (inline rows, no chart)              */}
              {/* ══════════════════════════════════════════════════════════ */}
              {(reportData?.targetVsActual || []).length > 0 && (
                <div className="pi-card" id="target-vs-actual">
                  <div className="pi-card-header">
                    <h2 className="pi-card-title font-serif">Target vs. Actual</h2>
                    <span className="pi-card-sub">Daily average over the period</span>
                  </div>
                  <div className="pi-tva-list">
                    {(reportData?.targetVsActual || []).map((t) => {
                      const ratio = t.dailyTarget > 0
                        ? Math.min(100, Math.round((t.actualDailyAverage / t.dailyTarget) * 100))
                        : 100;
                      const met = t.actualDailyAverage >= t.dailyTarget;
                      return (
                        <div key={t.practiceName} className="pi-tva-row">
                          <span className="pi-tva-emoji">{PRACTICE_ICONS[t.practiceName] || '🙏'}</span>
                          <div className="pi-tva-info">
                            <div className="pi-tva-name-row">
                              <span className="pi-tva-name">{t.practiceName}</span>
                              <span className={`pi-tva-ratio${met ? ' met' : ''}`}>
                                {t.actualDailyAverage} / {t.dailyTarget} per day
                              </span>
                            </div>
                            <div className="pi-bar-bg">
                              <div
                                className="pi-bar-fill"
                                style={{
                                  width: `${ratio}%`,
                                  background: met ? '#4E6346' : '#B85D36',
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
              {/* 7. MILESTONES (max 3 recent)                             */}
              {/* ══════════════════════════════════════════════════════════ */}
              {milestones.length > 0 && (
                <div className="pi-card" id="milestones">
                  <div className="pi-card-header">
                    <h2 className="pi-card-title font-serif">Milestones</h2>
                    <Link to="/personal-journey" className="pi-text-link">
                      Full history →
                    </Link>
                  </div>
                  <div className="pi-milestone-list">
                    {milestones.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="pi-milestone-row">
                        <span className="pi-milestone-icon">{m.icon || '🪷'}</span>
                        <div>
                          <div className="pi-milestone-title">{m.title}</div>
                          <div className="pi-milestone-date">{m.date ? formatShortDate(m.date) : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* 8. NAVIGATION SHORTCUTS                                  */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="pi-nav-links">
                <Link to="/personal-journey" className="pi-nav-tile">
                  <div>
                    <div className="pi-nav-tile-title">River of Time</div>
                    <div className="pi-nav-tile-sub">Your complete practice history</div>
                  </div>
                  <ChevronRight size={16} color="var(--accent-terracotta)" />
                </Link>
                <Link to="/select-practices" className="pi-nav-tile">
                  <div>
                    <div className="pi-nav-tile-title">Practices</div>
                    <div className="pi-nav-tile-sub">Configure what you track</div>
                  </div>
                  <ChevronRight size={16} color="var(--accent-gold)" />
                </Link>
                <Link to="/journey" className="pi-nav-tile">
                  <div>
                    <div className="pi-nav-tile-title">Kailash Yatra</div>
                    <div className="pi-nav-tile-sub">Digital pilgrimage progress</div>
                  </div>
                  <ChevronRight size={16} color="var(--accent-olive)" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
