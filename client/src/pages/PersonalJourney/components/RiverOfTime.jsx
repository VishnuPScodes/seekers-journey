import React, { useState, useRef, useMemo } from 'react';
import { CATEGORIES, CATEGORY_COLORS } from '../journeyDataUtils';
import { ZoomIn, ZoomOut, Calendar, Plus, Sparkles } from 'lucide-react';

export default function RiverOfTime({
  events = [],
  onSelectEvent,
  onOpenAddMilestone,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = Overview, 1.6 = Detailed
  const [hoveredNode, setHoveredNode] = useState(null);

  const waveScrollRef = useRef(null);

  // Filter events by active category
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    if (activeCategory === 'all') return events;
    return events.filter(e => e.category === activeCategory);
  }, [events, activeCategory]);

  // Extract distinct chronological years
  const timelineYears = useMemo(() => {
    const years = new Set();
    events.forEach(e => {
      if (e.date) {
        const d = new Date(e.date);
        if (!isNaN(d.getFullYear())) years.add(d.getFullYear());
      }
    });
    return Array.from(years).sort();
  }, [events]);

  const scrollToYear = (year) => {
    const el = document.getElementById(`pj-year-node-${year}`);
    if (el && waveScrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // Serpentine Curve Geometry Calculations
  const isZoomed = zoomLevel > 1;
  const nodeSpacing = isZoomed ? 260 : 135;
  const containerHeight = isZoomed ? 340 : 210;
  const baselineY = isZoomed ? 170 : 105;
  const amplitude = isZoomed ? 58 : 38;

  const snakePoints = useMemo(() => {
    return filteredEvents.map((ev, index) => {
      const x = 70 + index * nodeSpacing;
      const y = baselineY + Math.sin((index / 1.15) * Math.PI) * amplitude;
      return { x, y, event: ev, index };
    });
  }, [filteredEvents, nodeSpacing, baselineY, amplitude]);

  const totalSvgWidth = Math.max(820, 70 + filteredEvents.length * nodeSpacing + 100);

  const snakePathData = useMemo(() => {
    if (snakePoints.length === 0) return '';
    if (snakePoints.length === 1) {
      return `M ${snakePoints[0].x - 60},${baselineY} L ${snakePoints[0].x + 60},${baselineY}`;
    }

    let d = `M ${snakePoints[0].x - 60},${baselineY}`;
    d += ` Q ${snakePoints[0].x - 30},${(baselineY + snakePoints[0].y) / 2} ${snakePoints[0].x},${snakePoints[0].y}`;

    for (let i = 0; i < snakePoints.length - 1; i++) {
      const p0 = snakePoints[i];
      const p1 = snakePoints[i + 1];
      const midX = (p0.x + p1.x) / 2;
      d += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
    }

    const last = snakePoints[snakePoints.length - 1];
    d += ` Q ${last.x + 30},${(last.y + baselineY) / 2} ${last.x + 60},${baselineY}`;
    return d;
  }, [snakePoints, baselineY]);

  return (
    <div className="pj-card pj-river-card">
      {/* Header Row */}
      <div className="pj-river-header-row">
        <div>
          <span className="pj-tag" style={{ color: 'var(--pj-terracotta)' }}>
            Serpentine Chronicle
          </span>
          <h2 className="pj-serif pj-river-title">
            The River of Time
          </h2>
          <p style={{ fontSize: 13, color: 'var(--pj-text-muted)', margin: '2px 0 0' }}>
            A flowing stream of your sacred initiations, silence retreats, and milestones.
          </p>
        </div>

        {/* Controls: Add Milestone, Zoom & Scrubber */}
        <div className="pj-river-controls" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {onOpenAddMilestone && (
            <button
              type="button"
              onClick={onOpenAddMilestone}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #d9572b 0%, #b85d36 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(217, 87, 43, 0.25)',
                transition: 'all 0.15s ease',
              }}
              id="btn-add-milestone"
            >
              <Plus size={15} /> Add Milestone
            </button>
          )}

          {/* Zoom Toggle */}
          <div className="pj-zoom-toggle">
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className={`pj-zoom-btn ${zoomLevel === 1 ? 'active' : ''}`}
              title="Overview of the stream"
            >
              Overview (1x)
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1.6)}
              className={`pj-zoom-btn ${zoomLevel === 1.6 ? 'active' : ''}`}
              title="Zoom in to inspect detailed stories"
            >
              Detail 🔍 (1.6x)
            </button>
          </div>

          {/* Year Scrubber Pills */}
          {timelineYears.length > 1 && (
            <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
              {timelineYears.map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => scrollToYear(year)}
                  className="pj-scrubber-pill"
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="pj-category-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`pj-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Scrollable Horizontal Stream Canvas ── */}
      {filteredEvents.length === 0 ? (
        <div className="pj-river-empty-state">
          <p className="pj-serif" style={{ fontSize: 18, color: 'var(--pj-text-charcoal)', margin: '0 0 6px' }}>
            No memories recorded in this category yet.
          </p>
          <p style={{ fontSize: 13, color: 'var(--pj-text-muted)', margin: '0 0 16px' }}>
            Every step on the path leaves an inner fragrance. Capture your first reflection.
          </p>
          <button
            type="button"
            onClick={onOpenAddMemory}
            className="pj-whisper-trigger-btn"
            style={{ margin: '0 auto' }}
          >
            <Plus size={14} /> Record a Sacred Memory
          </button>
        </div>
      ) : (
        <div ref={waveScrollRef} className="pj-river-scroll-canvas">
          <div style={{ position: 'relative', width: totalSvgWidth, height: containerHeight }}>
            {/* Serpentine River SVG */}
            <svg
              width={totalSvgWidth}
              height={containerHeight}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <defs>
                <linearGradient id="pjRiverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d9572b" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#c49a45" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#4e6346" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#d9572b" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              {/* Ambient Glow Waterbed */}
              <path
                d={snakePathData}
                fill="none"
                stroke="rgba(217, 87, 43, 0.12)"
                strokeWidth={isZoomed ? "32" : "22"}
                strokeLinecap="round"
              />
              {/* Secondary River Bed */}
              <path
                d={snakePathData}
                fill="none"
                stroke="rgba(78, 99, 70, 0.22)"
                strokeWidth={isZoomed ? "16" : "11"}
                strokeLinecap="round"
              />
              {/* Main Serpentine Water Current */}
              <path
                d={snakePathData}
                fill="none"
                stroke="url(#pjRiverGrad)"
                strokeWidth={isZoomed ? "5.5" : "4"}
                strokeLinecap="round"
              />
              {/* Pranic Pulsing Thread */}
              <path
                d={snakePathData}
                fill="none"
                stroke="rgba(244, 239, 216, 0.85)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />
            </svg>

            {/* Glowing Milestone Beads */}
            {snakePoints.map((point) => {
              const ev = point.event;
              const colors = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.personal;
              const isMajor = ev.category === 'program' || ev.category === 'start' || ev.category === 'milestone';
              const evYear = ev.date ? new Date(ev.date).getFullYear() : '2024';
              const isUpper = point.y < baselineY;

              return (
                <div
                  key={ev._id || point.index}
                  id={`pj-year-node-${evYear}`}
                  style={{
                    position: 'absolute',
                    left: point.x,
                    top: point.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: hoveredNode === point.index ? 35 : 15,
                  }}
                  onMouseEnter={() => setHoveredNode(point.index)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Circular Bead Node */}
                  <div
                    onClick={() => onSelectEvent(ev)}
                    className="pj-node-bead"
                    style={{
                      width: isZoomed ? 48 : 38,
                      height: isZoomed ? 48 : 38,
                      border: `2.5px solid ${colors.text}`,
                      boxShadow: isMajor
                        ? `0 0 14px ${colors.border}, 0 2px 8px rgba(44, 38, 31, 0.12)`
                        : '0 2px 6px rgba(44, 38, 31, 0.08)',
                      transform: hoveredNode === point.index ? 'scale(1.22)' : 'scale(1)',
                    }}
                    title={`${ev.title}`}
                  >
                    <span style={{ fontSize: isZoomed ? 18 : 15 }}>
                      {ev.icon || '🪷'}
                    </span>
                  </div>

                  {/* Date Label over/under node */}
                  <div style={{
                    position: 'absolute',
                    top: isUpper ? -20 : (isZoomed ? 54 : 44),
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--pj-text-muted)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}
                  </div>

                  {/* DETAIL VIEW (1.6x ZOOM) — Story Card attached with stem */}
                  {isZoomed && (
                    <div
                      onClick={() => onSelectEvent(ev)}
                      className="pj-node-detail-card"
                      style={{
                        left: '50%',
                        top: isUpper ? 'auto' : 62,
                        bottom: isUpper ? 62 : 'auto',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {/* Connecting stem line */}
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: isUpper ? '100%' : -10,
                        width: 2,
                        height: 10,
                        background: colors.text,
                        transform: 'translateX(-50%)',
                      }} />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}>
                          {colors.label || ev.category}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--pj-text-muted)' }}>
                          {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                        </span>
                      </div>

                      <div className="pj-serif" style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--pj-text-charcoal)',
                        lineHeight: 1.25,
                        marginBottom: 4,
                      }}>
                        {ev.title}
                      </div>

                      {ev.description && (
                        <div style={{
                          fontSize: 11,
                          color: 'var(--pj-text-secondary)',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {ev.description}
                        </div>
                      )}
                    </div>
                  )}

                  {/* OVERVIEW HOVER TOOLTIP */}
                  {!isZoomed && hoveredNode === point.index && (
                    <div
                      className="pj-hover-tooltip"
                      style={{
                        top: isUpper ? 'auto' : 48,
                        bottom: isUpper ? 48 : 'auto',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{ev.title}</div>
                      <div style={{ fontSize: 10, color: '#e6d9c6', marginTop: 2 }}>
                        {colors.label || ev.category} • {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
