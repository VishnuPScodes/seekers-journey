import React from 'react';

/**
 * HandDrawnNavbarEdge
 * Renders an organic hand-drawn painted wave curve at the bottom edge of the navbar,
 * complete with delicate hand-drawn leaf vine flourishes and paint flecks.
 */
export default function HandDrawnNavbarEdge({
  fill = '#d9572b',
  height = 36,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        width: '100%',
        overflow: 'hidden',
        lineHeight: 0,
        pointerEvents: 'none',
        zIndex: 99,
        marginTop: -1,
      }}
    >
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: `${height}px` }}
      >
        {/* Soft painted watercolor shadow curve underneath */}
        <path
          d="M 0,0 L 1440,0 L 1440,16 C 1320,38 1200,10 1080,32 C 960,12 840,40 720,18 C 600,36 480,8 360,28 C 240,12 120,34 0,18 Z"
          fill="rgba(180, 60, 20, 0.35)"
        />

        {/* Main Organic Terracotta Hand-Drawn Wavy Stroke */}
        <path
          d="M 0,0 L 1440,0 L 1440,12 C 1340,34 1220,6 1100,28 C 980,8 860,36 740,14 C 620,32 500,4 380,24 C 260,8 140,30 0,14 Z"
          fill={fill}
        />

        {/* ── Left Hand-Drawn Organic Leaf & Vine Flourish Motif ── */}
        <g transform="translate(40, 6)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Main sweeping vine stem */}
          <path d="M 0,14 C 40,-2 90,16 140,6 C 180,-2 220,12 260,4" />
          {/* Leaf 1 */}
          <path d="M 25,8 C 20,2 28,-4 34,4 C 30,8 26,9 25,8 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 2 */}
          <path d="M 50,10 C 58,15 66,11 62,3 C 55,3 51,7 50,10 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 3 */}
          <path d="M 80,8 C 78,0 88,-6 94,1 C 90,6 84,7 80,8 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 4 */}
          <path d="M 110,9 C 118,13 124,7 120,-1 C 113,0 111,5 110,9 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 5 */}
          <path d="M 150,7 C 146,0 156,-5 162,2 C 158,7 153,8 150,7 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 6 */}
          <path d="M 195,6 C 202,10 208,4 204,-4 C 198,-3 196,2 195,6 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Berries / Dots */}
          <circle cx="38" cy="13" r="1.6" fill="#ffffff" />
          <circle cx="92" cy="12" r="1.6" fill="#ffffff" />
          <circle cx="170" cy="10" r="1.6" fill="#ffffff" />
        </g>

        {/* ── Right Hand-Drawn Organic Leaf & Vine Flourish Motif ── */}
        <g transform="translate(1120, 6)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Main sweeping vine stem */}
          <path d="M 0,4 C 40,14 80,-2 130,12 C 170,2 210,14 260,4" />
          {/* Leaf 1 */}
          <path d="M 20,6 C 16,0 24,-6 30,2 C 26,6 22,7 20,6 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 2 */}
          <path d="M 50,9 C 58,14 66,10 62,2 C 55,2 51,6 50,9 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 3 */}
          <path d="M 85,5 C 83,-3 93,-8 99,-1 C 95,4 89,5 85,5 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 4 */}
          <path d="M 120,7 C 128,11 134,5 130,-3 C 123,-2 121,3 120,7 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Leaf 5 */}
          <path d="M 165,5 C 162,-2 172,-7 178,0 C 174,5 168,6 165,5 Z" fill="rgba(255, 255, 255, 0.45)" />
          {/* Berries */}
          <circle cx="34" cy="11" r="1.6" fill="#ffffff" />
          <circle cx="102" cy="10" r="1.6" fill="#ffffff" />
          <circle cx="148" cy="9" r="1.6" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

/**
 * HandDrawnTileTop
 * Mini hand-drawn painted wave curve SVG for the top edge of Sadhana Shrine Tile cards.
 */
export function HandDrawnTileTop({ fill = '#d9572b', height = 18 }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        overflow: 'hidden',
        lineHeight: 0,
        pointerEvents: 'none',
        zIndex: 4,
        borderTopLeftRadius: '14px',
        borderTopRightRadius: '14px',
      }}
    >
      <svg
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: `${height}px` }}
      >
        {/* Watercolor shadow curve */}
        <path
          d="M 0,0 L 200,0 L 200,8 C 160,22 130,4 100,16 C 70,4 40,22 0,8 Z"
          fill="rgba(180, 60, 20, 0.25)"
        />
        {/* Main painted wavy stroke matching navbar */}
        <path
          d="M 0,0 L 200,0 L 200,6 C 160,18 130,2 100,13 C 70,2 40,18 0,6 Z"
          fill={fill}
        />
        {/* Lotus dot at apex */}
        <circle cx="100" cy="6.5" r="2.2" fill="#ffffff" />
      </svg>
    </div>
  );
}

/**
 * HandDrawnBannerHeader
 * Hand-drawn wavy terracotta banner header with curved bottom edge and vine flourish.
 */
export function HandDrawnBannerHeader({ title, subtitle }) {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#d9572b',
        color: '#ffffff',
        padding: '12px 24px 16px',
        borderRadius: '16px 16px 0 0',
        textAlign: 'center',
        margin: '0 auto 24px',
        maxWidth: '560px',
        boxShadow: '0 6px 18px rgba(217, 87, 43, 0.28)',
      }}
    >
      <div
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '19px',
          fontWeight: '700',
          letterSpacing: '0.6px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#ffffff',
          textShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }}
      >
        <span style={{ fontSize: '15px' }}>✨</span>
        <span>{title}</span>
        <span style={{ fontSize: '15px' }}>✨</span>
      </div>

      {subtitle && (
        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', fontWeight: '500' }}>
          {subtitle}
        </div>
      )}

      {/* Hand-Drawn Wavy Bottom Edge SVG */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          width: '100%',
          overflow: 'hidden',
          lineHeight: 0,
          pointerEvents: 'none',
          marginTop: -1,
        }}
      >
        <svg
          viewBox="0 0 560 24"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '18px' }}
        >
          <path
            d="M 0,0 L 560,0 L 560,6 C 450,22 360,4 270,15 C 180,4 90,22 0,6 Z"
            fill="#d9572b"
          />
        </svg>
      </div>
    </div>
  );
}

