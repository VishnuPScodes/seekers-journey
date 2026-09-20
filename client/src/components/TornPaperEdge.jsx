import React from 'react';

export default function TornPaperEdge({
  fill = '#f4efd8',
  bannerColor = '#d9572b',
  height = 28
}) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
      lineHeight: 0,
      marginTop: -1,
      pointerEvents: 'none',
    }}>
      <svg
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: `${height}px` }}
      >
        {/* Soft watercolor paint glow layer underneath */}
        <path
          d="M0,0 L1200,0 L1200,16 C1150,34 1100,12 1050,26 C1000,14 950,36 900,18 C850,8 800,28 750,14 C700,28 650,10 600,26 C550,12 500,32 450,16 C400,6 350,28 300,14 C250,26 200,10 150,24 C100,12 50,28 0,16 Z"
          fill={bannerColor}
          opacity="0.4"
        />

        {/* Main organic watercolor paint brush edge transition */}
        <path
          d="M0,0 L1200,0 L1200,10 C1160,28 1120,4 1080,22 C1040,12 1000,34 960,18 C920,4 880,28 840,14 C800,26 760,8 720,24 C680,10 640,30 600,14 C560,4 520,26 480,12 C440,28 400,10 360,22 C320,8 280,30 240,14 C200,4 160,26 120,12 C80,28 40,8 0,20 Z"
          fill={fill}
        />

        {/* Organic watercolor paint splatter & brush flecks */}
        <g fill={bannerColor} opacity="0.8">
          <circle cx="55" cy="28" r="2.2" />
          <circle cx="125" cy="34" r="1.8" />
          <circle cx="215" cy="30" r="2.5" />
          <circle cx="310" cy="35" r="1.6" />
          <circle cx="395" cy="27" r="2.3" />
          <circle cx="485" cy="33" r="1.9" />
          <circle cx="570" cy="29" r="2.4" />
          <circle cx="660" cy="34" r="1.7" />
          <circle cx="755" cy="28" r="2.1" />
          <circle cx="845" cy="33" r="1.5" />
          <circle cx="935" cy="29" r="2.6" />
          <circle cx="1030" cy="35" r="1.8" />
          <circle cx="1120" cy="27" r="2.2" />
        </g>
      </svg>
    </div>
  );
}
