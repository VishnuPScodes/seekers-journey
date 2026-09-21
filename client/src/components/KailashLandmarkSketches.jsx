import React from 'react';

// Realistic 3D landmark images for each major sacred destination
import adiyogiImg from '../assets/landmarks/adiyogi.png';
import kodaikanalImg from '../assets/landmarks/kodaikanal.png';
import hampiImg from '../assets/landmarks/hampi.png';
import tirupatiImg from '../assets/landmarks/tirupati.png';
import ujjainImg from '../assets/landmarks/ujjain.png';
import dwarkaImg from '../assets/landmarks/dwarka.png';
import varanasiImg from '../assets/landmarks/varanasi.png';
import kedarnathImg from '../assets/landmarks/kedarnath.png';
import spitiImg from '../assets/landmarks/spiti.png';
import manasarovarImg from '../assets/landmarks/manasarovar.png';
import kailashImg from '../assets/landmarks/kailash.png';

/**
 * Renders a realistic circular landmark image anchored to a destination point
 * on the Kailash Journey SVG map.
 */
function LandmarkImage({ src, size, alt, borderColor, x, y, offsetX, offsetY, opacity = 0.92 }) {
  const imgSize = size;
  const posX = x + offsetX;
  const posY = y + offsetY;
  const clipId = `clip-${alt.replace(/\s+/g, '-')}`;

  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={posX + imgSize / 2} cy={posY + imgSize / 2} r={imgSize / 2} />
        </clipPath>
      </defs>
      {/* Outer glow ring */}
      <circle
        cx={posX + imgSize / 2}
        cy={posY + imgSize / 2}
        r={imgSize / 2 + 3}
        fill="none"
        stroke={borderColor}
        strokeWidth="2"
        opacity="0.5"
      />
      {/* Inner border ring */}
      <circle
        cx={posX + imgSize / 2}
        cy={posY + imgSize / 2}
        r={imgSize / 2}
        fill="none"
        stroke={borderColor}
        strokeWidth="1.5"
      />
      {/* Realistic image inside circular clip */}
      <image
        href={src}
        x={posX}
        y={posY}
        width={imgSize}
        height={imgSize}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </g>
  );
}

/**
 * Renders the realistic landmark image anchored directly to a specific
 * major location point on the Kailash map.
 */
export function LandmarkSketchAnchor({ level, pt, color }) {
  if (!pt) return null;
  const [x, y] = pt;

  switch (level) {
    case 1:
      return (
        <LandmarkImage
          src={adiyogiImg}
          size={100}
          alt="Adiyogi Isha Yoga Center"
          borderColor={color || '#d9572b'}
          x={x} y={y}
          offsetX={-120} offsetY={-70}
        />
      );
    case 10:
      return (
        <LandmarkImage
          src={kodaikanalImg}
          size={95}
          alt="Kodaikanal Hills"
          borderColor={color || '#7c3aed'}
          x={x} y={y}
          offsetX={28} offsetY={-65}
        />
      );
    case 20:
      return (
        <LandmarkImage
          src={hampiImg}
          size={100}
          alt="Hampi Virupaksha Temple"
          borderColor={color || '#059669'}
          x={x} y={y}
          offsetX={-118} offsetY={-60}
        />
      );
    case 30:
      return (
        <LandmarkImage
          src={tirupatiImg}
          size={95}
          alt="Tirupati Balaji Temple"
          borderColor={color || '#d97706'}
          x={x} y={y}
          offsetX={28} offsetY={-60}
        />
      );
    case 41:
      return (
        <LandmarkImage
          src={ujjainImg}
          size={100}
          alt="Ujjain Mahakaleshwar Temple"
          borderColor={color || '#ef4444'}
          x={x} y={y}
          offsetX={-118} offsetY={-60}
        />
      );
    case 51:
      return (
        <LandmarkImage
          src={dwarkaImg}
          size={95}
          alt="Dwarka Dwarkadhish Temple"
          borderColor={color || '#f97316'}
          x={x} y={y}
          offsetX={28} offsetY={-60}
        />
      );
    case 64:
      return (
        <LandmarkImage
          src={varanasiImg}
          size={100}
          alt="Varanasi Kashi Ganga Ghat"
          borderColor={color || '#3b82f6'}
          x={x} y={y}
          offsetX={-118} offsetY={-60}
        />
      );
    case 79:
      return (
        <LandmarkImage
          src={kedarnathImg}
          size={100}
          alt="Kedarnath Temple"
          borderColor={color || '#0e7490'}
          x={x} y={y}
          offsetX={28} offsetY={-65}
        />
      );
    case 87:
      return (
        <LandmarkImage
          src={spitiImg}
          size={95}
          alt="Spiti Key Monastery"
          borderColor={color || '#8b5cf6'}
          x={x} y={y}
          offsetX={-118} offsetY={-60}
        />
      );
    case 101:
      return (
        <LandmarkImage
          src={manasarovarImg}
          size={100}
          alt="Lake Manasarovar"
          borderColor={color || '#a78bfa'}
          x={x} y={y}
          offsetX={28} offsetY={-60}
        />
      );
    case 108:
      return (
        <LandmarkImage
          src={kailashImg}
          size={115}
          alt="Mount Kailash Summit"
          borderColor={color || '#fbbf24'}
          x={x} y={y}
          offsetX={40} offsetY={-85}
          opacity={0.95}
        />
      );
    default:
      return null;
  }
}

// Keep ClassicalTempleDanceSketch as SVG (used in Hampi popup card)
export function ClassicalTempleDanceSketch({ size = 56, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crown / Topknot / Bindi */}
      <circle cx="50" cy="18" r="2.5" fill={color} />
      <path d="M 46 14 C 46 10, 54 10, 54 14 Z" stroke={color} strokeWidth="1.6" fill="none" />
      {/* Dancer Head */}
      <circle cx="50" cy="25" r="7" stroke={color} strokeWidth="1.8" fill="none" />
      {/* Classical Nataraja / Tribhanga Body Pose */}
      <path d="M 28 28 C 36 34, 44 36, 50 36 C 56 36, 64 34, 72 28" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="27" r="2.2" fill={color} />
      <circle cx="74" cy="27" r="2.2" fill={color} />
      {/* Torso & Hip Bend */}
      <path d="M 50 33 L 48 56 M 48 56 L 52 70" stroke={color} strokeWidth="2.0" strokeLinecap="round" />
      {/* Raised Dance Leg */}
      <path d="M 48 56 C 36 62, 32 72, 42 78 C 48 82, 54 74, 52 70" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Standing Foot & Ghungroo */}
      <path d="M 52 70 L 52 88 L 64 88" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="48" cy="86" r="1.5" fill={color} />
      <circle cx="52" cy="86" r="1.5" fill={color} />
      <circle cx="56" cy="86" r="1.5" fill={color} />
      {/* Lotus Base */}
      <path d="M 24 90 C 40 82, 60 82, 76 90" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
