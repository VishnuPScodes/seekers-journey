import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PersonaSwitcher from '../components/PersonaSwitcher';
import api from '../api';
import {
  Sparkles,
  Calendar,
  Compass,
  MapPin,
  Feather,
  Mic,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Mountain,
  HeartHandshake,
  Users,
  X,
  Plus,
  ArrowRight,
  Filter,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const CATEGORY_COLORS = {
  start:     { text: 'var(--accent-olive)',      border: 'rgba(78, 99, 70, 0.35)',   bg: 'rgba(78, 99, 70, 0.10)' },
  program:   { text: 'var(--accent-terracotta)',  border: 'rgba(184, 93, 54, 0.35)',  bg: 'rgba(184, 93, 54, 0.10)' },
  sadhana:   { text: 'var(--accent-saffron)',     border: 'rgba(217, 130, 43, 0.35)', bg: 'rgba(217, 130, 43, 0.10)' },
  milestone: { text: 'var(--accent-gold)',        border: 'rgba(196, 154, 69, 0.35)', bg: 'rgba(196, 154, 69, 0.10)' },
  seva:      { text: 'var(--accent-olive)',      border: 'rgba(78, 99, 70, 0.35)',   bg: 'rgba(78, 99, 70, 0.10)' },
  personal:  { text: 'var(--accent-terracotta)',  border: 'rgba(184, 93, 54, 0.25)',  bg: 'rgba(184, 93, 54, 0.08)' },
  community: { text: 'var(--accent-water)',       border: 'rgba(74, 112, 121, 0.25)', bg: 'rgba(74, 112, 121, 0.08)' },
};

const CATEGORIES = [
  { id: 'all',       label: 'All Memories' },
  { id: 'program',   label: 'Programs' },
  { id: 'sadhana',   label: 'Sadhana' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'seva',      label: 'Seva' },
  { id: 'personal',  label: 'Personal' },
];

export default function PersonalJourney() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [journeyData, setJourneyData] = useState(null);
  const [personas, setPersonas] = useState([]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [originStoryOpen, setOriginStoryOpen] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = Overview, 1.6 = Detail
  const [hoveredNode, setHoveredNode] = useState(null);

  // Modals
  const [editOriginModal, setEditOriginModal] = useState(false);
  const [reflectionModal, setReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);

  // Origin Story Form
  const [originForm, setOriginForm] = useState({
    discoveryChannel: '',
    firstAttraction: '',
    initialMotivation: '',
    originStoryText: '',
  });

  const waveScrollRef = useRef(null);

  // ── 1. Fetch Journey Data ──
  const fetchJourneyData = async () => {
    try {
      setLoading(true);
      const [meRes, personasRes] = await Promise.all([
        api.get('/journey/me'),
        api.get('/journey/personas'),
      ]);
      setJourneyData(meRes.data);
      setPersonas(personasRes.data.personas || []);
      if (meRes.data.user?.originStory) {
        setOriginForm({
          discoveryChannel: meRes.data.user.originStory.discoveryChannel || '',
          firstAttraction: meRes.data.user.originStory.firstAttraction || '',
          initialMotivation: meRes.data.user.originStory.initialMotivation || '',
          originStoryText: meRes.data.user.originStory.originStoryText || '',
        });
      }
    } catch (err) {
      console.error('Fetch journey data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!journeyData?.events) return [];
    if (activeCategory === 'all') return journeyData.events;
    return journeyData.events.filter(e => e.category === activeCategory);
  }, [journeyData, activeCategory]);

  // Extract distinct years for year scrubber
  const timelineYears = useMemo(() => {
    if (!journeyData?.events) return [];
    const years = new Set();
    journeyData.events.forEach(e => {
      if (e.date) years.add(new Date(e.date).getFullYear());
    });
    return Array.from(years).sort();
  }, [journeyData]);

  // Scroll to a specific year on the wave
  const scrollToYear = (year) => {
    const el = document.getElementById(`year-node-${year}`);
    if (el && waveScrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // ── 2. Handle Voice / Quick Reflection ──
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. You can type your reflection below.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setReflectionText(prev => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleSaveReflection = async (e) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    setSavingReflection(true);
    try {
      await api.post('/journey/voice-reflection', {
        text: reflectionText.trim(),
        practiceName: journeyData?.user?.selectedPractices?.[0] || 'Sadhana',
      });
      setReflectionText('');
      setReflectionModal(false);
      await fetchJourneyData();
    } catch (err) {
      console.error('Save reflection failed:', err);
    } finally {
      setSavingReflection(false);
    }
  };

  // ── 3. Save Origin Story ──
  const handleSaveOriginStory = async (e) => {
    e.preventDefault();
    try {
      await api.put('/journey/origin-story', originForm);
      setEditOriginModal(false);
      await fetchJourneyData();
    } catch (err) {
      console.error('Update origin story failed:', err);
    }
  };

  const user = journeyData?.user || authUser;
  const programs = journeyData?.programs || [];
  const officialPrograms = journeyData?.officialPrograms || [];

  const completedPrograms = useMemo(() => {
    return officialPrograms.filter(prog => programs.some(p => p.programId === prog.id));
  }, [officialPrograms, programs]);

  const upcomingPrograms = useMemo(() => {
    return officialPrograms.filter(prog => !programs.some(p => p.programId === prog.id));
  }, [officialPrograms, programs]);

  const eligibleProgramsCount = useMemo(() => {
    return upcomingPrograms.filter(prog => (prog.prerequisites || []).every(preId => programs.some(p => p.programId === preId))).length;
  }, [upcomingPrograms, programs]);

  const isZoomed = zoomLevel > 1;
  const nodeSpacing = isZoomed ? 260 : 130;
  const containerHeight = isZoomed ? 340 : 210;
  const baselineY = isZoomed ? 170 : 105;
  const amplitude = isZoomed ? 60 : 38;

  const snakePoints = useMemo(() => {
    return filteredEvents.map((ev, index) => {
      const x = 70 + index * nodeSpacing;
      const y = baselineY + Math.sin((index / 1.15) * Math.PI) * amplitude;
      return { x, y, event: ev, index };
    });
  }, [filteredEvents, nodeSpacing, baselineY, amplitude]);

  const totalSvgWidth = Math.max(820, 70 + filteredEvents.length * nodeSpacing + 100);

  const snakePathData = useMemo(() => {
    if (snakePoints.length === 0) return '';
    if (snakePoints.length === 1) return `M ${snakePoints[0].x - 60},${baselineY} L ${snakePoints[0].x + 60},${baselineY}`;

    let d = `M ${snakePoints[0].x - 60},${baselineY}`;
    d += ` Q ${snakePoints[0].x - 30},${(baselineY + snakePoints[0].y) / 2} ${snakePoints[0].x},${snakePoints[0].y}`;

    for (let i = 0; i < snakePoints.length - 1; i++) {
      const p0 = snakePoints[i];
      const p1 = snakePoints[i + 1];
      const midX = (p0.x + p1.x) / 2;
      d += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
    }

    const last = snakePoints[snakePoints.length - 1];
    d += ` Q ${last.x + 30},${(last.y + baselineY) / 2} ${last.x + 60},${baselineY}`;
    return d;
  }, [snakePoints, baselineY]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'var(--accent-terracotta) transparent' }} />
            <p className="font-serif" style={{ fontSize: 18, color: 'var(--text-body)' }}>
              Gathering your sacred journey...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingBottom: 60 }}>
        <div className="journey-page-container animate-in">

          {/* ── 1. HEADER & IDENTITY ── */}
          <div className="journey-header-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="text-caption-stone" style={{ color: 'var(--accent-terracotta)' }}>
                    Sacred Chronicle
                  </span>
                  <span style={{ color: 'var(--border-stone)' }}>•</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {user?.city || 'Bengaluru'}, {user?.region || 'India'}
                  </span>
                </div>

                <h1 className="font-serif" style={{
                  fontSize: 'clamp(28px, 4.5vw, 36px)',
                  fontWeight: 700,
                  color: 'var(--text-charcoal)',
                  margin: '0 0 6px',
                  lineHeight: 1.15,
                }}>
                  {user?.name || 'Seeker'}
                </h1>

                <p style={{ fontSize: 14, color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
                  Walking the path with Isha for <strong>{user?.timeOnPathLabel || '4 years, 6 months'}</strong>
                </p>
              </div>

              {/* Action Buttons: Voice Reflection, Persona Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <PersonaSwitcher onSwitched={fetchJourneyData} />
                <button
                  type="button"
                  onClick={() => setReflectionModal(true)}
                  className="stone-pill"
                  title="Record a micro-reflection"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--accent-terracotta)',
                    cursor: 'pointer',
                  }}
                >
                  <Feather size={14} /> Whisper of Grace
                </button>
              </div>
            </div>

            {/* Current Sadhana & Monthly Rhythm Bar */}
            <div style={{
              marginTop: 18,
              padding: '12px 16px',
              background: 'var(--surface-stone-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              <div>
                <span className="text-caption-stone" style={{ display: 'block' }}>
                  Current Active Practices
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {(user?.selectedPractices || ['Shambhavi Mahamudra']).map(pName => (
                    <span
                      key={pName}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '3px 10px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-stone)',
                        borderRadius: 'var(--radius-pill)',
                        color: 'var(--text-charcoal)',
                      }}
                    >
                      {pName}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="text-caption-stone" style={{ display: 'block' }}>
                  This Month's Rhythm
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-olive)' }}>
                  26 / 30 planned practices completed
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. "WHERE I STARTED" — ORIGIN STORY ── */}
          <div className="journey-origin-card">
            <div
              onClick={() => setOriginStoryOpen(!originStoryOpen)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(184, 93, 54, 0.12)',
                  color: 'var(--accent-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className="font-serif" style={{
                    fontSize: 21,
                    fontWeight: 600,
                    color: 'var(--text-charcoal)',
                    margin: 0,
                  }}>
                    Where I Started — Origin Story
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    The initial spark that opened the doorway
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditOriginModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--accent-terracotta)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Edit Story
                </button>
                {originStoryOpen ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
              </div>
            </div>

            {originStoryOpen && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <p className="font-serif" style={{
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: 'var(--text-body)',
                  lineHeight: 1.6,
                  margin: '0 0 14px',
                }}>
                  "{user?.originStory?.originStoryText || 'First encountered Sadhguru during a demanding life transition. The razor-sharp clarity and practical yogic technologies dismantled intellectual resistance, inspiring daily devotion to sadhana.'}"
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div style={{ padding: '10px 14px', background: 'var(--surface-stone-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
                    <span className="text-caption-stone">Discovery Pathway</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-charcoal)', marginTop: 3 }}>
                      {user?.originStory?.discoveryChannel || 'YouTube Video Discourse'}
                    </div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'var(--surface-stone-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
                    <span className="text-caption-stone">Initial Attraction</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-charcoal)', marginTop: 3 }}>
                      {user?.originStory?.firstAttraction || 'Clarity and profound logic of Sadhguru'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. "THE RIVER OF TIME" (Interactive Winding Snake River Timeline) ── */}
          <div className="river-of-time-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="text-caption-stone" style={{ color: 'var(--accent-terracotta)' }}>
                  Sacred Timeline
                </span>
                <h2 className="font-serif" style={{
                  fontSize: 25,
                  fontWeight: 600,
                  color: 'var(--text-charcoal)',
                  margin: '2px 0 0',
                }}>
                  The River of Time
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  A serpentine stream of your completed programs, whisper reflections, and sacred milestones.
                </p>
              </div>

              {/* Controls: Zoom In/Out & Year Scrubber */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Zoom Controller */}
                <div className="river-zoom-toggle">
                  <span className="text-caption-stone" style={{ paddingLeft: 4 }}>
                    Zoom:
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className={`zoom-toggle-btn ${zoomLevel === 1 ? 'active' : ''}`}
                    title="Compact view of the snake stream"
                  >
                    Overview (1x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1.6)}
                    className={`zoom-toggle-btn ${zoomLevel === 1.6 ? 'active' : ''}`}
                    title="Zoom in to inspect programs and reflections"
                  >
                    Zoom In 🔍 (1.6x)
                  </button>
                </div>

                {/* Year Navigation Scrubber Pills */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                  {timelineYears.map(year => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => scrollToYear(year)}
                      className="river-scrubber-pill"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 18, paddingBottom: 6 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`river-filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ── Scrollable Horizontal Snake River Container ── */}
            <div
              ref={waveScrollRef}
              style={{
                overflowX: 'auto',
                overflowY: 'visible',
                paddingBottom: 24,
                paddingTop: 16,
                position: 'relative',
                scrollbarWidth: 'thin',
              }}
            >
              <div style={{
                position: 'relative',
                width: totalSvgWidth,
                height: containerHeight,
                margin: '0 auto',
              }}>
                {/* SVG Serpentine River */}
                <svg
                  width={totalSvgWidth}
                  height={containerHeight}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#B85D36" stopOpacity="0.9" />
                      <stop offset="35%" stopColor="#C49A45" stopOpacity="0.95" />
                      <stop offset="70%" stopColor="#4E6346" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#B85D36" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* River Outer Ambient Glow */}
                  <path
                    d={snakePathData}
                    fill="none"
                    stroke="rgba(184, 93, 54, 0.12)"
                    strokeWidth={isZoomed ? "28" : "18"}
                    strokeLinecap="round"
                  />
                  {/* River Bed */}
                  <path
                    d={snakePathData}
                    fill="none"
                    stroke="rgba(78, 99, 70, 0.2)"
                    strokeWidth={isZoomed ? "14" : "9"}
                    strokeLinecap="round"
                  />
                  {/* Main Serpentine Water Body */}
                  <path
                    d={snakePathData}
                    fill="none"
                    stroke="url(#snakeGrad)"
                    strokeWidth={isZoomed ? "5" : "3.5"}
                    strokeLinecap="round"
                  />
                  {/* Sacred Pranic Filament */}
                  <path
                    d={snakePathData}
                    fill="none"
                    stroke="rgba(249, 246, 238, 0.8)"
                    strokeWidth="1.5"
                    strokeDasharray="4 8"
                  />
                </svg>

                {/* Circular Nodes & Pop-ups along the Snake */}
                {snakePoints.map((point) => {
                  const ev = point.event;
                  const colors = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.personal;
                  const isMajor = ev.category === 'program' || ev.category === 'start';
                  const evYear = ev.date ? new Date(ev.date).getFullYear() : '2023';
                  const isUpper = point.y < baselineY;

                  return (
                    <div
                      key={ev._id || point.index}
                      id={`year-node-${evYear}`}
                      style={{
                        position: 'absolute',
                        left: point.x,
                        top: point.y,
                        transform: 'translate(-50%, -50%)',
                        zIndex: hoveredNode === point.index ? 25 : 10,
                      }}
                      onMouseEnter={() => setHoveredNode(point.index)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Circular Pop-up Bead Node */}
                      <div
                        onClick={() => setSelectedEvent(ev)}
                        title={`${ev.title} (${new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`}
                        className="river-node-bead"
                        style={{
                          width: isZoomed ? 48 : 38,
                          height: isZoomed ? 48 : 38,
                          border: `2.5px solid ${colors.text}`,
                          boxShadow: isMajor
                            ? `0 0 14px ${colors.border}, 0 2px 8px rgba(44, 38, 31, 0.12)`
                            : '0 2px 6px rgba(44, 38, 31, 0.08)',
                          transform: hoveredNode === point.index ? 'scale(1.2)' : 'scale(1)',
                        }}
                      >
                        <span style={{ fontSize: isZoomed ? 18 : 15 }}>{ev.icon || '🪷'}</span>
                      </div>

                      {/* Date Label under/over the bead */}
                      <div style={{
                        position: 'absolute',
                        top: isUpper ? -20 : (isZoomed ? 54 : 44),
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                      }}>
                        {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}
                      </div>

                      {/* ZOOMED-IN DETAIL: Pop-up card attached to circle with a stem */}
                      {isZoomed && (
                        <div
                          onClick={() => setSelectedEvent(ev)}
                          className="river-node-detail-card"
                          style={{
                            left: '50%',
                            top: isUpper ? 'auto' : 62,
                            bottom: isUpper ? 62 : 'auto',
                            transform: 'translateX(-50%)',
                          }}
                        >
                          {/* Connecting Stem Line */}
                          <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: isUpper ? '100%' : -10,
                            width: 2,
                            height: 10,
                            background: colors.text,
                            transform: 'translateX(-50%)',
                          }} />

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}>
                              {ev.category}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                            </span>
                          </div>

                          <div className="font-serif" style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text-charcoal)',
                            lineHeight: 1.25,
                            marginBottom: 4,
                          }}>
                            {ev.title}
                          </div>

                          {ev.description && (
                            <div style={{
                              fontSize: 11,
                              color: 'var(--text-body)',
                              lineHeight: 1.35,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {ev.description}
                            </div>
                          )}
                        </div>
                      )}

                      {/* OVERVIEW HOVER TOOLTIP */}
                      {!isZoomed && hoveredNode === point.index && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: isUpper ? 'auto' : 48,
                            bottom: isUpper ? 48 : 'auto',
                            transform: 'translateX(-50%)',
                            background: 'var(--surface-dark-drawer)',
                            color: 'var(--text-inverse)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                            zIndex: 35,
                            pointerEvents: 'none',
                            border: '1px solid rgba(184, 93, 54, 0.35)',
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{ev.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            {ev.category} • {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 4. PROGRAM JOURNEY & OFFICIAL PREREQUISITE PATHWAYS ── */}
          <div className="prereq-syllabus-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="text-caption-stone" style={{ color: 'var(--accent-terracotta)' }}>
                  Sacred Curriculum
                </span>
                <h3 className="font-serif" style={{
                  fontSize: 25,
                  fontWeight: 600,
                  color: 'var(--text-charcoal)',
                  margin: '2px 0 0',
                }}>
                  Program Journey & Prerequisite Pathways
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-body)', margin: '4px 0 0' }}>
                  Track your completed programs and discover unlocked eligibility for advanced residential silence immersions.
                </p>
              </div>

              {/* Summary Metric Badges */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{
                  padding: '6px 14px',
                  background: 'rgba(78, 99, 70, 0.1)',
                  border: '1px solid rgba(78, 99, 70, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}>
                  <span className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-olive)', display: 'block' }}>
                    {completedPrograms.length}
                  </span>
                  <span className="text-caption-stone" style={{ fontSize: 9 }}>
                    Completed
                  </span>
                </div>

                <div style={{
                  padding: '6px 14px',
                  background: 'rgba(184, 93, 54, 0.1)',
                  border: '1px solid rgba(184, 93, 54, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}>
                  <span className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-terracotta)', display: 'block' }}>
                    {eligibleProgramsCount}
                  </span>
                  <span className="text-caption-stone" style={{ fontSize: 9 }}>
                    Eligible Advanced
                  </span>
                </div>
              </div>
            </div>

            {/* ── Sub-section 1: Completed Programs ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: 'var(--accent-olive)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <CheckCircle2 size={16} color="var(--accent-olive)" /> Completed Programs ({completedPrograms.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                {completedPrograms.map(prog => {
                  const userProg = programs.find(p => p.programId === prog.id);
                  const completionYear = userProg?.completionDate ? new Date(userProg.completionDate).getFullYear() : 'Completed';

                  return (
                    <div
                      key={prog.id}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(78, 99, 70, 0.06)',
                        border: '1px solid rgba(78, 99, 70, 0.35)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 22 }}>{prog.icon}</span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'rgba(78, 99, 70, 0.18)',
                          color: 'var(--accent-olive)',
                        }}>
                          ✓ Completed ({completionYear})
                        </span>
                      </div>

                      <div className="font-serif" style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: 'var(--text-charcoal)',
                        marginBottom: 4,
                      }}>
                        {prog.name}
                      </div>

                      <p style={{ fontSize: 11, color: 'var(--text-body)', margin: '0 0 8px', lineHeight: 1.4 }}>
                        {prog.description}
                      </p>

                      {prog.transmitsPractices && prog.transmitsPractices.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--accent-terracotta)', fontWeight: 600 }}>
                          Transmitted: {prog.transmitsPractices.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Sub-section 2: Advanced Programs & Prerequisite Pathways ── */}
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: 'var(--accent-terracotta)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Compass size={16} color="var(--accent-terracotta)" /> Advanced Programs & Prerequisite Pathways
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {upcomingPrograms.map(prog => {
                  const prereqList = (prog.prerequisites || []).map(preId => {
                    const preProg = officialPrograms.find(p => p.id === preId);
                    const isDone = programs.some(p => p.programId === preId);
                    return {
                      id: preId,
                      name: preProg ? preProg.name : preId.replace('_', ' ').toUpperCase(),
                      isDone,
                    };
                  });

                  const isEligible = prereqList.length === 0 || prereqList.every(p => p.isDone);

                  return (
                    <div
                      key={prog.id}
                      className={`prereq-item-card ${isEligible ? 'eligible' : ''}`}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 24 }}>{prog.icon}</span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-pill)',
                            background: isEligible ? 'rgba(184, 93, 54, 0.15)' : 'rgba(62, 56, 45, 0.08)',
                            color: isEligible ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                            border: `1px solid ${isEligible ? 'rgba(184, 93, 54, 0.35)' : 'transparent'}`,
                          }}>
                            {isEligible ? '✨ Eligible to Attend' : '⏳ Prerequisites Pending'}
                          </span>
                        </div>

                        <div className="font-serif" style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: 'var(--text-charcoal)',
                          marginBottom: 4,
                        }}>
                          {prog.name}
                        </div>

                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                          {prog.duration || 'Residential Program'}
                        </div>

                        <p style={{ fontSize: 11, color: 'var(--text-body)', margin: '0 0 12px', lineHeight: 1.4 }}>
                          {prog.description}
                        </p>
                      </div>

                      {/* Prerequisites Checklist Box */}
                      <div style={{
                        padding: '10px 12px',
                        background: 'var(--surface-card)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                      }}>
                        <span className="text-caption-stone" style={{ display: 'block', marginBottom: 6 }}>
                          Prerequisite Pathway:
                        </span>

                        {prereqList.length === 0 ? (
                          <div style={{ fontSize: 11, color: 'var(--accent-olive)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            ✓ Open Registration (No prerequisites required)
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {prereqList.map(pr => (
                              <div
                                key={pr.id}
                                style={{
                                  fontSize: 11,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  color: pr.isDone ? 'var(--text-charcoal)' : 'var(--text-muted)',
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ color: pr.isDone ? 'var(--accent-olive)' : 'var(--text-muted)' }}>
                                    {pr.isDone ? '✓' : '○'}
                                  </span>{' '}
                                  {pr.name}
                                </span>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: pr.isDone ? 'var(--accent-olive)' : 'var(--accent-saffron)',
                                }}>
                                  {pr.isDone ? 'Complete' : 'Incomplete'}
                                </span>
                              </div>
                            ))}

                            {prog.id === 'samyama' && (
                              <div style={{
                                fontSize: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: 'var(--text-charcoal)',
                                borderTop: '1px dashed var(--border-hairline)',
                                paddingTop: 4,
                                marginTop: 2,
                              }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ color: 'var(--accent-olive)' }}>✓</span> 60 Days Daily Practice
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-olive)' }}>
                                  Active ({user?.timeOnPathLabel || '4.5 yrs'})
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MODAL 1: WHISPER OF GRACE ── */}
      {reflectionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30, 26, 22, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="stone-panel animate-in" style={{ width: '100%', maxWidth: 480, background: 'var(--surface-ground)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 className="font-serif" style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-charcoal)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Feather size={18} color="var(--accent-terracotta)" /> Whisper of Grace
              </h3>
              <button
                type="button"
                onClick={() => setReflectionModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-body)', marginBottom: 14 }}>
              Capture a quiet sentence of what you felt or experienced during your sadhana today.
            </p>

            <form onSubmit={handleSaveReflection}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Today after Shambhavi, the stillness was effortless..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    fontSize: 13,
                    padding: '10px 12px',
                    resize: 'vertical',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-stone)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  title="Speak your reflection"
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: isRecording ? 'var(--accent-terracotta)' : 'var(--surface-stone-subtle)',
                    color: isRecording ? '#fff' : 'var(--text-body)',
                    border: '1px solid var(--border-stone)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Mic size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReflectionModal(false)}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReflection}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '6px 18px' }}
                >
                  {savingReflection ? 'Recording...' : '✓ Record Moment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT ORIGIN STORY ── */}
      {editOriginModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30, 26, 22, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="stone-panel animate-in" style={{ width: '100%', maxWidth: 500, background: 'var(--surface-ground)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 className="font-serif" style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-charcoal)',
                margin: 0,
              }}>
                Reflect on Your Origins
              </h3>
              <button
                type="button"
                onClick={() => setEditOriginModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOriginStory}>
              <div style={{ marginBottom: 12 }}>
                <label className="text-caption-stone" style={{ display: 'block', marginBottom: 4 }}>
                  How did you first encounter Sadhguru?
                </label>
                <input
                  type="text"
                  className="input"
                  value={originForm.discoveryChannel}
                  onChange={(e) => setOriginForm({ ...originForm, discoveryChannel: e.target.value })}
                  style={{
                    fontSize: 13,
                    padding: '8px 12px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-stone)',
                    borderRadius: 'var(--radius-sm)',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="text-caption-stone" style={{ display: 'block', marginBottom: 4 }}>
                  What initially attracted you?
                </label>
                <input
                  type="text"
                  className="input"
                  value={originForm.firstAttraction}
                  onChange={(e) => setOriginForm({ ...originForm, firstAttraction: e.target.value })}
                  style={{
                    fontSize: 13,
                    padding: '8px 12px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-stone)',
                    borderRadius: 'var(--radius-sm)',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="text-caption-stone" style={{ display: 'block', marginBottom: 4 }}>
                  Personal Origin Narrative
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={originForm.originStoryText}
                  onChange={(e) => setOriginForm({ ...originForm, originStoryText: e.target.value })}
                  style={{
                    fontSize: 13,
                    padding: '8px 12px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-stone)',
                    borderRadius: 'var(--radius-sm)',
                    width: '100%',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditOriginModal(false)}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '6px 18px' }}
                >
                  ✓ Save Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: EVENT DETAIL VIEW ── */}
      {selectedEvent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30, 26, 22, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="stone-panel animate-in" style={{ width: '100%', maxWidth: 440, background: 'var(--surface-ground)', padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20 }}>{selectedEvent.icon || '🪷'}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(184, 93, 54, 0.1)',
                  color: 'var(--accent-terracotta)',
                }}>
                  {selectedEvent.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="font-serif" style={{
              fontSize: 21,
              fontWeight: 700,
              color: 'var(--text-charcoal)',
              margin: '0 0 6px',
            }}>
              {selectedEvent.title}
            </h3>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} />
              {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
            </div>

            {selectedEvent.description && (
              <p className="font-serif" style={{
                fontSize: 15,
                fontStyle: 'italic',
                color: 'var(--text-body)',
                lineHeight: 1.55,
                margin: 0,
                borderLeft: '3px solid var(--accent-terracotta)',
                paddingLeft: 10,
              }}>
                "{selectedEvent.description}"
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
