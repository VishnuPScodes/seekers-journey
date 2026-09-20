import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { PRACTICE_ICON_EMOJI as PRACTICE_ICONS } from '../utils/practiceIcons';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

function formatDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const RANGE_OPTIONS = [
  { label: '7 days',   value: 7 },
  { label: '14 days',  value: 14 },
  { label: '1 month',  value: 30 },
  { label: '3 months', value: 90 },
  { label: '6 months', value: 180 },
];

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Progress({ defaultTab }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab state: 'sadhana' or 'life'
  const [activeTab, setActiveTab] = useState(() => {
    if (defaultTab) return defaultTab;
    if (location.pathname === '/life-metrics') return 'life';
    return 'sadhana';
  });

  // Sync tab state when location pathname changes
  useEffect(() => {
    if (location.pathname === '/life-metrics') {
      setActiveTab('life');
    } else if (location.pathname === '/progress') {
      setActiveTab('sadhana');
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'life' && location.pathname !== '/life-metrics') {
      navigate('/life-metrics', { replace: true });
    } else if (tab === 'sadhana' && location.pathname !== '/progress') {
      navigate('/progress', { replace: true });
    }
  };

  // ─── Sadhana State ────────────────────────────────────────────────────────
  const [sadhanaHistory, setSadhanaHistory] = useState([]);
  const [sadhanaStats, setSadhanaStats] = useState(null);
  const [sadhanaLoading, setSadhanaLoading] = useState(true);
  const [sadhanaError, setSadhanaError] = useState('');
  const [sadhanaDays, setSadhanaDays] = useState(14);
  const [sadhanaChartType, setSadhanaChartType] = useState('bar');

  useEffect(() => {
    if (sadhanaDays > 30) setSadhanaChartType('line');
  }, [sadhanaDays]);

  useEffect(() => {
    const fetchSadhanaHistory = async () => {
      setSadhanaLoading(true);
      setSadhanaError('');
      try {
        const { data } = await api.get(`/sadhana/history?days=${sadhanaDays}`);
        setSadhanaHistory(data.history || []);
        setSadhanaStats(data.stats || null);
      } catch (err) {
        setSadhanaError('Failed to load sadhana progress data');
      } finally {
        setSadhanaLoading(false);
      }
    };
    fetchSadhanaHistory();
  }, [sadhanaDays]);

  // ─── Life Metrics State ───────────────────────────────────────────────────
  const [lifeHistory, setLifeHistory] = useState([]);
  const [lifeStats, setLifeStats] = useState(null);
  const [lifeLoading, setLifeLoading] = useState(true);
  const [lifeError, setLifeError] = useState('');
  const [lifeDays, setLifeDays] = useState(14);
  const [lifeChartType, setLifeChartType] = useState('bar');

  useEffect(() => {
    if (lifeDays > 30) setLifeChartType('line');
  }, [lifeDays]);

  useEffect(() => {
    const fetchLifeHistory = async () => {
      setLifeLoading(true);
      setLifeError('');
      try {
        const { data } = await api.get(`/life/history?days=${lifeDays}`);
        setLifeHistory(data.history || []);
        setLifeStats(data.stats || null);
      } catch (err) {
        setLifeError('Failed to load life metrics data');
      } finally {
        setLifeLoading(false);
      }
    };
    fetchLifeHistory();
  }, [lifeDays]);

  // ─── Sadhana Chart Config ─────────────────────────────────────────────────
  const sadhanaMaxTicks = sadhanaDays <= 14 ? sadhanaDays : sadhanaDays <= 30 ? 15 : sadhanaDays <= 90 ? 13 : 12;
  const sadhanaLabels = sadhanaHistory.map(h => formatDate(h.date, sadhanaDays));
  const sadhanaScores = sadhanaHistory.map(h => h.totalScore);

  const perfectDayColors = sadhanaHistory.map(h =>
    h.isPerfectDay
      ? 'rgba(52, 211, 153, 0.85)'
      : h.practiced
      ? 'rgba(139, 92, 246, 0.75)'
      : 'rgba(255, 255, 255, 0.06)'
  );
  const perfectDayBorders = sadhanaHistory.map(h =>
    h.isPerfectDay
      ? 'rgba(52, 211, 153, 1)'
      : h.practiced
      ? 'rgba(167, 139, 250, 1)'
      : 'rgba(255,255,255,0.1)'
  );

  const sadhanaBarData = {
    labels: sadhanaLabels,
    datasets: [{
      label: 'Score',
      data: sadhanaScores,
      backgroundColor: perfectDayColors,
      borderColor: perfectDayBorders,
      borderWidth: 2,
      borderRadius: sadhanaDays > 30 ? 4 : 8,
      borderSkipped: false,
    }],
  };

  const sadhanaLineData = {
    labels: sadhanaLabels,
    datasets: [{
      label: 'Score',
      data: sadhanaScores,
      borderColor: 'rgba(167, 139, 250, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      pointBackgroundColor: perfectDayBorders,
      pointBorderColor: perfectDayBorders,
      pointRadius: sadhanaDays > 90 ? 2 : sadhanaDays > 30 ? 3 : 5,
      pointHoverRadius: sadhanaDays > 90 ? 5 : 7,
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
    }],
  };

  const sadhanaChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: sadhanaDays > 90 ? 400 : 700 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 12, 30, 0.95)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        titleColor: '#c4b5fd',
        bodyColor: '#a89fc2',
        padding: 12,
        callbacks: {
          title: (items) => {
            const idx = items[0].dataIndex;
            const entry = sadhanaHistory[idx];
            return `${sadhanaLabels[idx]}${entry?.isPerfectDay ? '  🏆 Perfect Day' : ''}`;
          },
          label: (item) => ` ${item.raw} pts`,
          afterLabel: (item) => {
            const entry = sadhanaHistory[item.dataIndex];
            if (!entry?.practices?.length) return '';
            const done = entry.practices.filter(p => p.count > 0);
            return done.map(p => `  ${PRACTICE_ICONS[p.name] || '•'} ${p.name} (${p.count}×)`).join('\n');
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        border: { color: 'rgba(255,255,255,0.06)' },
        ticks: {
          color: '#6b6280',
          font: { size: sadhanaDays > 90 ? 9 : 11 },
          maxTicksLimit: sadhanaMaxTicks,
          maxRotation: sadhanaDays > 30 ? 45 : 0,
          minRotation: sadhanaDays > 30 ? 45 : 0,
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#6b6280', font: { size: 11 } },
        beginAtZero: true,
      },
    },
  }), [sadhanaDays, sadhanaHistory, sadhanaLabels, sadhanaMaxTicks]);

  const practiceBreakdown = useMemo(() => {
    const map = {};
    sadhanaHistory.forEach(day => {
      day.practices?.forEach(p => {
        if (p.count > 0) {
          if (!map[p.name]) map[p.name] = { once: 0, twice: 0, total: 0 };
          if (p.count === 1) map[p.name].once++;
          if (p.count === 2) map[p.name].twice++;
          map[p.name].total++;
        }
      });
    });
    return map;
  }, [sadhanaHistory]);

  // ─── Life Chart Config ────────────────────────────────────────────────────
  const lifeMaxTicks = lifeDays <= 14 ? lifeDays : lifeDays <= 30 ? 15 : lifeDays <= 90 ? 13 : 12;
  const lifeLabels = lifeHistory.map(h => formatDate(h.date, lifeDays));
  const lifeScores = lifeHistory.map(h => h.totalLifeScore);

  const lifeBarColors = lifeHistory.map(h =>
    h.totalLifeScore >= 120
      ? 'rgba(52, 211, 153, 0.85)'
      : h.logged
      ? 'rgba(245, 158, 11, 0.85)'
      : 'rgba(255, 245, 235, 0.06)'
  );

  const lifeBarBorders = lifeHistory.map(h =>
    h.totalLifeScore >= 120
      ? 'rgba(52, 211, 153, 1)'
      : h.logged
      ? 'rgba(251, 191, 36, 1)'
      : 'rgba(255, 245, 235, 0.12)'
  );

  const lifeBarData = {
    labels: lifeLabels,
    datasets: [{
      label: 'Life Score',
      data: lifeScores,
      backgroundColor: lifeBarColors,
      borderColor: lifeBarBorders,
      borderWidth: 2,
      borderRadius: lifeDays > 30 ? 4 : 8,
      borderSkipped: false,
    }],
  };

  const lifeLineData = {
    labels: lifeLabels,
    datasets: [{
      label: 'Life Score',
      data: lifeScores,
      borderColor: 'rgba(251, 191, 36, 1)',
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      pointBackgroundColor: lifeBarBorders,
      pointBorderColor: lifeBarBorders,
      pointRadius: lifeDays > 90 ? 2 : lifeDays > 30 ? 3 : 5,
      pointHoverRadius: lifeDays > 90 ? 5 : 7,
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
    }],
  };

  const lifeChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: lifeDays > 90 ? 400 : 700 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 12, 30, 0.95)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        borderWidth: 1,
        titleColor: '#fef08a',
        bodyColor: '#d4c5b0',
        padding: 12,
        callbacks: {
          title: (items) => {
            const idx = items[0].dataIndex;
            const entry = lifeHistory[idx];
            return `${lifeLabels[idx]}${entry?.logged ? '  🌱 Life Log' : '  (Not Logged)'}`;
          },
          label: (item) => ` ${item.raw} / 160 pts`,
          afterLabel: (item) => {
            const entry = lifeHistory[item.dataIndex];
            if (!entry?.answers) return '';
            const a = entry.answers;
            return [
              `  🧘‍♂️ IE Course: ${a.innerEngineeringCount}×`,
              `  🍏 Conscious Eating: ${a.consciousEating}`,
              `  🌊 Mindset: ${a.reactOrRespond}`,
              `  🤝 Willingness: ${a.moreWilling}`,
              `  ⚡ Vibrancy: ${a.systemVibrant}`,
              `  🗣️ Vakshudhi: ${a.vakshudhiRating}`,
            ].join('\n');
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        border: { color: 'rgba(255,255,255,0.06)' },
        ticks: {
          color: '#9c8a74',
          font: { size: lifeDays > 90 ? 9 : 11 },
          maxTicksLimit: lifeMaxTicks,
          maxRotation: lifeDays > 30 ? 45 : 0,
          minRotation: lifeDays > 30 ? 45 : 0,
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#9c8a74', font: { size: 11 } },
        beginAtZero: true,
        max: 160,
      },
    },
  }), [lifeDays, lifeHistory, lifeLabels, lifeMaxTicks]);

  const sadhanaRangeLabel = RANGE_OPTIONS.find(o => o.value === sadhanaDays)?.label || `${sadhanaDays} days`;
  const lifeRangeLabel = RANGE_OPTIONS.find(o => o.value === lifeDays)?.label || `${lifeDays} days`;

  return (
    <>
      <Navbar />
      <div className="page" style={{ alignItems: 'flex-start' }}>
        <div className="progress-page animate-in" style={{ maxWidth: 440, padding: '0 4px' }}>

          {/* Page Header */}
          <div className="progress-header">
            <h1 className="page-title" style={{ fontSize: 28 }}>
              {activeTab === 'sadhana' ? 'Sadhana Progress' : 'Life Metrics'}
            </h1>
            <p className="page-desc">
              {activeTab === 'sadhana'
                ? `Hi ${user?.name?.split(' ')[0] || 'seeker'}, here's your daily sadhana journey 🌟`
                : 'Tracking your daily conscious living & willingness scores 🌿'}
            </p>
          </div>

          {/* In-Page View Switcher Button */}
          <div className="metrics-tab-switcher">
            <button
              type="button"
              className={`metrics-tab-btn ${activeTab === 'sadhana' ? 'active' : ''}`}
              onClick={() => handleTabChange('sadhana')}
              id="switch-tab-sadhana"
            >
              🧘 Sadhana Progress
            </button>
            <button
              type="button"
              className={`metrics-tab-btn ${activeTab === 'life' ? 'active' : ''}`}
              onClick={() => handleTabChange('life')}
              id="switch-tab-life"
            >
              🌱 Life Metrics
            </button>
          </div>

          {/* ────────────────── SADHANA PROGRESS VIEW ────────────────── */}
          {activeTab === 'sadhana' && (
            <>
              {/* Stats */}
              {sadhanaStats && (
                <div className="stats-row animate-in animate-in-delay-1">
                  <StatCard icon="🔥" label="Day Streak"     value={sadhanaStats.currentStreak}     color="var(--amber-400)" />
                  <StatCard icon="⭐" label="Total Score"    value={sadhanaStats.overallScore}       color="var(--purple-400)" />
                  <StatCard icon="📅" label="Days Practiced" value={sadhanaStats.totalDaysPracticed} color="#60a5fa" />
                  <StatCard icon="🏆" label="Perfect Days"   value={sadhanaStats.perfectDays}        color="var(--emerald-400)" />
                </div>
              )}

              {/* Chart card */}
              <div className="glass-card animate-in animate-in-delay-2" style={{ padding: '28px' }}>
                <div className="chart-controls">
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Daily Score
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                        — {sadhanaRangeLabel}
                        {sadhanaHistory.length > 0 && (
                          <span style={{ marginLeft: 6 }}>
                            · {sadhanaHistory.filter(h => h.practiced).length} active days
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span style={{ color: 'var(--purple-400)' }}>■</span> Practice day&nbsp;&nbsp;
                      <span style={{ color: 'var(--emerald-400)' }}>■</span> Perfect day&nbsp;&nbsp;
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>■</span> No practice
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="chart-toggle">
                      <button
                        className={`chart-toggle-btn ${sadhanaChartType === 'bar' ? 'active' : ''}`}
                        onClick={() => setSadhanaChartType('bar')}
                        disabled={sadhanaDays > 30}
                        style={{ opacity: sadhanaDays > 30 ? 0.4 : 1, cursor: sadhanaDays > 30 ? 'not-allowed' : 'pointer' }}
                      >
                        ▋ Bar
                      </button>
                      <button
                        className={`chart-toggle-btn ${sadhanaChartType === 'line' ? 'active' : ''}`}
                        onClick={() => setSadhanaChartType('line')}
                      >
                        ╱ Line
                      </button>
                    </div>

                    <select
                      className="days-select"
                      value={sadhanaDays}
                      onChange={e => setSadhanaDays(Number(e.target.value))}
                    >
                      {RANGE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="chart-container" style={{ height: sadhanaDays > 30 ? 300 : 260 }}>
                  {sadhanaLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                      <div className="spinner" style={{ width: 28, height: 28 }} />
                      <span style={{ color: 'var(--text-muted)' }}>Loading {sadhanaRangeLabel} of data...</span>
                    </div>
                  ) : sadhanaError ? (
                    <div className="alert alert-error">{sadhanaError}</div>
                  ) : sadhanaChartType === 'bar' ? (
                    <Bar data={sadhanaBarData} options={sadhanaChartOptions} />
                  ) : (
                    <Line data={sadhanaLineData} options={sadhanaChartOptions} />
                  )}
                </div>
              </div>

              {/* Practice breakdown */}
              {Object.keys(practiceBreakdown).length > 0 && (
                <div className="glass-card animate-in animate-in-delay-3" style={{ padding: '28px' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
                    Practice Breakdown
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                      {sadhanaRangeLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(practiceBreakdown)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([name, data]) => {
                        const pct = Math.round((data.total / sadhanaDays) * 100);
                        return (
                          <div key={name} className="breakdown-row">
                            <div className="breakdown-icon">{PRACTICE_ICONS[name] || '🙏'}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {name}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  {data.once}× once · {data.twice}× twice ·&nbsp;
                                  <span style={{ color: 'var(--purple-400)' }}>{pct}% consistency</span>
                                </span>
                              </div>
                              <div className="progress-bar" style={{ height: 5 }}>
                                <div
                                  className="progress-fill"
                                  style={{ width: `${pct}%`, background: 'var(--gradient-button)' }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!sadhanaLoading && sadhanaHistory.every(h => !h.practiced) && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🌱</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Your journey starts today
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                    Complete your first sadhana to see your progress here
                  </div>
                  <Link to="/tracker" className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '12px 28px' }}>
                    🧘 Start Today's Practice
                  </Link>
                </div>
              )}
            </>
          )}

          {/* ────────────────── LIFE METRICS VIEW ────────────────── */}
          {activeTab === 'life' && (
            <>
              {/* Stats Row */}
              {lifeStats && (
                <div className="stats-row animate-in animate-in-delay-1">
                  <StatCard icon="🔥" label="Life Streak"        value={`${lifeStats.currentStreak}d`}          color="var(--amber-400)" />
                  <StatCard icon="⭐" label="Avg Daily Score"   value={`${lifeStats.averageScore} pts`}       color="var(--purple-400)" />
                  <StatCard icon="🍏" label="Conscious Eating"   value={`${lifeStats.consciousEatingPct}%`}     color="#60a5fa" />
                  <StatCard icon="🗣️" label="Good Vakshudhi"    value={`${lifeStats.vakshudhiGoodPct}%`}      color="var(--emerald-400)" />
                </div>
              )}

              {/* Chart card */}
              <div className="glass-card animate-in animate-in-delay-2" style={{ padding: '28px' }}>
                <div className="chart-controls">
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Daily Life Score
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                        — {lifeRangeLabel}
                        {lifeHistory.length > 0 && (
                          <span style={{ marginLeft: 6 }}>
                            · {lifeHistory.filter(h => h.logged).length} entries
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span style={{ color: 'var(--purple-400)' }}>■</span> Daily score&nbsp;&nbsp;
                      <span style={{ color: 'var(--emerald-400)' }}>■</span> High score (≥120 pts)&nbsp;&nbsp;
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>■</span> Not logged
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="chart-toggle">
                      <button
                        className={`chart-toggle-btn ${lifeChartType === 'bar' ? 'active' : ''}`}
                        onClick={() => setLifeChartType('bar')}
                        disabled={lifeDays > 30}
                        style={{ opacity: lifeDays > 30 ? 0.4 : 1, cursor: lifeDays > 30 ? 'not-allowed' : 'pointer' }}
                      >
                        ▋ Bar
                      </button>
                      <button
                        className={`chart-toggle-btn ${lifeChartType === 'line' ? 'active' : ''}`}
                        onClick={() => setLifeChartType('line')}
                      >
                        ╱ Line
                      </button>
                    </div>

                    <select
                      className="days-select"
                      value={lifeDays}
                      onChange={e => setLifeDays(Number(e.target.value))}
                    >
                      {RANGE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="chart-container" style={{ height: lifeDays > 30 ? 300 : 260 }}>
                  {lifeLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                      <div className="spinner" style={{ width: 28, height: 28 }} />
                      <span style={{ color: 'var(--text-muted)' }}>Loading life metrics...</span>
                    </div>
                  ) : lifeError ? (
                    <div className="alert alert-error">{lifeError}</div>
                  ) : lifeChartType === 'bar' ? (
                    <Bar data={lifeBarData} options={lifeChartOptions} />
                  ) : (
                    <Line data={lifeLineData} options={lifeChartOptions} />
                  )}
                </div>
              </div>

              {/* Life Quality Consistency Breakdown */}
              {lifeStats && lifeStats.totalDaysLogged > 0 && (
                <div className="glass-card animate-in animate-in-delay-3" style={{ padding: '28px' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
                    Conscious Living Breakdown
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                      Over {lifeStats.totalDaysLogged} recorded days
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="breakdown-row">
                      <div className="breakdown-icon">🍏</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Conscious Eating</span>
                          <span style={{ fontSize: 12, color: 'var(--purple-400)', fontWeight: 600 }}>{lifeStats.consciousEatingPct}% Yes</span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${lifeStats.consciousEatingPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="breakdown-row">
                      <div className="breakdown-icon">🌊</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Responding Consciously</span>
                          <span style={{ fontSize: 12, color: 'var(--purple-400)', fontWeight: 600 }}>{lifeStats.respondingPct}% Responding</span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${lifeStats.respondingPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="breakdown-row">
                      <div className="breakdown-icon">🤝</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Willingness of Being</span>
                          <span style={{ fontSize: 12, color: 'var(--purple-400)', fontWeight: 600 }}>{lifeStats.willingPct}% Willing</span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${lifeStats.willingPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="breakdown-row">
                      <div className="breakdown-icon">⚡</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>System Vibrancy</span>
                          <span style={{ fontSize: 12, color: 'var(--purple-400)', fontWeight: 600 }}>{lifeStats.vibrantPct}% Vibrant</span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${lifeStats.vibrantPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="breakdown-row">
                      <div className="breakdown-icon">🗣️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>Good Vakshudhi</span>
                          <span style={{ fontSize: 12, color: 'var(--emerald-400)', fontWeight: 600 }}>{lifeStats.vakshudhiGoodPct}% Good</span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${lifeStats.vakshudhiGoodPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!lifeLoading && lifeHistory.every(h => !h.logged) && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🌱</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    No Life Journal entries yet
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                    Log your daily conscious living reflections to see your life metrics here
                  </div>
                  <Link to="/life-tracker" className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto', padding: '12px 28px' }}>
                    🌱 Start Life Journal
                  </Link>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
