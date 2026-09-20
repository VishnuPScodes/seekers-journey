import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PRACTICE_ICONS } from '../utils/practiceIcons';
import { Hand, Check } from 'lucide-react';

export default function SadhanaBubble({
  name,
  rotate = 0,
  totalTaps = 0,
  dailyTarget = 2,
  onTap,
  onDrag,
  onDragEnd,
  disabled = false,
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localTaps, setLocalTaps] = useState(totalTaps);
  const [scoreFloat, setScoreFloat] = useState(null);
  const [floatKey, setFloatKey] = useState(0);

  const dragStart = useRef(null);
  const hasDragged = useRef(false);

  useEffect(() => {
    setLocalTaps(totalTaps);
  }, [totalTaps]);

  const isDone = localTaps >= dailyTarget;

  const handleTap = useCallback((e) => {
    if (disabled || isAnimating || hasDragged.current) return;

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

  // Mouse Drag Handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 || disabled) return;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent) => {
      if (!dragStart.current) return;
      const dx = moveEvent.clientX - dragStart.current.x;
      const dy = moveEvent.clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) > 5) {
        hasDragged.current = true;
        onDrag && onDrag(name, dx, dy);
      }
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragStart.current && hasDragged.current) {
        const dx = upEvent.clientX - dragStart.current.x;
        const dy = upEvent.clientY - dragStart.current.y;
        onDragEnd && onDragEnd(name, dx, dy);
      }
      dragStart.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [disabled, name, onDrag, onDragEnd]);

  // Touch Drag Handlers
  const handleTouchStart = useCallback((e) => {
    if (disabled || e.touches.length !== 1) return;
    const t = e.touches[0];
    hasDragged.current = false;
    dragStart.current = { x: t.clientX, y: t.clientY };

    const handleTouchMove = (moveEvent) => {
      if (!dragStart.current || moveEvent.touches.length !== 1) return;
      const mt = moveEvent.touches[0];
      const dx = mt.clientX - dragStart.current.x;
      const dy = mt.clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) > 5) {
        hasDragged.current = true;
        onDrag && onDrag(name, dx, dy);
      }
    };

    const handleTouchEnd = (endEvent) => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (dragStart.current && hasDragged.current && endEvent.changedTouches.length > 0) {
        const et = endEvent.changedTouches[0];
        const dx = et.clientX - dragStart.current.x;
        const dy = et.clientY - dragStart.current.y;
        onDragEnd && onDragEnd(name, dx, dy);
      }
      dragStart.current = null;
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  }, [disabled, name, onDrag, onDragEnd]);

  const taps = localTaps;
  const glowIntensity = Math.min(taps * 0.2, 1);

  return (
    <div
      className={`sadhana-bubble ${isAnimating ? 'bubble-tap' : ''} ${taps > 0 ? 'bubble-active' : ''} ${isDone ? 'bubble-done' : ''}`}
      onClick={handleTap}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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

      {/* ── Inner content container counter-rotated so text stays 100% straight & upright ── */}
      <div
        className="bubble-inner-content"
        style={{
          transform: rotate ? `rotate(${-rotate}deg)` : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Icon */}
        <div className="bubble-icon">
          {PRACTICE_ICONS[name] || <Hand size={28} strokeWidth={1.5} />}
        </div>

        {/* Practice Name — Always 100% Straight */}
        <div className="bubble-name">{name}</div>

        {/* If done, show subtle prompt that seeker can record another session */}
        {isDone && (
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, opacity: 0.8 }}>
            + record more
          </div>
        )}
      </div>

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

      {/* Water ripple layers for the "floating stone" look */}
      <div className="bubble-water-surface" />
    </div>
  );
}
