import React from 'react';

export default function TornPaperEdge({ fill = '#f4efd8', bannerColor = '#d9572b', height = 34 }) {
  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', lineHeight: 0, marginTop: -1 }}>
      <svg
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: `${height}px`, fill }}
      >
        {/* Main jagged torn manuscript paper boundary */}
        <path d="M0,0 L1200,0 L1200,12 C1170,28 1140,8 1110,24 C1080,14 1050,32 1020,18 C990,6 960,28 930,14 C900,24 870,10 840,26 C810,12 780,30 750,16 C720,5 690,26 660,12 C630,28 600,14 570,25 C540,10 510,29 480,16 C450,6 420,27 390,14 C360,26 330,10 300,25 C270,12 240,29 210,15 C180,6 150,26 120,14 C90,28 60,10 30,24 L0,12 Z" />
        
        {/* Organic torn paper splatter flecks matching template image */}
        <g fill={bannerColor} opacity="0.85">
          <circle cx="45" cy="28" r="1.8" />
          <circle cx="95" cy="32" r="2.2" />
          <circle cx="155" cy="29" r="1.5" />
          <circle cx="215" cy="34" r="2.4" />
          <circle cx="285" cy="30" r="1.9" />
          <circle cx="345" cy="33" r="2.1" />
          <circle cx="415" cy="31" r="1.7" />
          <circle cx="475" cy="35" r="2.3" />
          <circle cx="535" cy="28" r="1.6" />
          <circle cx="615" cy="33" r="2.0" />
          <circle cx="685" cy="30" r="1.8" />
          <circle cx="745" cy="34" r="2.2" />
          <circle cx="815" cy="29" r="1.5" />
          <circle cx="875" cy="32" r="2.4" />
          <circle cx="945" cy="31" r="1.9" />
          <circle cx="1015" cy="34" r="2.1" />
          <circle cx="1085" cy="30" r="1.7" />
          <circle cx="1145" cy="33" r="2.2" />
        </g>
      </svg>
    </div>
  );
}
