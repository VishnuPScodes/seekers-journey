import React from 'react';

/**
 * Hand-drawn location-specific landmark caricatures & sketches
 * dynamically anchored to major destination points along the Kailash Trail.
 * Large in scale with delicate, light hand-drawn stroke lines.
 */

// 1. Level 1: Isha Yoga Center / Adiyogi
export function AdiyogiLandmarkSketch({ size = 95, color = '#d9572b' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Adiyogi Bust Outline */}
      <path d="M 50 18 C 42 18, 36 26, 36 36 C 36 44, 42 50, 50 50 C 58 50, 64 44, 64 36 C 64 26, 58 18, 50 18 Z" stroke={color} strokeWidth="1.8" fill="none" />
      {/* Crescent Moon in Hair */}
      <path d="M 58 20 C 62 18, 64 24, 60 26 C 58 24, 57 22, 58 20 Z" fill={color} />
      {/* Serpent around neck */}
      <path d="M 34 46 C 42 52, 58 52, 66 46 C 70 54, 76 66, 82 78 L 18 78 C 24 66, 30 54, 34 46 Z" stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      {/* Lotus Base */}
      <path d="M 22 84 C 35 76, 65 76, 78 84 M 32 88 C 44 82, 56 82, 68 88" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 2. Level 10: Kodaikanal Hills / Western Ghats
export function MountainHillsLandmarkSketch({ size = 90, color = '#7c3aed' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mountain Peaks */}
      <path d="M 10 75 L 35 32 L 58 62 L 78 38 L 92 75 Z" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      {/* Ridge Lines */}
      <path d="M 35 32 L 40 75 M 78 38 L 74 75" stroke={color} strokeWidth="1.2" strokeDasharray="3 3" />
      {/* Pine Trees */}
      <path d="M 20 75 L 20 60 M 16 68 L 20 60 L 24 68 M 14 73 L 20 64 L 26 73" stroke={color} strokeWidth="1.2" />
      {/* Sun/Cloud */}
      <circle cx="75" cy="24" r="8" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// 3. Level 20: Hampi Virupaksha Stone Temple Chariot
export function TempleGopuramSketch({ size = 90, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gopuram Tower Layers */}
      <path d="M 30 78 L 34 26 L 66 26 L 70 78 Z" stroke={color} strokeWidth="1.8" fill="none" />
      <line x1="32" y1="40" x2="68" y2="40" stroke={color} strokeWidth="1.4" />
      <line x1="31" y1="56" x2="69" y2="56" stroke={color} strokeWidth="1.4" />
      {/* Kalasam Peak */}
      <path d="M 45 26 L 50 14 L 55 26 Z" stroke={color} strokeWidth="1.6" fill="none" />
      {/* Arch Doorway */}
      <path d="M 42 78 L 42 62 C 42 56, 58 56, 58 62 L 58 78 Z" stroke={color} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

// 4. Level 30: Tirupati Sacred Hills & Sankha/Namam Emblem
export function TirupatiNamamSketch({ size = 90, color = '#d97706' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sacred Tilak / Namam */}
      <path d="M 35 24 L 35 60 C 35 72, 65 72, 65 60 L 65 24" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M 50 30 L 50 68" stroke={color} strokeWidth="2.0" strokeLinecap="round" />
      {/* Sacred Bindi Dot */}
      <circle cx="50" cy="74" r="3.5" fill={color} />
      {/* Surrounding Rays */}
      <path d="M 22 36 L 14 30 M 78 36 L 86 30 M 20 54 L 10 54 M 80 54 L 90 54" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 5. Level 41: Ujjain Mahakaleshwar Trishul & Damaru
export function TrishulDamaruSketch({ size = 92, color = '#ef4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Center Trishul Spear */}
      <line x1="50" y1="12" x2="50" y2="88" stroke={color} strokeWidth="2.0" strokeLinecap="round" />
      {/* Curved Prongs */}
      <path d="M 28 26 C 28 44, 50 44, 50 44 C 50 44, 72 44, 72 26" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Damaru Drum in center */}
      <path d="M 38 52 L 62 52 L 40 68 L 60 68 Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Damaru Cord Beads */}
      <circle cx="32" cy="60" r="2.2" fill={color} />
      <circle cx="68" cy="60" r="2.2" fill={color} />
    </svg>
  );
}

// 6. Level 51: Dwarka & Somnath Shankha Conch Shell
export function ConchShankhaSketch({ size = 90, color = '#f97316' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Spiral Conch Body */}
      <path d="M 50 20 C 65 20, 78 32, 78 48 C 78 64, 62 78, 48 84 C 36 78, 24 64, 24 48 C 24 35, 34 26, 46 22" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M 48 30 C 58 30, 66 38, 64 50 C 62 60, 50 68, 44 72" stroke={color} strokeWidth="1.4" fill="none" />
      <path d="M 46 40 C 52 40, 56 45, 54 52" stroke={color} strokeWidth="1.2" fill="none" />
      {/* Ocean Waves below */}
      <path d="M 16 84 C 26 80, 36 88, 46 84 C 56 80, 66 88, 76 84 C 84 80, 90 84, 94 84" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 7. Level 64: Varanasi Kashi Vishwanath Ganga Diya Lamp
export function KashiGangaDiyaSketch({ size = 90, color = '#3b82f6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Diya Oil Bowl */}
      <path d="M 20 54 C 20 74, 80 74, 80 54 L 88 50 C 88 50, 76 46, 50 46 C 24 46, 12 50, 12 50 Z" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      {/* Flame */}
      <path d="M 50 46 C 42 34, 46 20, 50 14 C 54 20, 58 34, 50 46 Z" stroke={color} strokeWidth="1.6" fill="none" />
      <path d="M 50 40 C 47 32, 49 24, 50 20 C 51 24, 53 32, 50 40 Z" fill={color} opacity="0.8" />
      {/* Water Ripples */}
      <path d="M 14 78 C 30 74, 50 82, 70 78 C 82 75, 90 78, 94 78" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 8. Level 79: Kedarnath Mountain Temple
export function KedarnathTempleSketch({ size = 95, color = '#0e7490' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mountain Backdrop */}
      <path d="M 8 68 L 30 24 L 50 48 L 72 20 L 92 68 Z" stroke={color} strokeWidth="1.4" strokeDasharray="3 3" opacity="0.6" />
      {/* Kedarnath Temple Structure */}
      <path d="M 32 78 L 36 42 L 64 42 L 68 78 Z" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M 30 42 L 50 28 L 70 42 Z" stroke={color} strokeWidth="1.8" fill="none" />
      <line x1="50" y1="28" x2="50" y2="18" stroke={color} strokeWidth="1.6" />
      <circle cx="50" cy="16" r="2.5" fill={color} />
      {/* Door */}
      <path d="M 44 78 L 44 64 C 44 60, 56 60, 56 64 L 56 78 Z" stroke={color} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

// 9. Level 87: Key Monastery / Spiti Tibetan Stupa
export function TibetanStupaSketch({ size = 90, color = '#8b5cf6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Base Steps */}
      <rect x="24" y="68" width="52" height="10" rx="2" stroke={color} strokeWidth="1.8" fill="none" />
      <rect x="30" y="58" width="40" height="10" rx="2" stroke={color} strokeWidth="1.4" fill="none" />
      {/* Dome */}
      <path d="M 34 58 C 34 42, 66 42, 66 58 Z" stroke={color} strokeWidth="1.8" fill="none" />
      {/* Spire Rings */}
      <path d="M 42 42 L 50 22 L 58 42 Z" stroke={color} strokeWidth="1.4" fill="none" />
      <circle cx="50" cy="18" r="4" stroke={color} strokeWidth="1.4" fill="none" />
      <path d="M 48 14 L 50 8 L 52 14 Z" fill={color} />
      {/* Prayer Flag Line */}
      <path d="M 12 36 L 50 22 L 88 36" stroke={color} strokeWidth="1.2" strokeDasharray="3 3" />
    </svg>
  );
}

// 10. Level 101: Lake Manasarovar Lotus & Swan (Hamsa)
export function ManasarovarHamsaSketch({ size = 90, color = '#a78bfa' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Swan (Hamsa) Neck & Body */}
      <path d="M 30 58 C 24 50, 26 36, 36 34 C 44 32, 42 44, 48 48 C 58 54, 72 50, 78 40 C 82 56, 70 70, 48 70 C 38 70, 32 64, 30 58 Z" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <circle cx="34" cy="38" r="1.5" fill={color} />
      {/* Lotus Flowers */}
      <path d="M 16 72 C 22 62, 28 66, 32 72 Z" stroke={color} strokeWidth="1.4" fill="none" />
      <path d="M 68 72 C 74 62, 80 66, 84 72 Z" stroke={color} strokeWidth="1.4" fill="none" />
      {/* Water Ripples */}
      <path d="M 10 78 C 30 74, 50 82, 70 78 C 82 75, 90 78, 94 78" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 11. Level 108: Mount Kailash Peak with Sacred Om
export function MountKailashSummitSketch({ size = 115, color = '#fbbf24' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sacred Sun Aura */}
      <circle cx="50" cy="28" r="15" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.75" />
      {/* Sacred Om Symbol in Sun */}
      <path d="M 45 28 C 43 24, 48 22, 50 25 C 52 22, 57 24, 55 28 C 53 32, 46 32, 50 36 M 50 28 L 57 28 M 52 20 C 55 20, 56 22, 56 22" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {/* Mount Kailash Diamond Pyramid Peak */}
      <path d="M 50 24 L 16 80 L 84 80 Z" stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <path d="M 50 24 L 50 80" stroke={color} strokeWidth="1.6" />
      <path d="M 50 44 L 28 80 M 50 44 L 72 80" stroke={color} strokeWidth="1.3" strokeDasharray="3 3" />
      {/* Base Snow Ridges */}
      <path d="M 8 84 C 30 78, 70 78, 92 84" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Renders the landmark caricature sketch anchored directly to a specific major location point on the Kailash map.
 */
export function LandmarkSketchAnchor({ level, pt, color }) {
  if (!pt) return null;

  const [x, y] = pt;

  switch (level) {
    case 1:
      return (
        <g transform={`translate(${x - 110}, ${y - 65})`} opacity={0.78}>
          <AdiyogiLandmarkSketch size={95} color={color || '#d9572b'} />
        </g>
      );
    case 10:
      return (
        <g transform={`translate(${x + 30}, ${y - 60})`} opacity={0.78}>
          <MountainHillsLandmarkSketch size={90} color={color || '#7c3aed'} />
        </g>
      );
    case 20:
      return (
        <g transform={`translate(${x - 105}, ${y - 55})`} opacity={0.78}>
          <TempleGopuramSketch size={90} color={color || '#059669'} />
        </g>
      );
    case 30:
      return (
        <g transform={`translate(${x + 30}, ${y - 55})`} opacity={0.78}>
          <TirupatiNamamSketch size={90} color={color || '#d97706'} />
        </g>
      );
    case 41:
      return (
        <g transform={`translate(${x - 105}, ${y - 55})`} opacity={0.78}>
          <TrishulDamaruSketch size={92} color={color || '#ef4444'} />
        </g>
      );
    case 51:
      return (
        <g transform={`translate(${x + 30}, ${y - 55})`} opacity={0.78}>
          <ConchShankhaSketch size={90} color={color || '#f97316'} />
        </g>
      );
    case 64:
      return (
        <g transform={`translate(${x - 105}, ${y - 55})`} opacity={0.78}>
          <KashiGangaDiyaSketch size={90} color={color || '#3b82f6'} />
        </g>
      );
    case 79:
      return (
        <g transform={`translate(${x + 32}, ${y - 60})`} opacity={0.78}>
          <KedarnathTempleSketch size={95} color={color || '#0e7490'} />
        </g>
      );
    case 87:
      return (
        <g transform={`translate(${x - 105}, ${y - 55})`} opacity={0.78}>
          <TibetanStupaSketch size={90} color={color || '#8b5cf6'} />
        </g>
      );
    case 101:
      return (
        <g transform={`translate(${x + 32}, ${y - 55})`} opacity={0.78}>
          <ManasarovarHamsaSketch size={90} color={color || '#a78bfa'} />
        </g>
      );
    case 108:
      return (
        <g transform={`translate(${x + 45}, ${y - 80})`} opacity={0.82}>
          <MountKailashSummitSketch size={115} color={color || '#fbbf24'} />
        </g>
      );
    default:
      return null;
  }
}


