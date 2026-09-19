import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html, Float, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { LOCATIONS, getLocation, getLevelProgress, getPointsToNextLevel } from '../utils/locations';
import { Mountain, ChevronLeft, ChevronRight, Info, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Utility: Generate 3D path through 108 points ─────────────────────────────
function generatePath() {
  const points = [];
  for (let i = 0; i < 108; i++) {
    const t = i / 107;
    // Winding path that spirals upward toward Kailash
    const angle = t * Math.PI * 6; // 3 full spirals
    const radius = 18 - t * 12;    // path narrows as it goes up
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = t * 30 - 15;         // rises from -15 to +15
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

const PATH_POINTS = generatePath();

// ─── Skybox ───────────────────────────────────────────────────────────────────
function SkyGradient() {
  return (
    <mesh scale={[200, 200, 200]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#0a0618" side={THREE.BackSide} />
    </mesh>
  );
}

// ─── The Path Tube ────────────────────────────────────────────────────────────
function PilgrimagePath({ userLevel }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(PATH_POINTS), []);

  // Completed path (glow color up to user's level)
  const completedPoints = useMemo(() => {
    const ratio = (userLevel - 1) / 107;
    const count = Math.max(2, Math.round(ratio * PATH_POINTS.length));
    return curve.getPoints(200).slice(0, Math.round((userLevel / 108) * 200));
  }, [userLevel, curve]);

  // Full path (dim)
  const allPoints = useMemo(() => curve.getPoints(400), [curve]);

  return (
    <>
      {/* Full path — faint */}
      <Line
        points={allPoints}
        color="#2d1b4e"
        lineWidth={2}
        transparent
        opacity={0.4}
      />
      {/* Completed path — glowing */}
      {completedPoints.length > 1 && (
        <Line
          points={completedPoints}
          color="#8b5cf6"
          lineWidth={4}
          transparent
          opacity={0.9}
        />
      )}
    </>
  );
}

// ─── A single location node ───────────────────────────────────────────────────
function LocationNode({ location, isActive, isCurrent, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isCurrent) {
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }
  });

  const pos = PATH_POINTS[location.level - 1];
  const isKailash = location.level === 108;

  const color = isKailash
    ? '#fbbf24'
    : isCurrent
    ? '#a78bfa'
    : isActive
    ? '#6d28d9'
    : '#1e0f3a';

  const emissive = isKailash
    ? '#f59e0b'
    : isCurrent
    ? '#7c3aed'
    : isActive
    ? '#4c1d95'
    : '#0a0618';

  const size = isKailash ? 0.9 : isCurrent ? 0.65 : isActive ? 0.35 : 0.2;

  return (
    <group position={[pos.x, pos.y, pos.z]} onClick={() => onClick(location)}>
      {/* Node sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? size * 1.3 : size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isCurrent ? 2.5 : isKailash ? 3 : isActive ? 1.2 : 0.3}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Kailash glow ring */}
      {isKailash && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.4, 0.08, 8, 32]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={4} />
        </mesh>
      )}

      {/* Point light for active/current nodes */}
      {(isCurrent || isKailash) && (
        <pointLight
          color={isCurrent ? '#8b5cf6' : '#fbbf24'}
          intensity={isCurrent ? 8 : 15}
          distance={12}
        />
      )}

      {/* HTML label — shown on hover or for current/Kailash */}
      {(hovered || isCurrent || isKailash) && (
        <Html
          center
          distanceFactor={30}
          position={[0, size + 1.2, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: isKailash
              ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))'
              : 'rgba(10, 6, 24, 0.88)',
            border: `1px solid ${isKailash ? 'rgba(251,191,36,0.5)' : isCurrent ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10,
            padding: '6px 12px',
            minWidth: 120,
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
            boxShadow: isCurrent ? '0 0 20px rgba(139,92,246,0.3)' : isKailash ? '0 0 30px rgba(251,191,36,0.4)' : 'none',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isKailash ? '#fbbf24' : isCurrent ? '#a78bfa' : '#e5e7eb', letterSpacing: 0.5 }}>
              {isKailash ? '🏔 ' : isCurrent ? '✨ ' : ''}{location.name}
            </div>
            <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
              Level {location.level} · {location.region}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Seeker Avatar (animated sphere traveling the path) ───────────────────────
function SeekerAvatar({ userLevel }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const pos = PATH_POINTS[Math.max(0, userLevel - 1)];

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 2;
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.4 + Math.sin(Date.now() * 0.004) * 0.25;
    }
  });

  return (
    <group position={[pos.x, pos.y + 0.5, pos.z]}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#a78bfa" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 20, 20]} />
        <meshStandardMaterial
          color="#c4b5fd"
          emissive="#7c3aed"
          emissiveIntensity={3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      {/* Trail ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.04, 8, 32]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#6d28d9" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#8b5cf6" intensity={6} distance={8} />
    </group>
  );
}

// ─── Camera Auto-fly to User Position ─────────────────────────────────────────
function CameraRig({ userLevel, targetLevel }) {
  const { camera } = useThree();
  const targetPos = PATH_POINTS[Math.max(0, targetLevel - 1)];

  useFrame(() => {
    const target = new THREE.Vector3(targetPos.x, targetPos.y + 5, targetPos.z + 20);
    camera.position.lerp(target, 0.015);
    camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
  });

  return null;
}

// ─── Mountain range backdrop ──────────────────────────────────────────────────
function Mountains() {
  const peaks = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: (Math.random() - 0.5) * 80,
      z: (Math.random() - 0.5) * 80 - 20,
      height: Math.random() * 15 + 5,
      radius: Math.random() * 4 + 2,
    }));
  }, []);

  return (
    <>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, -15 + p.height / 2, p.z]}>
          <coneGeometry args={[p.radius, p.height, 6]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#1e1040' : i % 3 === 1 ? '#160b30' : '#12082a'}
            roughness={1}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── The main 3D Scene ─────────────────────────────────────────────────────────
function Scene({ userLevel, viewingLevel, onSelectNode }) {
  return (
    <>
      <SkyGradient />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.4} color="#2d1b4e" />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#c4b5fd" />
      <pointLight position={[0, 15, 0]} intensity={20} color="#fbbf24" distance={40} />

      <Mountains />
      <PilgrimagePath userLevel={userLevel} />

      {/* Render all 108 nodes — only nearby ones are detailed */}
      {LOCATIONS.map(loc => (
        <LocationNode
          key={loc.level}
          location={loc}
          isActive={loc.level <= userLevel}
          isCurrent={loc.level === userLevel}
          onClick={onSelectNode}
        />
      ))}

      <SeekerAvatar userLevel={userLevel} />
      <CameraRig userLevel={userLevel} targetLevel={viewingLevel} />
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={60}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function KailashJourney() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userLevel = user?.currentLevel || 1;
  const totalScore = user?.totalCumulativeScore || 0;
  const [viewingLevel, setViewingLevel] = useState(userLevel);
  const [selectedLocation, setSelectedLocation] = useState(getLocation(userLevel));
  const [showInfo, setShowInfo] = useState(false);
  const levelProgress = getLevelProgress(totalScore);
  const pointsToNext = getPointsToNextLevel(totalScore);

  const handleSelectNode = (location) => {
    setViewingLevel(location.level);
    setSelectedLocation(location);
  };

  const currentLoc = getLocation(userLevel);
  const nextLoc = getLocation(Math.min(userLevel + 1, 108));

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0618', position: 'relative', overflow: 'hidden' }}>

      {/* ── 3D Canvas ── */}
      <Canvas
        camera={{ position: [0, 5, 25], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene
            userLevel={userLevel}
            viewingLevel={viewingLevel}
            onSelectNode={handleSelectNode}
          />
        </Suspense>
      </Canvas>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate('/')}
        id="journey-back-btn"
        style={{
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(10,6,24,0.7)', border: '1px solid rgba(139,92,246,0.3)',
          color: '#c4b5fd', borderRadius: 12, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          backdropFilter: 'blur(12px)', fontSize: 13, fontWeight: 600,
          zIndex: 10,
        }}
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* ── Title ── */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: '#a78bfa', textTransform: 'uppercase' }}>
          🏔 Kailash Journey
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Level {userLevel} / 108
        </div>
      </div>

      {/* ── Bottom HUD ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(10,6,24,0.98) 0%, rgba(10,6,24,0.6) 80%, transparent 100%)',
        padding: '28px 20px 32px',
        zIndex: 10,
      }}>

        {/* Current location info */}
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* Selected node info */}
          {selectedLocation && (
            <div style={{
              background: 'rgba(20, 12, 40, 0.7)', border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 16, padding: '14px 18px', marginBottom: 14,
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${selectedLocation.color}33, ${selectedLocation.color}11)`,
                border: `1px solid ${selectedLocation.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {selectedLocation.level === 108 ? '🏔' : selectedLocation.level <= userLevel ? '✨' : '🔒'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb', marginBottom: 2 }}>
                  {selectedLocation.level === userLevel ? 'You are here: ' : selectedLocation.level < userLevel ? 'Visited: ' : 'Upcoming: '}
                  {selectedLocation.name}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                  {selectedLocation.region} · Level {selectedLocation.level}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>
                  {selectedLocation.desc}
                </div>
              </div>
            </div>
          )}

          {/* Score + progress */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            {/* Level badge */}
            <div style={{
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 14, padding: '12px 18px', textAlign: 'center', flexShrink: 0, minWidth: 80,
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa', fontFamily: 'Cinzel, serif', lineHeight: 1 }}>
                {userLevel}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Level</div>
            </div>

            {/* Progress & score */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{currentLoc.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={11} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', fontFamily: 'Cinzel, serif' }}>{totalScore}</span>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>pts</span>
                </div>
              </div>

              {/* Progress bar to next level */}
              <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: 100, height: 6, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  width: `${levelProgress * 100}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {userLevel < 108 ? (
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  {pointsToNext} pts to reach <span style={{ color: '#a78bfa', fontWeight: 600 }}>{nextLoc.name}</span> (Level {userLevel + 1})
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                  🏔 You have reached Kailash! Journey complete.
                </div>
              )}
            </div>
          </div>

          {/* Navigation hint */}
          <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => { const l = Math.max(1, viewingLevel - 1); setViewingLevel(l); setSelectedLocation(getLocation(l)); }}
              disabled={viewingLevel <= 1}
              style={{
                background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
                opacity: viewingLevel <= 1 ? 0.4 : 1,
              }}
              id="journey-prev-btn"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <button
              onClick={() => { setViewingLevel(userLevel); setSelectedLocation(getLocation(userLevel)); }}
              style={{
                background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.5)',
                color: '#c4b5fd', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
              id="journey-my-pos-btn"
            >
              ✨ My Position
            </button>

            <button
              onClick={() => { const l = Math.min(108, viewingLevel + 1); setViewingLevel(l); setSelectedLocation(getLocation(l)); }}
              disabled={viewingLevel >= 108}
              style={{
                background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
                opacity: viewingLevel >= 108 ? 0.4 : 1,
              }}
              id="journey-next-btn"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#374151' }}>
            Click any node to explore · Drag to rotate · Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}
