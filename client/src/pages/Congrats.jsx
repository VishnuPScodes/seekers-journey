import React, { useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

import { Hand, Star, Trophy, Wind, Sunrise, LineChart } from 'lucide-react';
import { PRACTICE_ICONS } from '../utils/practiceIcons';

// Scoring constants live in server/config/pointRules.js — the frontend reads
// per-practice score directly from p.score returned in the SadhanaLog.
// KAPALABHATI_SCORES kept here only for the bonus display breakdown in the UI.
const KAPALABHATI_SCORES = { 20: 5, 50: 10, 100: 20, 150: 30, 200: 45 };

const SADHGURU_QUOTES = [
  "Only when your attention and involvement is indiscriminate, does the universe open up to you.",
  "Sadhana is not about going somewhere. Sadhana is a device to bring you to a certain level of maturity where the need to go somewhere is gone.",
  "Sadhana is always structured like this: First, you establish balance, then intensity. Intensity without balance can lead you completely off course.",
  "Spirituality means to crank up your life to the highest pitch of intensity. Don't think spirituality means having a nice, quiet life—it means being on fire.",
  "Devotion is when your involvement with life is so absolute that you yourself do not matter anymore.",
  "Spiritual process is not for the dead or the dying. It is for the living who want to become fully alive in all dimensions of life.",
  "Spirituality has nothing to do with the atmosphere you live in. It's about the atmosphere you create within yourself.",
  "The spiritual process has nothing to do with the outside—it is something that happens within you.",
  "Spiritual process is not about going to heaven someday. It is about knowing life in all its profoundness.",
  "Being on the spiritual path means understanding that the source of your trouble and the source of your wellbeing are within you.",
  "The most important thing is that you bring some quality to what you do. Whatever you do, you do it as an offering.",
];

// ─── Canvas Confetti ─────────────────────────────────────────────────────────
function useConfetti(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#a78bfa', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#c084fc'];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 12 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 5,
      opacity: Math.random() * 0.5 + 0.5,
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef]);
}

export default function Congrats() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef(null);

  useConfetti(canvasRef);

  // Pick a random quote once per visit (stable across re-renders)
  const quote = useMemo(
    () => SADHGURU_QUOTES[Math.floor(Math.random() * SADHGURU_QUOTES.length)],
    []
  );

  const practices = state?.practices || [];
  const totalScore = state?.totalScore ?? 0;
  const isPerfectDay = state?.isPerfectDay ?? false;
  const donePractices = practices.filter(p => p.count > 0);

  return (
    <>
      <Navbar />
      <div className="page" style={{ minHeight: '100vh', alignItems: 'center' }}>
        <canvas ref={canvasRef} className="congrats-canvas" />

      <div className="container-lg animate-in">
        <div className="glass-card congrats-content">
          <span className="congrats-emoji" style={{ display: 'flex', justifyContent: 'center' }}><Hand size={36} strokeWidth={1.5} /></span>

          <h1 className="congrats-title">Sadhana Complete!</h1>

          <p className="congrats-subtitle">
            Wonderful, {user?.name?.split(' ')[0] || 'seeker'}! Your daily
            practice is complete. Consistency is the key to transformation.
          </p>

          <p className="congrats-sanskrit">ॐ तत् सत्</p>

          {/* Score Badge */}
          <div className="score-badge-row">
            <div className="score-badge">
              <span className="score-badge-icon" style={{ display: 'flex' }}><Star size={20} /></span>
              <span className="score-badge-value">{totalScore}</span>
              <span className="score-badge-label">points earned</span>
            </div>
            {isPerfectDay && (
              <div className="perfect-day-badge">
                <Trophy size={14} style={{ display: 'inline', marginRight: 4 }} /> Perfect Day! <span style={{ fontSize: 11, opacity: 0.8 }}>+20 bonus</span>
              </div>
            )}
          </div>

          {/* Practice summary */}
          {donePractices.length > 0 && (
            <div className="congrats-summary">
              <div style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: 8,
              }}>
                Today's Summary
              </div>

              {donePractices.map(p => (
                <div key={p.name} className="summary-item">
                  <span style={{ display: 'flex' }}>{PRACTICE_ICONS[p.name] || <Hand size={20} />}</span>
                  <div style={{ flex: 1 }}>
                    <div>{p.name}</div>
                    {p.name === 'Shakti Chalana Kriya' && p.kapalabhatiCount && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        <Wind size={12} style={{ display: 'inline', marginRight: 4 }} /> {p.kapalabhatiCount} kapalabhatis
                        {KAPALABHATI_SCORES[p.kapalabhatiCount] && (
                          <span style={{ color: 'var(--amber-400)', marginLeft: 6 }}>
                            +{KAPALABHATI_SCORES[p.kapalabhatiCount]} pts bonus
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 10 }}>
                    +{p.score ?? (p.count === 1 ? 10 : 25)} pts
                  </span>
                  <span className={`summary-item-count count-${p.count}`}>
                    {p.count === 1 ? '1× done' : '2× done'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quote */}
          <div style={{
            padding: '14px 18px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: 12,
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            marginBottom: 24,
            lineHeight: 1.7,
          }}>
            "{quote}" — Sadhguru
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              id="congrats-continue-btn"
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              <Sunrise size={18} style={{ display: 'inline', marginRight: 8 }} /> Return Home
            </button>
            <Link
              to="/progress"
              className="btn btn-outline"
              id="congrats-progress-btn"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LineChart size={18} style={{ display: 'inline', marginRight: 8 }} /> View Progress
            </Link>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>
            Your log has been saved for today
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
