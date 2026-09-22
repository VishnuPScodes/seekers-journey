import React, { useState, useMemo } from 'react';

export default function GrowthAnalyticsModal({ isOpen, onClose, users = [] }) {
  const [chartMode, setChartMode] = useState('registrations'); // 'registrations' vs 'activity'
  const [timeRange, setTimeRange] = useState('90'); // '30', '90', 'all'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Process user data for both Registrations and Activity modes
  const analyticsData = useMemo(() => {
    if (!users || users.length === 0) {
      return { timeline: [], totalInPeriod: 0, avgDaily: 0, growthPct: 0, isIncreasing: true };
    }

    const now = new Date();
    const daysLimit = timeRange === '30' ? 30 : timeRange === '90' ? 90 : 365;

    const startDate = new Date();
    startDate.setDate(now.getDate() - daysLimit);
    startDate.setHours(0, 0, 0, 0);

    const regCountsMap = {};
    const actCountsMap = {};
    const datesList = [];

    const curr = new Date(startDate);
    while (curr <= now) {
      const dateStr = curr.toISOString().split('T')[0];
      datesList.push(dateStr);
      regCountsMap[dateStr] = 0;
      actCountsMap[dateStr] = 0;
      curr.setDate(curr.getDate() + 1);
    }

    let totalRegInPeriod = 0;
    let totalActInPeriod = 0;

    users.forEach(u => {
      if (u.createdAt) {
        const regStr = new Date(u.createdAt).toISOString().split('T')[0];
        if (regCountsMap[regStr] !== undefined) {
          regCountsMap[regStr] += 1;
          totalRegInPeriod += 1;
        }
      }
      if (u.lastActivityDate) {
        const actStr = new Date(u.lastActivityDate).toISOString().split('T')[0];
        if (actCountsMap[actStr] !== undefined) {
          actCountsMap[actStr] += 1;
          totalActInPeriod += 1;
        }
      }
    });

    let runningCumulativeReg = users.filter(u => u.createdAt && new Date(u.createdAt) < startDate).length;
    let runningCumulativeAct = users.filter(u => u.lastActivityDate && new Date(u.lastActivityDate) < startDate).length;

    const timeline = datesList.map(dateStr => {
      const dailyNewReg = regCountsMap[dateStr] || 0;
      const dailyAct = actCountsMap[dateStr] || 0;

      runningCumulativeReg += dailyNewReg;
      runningCumulativeAct += dailyAct;

      return {
        date: dateStr,
        dailyNew: dailyNewReg,
        dailyActive: dailyAct,
        cumulativeTotal: runningCumulativeReg,
        cumulativeActive: runningCumulativeAct,
        formattedDate: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });

    const half = Math.floor(timeline.length / 2);

    // Registration trend
    const firstHalfReg = timeline.slice(0, half).reduce((sum, d) => sum + d.dailyNew, 0);
    const secondHalfReg = timeline.slice(half).reduce((sum, d) => sum + d.dailyNew, 0);
    let regGrowthPct = 0;
    if (firstHalfReg > 0) {
      regGrowthPct = Math.round(((secondHalfReg - firstHalfReg) / firstHalfReg) * 100);
    } else if (secondHalfReg > 0) {
      regGrowthPct = 100;
    }

    // Active users trend
    const firstHalfAct = timeline.slice(0, half).reduce((sum, d) => sum + d.dailyActive, 0);
    const secondHalfAct = timeline.slice(half).reduce((sum, d) => sum + d.dailyActive, 0);
    let actGrowthPct = 0;
    if (firstHalfAct > 0) {
      actGrowthPct = Math.round(((secondHalfAct - firstHalfAct) / firstHalfAct) * 100);
    } else if (secondHalfAct > 0) {
      actGrowthPct = 100;
    }

    const avgDailyReg = (totalRegInPeriod / Math.max(1, timeline.length)).toFixed(1);
    const avgDailyAct = (totalActInPeriod / Math.max(1, timeline.length)).toFixed(1);

    return {
      timeline,
      totalRegInPeriod,
      totalActInPeriod,
      avgDailyReg,
      avgDailyAct,
      regGrowthPct,
      actGrowthPct,
      isRegIncreasing: regGrowthPct >= 0,
      isActIncreasing: actGrowthPct >= 0,
    };
  }, [users, timeRange]);

  if (!isOpen) return null;

  const {
    timeline,
    totalRegInPeriod,
    totalActInPeriod,
    avgDailyReg,
    avgDailyAct,
    regGrowthPct,
    actGrowthPct,
    isRegIncreasing,
    isActIncreasing
  } = analyticsData;

  const isRegMode = chartMode === 'registrations';

  // SVG Chart Dimensions
  const svgWidth = 720;
  const svgHeight = 260;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Values depending on mode
  const getValueY = (d) => isRegMode ? d.cumulativeTotal : d.dailyActive * 10 + d.cumulativeTotal * 0.1;
  const getBarValue = (d) => isRegMode ? d.dailyNew : d.dailyActive;

  const maxVal = Math.max(...timeline.map(d => isRegMode ? d.cumulativeTotal : d.dailyActive), 10);
  const minVal = Math.min(...timeline.map(d => isRegMode ? d.cumulativeTotal : 0), 0);
  const rangeY = Math.max(1, maxVal - minVal);
  const maxBar = Math.max(...timeline.map(d => isRegMode ? d.dailyNew : d.dailyActive), 5);

  const points = timeline.map((d, idx) => {
    const x = paddingLeft + (idx / Math.max(1, timeline.length - 1)) * chartW;
    const currentMetricVal = isRegMode ? d.cumulativeTotal : d.dailyActive;
    const yVal = paddingTop + chartH - ((currentMetricVal - (isRegMode ? minVal : 0)) / rangeY) * chartH;
    const yBar = paddingTop + chartH - ((isRegMode ? d.dailyNew : d.dailyActive) / maxBar) * (chartH * 0.45);
    return { ...d, x, yVal, yBar, idx };
  });

  // Generate smooth curved SVG Path
  const buildSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].yVal}`;

    let path = `M ${pts[0].x} ${pts[0].yVal}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const mx = (curr.x + next.x) / 2;
      const my = (curr.yVal + next.yVal) / 2;
      path += ` Q ${curr.x} ${curr.yVal}, ${mx} ${my}`;
    }
    const last = pts[pts.length - 1];
    path += ` L ${last.x} ${last.yVal}`;
    return path;
  };

  const linePathD = buildSmoothPath(points);
  const areaPathD = points.length > 0
    ? `${linePathD} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`
    : '';

  const tickInterval = Math.max(1, Math.floor(timeline.length / 6));
  const xTicks = points.filter((_, idx) => idx % tickInterval === 0 || idx === points.length - 1);

  const activeColor = isRegMode ? '#d9572b' : '#2d7d54';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(62, 56, 45, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        backgroundColor: '#ebdcb2',
        borderRadius: '20px',
        border: '2px solid rgba(217, 87, 43, 0.3)',
        boxShadow: '0 20px 50px rgba(62, 56, 45, 0.25)',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative',
        fontFamily: '"Inter", sans-serif',
        color: '#3e382d',
      }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1.5px solid rgba(217, 87, 43, 0.2)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📊</span>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '28px',
                fontWeight: '700',
                margin: 0,
                color: '#3e382d',
              }}>
                Seeker Analytics & Growth Dynamics
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#7e6b53', margin: '4px 0 0 0' }}>
              Track registration trajectories and active user engagement over time
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(62, 56, 45, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#3e382d',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => setChartMode('registrations')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: chartMode === 'registrations' ? '2px solid #d9572b' : '1.5px solid rgba(62, 56, 45, 0.2)',
              backgroundColor: chartMode === 'registrations' ? '#d9572b' : '#f4efd8',
              color: chartMode === 'registrations' ? '#ffffff' : '#3e382d',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: chartMode === 'registrations' ? '0 4px 12px rgba(217, 87, 43, 0.25)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📈 Registration Growth</span>
          </button>

          <button
            onClick={() => setChartMode('activity')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: chartMode === 'activity' ? '2px solid #2d7d54' : '1.5px solid rgba(62, 56, 45, 0.2)',
              backgroundColor: chartMode === 'activity' ? '#2d7d54' : '#f4efd8',
              color: chartMode === 'activity' ? '#ffffff' : '#3e382d',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: chartMode === 'activity' ? '0 4px 12px rgba(45, 125, 84, 0.25)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚡ Active Seekers & Engagement</span>
          </button>
        </div>

        {/* Range Controls & Key Metrics */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}>
          {/* Time range selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f4efd8', padding: '4px', borderRadius: '8px', border: '1px solid rgba(62, 56, 45, 0.2)' }}>
            <button
              onClick={() => setTimeRange('30')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: timeRange === '30' ? activeColor : 'transparent',
                color: timeRange === '30' ? '#fff' : '#3e382d',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('90')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: timeRange === '90' ? activeColor : 'transparent',
                color: timeRange === '90' ? '#fff' : '#3e382d',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: timeRange === 'all' ? activeColor : 'transparent',
                color: timeRange === 'all' ? '#fff' : '#3e382d',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              All Time
            </button>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#7e6b53' }}>
                {isRegMode ? 'New Registrations' : 'Active Seekers'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: activeColor }}>
                {isRegMode ? `+${totalRegInPeriod} seekers` : `${totalActInPeriod} active`}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#7e6b53' }}>
                {isRegMode ? 'Daily Signup Rate' : 'Daily Active Seekers'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#3e382d' }}>
                ~{isRegMode ? avgDailyReg : avgDailyAct} / day
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#7e6b53' }}>
                Growth Velocity
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: (isRegMode ? isRegIncreasing : isActIncreasing) ? '#2d7d54' : '#d9572b',
                backgroundColor: (isRegMode ? isRegIncreasing : isActIncreasing) ? 'rgba(45, 125, 84, 0.12)' : 'rgba(217, 87, 43, 0.12)',
                padding: '3px 10px',
                borderRadius: '12px',
                display: 'inline-block',
                marginTop: '2px',
              }}>
                {isRegMode
                  ? (isRegIncreasing ? `↗ +${regGrowthPct}% Signups` : `↘ ${regGrowthPct}% Slowdown`)
                  : (isActIncreasing ? `↗ +${actGrowthPct}% Engagement` : `↘ ${actGrowthPct}% Activity`)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Hand-Drawn Style Line Graph Container ──────────────────── */}
        <div style={{
          backgroundColor: '#f4efd8',
          borderRadius: '16px',
          border: `1.5px solid ${activeColor}40`,
          padding: '16px',
          position: 'relative',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
        }}>
          {/* Chart Legends */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: activeColor, borderRadius: '2px', display: 'inline-block' }}></span>
                <span>{isRegMode ? 'Cumulative Seekers (Growth Curve)' : 'Daily Active Seekers Trend'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: `${activeColor}40`, borderRadius: '2px', display: 'inline-block' }}></span>
                <span>{isRegMode ? 'Daily New Registrations' : 'Daily Active Logins'}</span>
              </div>
            </div>

            {hoveredPoint && (
              <div style={{
                backgroundColor: '#ebdcb2',
                border: `1px solid ${activeColor}`,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#3e382d',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}>
                {hoveredPoint.formattedDate}: {isRegMode ? `+${hoveredPoint.dailyNew} new (Total: ${hoveredPoint.cumulativeTotal})` : `${hoveredPoint.dailyActive} active seekers`}
              </div>
            )}
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              {/* Dynamic Gradient fill */}
              <linearGradient id="modeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
              </linearGradient>

              {/* Hand-drawn organic filter effect */}
              <filter id="handDrawnFilter">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + chartH * ratio;
              const val = Math.round(maxVal - ratio * (maxVal - minVal));
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="rgba(62, 56, 45, 0.1)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    fill="#7e6b53"
                    fontSize="10"
                    fontFamily="Inter"
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Bar Overlay */}
            {points.map((pt) => {
              const barVal = isRegMode ? pt.dailyNew : pt.dailyActive;
              const barH = (barVal / maxBar) * (chartH * 0.45);
              const barW = Math.max(2, (chartW / points.length) * 0.6);
              return (
                <rect
                  key={`bar-${pt.idx}`}
                  x={pt.x - barW / 2}
                  y={paddingTop + chartH - barH}
                  width={barW}
                  height={barH}
                  fill={`${activeColor}40`}
                  rx="2"
                />
              );
            })}

            {/* Filled Area under line */}
            <path
              d={areaPathD}
              fill="url(#modeGradient)"
            />

            {/* Main Hand-Drawn Line Curve */}
            <path
              d={linePathD}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#handDrawnFilter)"
            />

            {/* Data point circles & hover triggers */}
            {points.map((pt) => (
              <g key={`pt-${pt.idx}`}>
                <circle
                  cx={pt.x}
                  cy={pt.yVal}
                  r={hoveredPoint?.idx === pt.idx ? 6 : 3.5}
                  fill={hoveredPoint?.idx === pt.idx ? activeColor : '#ffffff'}
                  stroke={activeColor}
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Interactive hover hit area */}
                <rect
                  x={pt.x - (chartW / points.length) / 2}
                  y={paddingTop}
                  width={chartW / points.length}
                  height={chartH}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}

            {/* X-Axis Dates labels */}
            {xTicks.map((pt) => (
              <text
                key={`xtick-${pt.idx}`}
                x={pt.x}
                y={svgHeight - 12}
                fill="#7e6b53"
                fontSize="11"
                fontWeight="600"
                fontFamily="Inter"
                textAnchor="middle"
              >
                {pt.formattedDate}
              </text>
            ))}
          </svg>
        </div>

        {/* Footer Insight Box */}
        <div style={{
          marginTop: '20px',
          padding: '14px 18px',
          backgroundColor: '#f4efd8',
          borderRadius: '12px',
          border: '1px solid rgba(62, 56, 45, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#6e6454',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span>
            <span>
              {isRegMode ? (
                <>
                  <strong>Registration Growth Insight:</strong> Signups average <strong>~{avgDailyReg} new seekers/day</strong> over the last {timeRange} days with a velocity of <strong>{regGrowthPct >= 0 ? `+${regGrowthPct}%` : `${regGrowthPct}%`}</strong>.
                </>
              ) : (
                <>
                  <strong>Engagement Insight:</strong> Active seekers average <strong>~{avgDailyAct} active logins/day</strong> over the last {timeRange} days with an activity trend of <strong>{actGrowthPct >= 0 ? `+${actGrowthPct}%` : `${actGrowthPct}%`}</strong>.
                </>
              )}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: activeColor,
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
