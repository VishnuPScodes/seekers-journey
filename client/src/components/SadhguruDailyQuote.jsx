import React, { useState, useEffect } from 'react';
import { Quote, Sparkles } from 'lucide-react';
import api from '../api';
import { HandDrawnBrushBorder } from './HandDrawnNavbarEdge';


// ── Hand-Drawn Lotus & Flower Sketch Component (Artifact Style) ───────────────
function HandDrawnFlowerSketch({ size = 76, color = '#d9572b', opacity = 0.85, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', opacity, ...style }}
    >
      {/* Central blooming lotus petal */}
      <path
        d="M 50 14 C 44 30, 47 46, 50 56 C 53 46, 56 30, 50 14 Z"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="rgba(217, 87, 43, 0.08)"
      />
      {/* Mid lotus petals */}
      <path
        d="M 50 56 C 37 42, 27 32, 21 24 C 27 38, 37 48, 50 56 Z"
        stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="rgba(217, 87, 43, 0.05)"
      />
      <path
        d="M 50 56 C 63 42, 73 32, 79 24 C 73 38, 63 48, 50 56 Z"
        stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="rgba(217, 87, 43, 0.05)"
      />
      {/* Outer lotus petals */}
      <path
        d="M 50 56 C 32 48, 14 45, 8 38 C 17 50, 33 57, 50 56 Z"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M 50 56 C 68 48, 86 45, 92 38 C 83 50, 67 57, 50 56 Z"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Base lotus stem flourish & water lines */}
      <path d="M 18 64 C 34 70, 66 70, 82 64" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <path d="M 28 72 C 40 76, 60 76, 72 72" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      {/* Dew drop & radiance particles */}
      <circle cx="50" cy="8" r="1.5" fill={color} />
      <circle cx="21" cy="18" r="1.2" fill={color} opacity="0.75" />
      <circle cx="79" cy="18" r="1.2" fill={color} opacity="0.75" />
      <circle cx="8" cy="34" r="1" fill={color} opacity="0.6" />
      <circle cx="92" cy="34" r="1" fill={color} opacity="0.6" />
    </svg>
  );
}

export default function SadhguruDailyQuote() {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      try {
        const { data } = await api.get('/insights/sadhguru-quote');
        if (isMounted && data.success && data.quote) {
          setQuoteData(data.quote);
        }
      } catch (err) {
        console.error('Failed to load Sadhguru quote:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuote();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div
        className="glass-card quote-skeleton-card animate-pulse"
        style={{
          padding: '22px 26px',
          marginBottom: 20,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(238, 226, 198, 0.7), rgba(245, 238, 222, 0.85))',
          border: '1.5px solid rgba(217, 87, 43, 0.25)',
          minHeight: 110,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: 12
        }}
      >
        <Sparkles size={18} className="animate-spin" style={{ color: '#d9572b', opacity: 0.7 }} />
        <span style={{ fontSize: 13, color: '#6e6454', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
          Fetching Daily Wisdom from Sadhguru...
        </span>
      </div>
    );
  }

  const quote = quoteData || {
    title: 'Daily Wisdom',
    text: 'The seed of Enlightenment is there in every being. Enlightenment is a realization.',
    imageUrl: 'https://static.sadhguru.org/d/46272/1790128806-image_1790068446_9792.jpg',
    url: 'https://isha.sadhguru.org/en/wisdom/type/quotes'
  };

  return (
    <div
      className="sadhguru-quote-container animate-in"
      style={{
        marginBottom: 20,
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        className="sadhguru-quote-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(244, 234, 210, 0.94) 0%, rgba(238, 224, 192, 0.96) 100%)',
          boxShadow: '0 10px 30px rgba(217, 87, 43, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
          border: 'none',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Organic Hand-Drawn Painted Brush Border Overlay */}
        <HandDrawnBrushBorder color="#d9572b" strokeWidth={2} opacity={0.65} />

        {/* Top-Right Decorative Flower Lotus Artwork (Artifact Hand-Drawn Style) */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: 8,
            pointerEvents: 'none',
            opacity: 0.28,
            transform: 'rotate(15deg)',
          }}
        >
          <HandDrawnFlowerSketch size={92} color="#d9572b" />
        </div>

        {/* Bottom-Left Decorative Flower Flourish */}
        <div
          style={{
            position: 'absolute',
            bottom: -16,
            left: -12,
            pointerEvents: 'none',
            opacity: 0.18,
            transform: 'rotate(-40deg) scaleX(-1)',
          }}
        >
          <HandDrawnFlowerSketch size={84} color="#d9572b" />
        </div>

        {/* Radial warm orange ambient background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-5%',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(217, 87, 43, 0.14) 0%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none',
            borderRadius: '50%',
          }}
        />

        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* Quote Image thumbnail with orange/gold halo */}
          {quote.imageUrl && (
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                border: '2px solid #d9572b',
                boxShadow: '0 4px 14px rgba(217, 87, 43, 0.28), 0 0 0 3px rgba(217, 87, 43, 0.12)',
              }}
            >
              <img
                src={quote.imageUrl}
                alt="Sadhguru Daily Quote"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Quote Text & Attribution */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ position: 'relative', paddingLeft: 22 }}>
              <Quote
                size={16}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 2,
                  color: '#d9572b',
                  opacity: 0.85,
                  transform: 'scaleX(-1)',
                }}
              />
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: '#3e382d',
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 600,
                  letterSpacing: '0.2px',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                "{quote.text}"
              </p>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#d9572b',
                  textAlign: 'right',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'flex-end',
                  gap: 6,
                }}
              >
                <span>— Sadhguru</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
