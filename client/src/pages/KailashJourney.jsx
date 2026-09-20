import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LOCATIONS, getLevelProgress, getPointsToNextLevel } from '../utils/locations';
import { ChevronLeft, Star, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── 108 Anchor points  [longitude-like x, latitude-like z]
// z=+60 → South India (bottom),  z=−71 → Kailash/Tibet (top)
const ANCHORS = [
  [0,60],[-4,57],[2,55],[5,53],[3,51],[11,49],[17,47],[26,45],[20,43],[8,41],
  [-8,39],[-14,37],[-13,35],[-19,32],[-23,30],[-20,27],[-17,24],[-15,21],[-26,24],[-10,19],
  [10,19],[17,22],[24,25],[20,18],[14,16],[22,13],[17,10],[12,13],[19,17],[28,27],
  [5,8],[1,11],[2,6],[-1,4],[-8,2],[-6,0],[1,2],[-3,6],[-28,15],[-11,0],
  [-1,-4],[-4,-6],[5,-7],[11,-9],[17,-11],[2,-10],[-12,-5],[-15,-2],[-20,-7],[-18,-10],
  [-36,2],[-34,13],[-32,8],[-27,-6],[-29,2],[-26,-1],[-34,10],[-25,-4],[-32,4],[-38,6],
  [2,-13],[4,-15],[14,-17],[20,-19],[22,-21],[17,-20],[11,-17],[6,-20],[9,-25],[-1,-27],
  [-3,-30],[-5,-33],[-6,-35],[-8,-38],[-11,-40],[-6,-42],[-4,-45],[0,-47],[5,-48],[8,-51],
  [5,-53],[8,-55],[10,-57],[12,-58],[14,-60],[20,-56],[26,-54],[30,-52],[36,-50],[42,-48],
  [47,-50],[43,-52],[41,-54],[39,-48],[37,-46],[45,-56],[41,-58],[32,-60],[18,-62],[9,-64],
  [5,-66],[2,-68],[0,-67],[0,-69],[0,-70],[-1,-69],[0,-71],[0,-65],
];

// ── Region color config (vivid, high-contrast manuscript palette)
const REGIONS = [
  { range:[1,10],   color:'#d9572b', label:'Tamil Nadu' },
  { range:[11,20],  color:'#1b8a6b', label:'Kerala / Karnataka' },
  { range:[21,30],  color:'#d97706', label:'Andhra / Telangana' },
  { range:[31,40],  color:'#c92a42', label:'Maharashtra' },
  { range:[41,50],  color:'#8b44b8', label:'MP / Rajasthan' },
  { range:[51,60],  color:'#d96b00', label:'Gujarat' },
  { range:[61,70],  color:'#1d78b4', label:'Uttar Pradesh' },
  { range:[71,80],  color:'#2b8a4b', label:'Uttarakhand' },
  { range:[81,90],  color:'#7b2cb0', label:'Himalayas' },
  { range:[91,100], color:'#0284c7', label:'Ladakh' },
  { range:[101,108],color:'#b45309', label:'Kailash' },
];
function getColor(level) {
  return (REGIONS.find(r => level >= r.range[0] && level <= r.range[1]) || REGIONS[0]).color;
}

// ── SVG coordinate system
const VW = 500, VH = 700, PAD = 42;
const xMin = -38, xMax = 47, zMin = -71, zMax = 60;

function toSVG([x, z]) {
  const sx = ((x - xMin) / (xMax - xMin)) * (VW - PAD * 2) + PAD;
  // z=+60 (south) → large y (bottom),  z=-71 (north/Kailash) → small y (top)
  const sy = ((z - zMin) / (zMax - zMin)) * (VH - PAD * 2) + PAD;
  return [+sx.toFixed(2), +sy.toFixed(2)];
}

const SVG_PTS = ANCHORS.map(toSVG);

// ── Build smooth quadratic-bezier SVG path string
function makePath(pts) {
  if (!pts || pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = +((pts[i][0] + pts[i + 1][0]) / 2).toFixed(2);
    const my = +((pts[i][1] + pts[i + 1][1]) / 2).toFixed(2);
    d += ` Q${pts[i][0]},${pts[i][1]} ${mx},${my}`;
  }
  const L = pts[pts.length - 1];
  d += ` L${L[0]},${L[1]}`;
  return d;
}

// ── Pre-compute region centroid positions for labels
const REGION_LABELS = REGIONS.map(r => {
  const pts = ANCHORS.slice(r.range[0] - 1, r.range[1]).map(toSVG);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return { ...r, cx: +cx.toFixed(1), cy: +cy.toFixed(1) };
});

// ── Main component
export default function KailashJourney() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const userLevel    = user?.currentLevel || 1;
  const totalScore   = user?.totalCumulativeScore || 0;
  const levelPct     = Math.round(getLevelProgress(totalScore) * 100);
  const pointsToNext = getPointsToNextLevel(totalScore);

  const [selectedLevel, setSelectedLevel] = useState(userLevel);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, loc: null });
  const [transform, setTransform] = useState({ zoom: 1, x: 0, y: 0 });

  const dragging   = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const touchState = useRef(null);
  const containerRef = useRef(null);

  const selectedLoc = LOCATIONS.find(l => l.level === selectedLevel) || LOCATIONS[0];
  const nextLoc     = LOCATIONS.find(l => l.level === Math.min(userLevel + 1, 108)) || LOCATIONS[107];
  const selColor    = getColor(selectedLevel);

  // Path strings
  const fullPathD    = useMemo(() => makePath(SVG_PTS), []);
  const visitedPathD = useMemo(
    () => makePath(SVG_PTS.slice(0, Math.max(2, userLevel))),
    [userLevel],
  );

  // Pilgrim + Kailash screen positions
  const pilgrimPt = SVG_PTS[Math.max(0, userLevel - 1)];
  const kailashPt = SVG_PTS[107];

  // ── Pan bounds calculation
  const clampPan = useCallback((x, y, currentZoom) => {
    const maxX = (VW * currentZoom) * 0.45;
    const maxY = (VH * currentZoom) * 0.45;
    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY),
    };
  }, []);

  // ── Zoom logic (focused around focusX, focusY relative to center)
  const handleZoom = useCallback((zoomFactor, focusX = 0, focusY = 0) => {
    setTransform((prev) => {
      const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.5), 6);
      if (newZoom === prev.zoom) return prev;

      const actualFactor = newZoom / prev.zoom;
      const rawX = focusX - (focusX - prev.x) * actualFactor;
      const rawY = focusY - (focusY - prev.y) * actualFactor;

      const clamped = clampPan(rawX, rawY, newZoom);
      if (newZoom <= 1) {
        // Return smoothly to origin as zoom reaches 1 or below
        const ratio = Math.max(0, (newZoom - 0.5) / 0.5);
        return { zoom: newZoom, x: clamped.x * ratio, y: clamped.y * ratio };
      }
      return { zoom: newZoom, x: clamped.x, y: clamped.y };
    });
  }, [clampPan]);

  // ── Scroll wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const delta = -e.deltaY;
    let factor = 1 + delta * 0.003;
    factor = Math.min(Math.max(factor, 0.7), 1.4);

    handleZoom(factor, mouseX, mouseY);
  }, [handleZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── Mouse Pan
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY, px: transform.x, py: transform.y };
  }, [transform.x, transform.y]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    const targetX = dragOrigin.current.px + dx;
    const targetY = dragOrigin.current.py + dy;

    setTransform((prev) => {
      const clamped = clampPan(targetX, targetY, prev.zoom);
      return { ...prev, x: clamped.x, y: clamped.y };
    });
  }, [clampPan]);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // ── Touch Pan & Pinch Zoom
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchState.current = { type: 'pan', x: t.clientX, y: t.clientY, px: transform.x, py: transform.y };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchState.current = { type: 'pinch', dist };
    }
  }, [transform.x, transform.y]);

  const onTouchMove = useCallback((e) => {
    if (!touchState.current) return;

    if (touchState.current.type === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchState.current.x;
      const dy = t.clientY - touchState.current.y;
      const targetX = touchState.current.px + dx;
      const targetY = touchState.current.py + dy;

      setTransform((prev) => {
        const clamped = clampPan(targetX, targetY, prev.zoom);
        return { ...prev, x: clamped.x, y: clamped.y };
      });
    } else if (touchState.current.type === 'pinch' && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = dist / touchState.current.dist;

      const rect = containerRef.current?.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - (rect ? rect.left + rect.width / 2 : 0);
      const midY = (t1.clientY + t2.clientY) / 2 - (rect ? rect.top + rect.height / 2 : 0);

      handleZoom(factor, midX, midY);
      touchState.current.dist = dist;
    }
  }, [clampPan, handleZoom]);

  const onTouchEnd = useCallback(() => { touchState.current = null; }, []);

  // ── Dot hover/click
  const onDotEnter = useCallback((loc, e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({ visible: true, x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0), loc });
  }, []);
  const onDotLeave = useCallback(() => setTooltip(t => ({ ...t, visible: false })), []);
  const onDotClick = useCallback((loc) => setSelectedLevel(loc.level), []);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'var(--bg-primary, #f4efd8)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      color: '#3e382d',
    }}>

      {/* ── Pulse animation style ── */}
      <style>{`
        @keyframes kpulse {
          0%,100% { r: 13; opacity: 0.55; }
          50%      { r: 24; opacity: 0; }
        }
        .kpulse { animation: kpulse 2.4s ease-in-out infinite; }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#ebdcb2',
        borderBottom: '1px solid rgba(62, 56, 45, 0.15)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0, zIndex: 20,
      }}>
        <button
          onClick={() => navigate('/')}
          id="journey-back-btn"
          style={{
            background: '#f4efd8', border: '1px solid rgba(62, 56, 45, 0.2)',
            color: '#3e382d', borderRadius: 8, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 5,
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: '#3e382d', textTransform: 'uppercase', fontFamily: '"Cormorant Garamond", serif' }}>
            🏔 Kailash Journey
          </div>
          <div style={{ fontSize: 10, color: '#6b5e48', marginTop: 1, fontWeight: 600 }}>
            Level {userLevel} / 108 · Zoom: {Math.round(transform.zoom * 100)}% · Drag to pan
          </div>
        </div>

        <div style={{
          background: '#f4efd8', border: '1px solid #c46b3e66',
          borderRadius: 8, padding: '5px 11px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Star size={12} style={{ color: '#c46b3e' }} />
          <span style={{ fontSize: 14, fontWeight: 900, color: '#c46b3e' }}>{totalScore}</span>
        </div>
      </div>

      {/* ── MAP + LEGEND ROW ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* MAP */}
        <div
          ref={containerRef}
          style={{
            flex: 1, overflow: 'hidden', position: 'relative',
            cursor: dragging.current ? 'grabbing' : 'grab',
            background: '#f4efd8',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Pannable/zoomable layer */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.zoom})`,
              transformOrigin: 'center center',
            }}>
              <svg
                viewBox={`0 0 ${VW} ${VH}`}
                width={VW}
                height={VH}
                style={{ display: 'block', userSelect: 'none' }}
              >
                {/* ── Background ── */}
                <rect width={VW} height={VH} fill="#f4efd8" />

                {/* ── Subtle dot grid ── */}
                {Array.from({ length: 20 }).map((_, row) =>
                  Array.from({ length: 14 }).map((__, col) => (
                    <circle key={`${row}-${col}`}
                      cx={col * 36 + 20} cy={row * 36 + 20}
                      r={1.2} fill="#e2d8bd" />
                  ))
                )}

                {/* ── Region label watermarks ── */}
                {REGION_LABELS.map(r => (
                  <text key={r.label}
                    x={r.cx} y={r.cy}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fontWeight="800"
                    fill={r.color}
                    opacity={0.25}
                    style={{ letterSpacing: 1.5, textTransform: 'uppercase', pointerEvents: 'none' }}
                  >
                    {r.label.toUpperCase()}
                  </text>
                ))}

                {/* ── Full path (unvisited, soft tan line) ── */}
                <path
                  d={fullPathD}
                  fill="none"
                  stroke="#d8cca8"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* ── Visited path — vivid TERRACOTTA / GOLD accent ── */}
                {userLevel > 1 && (
                  <path
                    d={visitedPathD}
                    fill="none"
                    stroke="#c46b3e"
                    strokeWidth={5.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* ── Dots — 107 locations ── */}
                {LOCATIONS.filter(l => l.level < 108).map((loc, i) => {
                  const pt = SVG_PTS[i];
                  if (!pt) return null;

                  const isVisited   = loc.level <= userLevel;
                  const isMilestone = loc.level % 10 === 0;
                  const isSelected  = loc.level === selectedLevel;
                  const col = isVisited ? getColor(loc.level) : '#cbbd9b';
                  const r   = isMilestone ? 9 : 6;
                  const opacity = isVisited ? 1 : 0.75;

                  return (
                    <g key={loc.level}>
                      {/* Milestone outer ring */}
                      {isMilestone && isVisited && (
                        <circle cx={pt[0]} cy={pt[1]} r={14}
                          fill="none" stroke={col} strokeWidth={1.5}
                          opacity={0.6}
                        />
                      )}

                      {/* Selection ring */}
                      {isSelected && (
                        <circle cx={pt[0]} cy={pt[1]} r={r + 6}
                          fill="none" stroke="#3e382d" strokeWidth={2}
                          opacity={0.9}
                        />
                      )}

                      {/* Main dot */}
                      <circle
                        cx={pt[0]} cy={pt[1]} r={r}
                        fill={col}
                        stroke={isVisited ? '#ffffff' : 'none'}
                        strokeWidth={isVisited ? 1.2 : 0}
                        opacity={opacity}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={e => onDotEnter(loc, e)}
                        onMouseLeave={onDotLeave}
                        onClick={() => onDotClick(loc)}
                      />
                    </g>
                  );
                })}

                {/* ── Kailash beacon (level 108) ── */}
                <g>
                  {/* Wide halo */}
                  <circle cx={kailashPt[0]} cy={kailashPt[1]} r={30}
                    fill="#c46b3e15" />
                  {/* Mid ring */}
                  <circle cx={kailashPt[0]} cy={kailashPt[1]} r={20}
                    fill="none" stroke="#b45309" strokeWidth={2} opacity={0.6} />
                  {/* Inner ring */}
                  <circle cx={kailashPt[0]} cy={kailashPt[1]} r={14}
                    fill="none" stroke="#d97706" strokeWidth={2} opacity={0.85} />
                  {/* Core */}
                  <circle cx={kailashPt[0]} cy={kailashPt[1]} r={9}
                    fill="#b45309" stroke="#ffffff" strokeWidth={1.5}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => onDotEnter(LOCATIONS[107], e)}
                    onMouseLeave={onDotLeave}
                    onClick={() => onDotClick(LOCATIONS[107])}
                  />
                  {/* Label */}
                  <text x={kailashPt[0]} y={kailashPt[1] - 26}
                    textAnchor="middle"
                    fontSize={11} fontWeight="900"
                    fill="#b45309"
                    style={{ pointerEvents: 'none', letterSpacing: 1 }}
                  >
                    🏔 KAILASH
                  </text>
                </g>

                {/* ── Pilgrim marker (current level) ── */}
                <g>
                  {/* Pulsing outer ring */}
                  <circle
                    cx={pilgrimPt[0]} cy={pilgrimPt[1]}
                    r={13} fill="none"
                    stroke="#c46b3e" strokeWidth={2}
                    opacity={0.7}
                    className="kpulse"
                  />
                  {/* Static ring */}
                  <circle cx={pilgrimPt[0]} cy={pilgrimPt[1]} r={11}
                    fill="none" stroke="#3e382d" strokeWidth={2} opacity={0.8}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Bright core */}
                  <circle cx={pilgrimPt[0]} cy={pilgrimPt[1]} r={7}
                    fill="#c46b3e" stroke="#ffffff" strokeWidth={1.5}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* "YOU" label */}
                  <text x={pilgrimPt[0]} y={pilgrimPt[1] - 18}
                    textAnchor="middle"
                    fontSize={10} fontWeight="900"
                    fill="#3e382d"
                    style={{ pointerEvents: 'none', letterSpacing: 1 }}
                  >
                    ✦ YOU
                  </text>
                </g>

              </svg>
            </div>
          </div>

          {/* ── Floating Zoom & Recenter Controls ── */}
          <div style={{
            position: 'absolute', right: 14, bottom: 14,
            display: 'flex', flexDirection: 'column', gap: 6,
            zIndex: 40,
          }}>
            <button
              onClick={() => handleZoom(1.3, 0, 0)}
              title="Zoom In"
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: '#ebdcb2', border: '1px solid rgba(62, 56, 45, 0.25)',
                color: '#3e382d', fontSize: 18, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 56, 45, 0.15)',
              }}
            >
              +
            </button>
            <button
              onClick={() => handleZoom(0.77, 0, 0)}
              title="Zoom Out"
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: '#ebdcb2', border: '1px solid rgba(62, 56, 45, 0.25)',
                color: '#3e382d', fontSize: 18, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 56, 45, 0.15)',
              }}
            >
              −
            </button>
            <button
              onClick={() => setTransform({ zoom: 1, x: 0, y: 0 })}
              title="Reset / Recenter View"
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: '#ebdcb2', border: '1px solid rgba(62, 56, 45, 0.25)',
                color: '#c46b3e', fontSize: 13, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 56, 45, 0.15)',
              }}
            >
              🎯
            </button>
          </div>

          {/* ── Tooltip ── */}
          {tooltip.visible && tooltip.loc && (
            <div style={{
              position: 'absolute',
              left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth || 400) - 180),
              top:  tooltip.y - 56,
              background: '#f4efd8',
              border: `2px solid ${getColor(tooltip.loc.level)}`,
              borderRadius: 10, padding: '7px 13px',
              pointerEvents: 'none', zIndex: 50,
              boxShadow: `0 4px 18px rgba(62, 56, 45, 0.18)`,
              minWidth: 160,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: getColor(tooltip.loc.level), letterSpacing: 0.5 }}>
                {tooltip.loc.level === 108 ? '🏔 ' : ''}{tooltip.loc.name}
              </div>
              <div style={{ fontSize: 10, color: '#6b5e48', marginTop: 2, fontWeight: 500 }}>
                {tooltip.loc.region} · Point {tooltip.loc.level}
              </div>
            </div>
          )}
        </div>

        {/* ── LEGEND PANEL ─────────────────────────────────────────────── */}
        <div style={{
          width: 148, background: '#ebdcb2',
          borderLeft: '1px solid rgba(62, 56, 45, 0.15)',
          padding: '14px 12px', flexShrink: 0,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 9, color: '#6b5e48', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, marginBottom: 10 }}>
            Regions
          </div>
          {REGIONS.map(r => {
            const reached = userLevel >= r.range[0];
            return (
              <div key={r.label} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                marginBottom: 8, opacity: reached ? 1 : 0.45,
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: r.color, flexShrink: 0,
                  boxShadow: reached ? `0 0 6px ${r.color}66` : 'none',
                }} />
                <span style={{ fontSize: 10, color: '#3e382d', fontWeight: reached ? 700 : 400, lineHeight: 1.3 }}>
                  {r.label}
                </span>
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid rgba(62, 56, 45, 0.15)', marginTop: 10, paddingTop: 10 }}>
            <div style={{ fontSize: 9, color: '#6b5e48', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, marginBottom: 8 }}>
              Path
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 24, height: 3.5, background: '#c46b3e', borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: '#3e382d', fontWeight: 600 }}>Visited</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 3.5, background: '#d8cca8', borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: '#6b5e48' }}>Upcoming</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM HUD ──────────────────────────────────────────────────── */}
      <div style={{
        background: '#ebdcb2',
        borderTop: '1px solid rgba(62, 56, 45, 0.15)',
        padding: '12px 14px',
        flexShrink: 0, zIndex: 20,
      }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>

          {/* Selected location card */}
          <div style={{
            background: '#f4efd8',
            border: `2px solid ${selColor}44`,
            borderRadius: 12, padding: '10px 13px', marginBottom: 10,
            display: 'flex', gap: 11, alignItems: 'center',
            boxShadow: '0 2px 8px rgba(62, 56, 45, 0.08)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9, flexShrink: 0,
              background: `${selColor}20`,
              border: `2px solid ${selColor}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {selectedLevel === 108 ? '🏔' : selectedLevel === userLevel ? '🧘' : selectedLevel < userLevel ? '✅' : '🔒'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: selectedLevel <= userLevel ? selColor : '#6b5e48' }}>
                  {selectedLoc.name}
                </span>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: `${selColor}22`, color: selColor }}>
                  Pt {selectedLevel}
                </span>
                {selectedLevel === userLevel && <span style={{ fontSize: 9, color: '#c46b3e', fontWeight: 800 }}>← You are here</span>}
              </div>
              <div style={{ fontSize: 10, color: '#6b5e48', marginBottom: 2, fontWeight: 500 }}>
                <MapPin size={8} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                {selectedLoc.region}
              </div>
              <div style={{ fontSize: 10, color: '#3e382d', lineHeight: 1.5 }}>{selectedLoc.desc}</div>
            </div>
          </div>

          {/* Level + progress */}
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{
              background: '#f4efd8', border: '2px solid rgba(62, 56, 45, 0.15)',
              borderRadius: 9, padding: '7px 13px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#c46b3e', lineHeight: 1 }}>{userLevel}</div>
              <div style={{ fontSize: 8, color: '#6b5e48', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1, fontWeight: 700 }}>Level</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 10 }}>
                <span style={{ color: '#6b5e48', fontWeight: 600 }}>Progress to next</span>
                <span style={{ color: '#c46b3e', fontWeight: 800 }}>{levelPct}%</span>
              </div>
              <div style={{ background: '#d8cca8', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: 'linear-gradient(90deg, #c46b3e, #d97706)',
                  width: `${levelPct}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: '#6b5e48', marginTop: 4 }}>
                {userLevel < 108
                  ? <>{pointsToNext} pts → <span style={{ color: '#c46b3e', fontWeight: 700 }}>{nextLoc.name}</span></>
                  : <span style={{ color: '#b45309', fontWeight: 700 }}>🏔 Kailash reached! Journey complete.</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
