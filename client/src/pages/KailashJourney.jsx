import React, { useRef, useState, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { LOCATIONS, getLevelProgress, getPointsToNextLevel } from '../utils/locations';
import { ChevronLeft, Star, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── 108 anchor points — laid flat on the XZ plane ───────────────────────────
// Path goes from South India (z=+60, bottom of top-down view) to Kailash (z=-65, top)
// X: west(-) to east(+). Scale kept tight so everything fits on screen.
const ANCHORS = [
  // Tamil Nadu 1-10
  [0,60],[-4,57],[2,55],[5,53],[3,51],[11,49],[17,47],[26,45],[20,43],[8,41],
  // Kerala & Karnataka 11-20
  [-8,39],[-14,37],[-13,35],[-19,32],[-23,30],[-20,27],[-17,24],[-15,21],[-26,24],[-10,19],
  // Andhra & Telangana 21-30
  [10,19],[17,22],[24,25],[20,18],[14,16],[22,13],[17,10],[12,13],[19,17],[28,27],
  // Maharashtra 31-40
  [5,8],[1,11],[2,6],[-1,4],[-8,2],[-6,0],[1,2],[-3,6],[-28,15],[-11,0],
  // MP & Rajasthan 41-50
  [-1,-4],[-4,-6],[5,-7],[11,-9],[17,-11],[2,-10],[-12,-5],[-15,-2],[-20,-7],[-18,-10],
  // Gujarat 51-60
  [-36,2],[-34,13],[-32,8],[-27,-6],[-29,2],[-26,-1],[-34,10],[-25,-4],[-32,4],[-38,6],
  // Uttar Pradesh 61-70
  [2,-13],[4,-15],[14,-17],[20,-19],[22,-21],[17,-20],[11,-17],[6,-20],[9,-25],[-1,-27],
  // Uttarakhand 71-80
  [-3,-30],[-5,-33],[-6,-35],[-8,-38],[-11,-40],[-6,-42],[-4,-45],[0,-47],[5,-48],[8,-51],
  // High Himalayas 81-90
  [5,-53],[8,-55],[10,-57],[12,-58],[14,-60],[20,-56],[26,-54],[30,-52],[36,-50],[42,-48],
  // Ladakh 91-100
  [47,-50],[43,-52],[41,-54],[39,-48],[37,-46],[45,-56],[41,-58],[32,-60],[18,-62],[9,-64],
  // Kailash Approach 101-108
  [5,-66],[2,-68],[0,-67],[0,-69],[0,-70],[-1,-69],[0,-71],[0,-65],
];

// Convert to THREE.Vector3 — completely flat at y=0
const PATH_PTS = ANCHORS.map(([x, z]) => new THREE.Vector3(x, 0, z));

// ─── Region color config ──────────────────────────────────────────────────────
const REGIONS = [
  { range:[1,10],   color:'#fb923c' }, // Tamil Nadu — orange
  { range:[11,20],  color:'#34d399' }, // Kerala/Karnataka — emerald
  { range:[21,30],  color:'#fbbf24' }, // Andhra — yellow
  { range:[31,40],  color:'#f87171' }, // Maharashtra — red
  { range:[41,50],  color:'#fb7185' }, // MP/Rajasthan — rose
  { range:[51,60],  color:'#fdba74' }, // Gujarat — amber
  { range:[61,70],  color:'#60a5fa' }, // Uttar Pradesh — blue
  { range:[71,80],  color:'#67e8f9' }, // Uttarakhand — cyan
  { range:[81,90],  color:'#c084fc' }, // Himalayas — violet
  { range:[91,100], color:'#7dd3fc' }, // Ladakh — sky
  { range:[101,108],color:'#fde68a' }, // Kailash — gold
];
function getColor(level) {
  return (REGIONS.find(r => level >= r.range[0] && level <= r.range[1]) || REGIONS[0]).color;
}

// ─── PATH TUBE — thick, always visible (meshBasicMaterial = no lighting needed)
function PathTube({ userLevel }) {
  const fullCurve = useMemo(
    () => new THREE.CatmullRomCurve3(PATH_PTS, false, 'catmullrom', 0.5), []
  );

  // Dim full-path tube
  const dimGeo = useMemo(
    () => new THREE.TubeGeometry(fullCurve, 600, 0.8, 8, false), [fullCurve]
  );

  // Bright visited tube
  const visitedPts = useMemo(() => PATH_PTS.slice(0, Math.max(2, userLevel)), [userLevel]);
  const visitedCurve = useMemo(
    () => new THREE.CatmullRomCurve3(visitedPts, false, 'catmullrom', 0.5),
    [visitedPts]
  );
  const visitedGeo = useMemo(
    () => new THREE.TubeGeometry(visitedCurve, Math.max(4, userLevel * 5), 1.4, 8, false),
    [visitedCurve, userLevel]
  );

  return (
    <>
      {/* Full path — visible slate */}
      <mesh geometry={dimGeo}>
        <meshBasicMaterial color="#475569" transparent opacity={0.9} />
      </mesh>
      {/* Visited path — bright lavender */}
      <mesh geometry={visitedGeo} position={[0, 0.05, 0]}>
        <meshBasicMaterial color="#a78bfa" />
      </mesh>
    </>
  );
}

// ─── LOCATION DOT ─────────────────────────────────────────────────────────────
function Dot({ loc, userLevel, isSelected, onHover, onClick }) {
  const discRef   = useRef();
  const ringRef   = useRef();
  const [hovered, setHovered] = useState(false);

  const isVisited   = loc.level <= userLevel;
  const isMilestone = loc.level % 10 === 0;
  const isKailash   = loc.level === 108;
  const isCurrent   = loc.level === userLevel;

  const col = isKailash ? '#fde68a' : isVisited ? getColor(loc.level) : '#334155';
  const baseR = isKailash ? 5.5 : isMilestone ? 4.0 : 2.8;
  const r = (hovered || isSelected) ? baseR * 1.45 : baseR;

  // Pulse animation for current + Kailash
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if ((isCurrent || isKailash) && discRef.current) {
      const s = 1 + 0.22 * Math.sin(t * 3.0);
      discRef.current.scale.setScalar(s);
    }
    if (isKailash && ringRef.current) {
      ringRef.current.rotation.z = t * 0.7;
    }
  });

  const pt = PATH_PTS[loc.level - 1];

  return (
    <group position={[pt.x, 0.1, pt.z]}>
      {/* Soft halo behind dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 1.8, 24]} />
        <meshBasicMaterial
          color={col}
          transparent
          opacity={isVisited ? (isKailash ? 0.22 : 0.14) : 0.06}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Milestone outer ring */}
      {(isMilestone || isKailash) && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r * 1.1, r * 1.45, 28]} />
          <meshBasicMaterial
            color={col}
            transparent
            opacity={isVisited ? 0.85 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Main dot */}
      <mesh
        ref={discRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); onHover(loc); document.body.style.cursor = 'pointer'; }}
        onPointerOut={e => { e.stopPropagation(); setHovered(false); onHover(null); document.body.style.cursor = 'auto'; }}
        onClick={e => { e.stopPropagation(); onClick(loc); }}
      >
        <circleGeometry args={[r, 24]} />
        <meshBasicMaterial color={col} side={THREE.DoubleSide} transparent opacity={isVisited ? 1 : 0.45} />
      </mesh>

      {/* Hover / selected tooltip */}
      {(hovered || isSelected) && (
        <Html center position={[0, 0.2, -(r + 2)]} distanceFactor={55} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(3,7,18,0.95)',
            border: `2px solid ${col}`,
            borderRadius: 10, padding: '5px 13px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 18px ${col}66`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: col, letterSpacing: 0.5 }}>
              {isKailash ? '🏔 ' : ''}{loc.name}
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
              {loc.region} · Pt {loc.level}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── PILGRIM MARKER — large, unmissable pulsing beacon ───────────────────────
function Pilgrim({ userLevel }) {
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outerRef.current) {
      const s = 1 + 0.28 * Math.sin(t * 2.5);
      outerRef.current.scale.setScalar(s);
      outerRef.current.material.opacity = 0.3 + 0.2 * Math.sin(t * 2.5);
    }
    if (innerRef.current) {
      innerRef.current.rotation.z = t * 1.2;
    }
  });

  const pt = PATH_PTS[Math.max(0, userLevel - 1)];

  return (
    <group position={[pt.x, 0.2, pt.z]}>
      {/* Outer pulsing aura */}
      <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 32]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Spinning dashed ring */}
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 7.0, 40]} />
        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Bright solid inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 4.8, 32]} />
        <meshBasicMaterial color="#e0e7ff" side={THREE.DoubleSide} />
      </mesh>

      {/* Core white dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 28]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* "You are here" label */}
      <Html center position={[0, 0.3, -10]} distanceFactor={65} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(3,7,18,0.95)',
          border: '2px solid #a5b4fc',
          borderRadius: 8, padding: '4px 12px',
          fontSize: 11, fontWeight: 800, color: '#e0e7ff',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 18px #818cf899',
          letterSpacing: 0.5,
        }}>
          ✦ You are here
        </div>
      </Html>
    </group>
  );
}

// ─── KAILASH BEACON — golden, distinct, at the top ───────────────────────────
function KailashBeacon() {
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1.current) ring1.current.rotation.z =  t * 0.6;
    if (ring2.current) ring2.current.rotation.z = -t * 0.4;
  });

  const pt = PATH_PTS[107];

  return (
    <group position={[pt.x, 0.25, pt.z]}>
      {/* Wide glow halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[16, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer spinning ring */}
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.5, 10.5, 40]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner spinning ring (opposite) */}
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 7.5, 32]} />
        <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
      </mesh>

      {/* Core gold */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 28]} />
        <meshBasicMaterial color="#fffbeb" side={THREE.DoubleSide} />
      </mesh>

      {/* Kailash label */}
      <Html center position={[0, 0.3, -13]} distanceFactor={65} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(3,7,18,0.95)',
          border: '2px solid #fbbf24',
          borderRadius: 8, padding: '4px 14px',
          fontSize: 12, fontWeight: 900, color: '#fde68a',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 22px #fbbf2466',
          letterSpacing: 1,
        }}>
          🏔 Kailash
        </div>
      </Html>
    </group>
  );
}

// ─── REGION LABELS — HTML overlays at key positions ──────────────────────────
const LABEL_POS = [
  { text: 'TAMIL NADU',      x:14,  z:55,  col:'#fb923c' },
  { text: 'KERALA',          x:-23, z:30,  col:'#34d399' },
  { text: 'ANDHRA',          x:25,  z:20,  col:'#fbbf24' },
  { text: 'MAHARASHTRA',     x:-12, z:5,   col:'#f87171' },
  { text: 'RAJASTHAN',       x:-20, z:-4,  col:'#fb7185' },
  { text: 'GUJARAT',         x:-40, z:8,   col:'#fdba74' },
  { text: 'UTTAR PRADESH',   x:14,  z:-18, col:'#60a5fa' },
  { text: 'UTTARAKHAND',     x:-15, z:-38, col:'#67e8f9' },
  { text: 'HIMALAYAS',       x:14,  z:-55, col:'#c084fc' },
  { text: 'LADAKH',          x:44,  z:-52, col:'#7dd3fc' },
  { text: 'TIBET',           x:5,   z:-67, col:'#fde68a' },
];

function RegionLabels() {
  return (
    <>
      {LABEL_POS.map((r, i) => (
        <Html key={i} position={[r.x, 0.1, r.z]} center distanceFactor={90} style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: r.col, opacity: 0.45, letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
            {r.text}
          </div>
        </Html>
      ))}
    </>
  );
}

// ─── GROUND ───────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
      <planeGeometry args={[300, 300]} />
      <meshBasicMaterial color="#0a1628" />
    </mesh>
  );
}

// ─── CAMERA INIT ──────────────────────────────────────────────────────────────
function CameraInit() {
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.set(0, 145, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ─── SCENE ────────────────────────────────────────────────────────────────────
function Scene({ userLevel, selectedLevel, onHover, onClick }) {
  return (
    <>
      <Ground />
      <PathTube userLevel={userLevel} />

      {/* All 107 dots (Kailash rendered separately) */}
      {LOCATIONS.filter(l => l.level < 108).map(loc => (
        <Dot
          key={loc.level}
          loc={loc}
          userLevel={userLevel}
          isSelected={loc.level === selectedLevel}
          onHover={onHover}
          onClick={onClick}
        />
      ))}

      <KailashBeacon />
      <Pilgrim userLevel={userLevel} />
      <RegionLabels />

      <CameraInit />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={12}
        maxDistance={300}
        maxPolarAngle={Math.PI * 0.22}
        minPolarAngle={0}
        enableDamping
        dampingFactor={0.06}
        screenSpacePanning
      />
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function KailashJourney() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const userLevel    = user?.currentLevel || 1;
  const totalScore   = user?.totalCumulativeScore || 0;
  const levelPct     = Math.round(getLevelProgress(totalScore) * 100);
  const pointsToNext = getPointsToNextLevel(totalScore);

  const [selectedLevel, setSelectedLevel] = useState(userLevel);
  const selectedLoc = useMemo(() => LOCATIONS.find(l => l.level === selectedLevel) || LOCATIONS[0], [selectedLevel]);
  const nextLoc     = useMemo(() => LOCATIONS.find(l => l.level === Math.min(userLevel + 1, 108)) || LOCATIONS[107], [userLevel]);
  const selCol      = getColor(selectedLevel);

  const handleHover = useCallback(loc => {}, []);
  const handleClick = useCallback(loc => setSelectedLevel(loc.level), []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a1628', position: 'relative', overflow: 'hidden' }}>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 145, 0], fov: 52, near: 0.1, far: 600, up: [0, 0, -1] }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene
            userLevel={userLevel}
            selectedLevel={selectedLevel}
            onHover={handleHover}
            onClick={handleClick}
          />
        </Suspense>
      </Canvas>

      {/* ── Top Bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(10,22,40,0.97) 0%, transparent 100%)',
        padding: '12px 14px 30px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          id="journey-back-btn"
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(165,180,252,0.4)',
            color: '#a5b4fc', borderRadius: 10, padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: 5,
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: '#a5b4fc', textTransform: 'uppercase' }}>
            🏔 Kailash Journey
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
            Scroll to zoom · Drag to pan · Hover dots to explore
          </div>
        </div>

        <div style={{
          background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)',
          borderRadius: 10, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Star size={12} style={{ color: '#fbbf24' }} />
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>{totalScore}</span>
        </div>
      </div>

      {/* ── Region legend ── */}
      <div style={{
        position: 'absolute', top: 64, right: 12, zIndex: 10,
        background: 'rgba(10,22,40,0.92)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '10px 12px', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, fontWeight: 700 }}>Path</div>
        {REGIONS.map(r => (
          <div key={r.range[0]} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0, boxShadow: `0 0 6px ${r.color}88` }} />
            <span style={{ fontSize: 9.5, color: userLevel >= r.range[0] ? '#c7d2fe' : '#334155', fontWeight: userLevel >= r.range[0] ? 700 : 400 }}>
              {LOCATIONS.find(l => l.level === r.range[0])?.region || ''}
            </span>
          </div>
        ))}
      </div>

      {/* ── Bottom HUD ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(to top, rgba(10,22,40,0.98) 0%, rgba(10,22,40,0.7) 70%, transparent 100%)',
        padding: '14px 14px 18px',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* Selected location card */}
          <div style={{
            background: 'rgba(15,28,52,0.9)',
            border: `2px solid ${selCol}44`,
            borderRadius: 14, padding: '11px 14px', marginBottom: 10,
            display: 'flex', gap: 11, alignItems: 'center',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${selCol}18`, border: `2px solid ${selCol}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>
              {selectedLevel === 108 ? '🏔' : selectedLevel === userLevel ? '🧘' : selectedLevel < userLevel ? '✅' : '🔒'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: selectedLevel <= userLevel ? selCol : '#475569' }}>
                  {selectedLoc.name}
                </span>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: `${selCol}22`, color: selCol }}>
                  Pt {selectedLevel}
                </span>
                {selectedLevel === userLevel && <span style={{ fontSize: 9, color: '#a5b4fc', fontWeight: 800 }}>← You</span>}
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>
                <MapPin size={8} style={{ display: 'inline', marginRight: 3 }} />{selectedLoc.region}
              </div>
              <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.5 }}>{selectedLoc.desc}</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{
              background: 'rgba(15,28,52,0.8)', border: '2px solid rgba(165,180,252,0.25)',
              borderRadius: 10, padding: '7px 13px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#a5b4fc', lineHeight: 1 }}>{userLevel}</div>
              <div style={{ fontSize: 8, color: '#334155', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 1 }}>Level</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 10, color: '#475569' }}>
                <span>To next point</span>
                <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{levelPct}%</span>
              </div>
              <div style={{ background: 'rgba(15,28,52,0.8)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 100, background: 'linear-gradient(90deg,#6366f1,#a5b4fc)', width:`${levelPct}%`, transition:'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                {userLevel < 108
                  ? <>{pointsToNext} pts → <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{nextLoc.name}</span></>
                  : <span style={{ color: '#fbbf24', fontWeight: 700 }}>🏔 Kailash reached!</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
