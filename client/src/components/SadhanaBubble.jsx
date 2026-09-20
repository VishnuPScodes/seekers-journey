import React, { useState, useCallback, useEffect } from 'react';
import { PRACTICE_ICONS } from '../utils/practiceIcons';
import { Hand, Check } from 'lucide-react';

export default function SadhanaBubble({
  name,
  totalTaps = 0,
  dailyTarget = 2,
  onTap,
  disabled = false,
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localTaps, setLocalTaps] = useState(totalTaps);
  const [scoreFloat, setScoreFloat] = useState(null);
  const [floatKey, setFloatKey] = useState(0);

  useEffect(() => {
    setLocalTaps(totalTaps);
  }, [totalTaps]);

  const isDone = localTaps >= dailyTarget;

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
    const nextTaps = localTaps + 1;
    setLocalTaps(nextTaps);
    setFloatKey(k => k + 1);

    // If beyond target, still recorded but doesn't add score
    if (localTaps >= dailyTarget) {
      setScoreFloat('✓ recorded');
    } else if (localTaps === 0) {
      setScoreFloat('+10');
    } else {
      setScoreFloat('+15');
    }

    setTimeout(() => {
      setIsAnimating(false);
      setScoreFloat(null);
    }, 750);

    onTap && onTap(name);
  }, [disabled, isAnimating, localTaps, dailyTarget, name, onTap]);

  const taps = localTaps;
  const glowIntensity = Math.min(taps * 0.2, 1);

  return (
    <div
      className={`sadhana-bubble ${isAnimating ? 'bubble-tap' : ''} ${taps > 0 ? 'bubble-active' : ''} ${isDone ? 'bubble-done' : ''}`}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${taps} of ${dailyTarget} completed`}
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

      {/* Target & Tap count badge */}
      <div className={`bubble-count-badge ${isDone ? 'badge-done' : ''}`}>
        {isDone ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Check size={12} strokeWidth={3} /> {taps}/{dailyTarget}
          </span>
        ) : (
          <span>{taps}/{dailyTarget}</span>
        )}
      </div>

      {/* If done, show subtle prompt that seeker can record another session */}
      {isDone && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, opacity: 0.8 }}>
          + record more
        </div>
      )}

      {/* Water ripple layers for the "floating stone" look */}
      <div className="bubble-water-surface" />
    </div>
  );
}
