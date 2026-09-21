import React from 'react';

/**
 * ── Kundalini Serpent Spiral Motif (Photo 1 Reference) ──────────────────────────────
 * Coiled spiral serpent with hatched scales, outer wave line, 3-petal lotus, and bottom dots.
 */
export function KundaliniSerpentSpiralMotif({
  size = 120,
  color = '#d9572b',
  strokeWidth = 2,
  className = '',
  style = {},
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`kundalini-spiral-motif ${className}`}
      style={{ display: 'block', ...style }}
    >
      {/* Outer spiral body */}
      <path
        d="M 100 25 
           C 145 25, 175 55, 175 100 
           C 175 145, 145 175, 100 175 
           C 55 175, 30 145, 30 100 
           C 30 62, 58 42, 95 42 
           C 128 42, 152 65, 152 98 
           C 152 128, 130 148, 100 148 
           C 74 148, 56 130, 56 102 
           C 56 80, 72 65, 96 65 
           C 114 65, 128 78, 128 98 
           C 128 112, 116 122, 100 122 
           C 88 122, 80 114, 80 102"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Serpent Head at center */}
      <path
        d="M 80 102 C 80 94, 88 88, 98 88 C 104 88, 110 92, 108 98 C 106 104, 96 106, 90 103"
        stroke={color}
        strokeWidth={strokeWidth + 0.5}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="95" cy="94" r="1.5" fill={color} />

      {/* Radial hatch lines along the outer spiral coil */}
      <g stroke={color} strokeWidth={strokeWidth * 0.75} strokeLinecap="round" opacity="0.85">
        <line x1="100" y1="25" x2="100" y2="35" />
        <line x1="115" y1="27" x2="112" y2="37" />
        <line x1="130" y1="32" x2="124" y2="41" />
        <line x1="144" y1="40" x2="135" y2="48" />
        <line x1="156" y1="52" x2="145" y2="58" />
        <line x1="165" y1="66" x2="153" y2="70" />
        <line x1="171" y1="82" x2="158" y2="84" />
        <line x1="174" y1="98" x2="160" y2="98" />
        <line x1="172" y1="114" x2="158" y2="112" />
        <line x1="166" y1="130" x2="153" y2="125" />
        <line x1="156" y1="144" x2="144" y2="137" />
        <line x1="143" y1="156" x2="133" y2="146" />
        <line x1="128" y1="165" x2="120" y2="153" />
        <line x1="112" y1="171" x2="108" y2="157" />
        <line x1="96" y1="173" x2="96" y2="159" />
        <line x1="80" y1="171" x2="84" y2="157" />
        <line x1="64" y1="164" x2="71" y2="151" />
        <line x1="50" y1="153" x2="60" y2="142" />
        <line x1="39" y1="139" x2="51" y2="130" />
        <line x1="33" y1="123" x2="47" y2="117" />
        <line x1="30" y1="106" x2="45" y2="104" />
      </g>

      {/* Outer Wavy Flowing Vine to Lotus */}
      <path
        d="M 125 172 C 145 170, 168 152, 165 125 C 162 98, 178 75, 168 50"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />

      {/* Blooming 3-Petal Lotus Bud at top right */}
      <g transform="translate(168, 50) rotate(-20)">
        {/* Center petal */}
        <path
          d="M 0 0 C -4 -16, 0 -26, 0 -26 C 0 -26, 4 -16, 0 0 Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Left petal */}
        <path
          d="M 0 0 C -12 -10, -16 -20, -10 -22 C -4 -24, -2 -14, 0 0 Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right petal */}
        <path
          d="M 0 0 C 12 -10, 16 -20, 10 -22 C 4 -24, 2 -14, 0 0 Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* 4 Sacred Bottom Dots */}
      <circle cx="68" cy="184" r="3" fill={color} />
      <circle cx="84" cy="188" r="3" fill={color} />
      <circle cx="100" cy="190" r="3.5" fill={color} />
      <circle cx="116" cy="188" r="3" fill={color} />
    </svg>
  );
}


/**
 * ── Agni / Intensity Yogi Motif (Photo 2 - Left Reference) ─────────────────────────
 * Seated lotus yogi surrounded by flame aura with leaf flecks.
 */
export function AgniYogiMotif({
  size = 100,
  color = '#d9572b',
  strokeWidth = 2,
  className = '',
  style = {},
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`agni-yogi-motif ${className}`}
      style={{ display: 'block', ...style }}
    >
      {/* Flame Aura Outline */}
      <path
        d="M 80 15 
           C 95 30, 100 25, 115 45 
           C 125 58, 140 70, 135 92 
           C 130 115, 115 140, 80 145 
           C 45 140, 30 115, 25 92 
           C 20 70, 35 58, 45 45 
           C 60 25, 65 30, 80 15 Z"
        stroke={color}
        strokeWidth={strokeWidth * 0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 2"
        opacity="0.6"
      />

      {/* Flame Sparks */}
      <path
        d="M 40 38 L 48 30 M 120 38 L 112 30 M 20 80 L 12 75 M 140 80 L 148 75 M 80 8 L 80 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Yogi Head */}
      <circle cx="80" cy="52" r="12" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="80" cy="42" r="3" fill={color} /> {/* Topknot / Bindi */}

      {/* Yogi Body & Arms in Lotus Meditation */}
      <path
        d="M 80 64 C 70 70, 56 82, 54 96 C 52 110, 68 116, 80 116 C 92 116, 108 110, 106 96 C 104 82, 90 70, 80 64 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Infinity Lotus Leg Base */}
      <path
        d="M 50 116 C 36 116, 34 134, 52 134 C 68 134, 76 122, 80 118 C 84 122, 92 134, 108 134 C 126 134, 124 116, 110 116"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Floating Petal Flecks */}
      <path d="M 28 55 C 22 52, 22 60, 28 55 Z" fill={color} />
      <path d="M 132 55 C 138 52, 138 60, 132 55 Z" fill={color} />
    </svg>
  );
}


/**
 * ── Balance / Samata Yogi Motif (Photo 2 - Right Reference) ────────────────────────
 * Seated lotus yogi holding scales of balance with leaf vines.
 */
export function BalanceYogiMotif({
  size = 100,
  color = '#d9572b',
  strokeWidth = 2,
  className = '',
  style = {},
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`balance-yogi-motif ${className}`}
      style={{ display: 'block', ...style }}
    >
      {/* Yogi Head */}
      <circle cx="80" cy="48" r="11" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="80" cy="38" r="2.5" fill={color} />

      {/* Outstretched Arms holding Scales */}
      <path
        d="M 32 66 L 80 66 L 128 66"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Left Scale Pans */}
      <line x1="32" y1="66" x2="22" y2="84" stroke={color} strokeWidth={strokeWidth * 0.8} />
      <line x1="32" y1="66" x2="42" y2="84" stroke={color} strokeWidth={strokeWidth * 0.8} />
      <path d="M 18 84 L 46 84 L 32 94 Z" stroke={color} strokeWidth={strokeWidth * 0.85} strokeLinejoin="round" fill="none" />

      {/* Right Scale Pans */}
      <line x1="128" y1="66" x2="118" y2="84" stroke={color} strokeWidth={strokeWidth * 0.8} />
      <line x1="128" y1="66" x2="138" y2="84" stroke={color} strokeWidth={strokeWidth * 0.8} />
      <path d="M 114 84 L 142 84 L 128 94 Z" stroke={color} strokeWidth={strokeWidth * 0.85} strokeLinejoin="round" fill="none" />

      {/* Yogi Torso & Lap Hands */}
      <path
        d="M 80 60 L 80 94 M 64 78 C 68 88, 76 96, 80 96 C 84 96, 92 88, 96 78"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />

      {/* Infinity Lotus Leg Base */}
      <path
        d="M 50 114 C 36 114, 34 132, 52 132 C 68 132, 76 120, 80 116 C 84 120, 92 132, 108 132 C 126 132, 124 114, 110 114"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}


/**
 * ── Expansion / Sun Yogi Motif (Photo 2 - Bottom Reference) ────────────────────────
 * Seated lotus yogi with arms raised upward into sun rays and lotus base.
 */
export function ExpansionSunYogiMotif({
  size = 110,
  color = '#d9572b',
  strokeWidth = 2,
  className = '',
  style = {},
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`expansion-sun-yogi-motif ${className}`}
      style={{ display: 'block', ...style }}
    >
      {/* Radiant Sun Disc above head */}
      <circle cx="80" cy="24" r="9" fill={color} opacity="0.85" />
      <path
        d="M 80 6 L 80 10 M 80 38 L 80 42 M 62 24 L 66 24 M 94 24 L 98 24 M 67 11 L 70 14 M 93 11 L 90 14 M 67 37 L 70 34 M 93 37 L 90 34"
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
      />

      {/* Yogi Head */}
      <circle cx="80" cy="56" r="10" stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx="80" cy="47" r="2" fill={color} />

      {/* Arms Raised Upward (Prana Receptors / V Gesture) */}
      <path
        d="M 44 32 C 48 50, 68 66, 80 72 C 92 66, 112 50, 116 32"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />

      {/* Fingertip Light Rays */}
      <circle cx="44" cy="28" r="2" fill={color} />
      <circle cx="116" cy="28" r="2" fill={color} />

      {/* Torso & Lotus Legs */}
      <path
        d="M 80 66 L 80 100"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <path
        d="M 48 116 C 34 116, 32 134, 50 134 C 66 134, 76 122, 80 118 C 84 122, 94 134, 110 134 C 128 134, 126 116, 112 116"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Blooming Base Lotus Flower */}
      <g transform="translate(18, 124)">
        <path
          d="M 12 12 C 4 2, 0 -6, 0 -6 C 0 -6, -4 2, -12 12 C -18 19, -8 24, 0 24 C 8 24, 18 19, 12 12 Z"
          stroke={color}
          strokeWidth={strokeWidth * 0.85}
          fill="none"
        />
      </g>
    </svg>
  );
}


/**
 * ── Pure Decorative Yogic Motifs Row (No text or card boxes, pure icons for landing page) ───
 */
export function YogicArtisticBanner({ color = '#d9572b' }) {
  return (
    <div
      className="yogic-pure-icons-row animate-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-evenly',
        gap: 16,
        margin: '20px 0 24px',
        padding: '12px 0',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div className="yogic-pure-icon-item" style={{ transition: 'transform 0.3s ease', cursor: 'pointer' }}>
        <AgniYogiMotif size={72} color={color} strokeWidth={1.8} />
      </div>
      <div className="yogic-pure-icon-item" style={{ transition: 'transform 0.3s ease', cursor: 'pointer' }}>
        <BalanceYogiMotif size={72} color={color} strokeWidth={1.8} />
      </div>
      <div className="yogic-pure-icon-item" style={{ transition: 'transform 0.3s ease', cursor: 'pointer' }}>
        <ExpansionSunYogiMotif size={76} color={color} strokeWidth={1.8} />
      </div>
    </div>
  );
}

/**
 * ── Full-Screen Scattered Ambient Icons Layer ───────────────────────────────────────
 * Renders hand-drawn icons and logos floating gracefully across the entire screen backdrop.
 */
export function SacredBackgroundMotifsLayer({ color = '#d9572b' }) {
  return (
    <div
      className="sacred-bg-motifs-layer"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* 1. Top Left Floating Serpent Coil */}
      <div
        style={{
          position: 'absolute',
          top: '4%',
          left: '-20px',
          opacity: 0.18,
          transform: 'rotate(-12deg)',
          animation: 'serpent-float 8s ease-in-out infinite alternate',
        }}
      >
        <KundaliniSerpentSpiralMotif size={160} color={color} strokeWidth={1.6} />
      </div>

      {/* 2. Top Right Floating Agni Flame Yogi */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          right: '-15px',
          opacity: 0.16,
          transform: 'rotate(10deg)',
          animation: 'serpent-float 9s ease-in-out -2s infinite alternate',
        }}
      >
        <AgniYogiMotif size={140} color={color} strokeWidth={1.6} />
      </div>

      {/* 3. Mid Left Floating Balance Yogi */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '-10px',
          opacity: 0.15,
          transform: 'rotate(6deg)',
          animation: 'serpent-float 7.5s ease-in-out -1.5s infinite alternate',
        }}
      >
        <BalanceYogiMotif size={130} color={color} strokeWidth={1.6} />
      </div>

      {/* 4. Mid Right Floating Expansion Sun Yogi */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          right: '-10px',
          opacity: 0.18,
          transform: 'rotate(-8deg)',
          animation: 'serpent-float 8.5s ease-in-out -3s infinite alternate',
        }}
      >
        <ExpansionSunYogiMotif size={145} color={color} strokeWidth={1.6} />
      </div>

      {/* 5. Lower Left Kundalini Spiral Motif */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '2%',
          opacity: 0.16,
          transform: 'scaleX(-1) rotate(20deg)',
          animation: 'serpent-float 10s ease-in-out -4s infinite alternate',
        }}
      >
        <KundaliniSerpentSpiralMotif size={150} color={color} strokeWidth={1.6} />
      </div>

      {/* 6. Lower Right Agni Flame Yogi */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '2%',
          opacity: 0.15,
          transform: 'rotate(-15deg)',
          animation: 'serpent-float 9.5s ease-in-out -1s infinite alternate',
        }}
      >
        <AgniYogiMotif size={135} color={color} strokeWidth={1.6} />
      </div>
    </div>
  );
}

/**
 * ── Pure Icons Stream Section (No Cards or Text) ───────────────────────────────────
 */
export function SacredIconsGridSection({ color = '#d9572b' }) {
  return (
    <div
      className="sacred-icons-pure-row animate-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-evenly',
        flexWrap: 'wrap',
        gap: 20,
        margin: '24px 0 32px',
        padding: '16px 0',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ animation: 'serpent-float 7s ease-in-out infinite alternate' }}>
        <KundaliniSerpentSpiralMotif size={88} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ animation: 'serpent-float 8.5s ease-in-out -1.5s infinite alternate' }}>
        <AgniYogiMotif size={82} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ animation: 'serpent-float 6.5s ease-in-out -3s infinite alternate' }}>
        <BalanceYogiMotif size={82} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ animation: 'serpent-float 9s ease-in-out -2s infinite alternate' }}>
        <ExpansionSunYogiMotif size={88} color={color} strokeWidth={1.8} />
      </div>
    </div>
  );
}

