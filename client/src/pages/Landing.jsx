import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SadhanaBubble from '../components/SadhanaBubble';
import { useAuth } from '../context/AuthContext';
import { Calendar, Mountain, Zap, Star } from 'lucide-react';
import api from '../api';
import TornPaperEdge from '../components/TornPaperEdge';
import { getLocation, getLevelProgress, getPointsToNextLevel, getKmTraveled, getKmRemaining } from '../utils/locations';

import { KundaliniSerpentSpiralMotif, YogicArtisticBanner } from '../components/SadhanaMotifs';
import { HandDrawnBannerHeader } from '../components/HandDrawnNavbarEdge';
import DoneForDayModal from '../components/DoneForDayModal';


// ── Iridescent 3D Glass Orbs scatter helper (unequal sizes inspired by reference image)
function getPebbleScatterStyle(index) {
  // Unequal bubble sizes: large hero bubbles, medium bubbles, and compact ambient bubbles
  const sizes = [165, 135, 175, 125, 150, 120, 155, 130];
  const size = sizes[index % sizes.length];

  const yOffsets = [-16, 22, -22, 28, -26, 16, -18, 24];
  const offsetY = yOffsets[index % yOffsets.length];

  const xGaps = [22, 34, 14, 28, 18, 36, 16, 26];
  const marginRight = xGaps[index % xGaps.length];

  const animDelays = [0, -1.3, -0.6, -1.8, -0.9, -2.4, -1.5, -0.3];
  const animDelay = animDelays[index % animDelays.length];

  return { size, offsetY, marginRight, animDelay };
}

export default function Landing() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Score & Level state (initialized from user context)
  const [totalScore, setTotalScore] = useState(user?.totalCumulativeScore || 0);
  const [currentLevel, setCurrentLevel] = useState(user?.currentLevel || 1);
  const [leveledUpMsg, setLeveledUpMsg] = useState(null);
  const [showDoneModal, setShowDoneModal] = useState(false);

  // Today's practice counts & Pebble Positions
  const [todayCounts, setTodayCounts] = useState({});
  const [pebblePositions, setPebblePositions] = useState(user?.pebblePositions || {});
  const [activeDragPos, setActiveDragPos] = useState({});

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const currentLocation = getLocation(currentLevel);
  const levelProgress = getLevelProgress(totalScore);
  const pointsToNext = getPointsToNextLevel(totalScore);
  const kmTraveled = getKmTraveled(currentLevel);
  const kmRemaining = getKmRemaining(currentLevel);


  // ── Sync from user context when it updates (e.g., after server refresh)
  useEffect(() => {
    if (user?.totalCumulativeScore !== undefined) {
      setTotalScore(user.totalCumulativeScore);
    }
    if (user?.currentLevel !== undefined) {
      setCurrentLevel(user.currentLevel);
    }
    if (user?.pebblePositions) {
      setPebblePositions(user.pebblePositions);
    }
  }, [user?.totalCumulativeScore, user?.currentLevel, user?.pebblePositions]);

  // ── Fetch today's status & pre-fill practice counts from SadhanaLog
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const localDate = new Date().toLocaleDateString('en-CA');
        const { data } = await api.get(`/sadhana/today?date=${localDate}`);
        if (data.log && Array.isArray(data.log.practices)) {
          const counts = {};
          data.log.practices.forEach(p => {
            counts[p.name] = p.count || 0;
          });
          setTodayCounts(counts);
        }
      } catch (err) {
        console.error('Error loading landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  // ── Sadhana bubble tap handler — writes directly to unified SadhanaLog
  const handleBubbleTap = useCallback(async (practiceName) => {
    try {
      // User's local calendar date YYYY-MM-DD
      const localDate = new Date().toLocaleDateString('en-CA');
      const { data } = await api.post('/user/tap-sadhana', {
        practiceName,
        date: localDate,
        action: 'increment',
      });
      setTotalScore(data.totalCumulativeScore);
      setCurrentLevel(data.currentLevel);
      setTodayCounts(prev => ({
        ...prev,
        [practiceName]: data.count,
      }));
      updateUser({
        totalCumulativeScore: data.totalCumulativeScore,
        currentLevel: data.currentLevel,
      });

      if (data.leveledUp) {
        const loc = getLocation(data.currentLevel);
        setLeveledUpMsg(`🎉 Level ${data.currentLevel}! You've reached ${loc.name}`);
        setTimeout(() => setLeveledUpMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to record tap:', err);
    }
  }, [updateUser]);

  // ── Sadhana bubble revert handler — decrements count if tapped by mistake
  const handleBubbleRevert = useCallback(async (practiceName) => {
    try {
      const localDate = new Date().toLocaleDateString('en-CA');
      const { data } = await api.post('/user/tap-sadhana', {
        practiceName,
        date: localDate,
        action: 'decrement',
      });
      setTotalScore(data.totalCumulativeScore);
      setCurrentLevel(data.currentLevel);
      setTodayCounts(prev => ({
        ...prev,
        [practiceName]: data.count,
      }));
      updateUser({
        totalCumulativeScore: data.totalCumulativeScore,
        currentLevel: data.currentLevel,
      });
    } catch (err) {
      console.error('Failed to revert tap:', err);
    }
  }, [updateUser]);

  // ── Pebble Drag & Position Handlers
  const handlePebbleDrag = useCallback((name, dx, dy) => {
    setActiveDragPos(prev => ({
      ...prev,
      [name]: { dx, dy },
    }));
  }, []);

  const handlePebbleDragEnd = useCallback(async (name, dx, dy) => {
    const currentPos = pebblePositions[name] || { x: 0, y: 0 };
    const newPos = {
      x: Math.round(currentPos.x + dx),
      y: Math.round(currentPos.y + dy),
    };

    const updated = { ...pebblePositions, [name]: newPos };
    setPebblePositions(updated);
    setActiveDragPos(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });

    try {
      await api.post('/user/pebble-positions', { pebblePositions: updated });
      updateUser({ pebblePositions: updated });
    } catch (err) {
      console.error('Failed to save pebble positions:', err);
    }
  }, [pebblePositions, updateUser]);

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

      <div className="page river-page" style={{ paddingTop: 96 }}>
        <div className="container-lg animate-in" style={{ maxWidth: 840, padding: '0 8px', position: 'relative', zIndex: 2 }}>


          {/* ── Header with Floating Kundalini Spiral Motif ───────────────── */}
          <div className="landing-hero" style={{ marginBottom: 12, textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, left: 16, opacity: 0.22, pointerEvents: 'none' }}>
              <KundaliniSerpentSpiralMotif size={56} color="#d9572b" strokeWidth={1.8} />
            </div>
            <div style={{ position: 'absolute', top: -10, right: 16, opacity: 0.22, transform: 'scaleX(-1)', pointerEvents: 'none' }}>
              <KundaliniSerpentSpiralMotif size={56} color="#d9572b" strokeWidth={1.8} />
            </div>

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
                <Mountain size={14} style={{ color: '#d9572b', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentLocation.name}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.4 }}>
                {currentLocation.desc.length > 60 ? currentLocation.desc.slice(0, 57) + '…' : currentLocation.desc}
              </div>

              {/* Both Distance Metrics: Traveled & Remaining */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: '#d9572b', marginBottom: 6, flexWrap: 'wrap' }}>
                <span>📍 {kmTraveled.toLocaleString()} km traveled</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>🏔 {kmRemaining.toLocaleString()} km more to Kailash</span>
              </div>

              {/* Progress bar to next level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="progress-bar" style={{ flex: 1, height: 4 }}>
                  <div className="progress-fill" style={{ width: `${levelProgress * 100}%`, background: 'linear-gradient(90deg, #e65c00, #d9572b)' }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {pointsToNext} pts to next
                </span>
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 2 }}>
                <Star size={12} style={{ color: '#d9572b' }} />
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: '"Cormorant Garamond", serif', color: '#d9572b' }}>
                  {totalScore}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>total pts</div>
              <div style={{ fontSize: 10, color: '#d9572b', marginTop: 4, fontWeight: 700 }}>
                🏔 View Journey →
              </div>
            </div>

          </div>

          {/* ── Sacred Sadhana Shrine Cards ────────────────────────────── */}
          {selectedPractices.length > 0 ? (
            <div className="shrine-cards-wrapper animate-in" style={{ animationDelay: '0.1s', margin: '20px 0 28px' }}>
              <HandDrawnBannerHeader
                title="Sacred Sadhana Shrine Tiles"
                subtitle="Tap any tile to record your daily practice"
              />

              {/* Grid Container for Shrine Cards */}
              <div
                className="shrine-cards-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
                  gap: '16px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {selectedPractices.map((name, index) => {
                  const targetConfig = (user?.practiceConfig || []).find(c => c.name === name);
                  const dailyTarget = targetConfig?.dailyTarget || 2;

                  return (
                    <div key={name} className="shrine-card-item">
                      <SadhanaBubble
                        name={name}
                        totalTaps={todayCounts[name] || 0}
                        dailyTarget={dailyTarget}
                        onTap={handleBubbleTap}
                        onRevert={handleBubbleRevert}
                        onDrag={handlePebbleDrag}
                        onDragEnd={handlePebbleDragEnd}
                      />
                    </div>
                  );
                })}
              </div>

              {/* ── Done for the Day Action Pill ── */}
              <div style={{ textAlign: 'center', margin: '26px 0 10px' }}>
                <button
                  type="button"
                  className="btn-done-pill"
                  onClick={() => setShowDoneModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, rgba(217, 87, 43, 0.16) 0%, rgba(139, 107, 27, 0.16) 100%)',
                    border: '1px solid rgba(217, 87, 43, 0.45)',
                    borderRadius: 24,
                    padding: '9px 24px',
                    color: '#f4efd8',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#d9572b';
                    e.currentTarget.style.boxShadow = '0 0 18px rgba(217, 87, 43, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(217, 87, 43, 0.45)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.35)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span style={{ fontSize: 16 }}>✨</span>
                  <span>Done for the day 🙏</span>
                </button>
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

          {/* ── Sacred Yogic Artistic Banner (Centered Horizontally at Bottom) ── */}
          <div style={{ marginTop: 32, marginBottom: 20, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <YogicArtisticBanner color="#d9572b" />
          </div>
        </div>
      </div>

      {/* Done For The Day Consecrated Modal */}
      <DoneForDayModal
        isOpen={showDoneModal}
        onClose={() => setShowDoneModal(false)}
        todayCounts={todayCounts}
        selectedPractices={selectedPractices}
        user={user}
      />
    </>
  );
}
