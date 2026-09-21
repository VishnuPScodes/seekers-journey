import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LOCATIONS, getLevelProgress, getPointsToNextLevel, getKmTraveled, getKmRemaining } from '../utils/locations';

import { ChevronLeft, Star, MapPin, Layers, X, LocateFixed, Volume2, VolumeX, Play, Pause, Film, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HandDrawnNavbarEdge from '../components/HandDrawnNavbarEdge';
import { LandmarkSketchAnchor, ClassicalTempleDanceSketch } from '../components/KailashLandmarkSketches';
import hampiVideo from '../assets/videos/hampi.mp4';


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
  const [hampiVideoMuted, setHampiVideoMuted] = useState(true);
  const [showHampiModal, setShowHampiModal] = useState(false);

  // ── Camera view state
  const [view, setView] = useState({
    zoom: DEFAULT_ZOOM,
    centerX: pilgrimPt[0],
    centerY: pilgrimPt[1],
  });
  const [isDragging, setIsDragging] = useState(false);
  const [smoothTransition, setSmoothTransition] = useState(false);

  const dragging     = useRef(false);
  const dragLast     = useRef({ x: 0, y: 0 });
  const velocity     = useRef({ x: 0, y: 0 });
  const inertiaFrame = useRef(null);
  const viewRef      = useRef(view);
  const touchState   = useRef(null);
  const containerRef = useRef(null);

  // Keep viewRef in sync so inertia can read latest view
  useEffect(() => { viewRef.current = view; }, [view]);

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

  // ── Focus camera on specific point (with smooth animation)
  const focusOnPoint = useCallback((pt, zoom = 6.0) => {
    setSmoothTransition(true);
    setView({
      zoom: Math.min(Math.max(zoom, 1), 12),
      centerX: pt[0],
      centerY: pt[1],
    });
    setTimeout(() => setSmoothTransition(false), 500);
  }, []);

  // ── Zoom toward a specific SVG point (cursor or pinch center)
  const zoomToward = useCallback((svgX, svgY, factor, animate = false) => {
    if (animate) setSmoothTransition(true);
    setView((prev) => {
      const newZoom = Math.min(Math.max(prev.zoom * factor, 1), 14);
      // Shift center so the SVG point under cursor stays fixed
      const zoomRatio = newZoom / prev.zoom;
      const newCX = svgX + (prev.centerX - svgX) / zoomRatio;
      const newCY = svgY + (prev.centerY - svgY) / zoomRatio;
      return { zoom: newZoom, centerX: newCX, centerY: newCY };
    });
    if (animate) setTimeout(() => setSmoothTransition(false), 400);
  }, []);

  // ── Simple zoom without cursor centering (button clicks)
  const handleZoom = useCallback((zoomFactor) => {
    zoomToward(viewRef.current.centerX, viewRef.current.centerY, zoomFactor, true);
  }, [zoomToward]);

  // ── Scroll wheel zoom — centered on mouse cursor position in SVG space
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    // Convert mouse position to SVG coordinate
    const v = viewRef.current;
    const vW = VW / v.zoom;
    const vH = VH / v.zoom;
    const minCX = Math.max(vW / 2, Math.min(VW - vW / 2, v.centerX));
    const minCY = Math.max(vH / 2, Math.min(VH - vH / 2, v.centerY));
    const svgX = (minCX - vW / 2) + ((e.clientX - rect.left) / rect.width) * vW;
    const svgY = (minCY - vH / 2) + ((e.clientY - rect.top) / rect.height) * vH;

    // Smooth, natural zoom speed
    const rawDelta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY; // handle line vs pixel mode
    const factor = Math.pow(0.998, rawDelta);
    const clampedFactor = Math.min(Math.max(factor, 0.6), 1.6);
    zoomToward(svgX, svgY, clampedFactor);
  }, [zoomToward]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      const step = 60 / viewRef.current.zoom;
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); setView(p => ({ ...p, centerY: p.centerY - step })); break;
        case 'ArrowDown':  e.preventDefault(); setView(p => ({ ...p, centerY: p.centerY + step })); break;
        case 'ArrowLeft':  e.preventDefault(); setView(p => ({ ...p, centerX: p.centerX - step })); break;
        case 'ArrowRight': e.preventDefault(); setView(p => ({ ...p, centerX: p.centerX + step })); break;
        case '=': case '+': handleZoom(1.25); break;
        case '-': case '_': handleZoom(0.8); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleZoom]);

  // ── Mouse Pan with inertia/momentum
  const stopInertia = useCallback(() => {
    if (inertiaFrame.current) {
      cancelAnimationFrame(inertiaFrame.current);
      inertiaFrame.current = null;
    }
  }, []);

  const startInertia = useCallback(() => {
    const decay = 0.88;
    const tick = () => {
      const vx = velocity.current.x;
      const vy = velocity.current.y;
      if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) {
        inertiaFrame.current = null;
        return;
      }
      velocity.current = { x: vx * decay, y: vy * decay };
      setView(prev => {
        const v = viewRef.current;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return prev;
        const svgUnitX = (VW / v.zoom) / rect.width;
        const svgUnitY = (VH / v.zoom) / rect.height;
        return {
          ...prev,
          centerX: prev.centerX - velocity.current.x * svgUnitX,
          centerY: prev.centerY - velocity.current.y * svgUnitY,
        };
      });
      inertiaFrame.current = requestAnimationFrame(tick);
    };
    inertiaFrame.current = requestAnimationFrame(tick);
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    stopInertia();
    dragging.current = true;
    setIsDragging(true);
    dragLast.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
  }, [stopInertia]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragLast.current.x;
    const dy = e.clientY - dragLast.current.y;
    dragLast.current = { x: e.clientX, y: e.clientY };

    // Track velocity for inertia
    velocity.current = { x: dx * 0.6 + velocity.current.x * 0.4, y: dy * 0.6 + velocity.current.y * 0.4 };

    const v = viewRef.current;
    const svgUnitX = (VW / v.zoom) / rect.width;
    const svgUnitY = (VH / v.zoom) / rect.height;

    setView((prev) => ({
      ...prev,
      centerX: prev.centerX - dx * svgUnitX,
      centerY: prev.centerY - dy * svgUnitY,
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
    startInertia();
  }, [startInertia]);

  // ── Touch Pan & Pinch Zoom (properly centered)
  const onTouchStart = useCallback((e) => {
    e.preventDefault();
    stopInertia();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchState.current = {
        type: 'pan',
        lastX: t.clientX,
        lastY: t.clientY,
      };
      velocity.current = { x: 0, y: 0 };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      touchState.current = { type: 'pinch', dist, midX, midY };
    }
  }, [stopInertia]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!touchState.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (touchState.current.type === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchState.current.lastX;
      const dy = t.clientY - touchState.current.lastY;
      touchState.current.lastX = t.clientX;
      touchState.current.lastY = t.clientY;

      velocity.current = { x: dx * 0.6 + velocity.current.x * 0.4, y: dy * 0.6 + velocity.current.y * 0.4 };

      const v = viewRef.current;
      const svgUnitX = (VW / v.zoom) / rect.width;
      const svgUnitY = (VH / v.zoom) / rect.height;
      setView(prev => ({
        ...prev,
        centerX: prev.centerX - dx * svgUnitX,
        centerY: prev.centerY - dy * svgUnitY,
      }));

    } else if (touchState.current.type === 'pinch' && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const factor = dist / touchState.current.dist;

      // Zoom toward pinch midpoint in SVG space
      const v = viewRef.current;
      const vW = VW / v.zoom;
      const vH = VH / v.zoom;
      const clamped_cx = Math.max(vW / 2, Math.min(VW - vW / 2, v.centerX));
      const clamped_cy = Math.max(vH / 2, Math.min(VH - vH / 2, v.centerY));
      const svgX = (clamped_cx - vW / 2) + ((midX - rect.left) / rect.width) * vW;
      const svgY = (clamped_cy - vH / 2) + ((midY - rect.top) / rect.height) * vH;

      zoomToward(svgX, svgY, factor);
      touchState.current.dist = dist;
      touchState.current.midX = midX;
      touchState.current.midY = midY;
    }
  }, [zoomToward]);

  const onTouchEnd = useCallback(() => {
    touchState.current = null;
    startInertia();
  }, [startInertia]);

  // ── Dot hover/click
  const onDotEnter = useCallback((loc, e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({ visible: true, x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0), loc });
  }, []);
  const onDotLeave = useCallback(() => setTooltip(t => ({ ...t, visible: false })), []);
  const onDotClick = useCallback((loc) => {
    setSelectedLevel(loc.level);
    if (loc.level === 20) {
      setShowHampiModal(true);
    }
  }, []);

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
            cursor: isDragging ? 'grabbing' : 'grab',
            background: '#f4efd8',
            touchAction: 'none', // prevent browser scroll interference on touch
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
            style={{
              width: '100%', height: '100%', display: 'block', userSelect: 'none',
              transition: smoothTransition ? 'all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
            }}
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
                  {/* Landmark Hand-Drawn Sketch caricature anchored to major destinations */}
                  <LandmarkSketchAnchor level={loc.level} pt={pt} color={col} />

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
              {/* Landmark Sketch caricature anchored to Mount Kailash Summit */}
              <LandmarkSketchAnchor level={108} pt={kailashPt} color="#b45309" />

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
            display: 'flex', flexDirection: 'column', gap: 5,
            zIndex: 40,
          }}>
            {/* Zoom In */}
            <button
              onClick={() => handleZoom(1.3)}
              title="Zoom In (+)"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: '#ebdcb2', border: '1.5px solid rgba(62, 56, 45, 0.25)',
                color: '#3e382d', fontSize: 22, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 3px 10px rgba(62, 56, 45, 0.18)',
                transition: 'transform 0.1s, background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e0d0a0'}
              onMouseLeave={e => e.currentTarget.style.background = '#ebdcb2'}
            >
              +
            </button>

            {/* Zoom level pill */}
            <div style={{
              width: 38, height: 28, borderRadius: 8,
              background: 'rgba(62, 56, 45, 0.12)', border: '1px solid rgba(62, 56, 45, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#6b5e48', letterSpacing: 0.3,
            }}>
              {Math.round(view.zoom * 100)}%
            </div>

            {/* Zoom Out */}
            <button
              onClick={() => handleZoom(0.77)}
              title="Zoom Out (-)"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: '#ebdcb2', border: '1.5px solid rgba(62, 56, 45, 0.25)',
                color: '#3e382d', fontSize: 22, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 3px 10px rgba(62, 56, 45, 0.18)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e0d0a0'}
              onMouseLeave={e => e.currentTarget.style.background = '#ebdcb2'}
            >
              −
            </button>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(62, 56, 45, 0.15)', margin: '2px 4px' }} />

            {/* Focus on Me */}
            <button
              onClick={() => focusOnPoint(pilgrimPt, 6.0)}
              title="Focus on My Location"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: '#fff4ec', border: '1.5px solid rgba(196, 107, 62, 0.4)',
                color: '#c46b3e', fontSize: 14, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 3px 10px rgba(196, 107, 62, 0.15)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fde8d4'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff4ec'}
            >
              <LocateFixed size={17} />
            </button>

            {/* Full Overview */}
            <button
              onClick={() => { setSmoothTransition(true); setView({ zoom: 1.0, centerX: VW / 2, centerY: VH / 2 }); setTimeout(() => setSmoothTransition(false), 500); }}
              title="Full Trail Overview"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: '#ebdcb2', border: '1.5px solid rgba(62, 56, 45, 0.25)',
                color: '#6b5e48', fontSize: 14, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 3px 10px rgba(62, 56, 45, 0.18)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e0d0a0'}
              onMouseLeave={e => e.currentTarget.style.background = '#ebdcb2'}
            >
              🗺️
            </button>

            {/* Keyboard hint */}
            <div style={{
              width: 38, textAlign: 'center',
              fontSize: 7.5, color: '#9b8e78', fontWeight: 600, lineHeight: 1.3,
              marginTop: 2,
            }}>
              ↑↓←→<br/>± zoom
            </div>
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

          {/* ── Rich Destination Tooltip & Hampi Video Popup Card ── */}
          {tooltip.visible && tooltip.loc && (
            <div style={{
              position: 'absolute',
              left: Math.min(Math.max(12, tooltip.x + 14), (containerRef.current?.offsetWidth || 400) - (tooltip.loc.level === 20 ? 340 : 250)),
              top: Math.max(12, tooltip.y - (tooltip.loc.level === 20 ? 280 : 110)),
              background: '#f4efd8',
              border: `2px solid ${getColor(tooltip.loc.level)}`,
              borderRadius: 14, padding: '12px 14px',
              pointerEvents: tooltip.loc.level === 20 ? 'auto' : 'none', zIndex: 100,
              boxShadow: `0 12px 32px rgba(62, 56, 45, 0.35)`,
              maxWidth: tooltip.loc.level === 20 ? 330 : 240,
            }}>
              {/* Location Title */}
              <div style={{ fontSize: 14, fontWeight: 900, color: getColor(tooltip.loc.level), letterSpacing: 0.3, marginBottom: 2 }}>
                {tooltip.loc.level === 108 ? '🏔 ' : '📍 '}{tooltip.loc.name}
              </div>

              {/* Region & Level Badge */}
              <div style={{ fontSize: 10, color: '#6b5e48', fontWeight: 600, marginBottom: 6 }}>
                {tooltip.loc.region} · Level {tooltip.loc.level} of 108
              </div>

              {/* Hampi Special Video & Classical Dance Card */}
              {tooltip.loc.level === 20 ? (
                <div>
                  {/* Cinematic Video Player Box */}
                  <div style={{
                    position: 'relative', borderRadius: 10, overflow: 'hidden',
                    border: '1.5px solid #059669', marginBottom: 8, background: '#000',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  }}>
                    <video
                      src={hampiVideo}
                      autoPlay
                      loop
                      muted={hampiVideoMuted}
                      playsInline
                      style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      background: 'rgba(5, 150, 105, 0.9)', color: '#fff',
                      fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                      letterSpacing: 0.5, textTransform: 'uppercase', backdropFilter: 'blur(4px)',
                    }}>
                      🎬 Cinematic Temple Video
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setHampiVideoMuted(!hampiVideoMuted); }}
                      style={{
                        position: 'absolute', bottom: 6, right: 6,
                        background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.4)',
                        color: '#fff', borderRadius: '50%', width: 26, height: 26,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}
                      title={hampiVideoMuted ? "Unmute Sound" : "Mute Sound"}
                    >
                      {hampiVideoMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                  </div>

                  {/* Classical Dance Mudra Card */}
                  <div style={{
                    background: 'rgba(5, 150, 105, 0.08)',
                    border: '1px solid rgba(5, 150, 105, 0.25)',
                    borderRadius: 8, padding: '8px 10px', marginBottom: 8,
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    <div style={{ flexShrink: 0 }}>
                      <ClassicalTempleDanceSketch size={38} color="#059669" />
                    </div>
                    <div style={{ fontSize: 9.5, color: '#1e1b15', lineHeight: 1.35 }}>
                      <strong style={{ color: '#059669', display: 'block', marginBottom: 1 }}>💃 Classical Temple Dance (Nritta Seva)</strong>
                      Sacred Devadasi dance mudras in Virupaksha Ranga Mantapa echoing Shiva's Nataraja rhythm.
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setShowHampiModal(true); }}
                    style={{
                      width: '100%', padding: '6px 12px', borderRadius: 7,
                      background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
                      color: '#fff', border: 'none', fontSize: 10, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                    }}
                  >
                    <Sparkles size={11} /> Expand Temple & Dance Showcase →
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
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

      {/* ── HAMPI VIRUPAKSHA TEMPLE & CLASSICAL DANCE SHOWCASE MODAL ── */}
      {showHampiModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(28, 24, 20, 0.72)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#f8f3e2', border: '2px solid #059669',
            borderRadius: 20, maxWidth: 640, width: '100%', padding: '24px 24px 20px 24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowHampiModal(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(62,56,45,0.12)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#1e1b15',
              }}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: 'rgba(5, 150, 105, 0.15)',
                border: '1.5px solid rgba(5, 150, 105, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ClassicalTempleDanceSketch size={36} color="#059669" />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#059669', fontFamily: '"Cormorant Garamond", serif', lineHeight: 1.1 }}>
                  Hampi Virupaksha Temple & Classical Dance
                </div>
                <div style={{ fontSize: 11, color: '#6b5e48', fontWeight: 600, marginTop: 2 }}>
                  Pt 20 · Tungabhadra River & Vijayanagara Sacred Heritage
                </div>
              </div>
            </div>

            {/* High-Definition Cinematic Video Player */}
            <div style={{
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              border: '2px solid #059669', marginBottom: 18, background: '#000',
              boxShadow: '0 10px 28px rgba(0,0,0,0.3)',
            }}>
              <video
                src={hampiVideo}
                autoPlay
                loop
                muted={hampiVideoMuted}
                playsInline
                controls
                style={{ width: '100%', maxHeight: 330, objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(5, 150, 105, 0.92)', color: '#fff',
                fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                letterSpacing: 0.5, textTransform: 'uppercase', backdropFilter: 'blur(4px)',
                pointerEvents: 'none',
              }}>
                🎬 Cinematic Temple Aerial & Sacred Gopuram
              </div>
              <button
                onClick={() => setHampiVideoMuted(!hampiVideoMuted)}
                style={{
                  position: 'absolute', bottom: 12, right: 12,
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.5)',
                  color: '#fff', borderRadius: 20, padding: '5px 12px',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)',
                }}
              >
                {hampiVideoMuted ? <><VolumeX size={14} /> Unmute Audio</> : <><Volume2 size={14} /> Sound Playing</>}
              </button>
            </div>

            {/* Classical Temple Dance Spotlight Section */}
            <div style={{
              background: 'rgba(5, 150, 105, 0.08)', border: '1.5px solid rgba(5, 150, 105, 0.3)',
              borderRadius: 14, padding: '16px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Sparkles size={18} style={{ color: '#059669' }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#059669', fontFamily: '"Cormorant Garamond", serif' }}>
                  Classical Temple Dance (Nritta & Natya Mudras)
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#1e1b15', lineHeight: 1.6, margin: 0 }}>
                In the 100-pillared Ranga Mantapa of Virupaksha Temple, classical Devadasi temple dancers performed sacred <strong>Nritta & Natya mudras</strong>—translating cosmic rhythmic vibrations into dance to invoke Lord Shiva's Nataraja form. The stone chariot and musical pillars echo these sacred dance cadences.
              </p>
            </div>

            {/* Temple Architecture & History Details */}
            <div style={{
              background: 'rgba(217, 87, 43, 0.06)', border: '1px solid rgba(217, 87, 43, 0.25)',
              borderRadius: 14, padding: '16px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#d9572b', marginBottom: 4 }}>
                🏛 Sacred Virupaksha Gopuram & Heritage
              </div>
              <p style={{ fontSize: 12, color: '#383126', lineHeight: 1.5, margin: 0 }}>
                Dating back to the 7th century, Virupaksha Temple stands on the sacred banks of the Tungabhadra River at Hampi. Featuring a towering 50-meter Gopuram, inverse pinhole camera projections, and sacred Shiva shrines, it remains an active uninterrupted place of worship for over 1,300 years.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
