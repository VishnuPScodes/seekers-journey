import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LOCATIONS, getLevelProgress, getPointsToNextLevel, getKmTraveled, getKmRemaining } from '../utils/locations';

import { ChevronLeft, Star, MapPin, Layers, X, LocateFixed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HandDrawnNavbarEdge from '../components/HandDrawnNavbarEdge';
import { KundaliniSerpentSpiralMotif, AgniYogiMotif, BalanceYogiMotif, ExpansionSunYogiMotif } from '../components/SadhanaMotifs';

// ── Region color config (vivid manuscript palette)
const REGIONS = [
  { range: [1, 10],   color: '#d9572b', label: '1. Tamil Nadu' },
  { range: [11, 20],  color: '#1b8a6b', label: '2. Kerala / Karnataka' },
  { range: [21, 30],  color: '#d97706', label: '3. Andhra / Telangana' },
  { range: [31, 40],  color: '#c92a42', label: '4. Maharashtra' },
  { range: [41, 50],  color: '#8b44b8', label: '5. MP / Rajasthan' },
  { range: [51, 60],  color: '#d96b00', label: '6. Gujarat' },
  { range: [61, 70],  color: '#1d78b4', label: '7. Uttar Pradesh' },
  { range: [71, 80],  color: '#2b8a4b', label: '8. Uttarakhand' },
  { range: [81, 90],  color: '#7b2cb0', label: '9. Himalayas' },
  { range: [91, 100], color: '#0284c7', label: '10. Ladakh' },
  { range: [101, 108],color: '#b45309', label: '🏔 Kailash Summit' },
];

function getColor(level) {
  return (REGIONS.find(r => level >= r.range[0] && level <= r.range[1]) || REGIONS[0]).color;
}

// ── Canvas Dimensions
const VW = 900;
const VH = 3200; // Expanded height for generous physical spacing between all 108 destinations
const DEFAULT_ZOOM = 6.0; // 600% Zoom on load centered on seeker location


// Deterministic organic pseudo-random generator for hand-drawn wobble
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ── Round Organic Hand-Drawn S-Curve Mountain Trail Generator
function generateNaturalOrganicTrailPoints() {
  const pts = [];
  const total = 108;
  const startY = 3100;
  const endY = 100;

  for (let i = 0; i < total; i++) {
    if (i === 0) {
      pts.push([140, startY]);
      continue;
    }
    if (i === total - 1) {
      pts.push([450, endY]);
      continue;
    }

    const t = i / (total - 1); // 0 to 1 progress

    // Linear vertical ascent from bottom (3100) to top summit (100)
    const baseY = startY - t * (startY - endY);

    // Round, sweeping S-curve loops (3.5 wide, soft, round S-curves across 108 levels)
    const roundS = Math.sin(t * Math.PI * 7) * 280;

    // Organic hand-drawn path sway & gentle mountain drift
    const drift = Math.cos(t * Math.PI * 2.2) * 60;
    const handWobbleX = (pseudoRandom(i * 7 + 1) - 0.5) * 14;
    const handWobbleY = (pseudoRandom(i * 7 + 2) - 0.5) * 8;

    const baseX = 450 + roundS + drift + handWobbleX;

    const finalX = Math.round(Math.max(100, Math.min(800, baseX)));
    const finalY = Math.round(baseY + handWobbleY);

    pts.push([finalX, finalY]);
  }
  return pts;
}

const SVG_PTS = generateNaturalOrganicTrailPoints();

// ── Organic Hand-Drawn Curved SVG Path Generator (Smooth Round S-Spline)
function makeHandDrawnPath(pts) {
  if (!pts || pts.length < 2) return '';
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;

  let d = `M${pts[0][0]},${pts[0][1]}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;

    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const dist = Math.hypot(dx, dy);

    // Hand-drawn organic control point offset for natural ink stroke curvature
    const wobble = (pseudoRandom(i * 11 + 3) - 0.5) * Math.min(dist * 0.25, 14);
    const perpX = dist > 0 ? (-dy / dist) * wobble : 0;
    const perpY = dist > 0 ? (dx / dist) * wobble : 0;

    const ctrlX = +(mx + perpX).toFixed(1);
    const ctrlY = +(my + perpY).toFixed(1);

    d += ` Q${ctrlX},${ctrlY} ${p1[0]},${p1[1]}`;
  }
  return d;
}

// ── Region Watermark Labels
const REGION_LABELS = REGIONS.map(r => {
  const pts = SVG_PTS.slice(r.range[0] - 1, r.range[1]);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return { ...r, cx: +cx.toFixed(1), cy: +cy.toFixed(1) };
});

export default function KailashJourney() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const userLevel    = user?.currentLevel || 1;
  const totalScore   = user?.totalCumulativeScore || 0;
  const levelPct     = Math.round(getLevelProgress(totalScore) * 100);
  const pointsToNext = getPointsToNextLevel(totalScore);

  const pilgrimPt = SVG_PTS[Math.max(0, userLevel - 1)];
  const kailashPt = SVG_PTS[107];

  const [selectedLevel, setSelectedLevel] = useState(userLevel);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, loc: null });
  const [showLegend, setShowLegend] = useState(false);

  // ── Camera view state: default to 3.3 (330% Zoom) centered directly on seeker location
  const [view, setView] = useState({
    zoom: DEFAULT_ZOOM,
    centerX: pilgrimPt[0],
    centerY: pilgrimPt[1],
  });


  const dragging     = useRef(false);
  const dragOrigin   = useRef({ x: 0, y: 0, cx: VW / 2, cy: VH / 2 });
  const touchState   = useRef(null);
  const containerRef = useRef(null);

  const selectedLoc = LOCATIONS.find(l => l.level === selectedLevel) || LOCATIONS[0];
  const nextLoc     = LOCATIONS.find(l => l.level === Math.min(userLevel + 1, 108)) || LOCATIONS[107];
  const selColor    = getColor(selectedLevel);

  // Hand-drawn path strings
  const fullPathD    = useMemo(() => makeHandDrawnPath(SVG_PTS), []);
  const visitedPathD = useMemo(
    () => makeHandDrawnPath(SVG_PTS.slice(0, Math.max(2, userLevel))),
    [userLevel],
  );

  // ── Calculate viewBox string from view state (100% reliable framing)
  const viewBoxStr = useMemo(() => {
    const vW = VW / view.zoom;
    const vH = VH / view.zoom;

    // Clamp focus center so viewBox never leaves the canvas bounds
    const minCenterX = vW / 2;
    const maxCenterX = VW - vW / 2;
    const minCenterY = vH / 2;
    const maxCenterY = VH - vH / 2;

    const clampedCX = Math.max(minCenterX, Math.min(maxCenterX, view.centerX));
    const clampedCY = Math.max(minCenterY, Math.min(maxCenterY, view.centerY));

    const minX = clampedCX - vW / 2;
    const minY = clampedCY - vH / 2;

    return `${minX.toFixed(1)} ${minY.toFixed(1)} ${vW.toFixed(1)} ${vH.toFixed(1)}`;
  }, [view]);

  // ── Focus camera on specific point
  const focusOnPoint = useCallback((pt, zoom = 6.0) => {
    setView({
      zoom: Math.min(Math.max(zoom, 1), 12),
      centerX: pt[0],
      centerY: pt[1],
    });
  }, []);

  // ── Zoom logic
  const handleZoom = useCallback((zoomFactor) => {
    setView((prev) => {
      const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 1), 12);
      return { ...prev, zoom: newZoom };
    });
  }, []);

  // ── Scroll wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    let factor = 1 + delta * 0.003;
    factor = Math.min(Math.max(factor, 0.75), 1.35);
    handleZoom(factor);
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
    dragOrigin.current = {
      x: e.clientX,
      y: e.clientY,
      cx: view.centerX,
      cy: view.centerY,
    };
  }, [view.centerX, view.centerY]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;

    // Convert pixel drag distance to SVG coordinate delta
    const vW = VW / view.zoom;
    const vH = VH / view.zoom;
    const svgDx = (dx / rect.width) * vW;
    const svgDy = (dy / rect.height) * vH;

    setView((prev) => ({
      ...prev,
      centerX: dragOrigin.current.cx - svgDx,
      centerY: dragOrigin.current.cy - svgDy,
    }));
  }, [view.zoom]);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // ── Touch Pan & Pinch Zoom
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchState.current = {
        type: 'pan',
        x: t.clientX,
        y: t.clientY,
        cx: view.centerX,
        cy: view.centerY,
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchState.current = { type: 'pinch', dist, zoom: view.zoom };
    }
  }, [view.centerX, view.centerY, view.zoom]);

  const onTouchMove = useCallback((e) => {
    if (!touchState.current || !containerRef.current) return;

    if (touchState.current.type === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const dx = t.clientX - touchState.current.x;
      const dy = t.clientY - touchState.current.y;

      const vW = VW / view.zoom;
      const vH = VH / view.zoom;
      const svgDx = (dx / rect.width) * vW;
      const svgDy = (dy / rect.height) * vH;

      setView((prev) => ({
        ...prev,
        centerX: touchState.current.cx - svgDx,
        centerY: touchState.current.cy - svgDy,
      }));
    } else if (touchState.current.type === 'pinch' && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = dist / touchState.current.dist;
      handleZoom(factor);
      touchState.current.dist = dist;
    }
  }, [view.zoom, handleZoom]);

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
          0%,100% { r: 18; opacity: 0.6; }
          50%      { r: 32; opacity: 0; }
        }
        .kpulse { animation: kpulse 2.4s ease-in-out infinite; }
      `}</style>

      {/* ── TOP BAR (Saffron-Terracotta Hand-Drawn Manuscript Banner) ───────── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #e65c00 0%, #d9572b 100%)',
        color: '#fffcf7',
        padding: '12px 14px 10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0, zIndex: 20,
        boxShadow: '0 4px 15px rgba(196, 85, 37, 0.25)',
      }}>
        {/* Organic Hand-Drawn Wavy Bottom Edge with Leaf Vine Flourishes */}
        <HandDrawnNavbarEdge fill="#d9572b" height={32} />

        <button
          onClick={() => navigate('/')}
          id="journey-back-btn"
          style={{
            background: 'rgba(255, 252, 247, 0.18)', border: '1px solid rgba(255, 252, 247, 0.35)',
            color: '#ffffff', borderRadius: 8, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 5,
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
            position: 'relative', zIndex: 2,
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>

        <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 2, color: '#ffffff', textTransform: 'uppercase', fontFamily: '"Cormorant Garamond", serif', textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            🏔 Kailash Pilgrim Trail
          </div>
          <div style={{ fontSize: 11, color: '#fceee6', marginTop: 2, fontWeight: 700 }}>
            Level {userLevel} / 108 · 📍 {getKmTraveled(userLevel).toLocaleString()} km traveled · 🏔 {getKmRemaining(userLevel).toLocaleString()} km to Kailash
          </div>
        </div>

        <button
          onClick={() => setShowLegend(v => !v)}
          style={{
            background: showLegend ? '#ffffff' : 'rgba(255, 252, 247, 0.18)',
            color: showLegend ? '#c45525' : '#ffffff',
            border: '1px solid rgba(255, 252, 247, 0.35)',
            borderRadius: 8, padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            cursor: 'pointer', fontSize: 11, fontWeight: 700,
            position: 'relative', zIndex: 2,
          }}
        >
          <Layers size={13} /> {showLegend ? 'Close' : 'Regions'}
        </button>

        <div style={{
          background: 'rgba(255, 252, 247, 0.2)', border: '1px solid rgba(255, 252, 247, 0.4)',
          borderRadius: 8, padding: '5px 11px',
          display: 'flex', alignItems: 'center', gap: 5,
          position: 'relative', zIndex: 2,
        }}>
          <Star size={12} style={{ color: '#ffea79' }} />
          <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff' }}>{totalScore}</span>
        </div>
      </div>

      {/* ── MAP CANVAS (100% Full Trail Overview on Load) ───────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        <div
          ref={containerRef}
          style={{
            width: '100%', height: '100%',
            overflow: 'hidden', position: 'relative',
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
          <svg
            viewBox={viewBoxStr}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
          >
            {/* ── Background ── */}
            <rect width={VW} height={VH} fill="#f4efd8" />

            {/* ── Subtle manuscript grid dots ── */}
            {Array.from({ length: 30 }).map((_, row) =>
              Array.from({ length: 22 }).map((__, col) => (
                <circle key={`${row}-${col}`}
                  cx={col * 40 + 20} cy={row * 40 + 20}
                  r={1.3} fill="#e2d8bd" />
              ))
            )}

            {/* ── 10 Region Title Watermarks ── */}
            {REGION_LABELS.map(r => (
              <text key={r.label}
                x={r.cx} y={r.cy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={14} fontWeight="800"
                fill={r.color}
                opacity={0.25}
                style={{ letterSpacing: 2, textTransform: 'uppercase', pointerEvents: 'none' }}
              >
                {r.label.toUpperCase()}
              </text>
            ))}
            {/* ── Sacred Hand-Drawn Yogic Logos & Motifs Along the Trail ── */}
            <g transform="translate(620, 2920)" opacity={0.22} style={{ pointerEvents: 'none' }}>
              <KundaliniSerpentSpiralMotif size={180} color="#d9572b" strokeWidth={1.8} />
            </g>
            <g transform="translate(80, 2250)" opacity={0.20} style={{ pointerEvents: 'none' }}>
              <AgniYogiMotif size={160} color="#d97706" strokeWidth={1.8} />
            </g>
            <g transform="translate(640, 1550)" opacity={0.22} style={{ pointerEvents: 'none' }}>
              <BalanceYogiMotif size={165} color="#d96b00" strokeWidth={1.8} />
            </g>
            <g transform="translate(60, 850)" opacity={0.22} style={{ pointerEvents: 'none' }}>
              <ExpansionSunYogiMotif size={175} color="#2b8a4b" strokeWidth={1.8} />
            </g>
            <g transform="translate(620, 180)" opacity={0.25} style={{ pointerEvents: 'none' }}>
              <KundaliniSerpentSpiralMotif size={190} color="#b45309" strokeWidth={1.8} />
            </g>

            {/* ── Full Mountain Trail (Unvisited - Soft manuscript guide) ── */}
            <path
              d={fullPathD}
              fill="none"
              stroke="#d8cca8"
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* ── Dashed Hand-Drawn Trail Accent ── */}
            <path
              d={fullPathD}
              fill="none"
              stroke="#e6d7b8"
              strokeWidth={2.5}
              strokeDasharray="9 6"
              strokeLinecap="round"
            />

            {/* ── Visited Path — Vivid Terracotta / Gold hand-drawn ink ── */}
            {userLevel > 1 && (
              <>
                <path
                  d={visitedPathD}
                  fill="none"
                  stroke="#c46b3e33"
                  strokeWidth={18}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={visitedPathD}
                  fill="none"
                  stroke="#c46b3e"
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* ── Locations (108 points) ── */}
            {LOCATIONS.filter(l => l.level < 108).map((loc, i) => {
              const pt = SVG_PTS[i];
              if (!pt) return null;

              const isVisited   = loc.level <= userLevel;
              const isMilestone = loc.level % 10 === 0;
              const isSelected  = loc.level === selectedLevel;
              const col = isVisited ? getColor(loc.level) : '#cbbd9b';
              const r   = isMilestone ? 14 : 7.5;
              const opacity = isVisited ? 1 : 0.85;

              const showLabel = isMilestone || isSelected || loc.level === 1;

              return (
                <g key={loc.level}>
                  {/* Milestone 10-point outer hand-drawn ring */}
                  {isMilestone && (
                    <circle cx={pt[0]} cy={pt[1]} r={22}
                      fill="none" stroke={col} strokeWidth={isVisited ? 2.5 : 1.2}
                      strokeDasharray={isVisited ? 'none' : '4 4'}
                      opacity={isVisited ? 0.8 : 0.5}
                    />
                  )}

                  {/* Visible Location Badge for major milestones */}
                  {showLabel && (
                    <g transform={`translate(${pt[0]}, ${pt[1] + (isMilestone ? 32 : 22)})`}>
                      <rect
                        x="-60" y="-11" width="120" height="22" rx="6"
                        fill="#f4efd8ee" stroke={col} strokeWidth="1"
                      />
                      <text
                        x="0" y="0"
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={10} fontWeight="800"
                        fill={isVisited ? col : '#7c725d'}
                        style={{ pointerEvents: 'none', letterSpacing: 0.3 }}
                      >
                        Pt {loc.level} · {loc.name.length > 12 ? loc.name.slice(0, 11) + '…' : loc.name}
                      </text>
                    </g>
                  )}

                  {/* Selection highlight ring */}
                  {isSelected && (
                    <circle cx={pt[0]} cy={pt[1]} r={r + 8}
                      fill="none" stroke="#3e382d" strokeWidth={3}
                      opacity={0.9}
                    />
                  )}

                  {/* Main Location Node Dot */}
                  <circle
                    cx={pt[0]} cy={pt[1]} r={r}
                    fill={col}
                    stroke={isVisited ? '#ffffff' : '#f4efd8'}
                    strokeWidth={isVisited ? 2 : 1.2}
                    opacity={opacity}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => onDotEnter(loc, e)}
                    onMouseLeave={onDotLeave}
                    onClick={() => onDotClick(loc)}
                  />
                </g>
              );
            })}

            {/* ── Level 1: START Banner (Far Bottom Left) ── */}
            <g transform={`translate(${SVG_PTS[0][0]}, ${SVG_PTS[0][1] - 28})`}>
              <rect x="-65" y="-13" width="130" height="24" rx="7" fill="#d9572b22" stroke="#d9572b" strokeWidth="1.5" />
              <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="900" fill="#d9572b" style={{ pointerEvents: 'none' }}>
                🚩 START (Level 1)
              </text>
            </g>

            {/* ── Kailash Beacon & Summit Badge (Top Peak) ── */}
            <g>
              <circle cx={kailashPt[0]} cy={kailashPt[1]} r={42} fill="#b4530915" />
              <circle cx={kailashPt[0]} cy={kailashPt[1]} r={28} fill="none" stroke="#b45309" strokeWidth={2} opacity={0.6} />
              <circle cx={kailashPt[0]} cy={kailashPt[1]} r={18} fill="none" stroke="#d97706" strokeWidth={2} opacity={0.85} />
              <circle cx={kailashPt[0]} cy={kailashPt[1]} r={12}
                fill="#b45309" stroke="#ffffff" strokeWidth={2}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => onDotEnter(LOCATIONS[107], e)}
                onMouseLeave={onDotLeave}
                onClick={() => onDotClick(LOCATIONS[107])}
              />

              {/* Clean Non-Stretched Summit Badge */}
              <g transform={`translate(${kailashPt[0]}, ${kailashPt[1] - 46})`}>
                <rect
                  x="-90" y="-18" width="180" height="30" rx="9"
                  fill="#ebdcb2" stroke="#b45309" strokeWidth="1.5"
                />
                <text
                  x="0" y="0"
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={13} fontWeight="900" fill="#b45309"
                  fontFamily='"Cormorant Garamond", serif'
                  style={{ letterSpacing: 1 }}
                >
                  🏔 MOUNT KAILASH
                </text>
              </g>
            </g>

            {/* ── Pilgrim Marker (Current Seeker Level) ── */}
            <g>
              <circle
                cx={pilgrimPt[0]} cy={pilgrimPt[1]}
                r={18} fill="none"
                stroke="#c46b3e" strokeWidth={2.5}
                opacity={0.85}
                className="kpulse"
              />
              <circle cx={pilgrimPt[0]} cy={pilgrimPt[1]} r={14}
                fill="none" stroke="#3e382d" strokeWidth={2} opacity={0.9}
                style={{ pointerEvents: 'none' }}
              />
              <circle cx={pilgrimPt[0]} cy={pilgrimPt[1]} r={9}
                fill="#c46b3e" stroke="#ffffff" strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
              <text x={pilgrimPt[0]} y={pilgrimPt[1] - 25}
                textAnchor="middle"
                fontSize={11} fontWeight="900"
                fill="#3e382d"
                style={{ pointerEvents: 'none', letterSpacing: 0.5 }}
              >
                ✦ YOU ARE HERE
              </text>
            </g>

          </svg>

          {/* ── Floating Zoom Controls with Focus Seeker Button ── */}
          <div style={{
            position: 'absolute', right: 14, bottom: 84,
            display: 'flex', flexDirection: 'column', gap: 6,
            zIndex: 40,
          }}>
            <button
              onClick={() => handleZoom(1.3)}
              title="Zoom In"
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: '#ebdcb2', border: '1px solid rgba(62, 56, 45, 0.25)',
                color: '#3e382d', fontSize: 20, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 56, 45, 0.15)',
              }}
            >
              +
            </button>
            <button
              onClick={() => handleZoom(0.77)}
              title="Zoom Out"
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: '#ebdcb2', border: '1px solid rgba(62, 56, 45, 0.25)',
                color: '#3e382d', fontSize: 20, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 56, 45, 0.15)',
              }}
            >
              −
            </button>
            <button
              onClick={() => focusOnPoint(pilgrimPt, 6.0)}
              title="Focus on My Location (600% Zoom)"
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: '#ebdcb2', border: '1px solid rgba(62, 56, 45, 0.25)',
                color: '#c46b3e', fontSize: 14, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 56, 45, 0.15)',
              }}
            >
              <LocateFixed size={18} />
            </button>
            <button
              onClick={() => setView({ zoom: 1.0, centerX: VW / 2, centerY: VH / 2 })}
              title="Full Map Overview (100%)"
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: '#ebdcb2', border: '1px solid rgba(62, 56, 45, 0.25)',
                color: '#6b5e48', fontSize: 13, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(62, 56, 45, 0.15)',
              }}
            >
              🎯
            </button>
          </div>

          {/* ── Floating Region Drawer / Overlay ── */}
          {showLegend && (
            <div style={{
              position: 'absolute', top: 12, right: 12, width: 220, maxHeight: 'calc(100% - 24px)',
              background: '#ebdcb2', border: '2px solid rgba(62, 56, 45, 0.2)',
              borderRadius: 14, padding: '14px 14px', zIndex: 60,
              boxShadow: '0 8px 30px rgba(62, 56, 45, 0.25)', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#6b5e48', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>
                  10 Milestone Regions
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3e382d', padding: 2 }}
                >
                  <X size={16} />
                </button>
              </div>

              {REGIONS.map(r => {
                const reached = userLevel >= r.range[0];
                return (
                  <div key={r.label} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 8, opacity: reached ? 1 : 0.5,
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: r.color, flexShrink: 0,
                      boxShadow: reached ? `0 0 6px ${r.color}66` : 'none',
                    }} />
                    <span style={{ fontSize: 11, color: '#3e382d', fontWeight: reached ? 700 : 400, lineHeight: 1.3 }}>
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Rich Destination Tooltip (Short Description & Kilometers Traveled) ── */}
          {tooltip.visible && tooltip.loc && (
            <div style={{
              position: 'absolute',
              left: Math.min(Math.max(12, tooltip.x + 14), (containerRef.current?.offsetWidth || 400) - 250),
              top: Math.max(12, tooltip.y - 110),
              background: '#f4efd8',
              border: `2px solid ${getColor(tooltip.loc.level)}`,
              borderRadius: 12, padding: '10px 14px',
              pointerEvents: 'none', zIndex: 100,
              boxShadow: `0 8px 24px rgba(62, 56, 45, 0.28)`,
              maxWidth: 240,
            }}>
              {/* Location Title */}
              <div style={{ fontSize: 13, fontWeight: 900, color: getColor(tooltip.loc.level), letterSpacing: 0.3, marginBottom: 2 }}>
                {tooltip.loc.level === 108 ? '🏔 ' : '📍 '}{tooltip.loc.name}
              </div>

              {/* Region & Level Badge */}
              <div style={{ fontSize: 10, color: '#6b5e48', fontWeight: 600, marginBottom: 6 }}>
                {tooltip.loc.region} · Level {tooltip.loc.level} of 108
              </div>

              {/* Remaining Distance to Kailash & Traveled Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 800, color: '#d9572b',
                background: 'rgba(217, 87, 43, 0.12)', border: '1px solid rgba(217, 87, 43, 0.3)',
                padding: '2px 8px', borderRadius: 6, marginBottom: 6,
              }}>
                🧭 {tooltip.loc.level === 108
                  ? 'Summit Reached! 3,300 km Traveled'
                  : `${getKmTraveled(tooltip.loc.level).toLocaleString()} km traveled · ${getKmRemaining(tooltip.loc.level).toLocaleString()} km to Kailash`
                }
              </div>

              {/* Short Description */}
              <div style={{ fontSize: 11, color: '#1e1b15', lineHeight: 1.4, fontWeight: 500 }}>
                {tooltip.loc.desc}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM HUD (Selected Location & Progress) ───────────────────── */}
      <div style={{
        background: '#ebdcb2',
        borderTop: '1px solid rgba(62, 56, 45, 0.15)',
        padding: '10px 14px',
        flexShrink: 0, zIndex: 20,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Selected location card */}
          <div style={{
            background: '#f4efd8',
            border: `2px solid ${selColor}44`,
            borderRadius: 12, padding: '9px 13px', marginBottom: 8,
            display: 'flex', gap: 11, alignItems: 'center',
            boxShadow: '0 2px 8px rgba(62, 56, 45, 0.08)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
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
              <div style={{ fontSize: 10, color: '#3e382d', lineHeight: 1.4 }}>{selectedLoc.desc}</div>
            </div>
          </div>

          {/* Level + progress */}
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{
              background: '#f4efd8', border: '2px solid rgba(62, 56, 45, 0.15)',
              borderRadius: 9, padding: '6px 12px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#c46b3e', lineHeight: 1 }}>{userLevel}</div>
              <div style={{ fontSize: 8, color: '#6b5e48', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1, fontWeight: 700 }}>Level</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 }}>
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
              <div style={{ fontSize: 10, color: '#6b5e48', marginTop: 3 }}>
                {userLevel < 108
                  ? <><span style={{ color: '#d9572b', fontWeight: 800 }}>📍 {getKmTraveled(userLevel).toLocaleString()} km traveled</span> · <span style={{ color: '#d9572b', fontWeight: 800 }}>🏔 {getKmRemaining(userLevel).toLocaleString()} km to Kailash</span> · {pointsToNext} pts to <span style={{ color: '#c46b3e', fontWeight: 700 }}>{nextLoc.name}</span></>
                  : <span style={{ color: '#b45309', fontWeight: 700 }}>🏔 Kailash reached! 3,300 km traveled. Journey complete.</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
