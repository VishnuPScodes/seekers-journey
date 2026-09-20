import React, {
  useRef, useState, useMemo, Suspense, useCallback,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { LOCATIONS, getLevelProgress, getPointsToNextLevel } from '../utils/locations';
import { ChevronLeft, Star, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// 108 ANCHOR POINTS — flat top-down layout
// The path winds organically from South India (bottom, +z) to Kailash (top, -z)
// Spread across x: -55 to +55, z: -72 to +68
// ─────────────────────────────────────────────────────────────────────────────
const ANCHOR_XZ = [
  // Tamil Nadu 1-10 (south, center-right, saffron)
  [0, 66], [-5, 63], [2, 61], [6, 59], [4, 57],
  [13, 55], [19, 53], [30, 51], [23, 49], [9, 47],
  // Kerala & Karnataka 11-20 (southwest, emerald)
  [-9, 44], [-16, 42], [-15, 40], [-22, 37], [-26, 34],
  [-23, 31], [-19, 28], [-17, 25], [-30, 28], [-11, 23],
  // Andhra & Telangana 21-30 (southeast, yellow)
  [11, 23], [19, 26], [27, 29], [23, 22], [16, 19],
  [25, 16], [19, 12], [13, 15], [21, 20], [32, 31],
  // Maharashtra 31-40 (center, red)
  [6, 10], [1, 13], [3, 8], [-1, 6], [-9, 4],
  [-7, 2], [1, 4], [-4, 8], [-32, 18], [-13, 2],
  // MP & Rajasthan 41-50 (center-north, crimson)
  [-1, -2], [-5, -4], [6, -5], [13, -7], [19, -9],
  [3, -8], [-14, -3], [-17, 0], [-23, -5], [-21, -8],
  // Gujarat 51-60 (far west, amber)
  [-42, 4], [-40, 16], [-37, 10], [-32, -4], [-34, 4],
  [-30, 1], [-40, 12], [-29, -2], [-37, 6], [-44, 8],
  // Uttar Pradesh 61-70 (center-north, blue)
  [3, -11], [5, -13], [16, -15], [23, -17], [25, -19],
  [19, -18], [13, -15], [7, -18], [11, -23], [-1, -25],
  // Uttarakhand 71-80 (north, cyan)
  [-4, -28], [-6, -31], [-7, -33], [-9, -36], [-13, -38],
  [-7, -40], [-5, -43], [-1, -45], [6, -46], [9, -49],
  // High Himalayas 81-90 (northwest, violet)
  [6, -51], [9, -53], [11, -55], [13, -56], [16, -58],
  [23, -54], [29, -52], [33, -50], [39, -48], [46, -46],
  // Ladakh 91-100 (northeast, ice blue)
  [51, -48], [47, -50], [45, -52], [43, -46], [41, -44],
  [49, -54], [45, -56], [36, -58], [21, -60], [11, -62],
  // Kailash Approach 101-108 (gold)
  [6, -64], [3, -66], [1, -65], [0, -67],
  [0, -68], [-1, -67], [0, -70], [0, -72],
];

// Flat path points (y very slightly above ground)
const PATH_3D = ANCHOR_XZ.map(([x, z], i) => {
  return new THREE.Vector3(x, 0.05, z);
});

// ─────────────────────────────────────────────────────────────────────────────
// REGION CONFIG — color, label, range
// ─────────────────────────────────────────────────────────────────────────────
const REGIONS = [
  { name: 'Tamil Nadu',       range: [1, 10],   color: '#f97316', emissive: '#ea580c' },
  { name: 'Kerala/Karnataka', range: [11, 20],  color: '#10b981', emissive: '#059669' },
  { name: 'Andhra/Telangana', range: [21, 30],  color: '#eab308', emissive: '#ca8a04' },
  { name: 'Maharashtra',      range: [31, 40],  color: '#ef4444', emissive: '#dc2626' },
  { name: 'MP / Rajasthan',   range: [41, 50],  color: '#f43f5e', emissive: '#e11d48' },
  { name: 'Gujarat',          range: [51, 60],  color: '#fb923c', emissive: '#f97316' },
  { name: 'Uttar Pradesh',    range: [61, 70],  color: '#60a5fa', emissive: '#3b82f6' },
  { name: 'Uttarakhand',      range: [71, 80],  color: '#22d3ee', emissive: '#06b6d4' },
  { name: 'High Himalayas',   range: [81, 90],  color: '#a78bfa', emissive: '#7c3aed' },
  { name: 'Ladakh / Tibet',   range: [91, 100], color: '#38bdf8', emissive: '#0ea5e9' },
  { name: 'Kailash Approach', range: [101, 108],color: '#fbbf24', emissive: '#f59e0b' },
];

function getRegion(level) {
  return REGIONS.find(r => level >= r.range[0] && level <= r.range[1]) || REGIONS[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUND PLANE — subtle grid
// ─────────────────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#070d1a" roughness={1} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PILGRIMAGE PATH — TubeGeometry (thick 3D tubes, always visible)
// ─────────────────────────────────────────────────────────────────────────────
function PilgrimagePaths({ userLevel }) {
  const fullCurve = useMemo(
    () => new THREE.CatmullRomCurve3(PATH_3D, false, 'catmullrom', 0.5),
    [],
  );

  // Full dim tube
  const fullTubeGeo = useMemo(
    () => new THREE.TubeGeometry(fullCurve, 500, 0.55, 6, false),
    [fullCurve],
  );

  // Visited bright tube
  const visitedCurve = useMemo(() => {
    const count = Math.max(2, Math.round((userLevel / 108) * 108));
    const pts = PATH_3D.slice(0, count);
    if (pts.length < 2) return null;
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  }, [userLevel]);

  const visitedTubeGeo = useMemo(() => {
    if (!visitedCurve) return null;
    return new THREE.TubeGeometry(visitedCurve, 300, 0.9, 6, false);
  }, [visitedCurve]);

  return (
    <>
      {/* Dim full-path tube */}
      <mesh geometry={fullTubeGeo}>
        <meshStandardMaterial
          color="#1e3a5f"
          transparent
          opacity={0.55}
          roughness={1}
        />
      </mesh>

      {/* Bright visited tube */}
      {visitedTubeGeo && (
        <mesh geometry={visitedTubeGeo}>
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#7c3aed"
            emissiveIntensity={2.5}
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION DOT — flat disc, large enough to see from top
// ─────────────────────────────────────────────────────────────────────────────
function LocationDot({ location, position, isVisited, isSelected, onHover, onClick }) {
  const meshRef    = useRef();
  const [hovered, setHovered] = useState(false);
  const region     = getRegion(location.level);
  const isMilestone = location.level % 10 === 0;
  const isKailash  = location.level === 108;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (isSelected || isKailash) {
      const s = 1 + 0.18 * Math.sin(clock.getElapsedTime() * 3);
      meshRef.current.scale.setScalar(s);
    }
  });

  // Sizes — large enough to see from camera y=130
  const baseR = isKailash ? 5.0 : isMilestone ? 3.5 : 2.0;
  const r = hovered || isSelected ? baseR * 1.4 : baseR;

  const color    = isKailash ? '#fbbf24' : isVisited ? region.color : '#1e293b';
  const emissive = isKailash ? '#f59e0b' : isVisited ? region.emissive : '#0c1525';
  const emissInt = isKailash ? 5 : isVisited ? (isMilestone ? 3 : 1.8) : 0.15;

  return (
    <group position={[position.x, 0.06, position.z]}>
      {/* Soft glow halo */}
      {isVisited && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r * 2.0, 24]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={isKailash ? 0.22 : 0.12}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Ring for milestones */}
      {isMilestone && isVisited && !isKailash && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseR * 1.35, baseR * 1.65, 24]} />
          <meshStandardMaterial
            color={region.color}
            emissive={region.emissive}
            emissiveIntensity={2.5}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Main dot disc */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); onHover(location); document.body.style.cursor = 'pointer'; }}
        onPointerOut={e => { e.stopPropagation(); setHovered(false); onHover(null); document.body.style.cursor = 'auto'; }}
        onClick={e => { e.stopPropagation(); onClick(location); }}
      >
        <circleGeometry args={[r, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissInt}
          roughness={0.2}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point light on visited */}
      {isVisited && (
        <pointLight
          color={color}
          intensity={isMilestone ? 6 : 2}
          distance={isMilestone ? 8 : 4}
        />
      )}

      {/* Tooltip on hover or selected */}
      {(hovered || isSelected) && (
        <Html
          center
          position={[0, 0.5, -r - 1.5]}
          distanceFactor={60}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(4,8,20,0.95)',
            border: `1.5px solid ${isKailash ? '#fbbf24' : isVisited ? region.color : '#334155'}`,
            borderRadius: 10, padding: '6px 13px',
            textAlign: 'center', backdropFilter: 'blur(12px)',
            boxShadow: isVisited ? `0 0 16px ${region.color}44` : 'none',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isKailash ? '#fbbf24' : isVisited ? region.color : '#64748b', letterSpacing: 0.3 }}>
              {isKailash ? '🏔 ' : ''}{location.name}
            </div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
              {location.region} · Pt {location.level}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PILGRIM — simple large pulsing disc
// ─────────────────────────────────────────────────────────────────────────────
function PilgrimFigure({ position }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const s = 1 + 0.2 * Math.sin(clock.getElapsedTime() * 3);
    meshRef.current.scale.setScalar(s);
  });

  return (
    <group position={[position.x, 0.12, position.z]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 32]} />
        <meshStandardMaterial
          color="#c4b5fd"
          emissive="#8b5cf6"
          emissiveIntensity={6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#8b5cf6" intensity={30} distance={15} />
      <Html center position={[0, 0.3, -5.5]} distanceFactor={70} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(4,8,20,0.92)',
          border: '1.5px solid rgba(167,139,250,0.7)',
          borderRadius: 8, padding: '3px 10px',
          fontSize: 11, fontWeight: 700, color: '#c4b5fd',
          whiteSpace: 'nowrap', backdropFilter: 'blur(8px)',
          boxShadow: '0 0 14px rgba(124,58,237,0.5)',
        }}>
          ✨ You are here
        </div>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KAILASH PEAK — top-down golden beacon at the top
// ─────────────────────────────────────────────────────────────────────────────
function KailashMarker({ position }) {
  const ringRef = useRef();
  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.rotation.z = clock.getElapsedTime() * 0.6;
  });

  return (
    <group position={[position.x, position.y + 0.1, position.z]}>
      {/* Outer golden glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 32]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner gold ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 3.0, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={5} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Core disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.0, 32]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={6} side={THREE.DoubleSide} />
      </mesh>
      {/* A small upright cone seen from top */}
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.9, 2.0, 6]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={3} metalness={0.7} roughness={0.1} />
      </mesh>
      <pointLight color="#fbbf24" intensity={40} distance={22} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGION LABELS — Html overlays (no font loading needed)
// ─────────────────────────────────────────────────────────────────────────────
const REGION_LABEL_POS = [
  { label: 'Tamil Nadu',      x: 10,  z: 60,  color: '#f97316' },
  { label: 'Kerala/Karnataka',x: -25, z: 32,  color: '#10b981' },
  { label: 'Andhra/Telangana',x: 28,  z: 22,  color: '#eab308' },
  { label: 'Maharashtra',     x: -15, z: 6,   color: '#ef4444' },
  { label: 'MP / Rajasthan',  x: 2,   z: -7,  color: '#f43f5e' },
  { label: 'Gujarat',         x: -48, z: 10,  color: '#fb923c' },
  { label: 'Uttar Pradesh',   x: 14,  z: -17, color: '#60a5fa' },
  { label: 'Uttarakhand',     x: -18, z: -38, color: '#22d3ee' },
  { label: 'Himalayas',       x: 15,  z: -54, color: '#a78bfa' },
  { label: 'Ladakh',          x: 48,  z: -50, color: '#38bdf8' },
  { label: 'Tibet / Kailash', x: 0,   z: -75, color: '#fbbf24' },
];

function RegionLabels() {
  return (
    <>
      {REGION_LABEL_POS.map((r, i) => (
        <Html
          key={i}
          position={[r.x, 0.1, r.z]}
          center
          distanceFactor={80}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            fontSize: 11, fontWeight: 700, color: r.color,
            opacity: 0.28, whiteSpace: 'nowrap', letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            {r.label}
          </div>
        </Html>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA — top-down setup (runs once on mount via useEffect)
// ─────────────────────────────────────────────────────────────────────────────
function TopDownCamera() {
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.set(0, 130, 0);  // lower = everything appears larger
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL SCENE
// ─────────────────────────────────────────────────────────────────────────────
function Scene({ userLevel, selectedLevel, onHoverDot, onClickDot }) {
  const pilgrimPos = PATH_3D[Math.max(0, userLevel - 1)];
  const kailashPos = PATH_3D[107];

  return (
    <>
      <ambientLight intensity={0.5} color="#0f172a" />
      <directionalLight position={[0, 50, -30]} intensity={0.8} color="#a78bfa" />
      <pointLight position={[0, 30, 0]} intensity={10} color="#1e1040" />

      <TopDownCamera />
      <Stars radius={200} depth={30} count={4000} factor={2} saturation={0} fade speed={0.2} />
      <Ground />
      <PilgrimagePaths userLevel={userLevel} />
      <RegionLabels />

      {/* 108 dots */}
      {LOCATIONS.map((loc, i) => {
        if (loc.level === 108) return null; // Kailash rendered separately
        return (
          <LocationDot
            key={loc.level}
            location={loc}
            position={PATH_3D[i]}
            isVisited={loc.level <= userLevel}
            isSelected={loc.level === selectedLevel}
            onHover={onHoverDot}
            onClick={onClickDot}
          />
        );
      })}

      {/* Kailash */}
      <KailashMarker position={kailashPos} />

      {/* Pilgrim */}
      <PilgrimFigure position={pilgrimPos} />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={15}
        maxDistance={280}
        maxPolarAngle={Math.PI * 0.28}  // can tilt slightly to see depth
        minPolarAngle={0}
        enableDamping
        dampingFactor={0.07}
        screenSpacePanning
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGEND
// ─────────────────────────────────────────────────────────────────────────────
function Legend({ userLevel }) {
  return (
    <div style={{
      position: 'absolute', top: 70, right: 12, zIndex: 10,
      background: 'rgba(5,10,22,0.88)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '10px 12px', backdropFilter: 'blur(10px)',
      maxWidth: 145,
    }}>
      <div style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, fontWeight: 600 }}>
        Regions
      </div>
      {REGIONS.map(r => {
        const visited = userLevel >= r.range[0];
        return (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, opacity: visited ? 1 : 0.4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0, boxShadow: visited ? `0 0 5px ${r.color}` : 'none' }} />
            <span style={{ fontSize: 9.5, color: visited ? '#c4b5fd' : '#374151', fontWeight: visited ? 600 : 400 }}>
              {r.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function KailashJourney() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const userLevel   = user?.currentLevel || 1;
  const totalScore  = user?.totalCumulativeScore || 0;
  const levelPct    = Math.round(getLevelProgress(totalScore) * 100);
  const pointsToNext = getPointsToNextLevel(totalScore);

  const [selectedLevel, setSelectedLevel] = useState(userLevel);
  const [hoveredLoc,    setHoveredLoc]    = useState(null);

  const selectedLoc = useMemo(
    () => LOCATIONS.find(l => l.level === selectedLevel) || LOCATIONS[0],
    [selectedLevel],
  );
  const nextLoc = useMemo(
    () => LOCATIONS.find(l => l.level === Math.min(userLevel + 1, 108)) || LOCATIONS[107],
    [userLevel],
  );
  const selRegion = getRegion(selectedLevel);

  const handleHoverDot = useCallback(loc => setHoveredLoc(loc), []);
  const handleClickDot = useCallback(loc => setSelectedLevel(loc.level), []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050a16', position: 'relative', overflow: 'hidden' }}>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 180, 0], fov: 55, near: 0.1, far: 600, up: [0, 0, -1] }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene
            userLevel={userLevel}
            selectedLevel={selectedLevel}
            onHoverDot={handleHoverDot}
            onClickDot={handleClickDot}
          />
        </Suspense>
      </Canvas>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(5,10,22,0.95) 0%, transparent 100%)',
        padding: '12px 14px 28px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          id="journey-back-btn"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa', borderRadius: 10, padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: 5,
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: '#a78bfa', textTransform: 'uppercase' }}>
            🏔 Kailash Journey
          </div>
          <div style={{ fontSize: 10, color: '#374151', marginTop: 1 }}>
            Scroll to zoom · Drag to pan · Hover to explore
          </div>
        </div>

        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 10, padding: '5px 11px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Star size={11} style={{ color: '#fbbf24' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', fontFamily: 'Cinzel, serif' }}>
            {totalScore}
          </span>
        </div>
      </div>

      {/* Legend */}
      <Legend userLevel={userLevel} />

      {/* Bottom HUD */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(to top, rgba(5,10,22,0.97) 0%, rgba(5,10,22,0.6) 70%, transparent 100%)',
        padding: '14px 14px 18px',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* Selected location */}
          <div style={{
            background: 'rgba(8,14,28,0.9)',
            border: `1px solid ${selectedLevel === 108 ? 'rgba(251,191,36,0.4)' : `${selRegion.color}44`}`,
            borderRadius: 13, padding: '10px 13px', marginBottom: 9,
            backdropFilter: 'blur(14px)',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9, flexShrink: 0,
              background: `${selRegion.color}15`,
              border: `1px solid ${selRegion.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {selectedLevel === 108 ? '🏔' : selectedLevel === userLevel ? '🧘' : selectedLevel < userLevel ? '✅' : '🔒'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: selectedLevel <= userLevel ? selRegion.color : '#4b6080' }}>
                  {selectedLoc.name}
                </span>
                <span style={{
                  fontSize: 9, padding: '1px 6px', borderRadius: 20, fontWeight: 600,
                  background: `${selRegion.color}20`, color: selRegion.color,
                }}>
                  Pt {selectedLevel}
                </span>
                {selectedLevel === userLevel && (
                  <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>← You are here</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#374151', marginBottom: 2 }}>
                <MapPin size={8} style={{ display: 'inline', marginRight: 3 }} />{selectedLoc.region}
              </div>
              <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.5 }}>{selectedLoc.desc}</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{
              background: 'rgba(8,14,28,0.8)', border: '1px solid rgba(109,40,217,0.28)',
              borderRadius: 9, padding: '7px 12px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#a78bfa', fontFamily: 'Cinzel, serif', lineHeight: 1 }}>
                {userLevel}
              </div>
              <div style={{ fontSize: 8, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>Level</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10, color: '#374151' }}>
                <span>Progress</span>
                <span style={{ color: '#a78bfa', fontWeight: 600 }}>{levelPct}%</span>
              </div>
              <div style={{ background: 'rgba(8,14,28,0.7)', borderRadius: 100, height: 5, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  width: `${levelPct}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: '#374151' }}>
                {userLevel < 108
                  ? <>{pointsToNext} pts → <span style={{ color: '#a78bfa', fontWeight: 600 }}>{nextLoc.name}</span></>
                  : <span style={{ color: '#fbbf24', fontWeight: 600 }}>🏔 Kailash reached!</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
