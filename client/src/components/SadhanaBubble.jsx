import React, { useState, useCallback } from 'react';
import { PRACTICE_ICONS } from '../utils/practiceIcons';
import { Hand } from 'lucide-react';

export default function SadhanaBubble({ name, totalTaps = 0, onTap, disabled = false }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localTaps, setLocalTaps] = useState(totalTaps);
  const [scoreFloat, setScoreFloat] = useState(null);
  const [floatKey, setFloatKey] = useState(0);

  const handleTap = useCallback((e) => {
    if (disabled || isAnimating) return;

    // Ripple effect
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'bubble-ripple';
    const size = 80;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);

    // Animate the card
    setIsAnimating(true);
    setLocalTaps(prev => prev + 1);
    setFloatKey(k => k + 1);
    setScoreFloat('+10');
    setTimeout(() => {
      setIsAnimating(false);
      setScoreFloat(null);
    }, 700);

    onTap && onTap(name);
  }, [disabled, isAnimating, name, onTap]);

  const taps = localTaps;
  const glowIntensity = Math.min(taps * 0.15, 1);

  return (
    <div
      className={`sadhana-bubble ${isAnimating ? 'bubble-tap' : ''} ${taps > 0 ? 'bubble-active' : ''}`}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${taps} taps today`}
      onKeyDown={(e) => e.key === 'Enter' && handleTap(e)}
      style={{
        '--glow-opacity': glowIntensity,
        '--tap-count': taps,
      }}
    >
      {/* Score float-up animation */}
      {scoreFloat && (
        <span key={floatKey} className="bubble-score-float">
          {scoreFloat}
        </span>
      )}

      {/* Glow ring */}
      <div className="bubble-glow-ring" />

      {/* Icon */}
      <div className="bubble-icon">
        {PRACTICE_ICONS[name] || <Hand size={28} strokeWidth={1.5} />}
      </div>

      {/* Name */}
      <div className="bubble-name">{name}</div>

      {/* Tap count badge */}
      {taps > 0 && (
        <div className="bubble-count-badge">
          {taps}×
        </div>
      )}

      {/* Water ripple layers for the "floating stone" look */}
      <div className="bubble-water-surface" />
    </div>
  );
}
