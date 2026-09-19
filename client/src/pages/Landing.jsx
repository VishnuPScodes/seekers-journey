import React, { useRef, useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PRACTICE_ICONS } from '../utils/practiceIcons';
import { getLevelProgress, getPointsToNextLevel, getLocation, POINTS_PER_LEVEL } from '../utils/locations';
import api from '../api';

// ─── Pebble colors — warm stone palette ────────────────────────────────────────
const PEBBLE_COLORS = [
  '#8a9ba8', '#7d8e99', '#9eada4', '#b0a090',
  '#a0a8b0', '#8c9e8c', '#b8a898', '#7a8c8c',
  '#a8b0a0', '#909898', '#c0b0a0', '#8898a8',
];

const PEBBLE_ROUGHNESS = [0.85, 0.75, 0.9, 0.8, 0.7, 0.88];

// ─── Animated River Water ──────────────────────────────────────────────────────
function RiverWater() {
  const meshRef = useRef();
  const materialRef = useRef();

  const waterGeo = useMemo(() => new THREE.PlaneGeometry(30, 60, 80, 80), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // plane is XY, we use as XZ
      const wave =
        Math.sin(x * 0.6 + t * 0.5) * 0.04 +
        Math.sin(z * 0.4 + t * 0.4) * 0.03 +
        Math.sin((x + z) * 0.3 + t * 0.6) * 0.02;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    // Animate water color shift — very subtle
    if (materialRef.current) {
      const hue = 0.52 + Math.sin(t * 0.1) * 0.02;
      materialRef.current.color.setHSL(hue, 0.4, 0.62 + Math.sin(t * 0.2) * 0.02);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <primitive object={waterGeo} />
      <meshStandardMaterial
        ref={materialRef}
        color="#7cb4c0"
        transparent
        opacity={0.82}
        roughness={0.05}
        metalness={0.1}
        envMapIntensity={1}
      />
    </mesh>
  );
}

// ─── River Bed ─────────────────────────────────────────────────────────────────
function RiverBed() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
      <planeGeometry args={[30, 60]} />
      <meshStandardMaterial color="#c8bfaa" roughness={1} />
    </mesh>
  );
}

// ─── Scattered tiny background pebbles ────────────────────────────────────────
function BackgroundPebbles() {
  const pebbles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 24,
        z: (Math.random() - 0.5) * 50,
        rx: Math.random() * 0.3,
        rz: Math.random() * Math.PI,
        sx: 0.08 + Math.random() * 0.15,
        sy: 0.04 + Math.random() * 0.06,
        sz: 0.08 + Math.random() * 0.12,
        color: PEBBLE_COLORS[Math.floor(Math.random() * PEBBLE_COLORS.length)],
      });
    }
    return arr;
  }, []);

  return (
    <>
      {pebbles.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, -0.1, p.z]}
          rotation={[p.rx, p.rz, 0]}
          scale={[p.sx, p.sy, p.sz]}
        >
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={p.color} roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

// ─── Bank Rocks ────────────────────────────────────────────────────────────────
function RiverBanks() {
  const rocks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 25; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      arr.push({
        x: side * (7 + Math.random() * 8),
        z: (Math.random() - 0.5) * 50,
        scale: 0.3 + Math.random() * 0.8,
        ry: Math.random() * Math.PI,
        color: i % 3 === 0 ? '#8a9e8a' : i % 3 === 1 ? '#b0a890' : '#9a9898',
      });
    }
    return arr;
  }, []);

  return (
    <>
      {/* Bank ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, -0.05, 0]}>
        <planeGeometry args={[12, 60]} />
        <meshStandardMaterial color="#c8bca0" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, -0.05, 0]}>
        <planeGeometry args={[12, 60]} />
        <meshStandardMaterial color="#c8bca0" roughness={1} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, 0.05, r.z]} rotation={[0, r.ry, 0]} scale={r.scale}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshStandardMaterial color={r.color} roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

// ─── A Single Sadhana Pebble ───────────────────────────────────────────────────
function SadhanaPebble({ practice, position, colorIndex, tapCount, onTap, justTapped }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();

  const color = PEBBLE_COLORS[colorIndex % PEBBLE_COLORS.length];
  const roughness = PEBBLE_ROUGHNESS[colorIndex % PEBBLE_ROUGHNESS.length];

  // Unique float phase per pebble
  const floatPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const floatSpeed = useMemo(() => 0.4 + Math.random() * 0.3, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const bob = Math.sin(t * floatSpeed + floatPhase) * 0.04;
    meshRef.current.position.y = 0.04 + bob;

    // Gentle rotation
    meshRef.current.rotation.y += 0.001;

    // Glow pulse when tapped
    if (glowRef.current) {
      const gAlpha = tapCount > 0
        ? 0.25 + Math.sin(t * 2 + floatPhase) * 0.15
        : hovered ? 0.15 : 0;
      glowRef.current.material.opacity = gAlpha;
    }
  });

  // Change cursor on hover
  useEffect(() => {
    gl.domElement.style.cursor = hovered ? 'pointer' : 'default';
    return () => { gl.domElement.style.cursor = 'default'; };
  }, [hovered, gl]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onTap(practice.name);

    // Water ripple from click point
    if (meshRef.current) {
      const pos = meshRef.current.position.clone();
      // Just animate scale briefly
      meshRef.current.scale.set(1.15, 0.85, 1.15);
      setTimeout(() => {
        if (meshRef.current) meshRef.current.scale.set(1, 1, 1);
      }, 200);
    }
  }, [onTap, practice.name]);

  const isDone = tapCount > 0;

  return (
    <group position={position}>
      {/* Glow disc underneath */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial
          color={isDone ? '#a8d8b8' : '#c8e8f0'}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Water ring ripple (always-on subtle) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial
          color={isDone ? '#98c8a8' : '#88b8c8'}
          transparent
          opacity={tapCount > 0 ? 0.3 : 0.1}
          depthWrite={false}
        />
      </mesh>

      {/* The Pebble */}
      <mesh
        ref={meshRef}
        position={[0, 0.04, 0]}
        scale={[1, 0.45, 0.88]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[0.38, 32, 24]} />
        <meshStandardMaterial
          color={isDone ? new THREE.Color(color).lerp(new THREE.Color('#b8d8c8'), 0.4) : color}
          roughness={roughness}
          metalness={0.02}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, 0.52, 0]}
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            fontSize: '11px',
            fontFamily: '"Cormorant Garamond", "Georgia", serif',
            fontWeight: 600,
            color: isDone ? '#3a6a4a' : '#3a4a50',
            letterSpacing: '0.3px',
            textShadow: '0 1px 3px rgba(255,255,255,0.8)',
            background: 'rgba(255,255,255,0.5)',
            padding: '2px 6px',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
          }}>
            {practice.name.split(' ')[0]}
          </div>
          {tapCount > 0 && (
            <div style={{
              fontSize: '9px',
              color: '#4a8a5a',
              fontWeight: 700,
              marginTop: '1px',
              textShadow: '0 1px 2px rgba(255,255,255,0.9)',
            }}>
              ✓ {tapCount}×
            </div>
          )}
        </div>
      </Html>

      {/* Score pop-up when just tapped */}
      {justTapped && (
        <Html position={[0, 1, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#3a7a4a',
            fontFamily: '"Cormorant Garamond", serif',
            textShadow: '0 1px 3px rgba(255,255,255,0.9)',
            animation: 'scoreRise 0.8s ease-out forwards',
          }}>
            +10
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Caustic light patches on the bed ─────────────────────────────────────────
function CausticPatches() {
  const patches = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    x: (Math.random() - 0.5) * 20,
    z: (Math.random() - 0.5) * 40,
    scale: 0.3 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
  })), []);

  const refs = useRef(patches.map(() => React.createRef()));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((ref, i) => {
      if (ref.current) {
        const p = patches[i];
        ref.current.material.opacity = 0.04 + Math.sin(t * 0.8 + p.phase) * 0.03;
        ref.current.scale.setScalar(p.scale * (0.9 + Math.sin(t * 0.5 + p.phase) * 0.1));
      }
    });
  });

  return (
    <>
      {patches.map((p, i) => (
        <mesh
          key={i}
          ref={refs.current[i]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[p.x, -0.15, p.z]}
          scale={p.scale}
        >
          <circleGeometry args={[0.5, 6]} />
          <meshBasicMaterial color="#d4f0f8" transparent opacity={0.05} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Camera gently drifting ────────────────────────────────────────────────────
function DriftingCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 9, 12);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.08;
    camera.position.x = Math.sin(t) * 0.8;
    camera.position.y = 9 + Math.sin(t * 0.7) * 0.3;
    camera.lookAt(Math.sin(t) * 0.3, 0, 0);
  });
  return null;
}

// ─── Pebble layout: scattered organic positions ────────────────────────────────
function getPebblePositions(count) {
  const positions = [];
  const cols = Math.ceil(Math.sqrt(count * 1.5));
  let placed = 0;

  // Organic scatter with some structure
  for (let row = 0; placed < count; row++) {
    const inRow = Math.min(count - placed, 2 + Math.floor(Math.random() * 2));
    for (let col = 0; col < inRow && placed < count; col++) {
      const x = (col - (inRow - 1) / 2) * 2.2 + (Math.random() - 0.5) * 1.2;
      const z = row * 2.0 - (Math.ceil(count / 3) * 1.0) + (Math.random() - 0.5) * 0.8;
      positions.push([x, 0, z]);
      placed++;
    }
  }
  return positions;
}

// ─── The full 3D Scene ─────────────────────────────────────────────────────────
function RiverScene({ practices, tapCounts, justTappedName, onTap }) {
  const positions = useMemo(() => getPebblePositions(practices.length), [practices.length]);

  return (
    <>
      {/* Sky color via background */}
      <color attach="background" args={['#d8eef4']} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#c8e8f0', 15, 40]} />

      {/* Lighting */}
      <ambientLight intensity={1.2} color="#f0f4e8" />
      <directionalLight
        position={[5, 12, 5]}
        intensity={2.0}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-8, 8, -5]} intensity={0.6} color="#c8e8f8" />
      <pointLight position={[0, 6, 0]} intensity={1.5} color="#e8f4f0" distance={25} />

      <DriftingCamera />
      <RiverBed />
      <CausticPatches />
      <BackgroundPebbles />
      <RiverBanks />
      <RiverWater />

      {/* Sadhana pebbles */}
      {practices.map((practice, i) => (
        <SadhanaPebble
          key={practice.name}
          practice={practice}
          position={positions[i] || [0, 0, i * 2]}
          colorIndex={i}
          tapCount={tapCounts[practice.name] || 0}
          onTap={onTap}
          justTapped={justTappedName === practice.name}
        />
      ))}
    </>
  );
}

// ─── Minimal HUD overlay ───────────────────────────────────────────────────────
function HUD({ user, totalScore, currentLevel, navigate }) {
  const loc = getLocation(currentLevel);
  const progress = getLevelProgress(totalScore);

  return (
    <>
      {/* Top-left: greeting */}
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        fontFamily: '"Cormorant Garamond", Georgia, serif',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(40,70,60,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
          Namaskaram
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2a4a3a', lineHeight: 1 }}>
          {user?.name?.split(' ')[0] || 'Seeker'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(40,70,60,0.5)', marginTop: 2 }}>
          Tap a pebble to practice
        </div>
      </div>

      {/* Top-right: level badge */}
      <button
        id="hud-journey-btn"
        onClick={() => navigate('/journey')}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: 'rgba(255,255,255,0.55)',
          border: '1px solid rgba(100,160,140,0.3)',
          borderRadius: 14,
          padding: '10px 14px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          textAlign: 'right',
          fontFamily: '"Cormorant Garamond", serif',
          boxShadow: '0 2px 12px rgba(80,140,120,0.12)',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 900, color: '#3a6a4a', lineHeight: 1 }}>
          {currentLevel}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(40,80,60,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Level
        </div>
        {/* Progress bar */}
        <div style={{ width: 60, height: 3, background: 'rgba(100,160,140,0.2)', borderRadius: 2, marginTop: 6 }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', background: '#6ab090', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: 9, color: 'rgba(40,80,60,0.5)', marginTop: 3 }}>
          🏔 {loc.name.split(' ').slice(0, 2).join(' ')}
        </div>
      </button>

      {/* Bottom: score */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(100,160,140,0.25)',
        borderRadius: 100,
        padding: '8px 24px',
        backdropFilter: 'blur(12px)',
        fontFamily: '"Cormorant Garamond", serif',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 4px 20px rgba(80,140,120,0.1)',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(40,80,60,0.6)', letterSpacing: 0.5 }}>Score</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2a5a3a', lineHeight: 1 }}>{totalScore}</div>
        <div style={{ width: 1, height: 20, background: 'rgba(100,160,140,0.3)' }} />
        <button
          onClick={() => navigate('/tracker')}
          id="hud-tracker-btn"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'rgba(40,80,60,0.7)', fontFamily: 'inherit',
            fontWeight: 600, letterSpacing: 0.3,
          }}
        >
          Full Log →
        </button>
      </div>
    </>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [totalScore, setTotalScore] = useState(user?.totalCumulativeScore || 0);
  const [currentLevel, setCurrentLevel] = useState(user?.currentLevel || 1);
  const [tapCounts, setTapCounts] = useState({});
  const [justTappedName, setJustTappedName] = useState(null);
  const [leveledUp, setLeveledUp] = useState(null);

  useEffect(() => {
    if (user?.totalCumulativeScore !== undefined) setTotalScore(user.totalCumulativeScore);
    if (user?.currentLevel !== undefined) setCurrentLevel(user.currentLevel);
  }, [user?.totalCumulativeScore, user?.currentLevel]);

  const selectedPractices = useMemo(() =>
    (user?.selectedPractices || []).map(name => ({ name })),
    [user?.selectedPractices]
  );

  const handleTap = useCallback(async (practiceName) => {
    const prevScore = totalScore;
    const prevLevel = currentLevel;
    const newScore = totalScore + 10;
    const newLevel = Math.min(Math.floor(newScore / POINTS_PER_LEVEL) + 1, 108);

    // Optimistic update
    setTotalScore(newScore);
    setCurrentLevel(newLevel);
    setTapCounts(prev => ({ ...prev, [practiceName]: (prev[practiceName] || 0) + 1 }));
    setJustTappedName(practiceName);
    setTimeout(() => setJustTappedName(null), 900);

    if (newLevel > prevLevel) {
      const loc = getLocation(newLevel);
      setLeveledUp(`Level ${newLevel} · ${loc.name}`);
      setTimeout(() => setLeveledUp(null), 4000);
    }

    try {
      const { data } = await api.post('/user/tap-sadhana');
      setTotalScore(data.totalCumulativeScore);
      setCurrentLevel(data.currentLevel);
      updateUser({ totalCumulativeScore: data.totalCumulativeScore, currentLevel: data.currentLevel });
    } catch {
      setTotalScore(prevScore);
      setCurrentLevel(prevLevel);
    }
  }, [totalScore, currentLevel, updateUser]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Score pop animation */}
      <style>{`
        @keyframes scoreRise {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(1.4); }
        }
      `}</style>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 9, 12], fov: 52, near: 0.1, far: 100 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#d8eef4');
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <RiverScene
            practices={selectedPractices}
            tapCounts={tapCounts}
            justTappedName={justTappedName}
            onTap={handleTap}
          />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <HUD
        user={user}
        totalScore={totalScore}
        currentLevel={currentLevel}
        navigate={navigate}
      />

      {/* Level-up toast */}
      {leveledUp && (
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(100,170,130,0.4)',
          borderRadius: 20,
          padding: '10px 22px',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 14, fontWeight: 700,
          color: '#2a5a3a',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(80,160,100,0.2)',
          animation: 'scoreRise 4s ease forwards',
          whiteSpace: 'nowrap',
        }}>
          ✨ {leveledUp}
        </div>
      )}

      {/* No practices yet */}
      {selectedPractices.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10,
          flexDirection: 'column', gap: 16,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(12px)',
            borderRadius: 20,
            padding: '28px 36px',
            textAlign: 'center',
            fontFamily: '"Cormorant Garamond", serif',
            border: '1px solid rgba(100,160,140,0.3)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🪨</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2a4a3a', marginBottom: 6 }}>
              No Sadhanas Selected
            </div>
            <div style={{ fontSize: 13, color: 'rgba(40,70,60,0.7)', marginBottom: 20 }}>
              Choose your practices to place pebbles in the river
            </div>
            <button
              onClick={() => navigate('/select-practices')}
              style={{
                background: '#5a9070', color: 'white', border: 'none',
                borderRadius: 12, padding: '10px 24px', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
              }}
              id="landing-select-practices-btn"
            >
              Select Practices →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
