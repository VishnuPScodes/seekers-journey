import React, { useRef, useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLevelProgress, getPointsToNextLevel, getLocation, POINTS_PER_LEVEL } from '../utils/locations';
import api from '../api';

// ─── Vibrant pebble palette — each sadhana has its own rich color ──────────────
const PEBBLE_PALETTE = [
  { base: '#e8845a', emissive: '#c05030', label: '#7a2a10' }, // terracotta
  { base: '#5a9ed4', emissive: '#2a6aaa', label: '#0a3a6a' }, // sapphire blue
  { base: '#68c49a', emissive: '#2a8a60', label: '#0a4a30' }, // jade green
  { base: '#b87ad4', emissive: '#7a3aa0', label: '#4a1060' }, // amethyst
  { base: '#e8c45a', emissive: '#b08a20', label: '#6a4a00' }, // amber gold
  { base: '#e87a9a', emissive: '#b03a5a', label: '#6a0a2a' }, // rose
  { base: '#5ac4d4', emissive: '#1a8090', label: '#004a58' }, // teal
  { base: '#a4c468', emissive: '#688a20', label: '#3a5000' }, // moss
  { base: '#d4845a', emissive: '#a04420', label: '#602000' }, // sienna
  { base: '#7a9ed4', emissive: '#3a5aaa', label: '#0a2060' }, // periwinkle
  { base: '#c4a464', emissive: '#8a6420', label: '#4a2800' }, // sandstone
];

// Sadhana icons as emoji
const SADHANA_EMOJI = {
  'Shoonya Meditation': '🌌',
  'Shambhavi Mahamudra': '👁',
  'Shakti Chalana Kriya': '⚡',
  'Surya Kriya': '☀️',
  'Yogasanas': '🧘',
  'Angamardana': '🔥',
  'Sukha Kriya': '🌿',
  'Samyama Sadhana': '🪷',
  'Breath Watching': '🌬',
  'Surya Shakti': '✨',
  'Bhastrika Kriya': '💨',
};

// ─── Animated River Water — Rich Deep Blue ─────────────────────────────────────
function RiverWater() {
  const meshRef = useRef();

  const waterGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(20, 30, 100, 100);
    return g;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const wave =
        Math.sin(x * 1.2 + t * 1.0) * 0.035 +
        Math.sin(y * 0.8 + t * 0.8) * 0.045 +
        Math.sin((x * 0.5 + y * 0.4) + t * 1.2) * 0.025 +
        Math.sin(x * 2.0 - t * 1.5) * 0.015;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <primitive object={waterGeo} />
      <meshPhysicalMaterial
        color="#1a6fa0"
        transparent
        opacity={0.88}
        roughness={0.05}
        metalness={0.3}
        reflectivity={0.9}
        envMapIntensity={2.0}
        transmission={0.1}
      />
    </mesh>
  );
}

// ─── Deep river bed with sandy tones ──────────────────────────────────────────
function RiverBed() {
  return (
    <>
      {/* Main bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]}>
        <planeGeometry args={[20, 30]} />
        <meshStandardMaterial color="#8aaa90" roughness={1} />
      </mesh>
      {/* Sandy patches */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i * 0.5]} position={[x, -0.21, (i - 1) * 3]}>
          <circleGeometry args={[1.2 + i * 0.3, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#c0b890' : '#a8c8a0'} roughness={1} />
        </mesh>
      ))}
    </>
  );
}

// ─── Sparkle/glint particles on water surface ──────────────────────────────────
function WaterSparkles() {
  const count = 60;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = 0.03;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    return arr;
  }, []);

  const geoRef = useRef();
  const phases = useMemo(() => Array.from({ length: count }, () => Math.random() * Math.PI * 2), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!geoRef.current) return;
    const sizes = geoRef.current.attributes.size;
    for (let i = 0; i < count; i++) {
      sizes.setX(i, Math.max(0, Math.sin(t * 2 + phases[i]) * 3));
    }
    sizes.needsUpdate = true;
  });

  const sizesArr = useMemo(() => new Float32Array(count).fill(1), []);

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizesArr, 1]} />
      </bufferGeometry>
      <pointsMaterial color="#88ddff" size={0.08} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

// ─── Lush river banks with grass & rocks ──────────────────────────────────────
function RiverBanks() {
  const bankRocks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      arr.push({
        x: side * (5.5 + Math.random() * 5),
        z: (Math.random() - 0.5) * 28,
        scale: 0.2 + Math.random() * 0.6,
        ry: Math.random() * Math.PI,
        color: ['#8a9e7a', '#7a8e68', '#9aae8a', '#c8baa0', '#a89880'][Math.floor(Math.random() * 5)],
      });
    }
    return arr;
  }, []);

  return (
    <>
      {/* Left bank — green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, -0.05, 0]}>
        <planeGeometry args={[8, 30]} />
        <meshStandardMaterial color="#6a9a60" roughness={0.95} />
      </mesh>
      {/* Right bank — green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, -0.05, 0]}>
        <planeGeometry args={[8, 30]} />
        <meshStandardMaterial color="#6a9a60" roughness={0.95} />
      </mesh>
      {/* Bank rocks */}
      {bankRocks.map((r, i) => (
        <mesh key={i} position={[r.x, 0.04, r.z]} rotation={[0.1, r.ry, 0]} scale={[r.scale, r.scale * 0.5, r.scale]}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshStandardMaterial color={r.color} roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

// ─── Floating water lily leaves ────────────────────────────────────────────────
function WaterLilies() {
  const lilies = useMemo(() => [
    { x: -3.5, z: -4, r: 0.3 }, { x: 3.2, z: -1, r: 0.25 },
    { x: -4.0, z: 2, r: 0.22 }, { x: 3.8, z: 3, r: 0.28 },
    { x: -3.2, z: 5, r: 0.2 }, { x: 4.2, z: -5, r: 0.24 },
  ], []);

  const refs = useRef(lilies.map(() => React.createRef()));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((ref, i) => {
      if (ref.current) {
        ref.current.position.y = 0.02 + Math.sin(t * 0.4 + i) * 0.01;
        ref.current.rotation.y = t * 0.05 + i;
      }
    });
  });

  return (
    <>
      {lilies.map((l, i) => (
        <mesh key={i} ref={refs.current[i]} rotation={[-Math.PI / 2, 0, 0]} position={[l.x, 0.01, l.z]}>
          <circleGeometry args={[l.r, 12]} />
          <meshStandardMaterial color="#4a9a50" roughness={0.7} transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

// ─── A Single Sadhana Pebble ───────────────────────────────────────────────────
function SadhanaPebble({ practice, position, paletteIndex, tapCount, onTap, justTapped }) {
  const groupRef = useRef();
  const pebbleRef = useRef();
  const glowRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();

  const palette = PEBBLE_PALETTE[paletteIndex % PEBBLE_PALETTE.length];
  const floatPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  const floatSpeed = useMemo(() => 0.5 + Math.random() * 0.4, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const bob = Math.sin(t * floatSpeed + floatPhase) * 0.05;

    if (groupRef.current) {
      groupRef.current.position.y = bob;
    }
    if (pebbleRef.current && (hovered || tapCount > 0)) {
      pebbleRef.current.rotation.y += 0.008;
    }
    // Glow pulse
    if (glowRef.current) {
      glowRef.current.material.opacity = tapCount > 0
        ? 0.5 + Math.sin(t * 2.5 + floatPhase) * 0.2
        : hovered ? 0.3 : 0;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.8 + floatPhase) * 0.05);
    }
    if (ringRef.current) {
      ringRef.current.material.opacity = tapCount > 0 ? 0.6 : hovered ? 0.3 : 0.1;
      ringRef.current.rotation.z = t * 0.3;
    }
  });

  useEffect(() => {
    gl.domElement.style.cursor = hovered ? 'pointer' : 'default';
    return () => { gl.domElement.style.cursor = 'default'; };
  }, [hovered, gl]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    // Pop animation
    if (pebbleRef.current) {
      pebbleRef.current.scale.set(1.25, 0.8, 1.25);
      setTimeout(() => { if (pebbleRef.current) pebbleRef.current.scale.set(1, 1, 1); }, 250);
    }
    onTap(practice.name);
  }, [onTap, practice.name]);

  const isDone = tapCount > 0;
  const emoji = SADHANA_EMOJI[practice.name] || '🙏';
  // Short label — first word only if too long
  const shortName = practice.name.length > 12
    ? practice.name.split(' ').slice(0, 2).join(' ')
    : practice.name;

  return (
    <group position={position}>
      <group ref={groupRef}>

        {/* Underwater glow disc */}
        <mesh
          ref={glowRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.04, 0]}
        >
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial
            color={palette.base}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        {/* Ripple ring */}
        <mesh
          ref={ringRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
        >
          <ringGeometry args={[0.55, 0.72, 48]} />
          <meshBasicMaterial
            color={palette.base}
            transparent
            opacity={0.1}
            depthWrite={false}
          />
        </mesh>

        {/* The Pebble — shiny wet stone look */}
        <mesh
          ref={pebbleRef}
          position={[0, 0.06, 0]}
          scale={[1.0, 0.5, 0.85]}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <sphereGeometry args={[0.52, 40, 32]} />
          <meshPhysicalMaterial
            color={isDone
              ? new THREE.Color(palette.base).lerp(new THREE.Color('#ffffff'), 0.25)
              : palette.base
            }
            emissive={isDone ? palette.emissive : (hovered ? palette.emissive : '#000000')}
            emissiveIntensity={isDone ? 0.3 : hovered ? 0.15 : 0}
            roughness={0.18}
            metalness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
            reflectivity={0.8}
          />
        </mesh>

        {/* Label above pebble */}
        <Html
          position={[0, 0.75, 0]}
          center
          distanceFactor={5}
          occlude={false}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
            {/* Emoji */}
            <div style={{ fontSize: '18px', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}>
              {emoji}
            </div>
            {/* Name */}
            <div style={{
              marginTop: '3px',
              fontSize: '10px',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 700,
              color: palette.label,
              textShadow: '0 1px 4px rgba(255,255,255,0.95)',
              background: 'rgba(255,255,255,0.7)',
              padding: '2px 7px',
              borderRadius: 10,
              backdropFilter: 'blur(6px)',
              border: `1px solid ${palette.base}44`,
              whiteSpace: 'nowrap',
            }}>
              {shortName}
            </div>
            {/* Done badge */}
            {isDone && (
              <div style={{
                marginTop: '3px',
                fontSize: '9px',
                fontWeight: 800,
                color: '#fff',
                background: palette.emissive,
                padding: '1px 7px',
                borderRadius: 10,
                boxShadow: `0 2px 6px ${palette.base}88`,
              }}>
                ✓ {tapCount}×
              </div>
            )}
          </div>
        </Html>

        {/* +10 pop when just tapped */}
        {justTapped && (
          <Html position={[0, 1.4, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 900,
              color: palette.emissive,
              fontFamily: '"Cormorant Garamond", serif',
              textShadow: '0 2px 8px rgba(255,255,255,0.9)',
              animation: 'scoreRise 0.9s ease-out forwards',
              whiteSpace: 'nowrap',
            }}>
              +10 ✨
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ─── Underwater caustic light ──────────────────────────────────────────────────
function Caustics() {
  const count = 18;
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 14,
    z: (Math.random() - 0.5) * 22,
    s: 0.25 + Math.random() * 0.7,
    ph: Math.random() * Math.PI * 2,
    color: ['#88ccff', '#aaddff', '#66bbee', '#99ddcc'][Math.floor(Math.random() * 4)],
  })), []);
  const refs = useRef(data.map(() => React.createRef()));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((ref, i) => {
      if (ref.current) {
        ref.current.material.opacity = 0.06 + Math.abs(Math.sin(t * 0.7 + data[i].ph)) * 0.1;
        ref.current.scale.setScalar(data[i].s * (0.85 + Math.sin(t * 0.5 + data[i].ph) * 0.15));
      }
    });
  });

  return (
    <>
      {data.map((d, i) => (
        <mesh key={i} ref={refs.current[i]} rotation={[-Math.PI / 2, 0, 0]} position={[d.x, -0.19, d.z]}>
          <circleGeometry args={[0.6, 8]} />
          <meshBasicMaterial color={d.color} transparent opacity={0.07} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Camera: closer and looking down at a nice angle ──────────────────────────
function Camera() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 4.5, 5.5);
    camera.lookAt(0, 0, -1);
    camera.fov = 55;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.06;
    camera.position.x = Math.sin(t) * 0.6;
    camera.position.y = 4.5 + Math.sin(t * 0.7) * 0.15;
    camera.lookAt(Math.sin(t) * 0.2, 0, -1);
  });

  return null;
}

// ─── Organic pebble positions in the river ─────────────────────────────────────
function buildPositions(count) {
  const positions = [];
  // Arrange in staggered rows, centered, closer together for zoom
  const cols = Math.ceil(Math.sqrt(count * 1.2));
  let placed = 0;
  let row = 0;
  while (placed < count) {
    const inRow = Math.min(count - placed, row % 2 === 0 ? 3 : 2);
    for (let col = 0; col < inRow && placed < count; col++) {
      const x = (col - (inRow - 1) / 2) * 1.8 + (Math.random() - 0.5) * 0.5;
      const z = row * 1.9 - ((Math.ceil(count / 2.5)) * 0.95) + (Math.random() - 0.5) * 0.5;
      positions.push([x, 0, z]);
      placed++;
    }
    row++;
  }
  return positions;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ practices, tapCounts, justTappedName, onTap }) {
  const positions = useMemo(() => buildPositions(practices.length), [practices.length]);

  return (
    <>
      {/* Rich blue sky */}
      <color attach="background" args={['#3a90c8']} />
      <fog attach="fog" args={['#7ab8e0', 10, 28]} />

      {/* Lighting */}
      <ambientLight intensity={1.4} color="#d4eeff" />
      <directionalLight
        position={[4, 10, 4]}
        intensity={2.8}
        color="#fff4d0"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Blue fill from below water */}
      <directionalLight position={[-6, 2, -6]} intensity={1.2} color="#5ab0e0" />
      {/* Warm top highlight */}
      <pointLight position={[0, 8, 2]} intensity={3} color="#ffe8c0" distance={20} />
      {/* Blue rim on water */}
      <pointLight position={[0, 1, -5]} intensity={4} color="#2080c0" distance={12} />

      <Camera />
      <RiverBed />
      <Caustics />
      <RiverBanks />
      <WaterLilies />
      <RiverWater />
      <WaterSparkles />

      {practices.map((practice, i) => (
        <SadhanaPebble
          key={practice.name}
          practice={practice}
          position={positions[i] || [0, 0, i * 1.9]}
          paletteIndex={i}
          tapCount={tapCounts[practice.name] || 0}
          onTap={onTap}
          justTapped={justTappedName === practice.name}
        />
      ))}
    </>
  );
}

// ─── HUD overlay (minimal glass) ──────────────────────────────────────────────
function HUD({ user, totalScore, currentLevel, navigate }) {
  const loc = getLocation(currentLevel);
  const progress = getLevelProgress(totalScore);

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        background: 'linear-gradient(to bottom, rgba(20,60,100,0.45) 0%, transparent 100%)',
      }}>
        {/* Greeting */}
        <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          <div style={{ fontSize: 11, color: 'rgba(200,235,255,0.75)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Namaskaram
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,80,160,0.6)', lineHeight: 1.1 }}>
            {user?.name?.split(' ')[0] || 'Seeker'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(200,235,255,0.65)', marginTop: 2 }}>
            Tap a pebble to practice
          </div>
        </div>

        {/* Level badge */}
        <button
          id="hud-journey-btn"
          onClick={() => navigate('/journey')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 16,
            padding: '10px 16px',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            textAlign: 'right',
            fontFamily: '"Cormorant Garamond", serif',
            boxShadow: '0 4px 20px rgba(0,80,160,0.25)',
            minWidth: 90,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ffe566', lineHeight: 1, textShadow: '0 2px 8px rgba(180,120,0,0.5)' }}>
            {currentLevel}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Level
          </div>
          <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 5 }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: 'linear-gradient(90deg, #ffe566, #ffaa22)',
              borderRadius: 2, transition: 'width 0.5s ease',
              boxShadow: '0 0 6px rgba(255,200,0,0.6)',
            }} />
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 3, maxWidth: 80, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            🏔 {loc.name.split(' ').slice(0, 2).join(' ')}
          </div>
        </button>
      </div>

      {/* Bottom score pill */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(10,40,80,0.55)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 100,
        padding: '10px 28px',
        backdropFilter: 'blur(14px)',
        fontFamily: '"Cormorant Garamond", serif',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 4px 24px rgba(0,60,140,0.35)',
      }}>
        <div>
          <span style={{ fontSize: 10, color: 'rgba(180,220,255,0.7)', letterSpacing: 0.5 }}>Score </span>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#ffe566', textShadow: '0 2px 8px rgba(255,180,0,0.5)' }}>
            {totalScore}
          </span>
        </div>
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.2)' }} />
        <button
          onClick={() => navigate('/tracker')}
          id="hud-tracker-btn"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'rgba(180,225,255,0.9)', fontFamily: 'inherit',
            fontWeight: 600, letterSpacing: 0.3,
          }}
        >
          Full Log →
        </button>
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.2)' }} />
        <button
          onClick={() => navigate('/progress')}
          id="hud-progress-btn"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'rgba(180,225,255,0.9)', fontFamily: 'inherit',
            fontWeight: 600, letterSpacing: 0.3,
          }}
        >
          Progress →
        </button>
      </div>
    </>
  );
}

// ─── Main Landing ──────────────────────────────────────────────────────────────
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

    setTotalScore(newScore);
    setCurrentLevel(newLevel);
    setTapCounts(prev => ({ ...prev, [practiceName]: (prev[practiceName] || 0) + 1 }));
    setJustTappedName(practiceName);
    setTimeout(() => setJustTappedName(null), 900);

    if (newLevel > prevLevel) {
      const loc = getLocation(newLevel);
      setLeveledUp(`✨ Level ${newLevel} · ${loc.name}`);
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
      <style>{`
        @keyframes scoreRise {
          0%   { opacity: 1; transform: translateY(0)   scale(0.8); }
          40%  { opacity: 1; transform: translateY(-22px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.9); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-14px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <Canvas
        camera={{ position: [0, 4.5, 5.5], fov: 55, near: 0.1, far: 80 }}
        shadows
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#3a90c8');
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <Scene
            practices={selectedPractices}
            tapCounts={tapCounts}
            justTappedName={justTappedName}
            onTap={handleTap}
          />
        </Suspense>
      </Canvas>

      <HUD user={user} totalScore={totalScore} currentLevel={currentLevel} navigate={navigate} />

      {/* Level-up toast */}
      {leveledUp && (
        <div style={{
          position: 'absolute', top: 80, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(20,60,120,0.75)',
          border: '1px solid rgba(255,230,100,0.5)',
          borderRadius: 24,
          padding: '11px 26px',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 15, fontWeight: 700,
          color: '#ffe566',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,60,160,0.4)',
          animation: 'toastIn 0.4s ease forwards',
          whiteSpace: 'nowrap',
          textShadow: '0 2px 8px rgba(180,120,0,0.6)',
        }}>
          {leveledUp}
        </div>
      )}

      {/* No practices state */}
      {selectedPractices.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10,
        }}>
          <div style={{
            background: 'rgba(10,40,80,0.65)',
            backdropFilter: 'blur(14px)',
            borderRadius: 24,
            padding: '32px 40px',
            textAlign: 'center',
            fontFamily: '"Cormorant Garamond", serif',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 40px rgba(0,40,120,0.5)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🪨</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              No Sadhanas Selected
            </div>
            <div style={{ fontSize: 13, color: 'rgba(180,220,255,0.8)', marginBottom: 22 }}>
              Choose your practices to place pebbles in the river
            </div>
            <button
              onClick={() => navigate('/select-practices')}
              id="landing-select-practices-btn"
              style={{
                background: 'linear-gradient(135deg, #4a9ade, #2a6aaa)',
                color: 'white', border: 'none',
                borderRadius: 14, padding: '12px 28px', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(40,100,180,0.5)',
              }}
            >
              Select Practices →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
