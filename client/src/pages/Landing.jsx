import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SadhanaBubble from '../components/SadhanaBubble';
import { useAuth } from '../context/AuthContext';
import { Calendar, Mountain, Zap, Star } from 'lucide-react';
import api from '../api';
import { getLocation, getLevelProgress, getPointsToNextLevel, POINTS_PER_LEVEL } from '../utils/locations';

export default function Landing() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Score & Level state (initialized from user context)
  const [totalScore, setTotalScore] = useState(user?.totalCumulativeScore || 0);
  const [currentLevel, setCurrentLevel] = useState(user?.currentLevel || 1);
  const [leveledUpMsg, setLeveledUpMsg] = useState(null);

  // Bubble tap counts (session only, resets on page reload)
  const [sessionTaps, setSessionTaps] = useState({});

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const currentLocation = getLocation(currentLevel);
  const levelProgress = getLevelProgress(totalScore);
  const pointsToNext = getPointsToNextLevel(totalScore);

  // ── Sync from user context when it updates (e.g., after server refresh)
  useEffect(() => {
    if (user?.totalCumulativeScore !== undefined) {
      setTotalScore(user.totalCumulativeScore);
    }
    if (user?.currentLevel !== undefined) {
      setCurrentLevel(user.currentLevel);
    }
  }, [user?.totalCumulativeScore, user?.currentLevel]);

  // ── Fetch today's status
  useEffect(() => {
    const fetchToday = async () => {
      try {
        await api.get('/sadhana/today');
      } catch (err) {
        console.error('Error loading landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  // ── Sadhana bubble tap handler
  const handleBubbleTap = useCallback(async (practiceName) => {
    // Optimistic update
    const prevScore = totalScore;
    const prevLevel = currentLevel;
    const newScore = totalScore + 10;
    const newLevel = Math.min(Math.floor(newScore / POINTS_PER_LEVEL) + 1, 108);

    setTotalScore(newScore);
    setCurrentLevel(newLevel);
    setSessionTaps(prev => ({ ...prev, [practiceName]: (prev[practiceName] || 0) + 1 }));

    if (newLevel > prevLevel) {
      const loc = getLocation(newLevel);
      setLeveledUpMsg(`🎉 Level ${newLevel}! You've reached ${loc.name}`);
      setTimeout(() => setLeveledUpMsg(null), 4000);
    }

    // Sync to server
    try {
      const { data } = await api.post('/user/tap-sadhana');
      setTotalScore(data.totalCumulativeScore);
      setCurrentLevel(data.currentLevel);
      updateUser({ totalCumulativeScore: data.totalCumulativeScore, currentLevel: data.currentLevel });
    } catch (err) {
      // Roll back on failure
      setTotalScore(prevScore);
      setCurrentLevel(prevLevel);
      console.error('Failed to record tap:', err);
    }
  }, [totalScore, currentLevel, updateUser]);



  const selectedPractices = user?.selectedPractices || [];

  if (loading) {
    return (
      <div className="yogic-loader-container">
        <div className="yogic-breathing-circle">
          <img src="/logo.png" className="yogic-loader-icon" alt="Meditating" />
        </div>
        <p className="yogic-loader-text">Breathing in...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      {/* River Background Canvas */}
      <div className="river-bg">
        <div className="river-layer river-layer-1" />
        <div className="river-layer river-layer-2" />
        <div className="river-layer river-layer-3" />
        <div className="river-shimmer" />
      </div>

      {/* Level-up notification */}
      {leveledUpMsg && (
        <div className="levelup-toast animate-in">
          <span className="levelup-toast-icon">✨</span>
          {leveledUpMsg}
        </div>
      )}

      <div className="page river-page">
        <div className="container-lg animate-in" style={{ maxWidth: 500, padding: '0 4px', position: 'relative', zIndex: 2 }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="landing-hero" style={{ marginBottom: 12, textAlign: 'center' }}>
            <div className="date-badge" style={{ fontSize: 11, padding: '3px 10px', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} /> {today}
            </div>
            <h1 className="page-title" style={{ fontSize: 26, marginBottom: 2 }}>
              Namaskaram, {user?.name?.split(' ')[0] || 'Seeker'} 🙏
            </h1>
            <p className="page-desc" style={{ fontSize: 12 }}>
              Tap a sadhana to record your practice
            </p>
          </div>

          {/* ── Level & Score Card ──────────────────────────────────────── */}
          <div
            className="level-score-card animate-in"
            onClick={() => navigate('/journey')}
            role="button"
            tabIndex={0}
            id="level-score-card"
            style={{ cursor: 'pointer' }}
          >
            {/* Left: Level badge */}
            <div className="level-badge-large">
              <div className="level-badge-ring" style={{ '--progress': levelProgress }} />
              <div className="level-badge-inner">
                <span className="level-badge-num">{currentLevel}</span>
                <span className="level-badge-lbl">Level</span>
              </div>
            </div>

            {/* Right: Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Mountain size={14} style={{ color: 'var(--purple-400)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentLocation.name}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                {currentLocation.desc.length > 60 ? currentLocation.desc.slice(0, 57) + '…' : currentLocation.desc}
              </div>

              {/* Progress bar to next level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="progress-bar" style={{ flex: 1, height: 4 }}>
                  <div className="progress-fill" style={{ width: `${levelProgress * 100}%`, background: 'var(--gradient-button)' }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {pointsToNext} pts to next
                </span>
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 2 }}>
                <Star size={12} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Cinzel, serif', color: '#fbbf24' }}>
                  {totalScore}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>total pts</div>
              <div style={{ fontSize: 10, color: 'var(--purple-400)', marginTop: 4, fontWeight: 600 }}>
                🏔 View Journey →
              </div>
            </div>
          </div>

          {/* ── Sadhana Bubbles ─────────────────────────────────────────── */}
          {selectedPractices.length > 0 ? (
            <div className="sadhana-bubbles-section animate-in" style={{ animationDelay: '0.1s' }}>
              <div className="sadhana-bubbles-label">
                <Zap size={12} style={{ color: '#fbbf24' }} />
                Tap to practice • Each tap = +10 pts
              </div>
              <div className="sadhana-bubbles-grid">
                {selectedPractices.map(name => (
                  <SadhanaBubble
                    key={name}
                    name={name}
                    totalTaps={sessionTaps[name] || 0}
                    onTap={handleBubbleTap}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🧘</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                No practices selected yet
              </p>
              <Link to="/select-practices" className="btn btn-primary" style={{ textDecoration: 'none', width: 'auto', display: 'inline-flex', padding: '10px 24px' }}>
                Select Practices
              </Link>
            </div>
          )}


        </div>
      </div>
    </>
  );
}
