import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api';
import {
  Shield,
  Search,
  Plus,
  Users,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
  Compass,
  Crown,
  Flower2,
  Clock,
  Check,
  Lock,
} from 'lucide-react';
import './Community.css';

export default function SanghasDirectory() {
  const navigate = useNavigate();
  const [sanghas, setSanghas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('interest');
  const [newLocation, setNewLocation] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchSanghas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // If a standard type is selected
      if (!['all', 'guided', 'joined', 'discover'].includes(selectedType)) {
        params.append('type', selectedType);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await api.get(`/community/sanghas?${params.toString()}`);
      setSanghas(res.data.sanghas || []);
    } catch (err) {
      console.error('Failed to fetch sanghas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSanghas();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchSanghas]);

  const handleJoinToggle = async (sanghaId) => {
    try {
      const res = await api.post(`/community/sanghas/${sanghaId}/join`);
      if (res.data) {
        setSanghas((prev) =>
          prev.map((s) =>
            s._id === sanghaId
              ? {
                  ...s,
                  isMember: res.data.isMember,
                  membershipStatus: res.data.membershipStatus,
                  membersCount: res.data.membersCount,
                }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle sangha membership:', err);
    }
  };

  const handleCreateSangha = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Sangha name is required.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const res = await api.post('/community/sanghas', {
        name: newName.trim(),
        tagline: newTagline.trim(),
        description: newDesc.trim(),
        type: newType,
        location: newLocation.trim(),
        isPrivate: newIsPrivate,
      });

      if (res.data?.sangha) {
        setShowCreateModal(false);
        setNewName('');
        setNewTagline('');
        setNewDesc('');
        setNewLocation('');
        setNewIsPrivate(false);
        navigate(`/community/circles/${res.data.sangha.slug || res.data.sangha._id}`);
      }
    } catch (err) {
      console.error('Failed to create sangha:', err);
      setCreateError(err.response?.data?.message || 'Could not create Sangha.');
    } finally {
      setCreating(false);
    }
  };

  // Grouping for featured panel grid
  const guidedSanghas = useMemo(() => sanghas.filter((s) => s.isOwner), [sanghas]);
  const joinedSanghas = useMemo(() => sanghas.filter((s) => s.isMember && !s.isOwner), [sanghas]);
  const discoverSanghas = useMemo(() => sanghas.filter((s) => !s.isMember && !s.isOwner), [sanghas]);

  // Total pending requests across all owned circles
  const totalPendingRequests = useMemo(() => {
    return guidedSanghas.reduce((sum, s) => sum + (s.pendingRequestsCount || 0), 0);
  }, [guidedSanghas]);

  // Filtered sanghas when a specific filter or search is active
  const displayedSanghas = useMemo(() => {
    if (selectedType === 'guided') return guidedSanghas;
    if (selectedType === 'joined') return joinedSanghas;
    if (selectedType === 'discover') return discoverSanghas;
    return sanghas;
  }, [selectedType, guidedSanghas, joinedSanghas, discoverSanghas, sanghas]);

  const filterPills = [
    { id: 'all', label: 'All Circles', icon: '🏛️', count: sanghas.length },
    {
      id: 'guided',
      label: 'Circles You Guide',
      icon: '👑',
      count: guidedSanghas.length,
      alert: totalPendingRequests > 0 ? `${totalPendingRequests} pending` : null,
    },
    { id: 'joined', label: 'Walk With (Joined)', icon: '🪷', count: joinedSanghas.length },
    { id: 'discover', label: 'Discover New', icon: '🌌', count: discoverSanghas.length },
    { id: 'local', label: 'Local / City', icon: '📍' },
    { id: 'interest', label: 'Practice & Japa', icon: '🌿' },
    { id: 'program', label: 'Program Cohorts', icon: '🏔️' },
  ];

  // Reusable Sangha Card Component
  const renderSanghaCard = (s) => {
    const cardClass = `comm-sangha-card-item ${
      s.isOwner ? 'is-owner' : s.isMember ? 'is-joined' : s.membershipStatus === 'pending' ? 'is-pending' : ''
    }`;

    return (
      <div key={s._id} className={cardClass} id={`sangha-card-${s.slug || s._id}`}>
        <div>
          <div className="comm-sangha-card-top">
            <div
              className="comm-sangha-big-icon"
              style={{
                background: s.isOwner
                  ? 'linear-gradient(135deg, rgba(196, 154, 69, 0.25), #fbf2dc)'
                  : s.isMember
                  ? 'linear-gradient(135deg, rgba(78, 99, 70, 0.2), #f4f8f2)'
                  : 'linear-gradient(135deg, var(--comm-gold-light), #fbf2dc)',
              }}
            >
              {s.isOwner ? '👑' : s.isMember ? '🪷' : '🏛️'}
            </div>

            <div className="comm-sangha-title-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                {s.isOwner ? (
                  <span className="comm-sangha-badge-owner">
                    <Crown size={12} /> You Guide This Circle (Owner)
                  </span>
                ) : s.isMember ? (
                  <span className="comm-sangha-badge-joined">
                    <Flower2 size={12} /> You Walk Here (Member)
                  </span>
                ) : s.membershipStatus === 'pending' ? (
                  <span className="comm-sangha-badge-pending">
                    <Clock size={12} /> Approval Pending
                  </span>
                ) : s.isPrivateCircle ? (
                  <span className="comm-sangha-badge-pending" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#92400e', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
                    <Lock size={11} /> Private Circle
                  </span>
                ) : (
                  <span className="comm-sangha-badge-joined" style={{ background: 'rgba(78, 99, 70, 0.1)', color: '#3d5236', border: '1px solid rgba(78, 99, 70, 0.25)' }}>
                    🌐 Public Circle
                  </span>
                )}

                {s.isOwner && s.pendingRequestsCount > 0 && (
                  <span
                    style={{
                      background: '#d97706',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    ⚡ {s.pendingRequestsCount} Pending
                  </span>
                )}

                <span className="comm-level-badge" style={{ textTransform: 'capitalize' }}>
                  {s.type} circle
                </span>
              </div>

              <h3 className="comm-sangha-name">{s.name}</h3>
            </div>
          </div>

          <p className="comm-sangha-tagline">
            {s.tagline || 'A circle of seekers walking the spiritual path in harmony and mutual encouragement.'}
          </p>

          <div className="comm-sangha-metrics-row">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={14} /> {s.membersCount || 1} {s.membersCount === 1 ? 'seeker' : 'seekers'}
            </span>
            {s.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} /> {s.location}
              </span>
            )}
            <span>• {s.postsCount || 0} reflections</span>
          </div>
        </div>

        <div className="comm-sangha-card-footer">
          {s.isOwner ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
              {s.pendingRequestsCount > 0 ? (
                <Link
                  to={`/community/circles/${s.slug || s._id}?tab=requests`}
                  className="comm-btn-small"
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: 16,
                  }}
                  id={`review-requests-btn-${s._id}`}
                >
                  ⚡ Review Requests ({s.pendingRequestsCount})
                </Link>
              ) : (
                <span style={{ fontSize: '0.76rem', color: '#8b6b1b', fontWeight: 600 }}>
                  👑 Circle Guide
                </span>
              )}

              <Link
                to={`/community/circles/${s.slug || s._id}`}
                className="comm-action-btn"
                style={{ color: 'var(--comm-terracotta)', fontWeight: 600 }}
                id={`manage-circle-btn-${s.slug || s._id}`}
              >
                <span>Enter & Manage</span> <ArrowRight size={14} />
              </Link>
            </div>
          ) : s.isMember ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="comm-btn-small joined"
                onClick={() => handleJoinToggle(s._id)}
                id={`sangha-card-join-btn-${s._id}`}
                title="Click to leave circle"
              >
                Joined Circle ✓
              </button>

              <Link
                to={`/community/circles/${s.slug || s._id}`}
                className="comm-action-btn"
                style={{ color: '#4E6346', fontWeight: 700 }}
                id={`enter-circle-btn-${s.slug || s._id}`}
              >
                <span>Enter Sanctuary</span> <ArrowRight size={14} />
              </Link>
            </div>
          ) : s.membershipStatus === 'pending' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="comm-btn-small"
                style={{
                  background: 'rgba(217, 119, 6, 0.12)',
                  color: '#92400e',
                  border: '1px solid #d97706',
                  cursor: 'pointer',
                }}
                onClick={() => handleJoinToggle(s._id)}
                id={`sangha-card-cancel-btn-${s._id}`}
                title="Cancel your join request"
              >
                <Clock size={12} /> Pending (Cancel)
              </button>

              <Link
                to={`/community/circles/${s.slug || s._id}`}
                className="comm-action-btn"
                style={{ color: 'var(--comm-text-muted)', fontWeight: 600 }}
              >
                <span>View Guidelines</span> <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="comm-btn-small"
                onClick={() => handleJoinToggle(s._id)}
                id={`sangha-card-join-btn-${s._id}`}
              >
                {s.isPrivateCircle ? 'Request to Join 🙏' : 'Join Circle 🙏 (Instant)'}
              </button>

              <Link
                to={`/community/circles/${s.slug || s._id}`}
                className="comm-action-btn"
                style={{ color: 'var(--comm-terracotta)', fontWeight: 600 }}
                id={`enter-circle-btn-${s.slug || s._id}`}
              >
                <span>View Circle</span> <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isSegmentedView = selectedType === 'all' && !searchQuery.trim();

  return (
    <>
      <Navbar />

      <main className="comm-root-container">
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          {/* ── Back Navigation ── */}
          <button
            type="button"
            className="comm-back-nav"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/community');
              }
            }}
            id="btn-back-nav"
            style={{ marginBottom: 14 }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* ── Directory Header ── */}
          <header
            className="comm-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div className="comm-header-badge">
                <Shield size={14} />
                <span>Sacred Circles & Communities</span>
              </div>
              <h1 className="comm-header-title">Sangha Directory</h1>
              <p className="comm-header-subtitle">
                Walk your path in sacred fellowship. Discover city chapters, meditation circles, or guide your own sangha.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                to="/community"
                className="comm-action-btn"
                style={{ background: 'var(--comm-bg-card)', padding: '8px 16px' }}
              >
                <Compass size={16} /> Feed View
              </Link>
              <button
                type="button"
                className="comm-btn-share"
                onClick={() => setShowCreateModal(true)}
                id="btn-create-sangha-modal"
              >
                <Plus size={16} /> Start a Circle
              </button>
            </div>
          </header>

          {/* ── Toolbar: Search & Filter Pills ── */}
          <div className="comm-directory-toolbar">
            <div className="comm-search-row">
              <div className="comm-search-input-wrapper">
                <Search size={18} className="comm-search-icon-pos" />
                <input
                  type="text"
                  placeholder="Search circles by name, practice, or location..."
                  className="comm-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="sanghas-search-input"
                />
              </div>
            </div>

            {/* Segmented Filter Bar */}
            <div className="comm-filter-pills" role="tablist">
              {filterPills.map((pill) => (
                <button
                  key={pill.id}
                  className={`comm-filter-pill-btn ${selectedType === pill.id ? 'active' : ''}`}
                  onClick={() => setSelectedType(pill.id)}
                  id={`filter-pill-${pill.id}`}
                  style={{ position: 'relative' }}
                >
                  <span>{pill.icon}</span>
                  <span>{pill.label}</span>
                  {typeof pill.count === 'number' && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        opacity: 0.8,
                        marginLeft: 2,
                        background: 'rgba(0,0,0,0.06)',
                        padding: '1px 6px',
                        borderRadius: 8,
                      }}
                    >
                      {pill.count}
                    </span>
                  )}
                  {pill.alert && (
                    <span
                      style={{
                        background: '#d97706',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 8,
                        marginLeft: 4,
                      }}
                    >
                      {pill.alert}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Directory Content ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <div
                className="spinner"
                style={{
                  width: 38,
                  height: 38,
                  margin: '0 auto 12px',
                  borderColor: 'var(--comm-terracotta) transparent var(--comm-terracotta) transparent',
                }}
              />
              <p style={{ color: 'var(--comm-terracotta)', fontWeight: 600, fontSize: '0.92rem' }}>
                Discovering sacred circles...
              </p>
            </div>
          ) : sanghas.length === 0 ? (
            <div className="comm-empty-state">
              <div className="comm-empty-icon">🏛️</div>
              <h3 className="comm-empty-title">No circles found</h3>
              <p className="comm-empty-desc">
                {searchQuery
                  ? `No sanghas matched "${searchQuery}". Try a different term or create this circle.`
                  : 'Be the pioneer to light this fire. Start the first sangha for this category!'}
              </p>
              <button
                type="button"
                className="comm-btn-share"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} /> Start this Sangha
              </button>
            </div>
          ) : isSegmentedView ? (
            /* ── FEATURE PANEL GRID (Catchy Minimalist Layout) ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {/* PANEL 1: Circles You Guide (Owner Sanctuary) */}
              {guidedSanghas.length > 0 && (
                <section id="panel-guided-sanghas">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                      paddingBottom: 10,
                      borderBottom: '2px solid rgba(196, 154, 69, 0.25)',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontFamily: 'var(--comm-font-serif)',
                          fontSize: '1.35rem',
                          color: '#2c261f',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>👑</span> Circles You Guide
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)', margin: '3px 0 0' }}>
                        You are the founder and guardian of these sacred circles. Review join requests and nurture fellowship.
                      </p>
                    </div>

                    <span
                      style={{
                        background: 'rgba(196, 154, 69, 0.15)',
                        color: '#8b6b1b',
                        padding: '4px 12px',
                        borderRadius: 14,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {guidedSanghas.length} {guidedSanghas.length === 1 ? 'Circle' : 'Circles'}
                    </span>
                  </div>

                  <div className="comm-sangha-grid">
                    {guidedSanghas.map((s) => renderSanghaCard(s))}
                  </div>
                </section>
              )}

              {/* PANEL 2: Circles You Walk With (Joined Sanctuary) */}
              {joinedSanghas.length > 0 && (
                <section id="panel-joined-sanghas">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                      paddingBottom: 10,
                      borderBottom: '2px solid rgba(78, 99, 70, 0.2)',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontFamily: 'var(--comm-font-serif)',
                          fontSize: '1.35rem',
                          color: '#2c261f',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>🪷</span> Circles You Walk With
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)', margin: '3px 0 0' }}>
                        Active fellowships where you share sadhana, reflections, and participate in circle satsang.
                      </p>
                    </div>

                    <span
                      style={{
                        background: 'rgba(78, 99, 70, 0.14)',
                        color: '#3d5236',
                        padding: '4px 12px',
                        borderRadius: 14,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {joinedSanghas.length} {joinedSanghas.length === 1 ? 'Circle' : 'Circles'}
                    </span>
                  </div>

                  <div className="comm-sangha-grid">
                    {joinedSanghas.map((s) => renderSanghaCard(s))}
                  </div>
                </section>
              )}

              {/* PANEL 3: Discover More Circles */}
              {discoverSanghas.length > 0 && (
                <section id="panel-discover-sanghas">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                      paddingBottom: 10,
                      borderBottom: '1px solid var(--comm-border-hairline)',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontFamily: 'var(--comm-font-serif)',
                          fontSize: '1.35rem',
                          color: '#2c261f',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>🌌</span> Discover More Circles
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)', margin: '3px 0 0' }}>
                        Find regional chapters, meditation groups, and program cohorts to request entry.
                      </p>
                    </div>

                    <span
                      style={{
                        background: 'rgba(0,0,0,0.05)',
                        color: 'var(--comm-text-muted)',
                        padding: '4px 12px',
                        borderRadius: 14,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {discoverSanghas.length} Available
                    </span>
                  </div>

                  <div className="comm-sangha-grid">
                    {discoverSanghas.map((s) => renderSanghaCard(s))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* ── Filtered or Searched Grid ── */
            <div>
              <div style={{ marginBottom: 16, fontSize: '0.88rem', color: 'var(--comm-text-muted)' }}>
                Showing <strong>{displayedSanghas.length}</strong> {displayedSanghas.length === 1 ? 'circle' : 'circles'}
                {searchQuery && <span> matching "{searchQuery}"</span>}
              </div>
              <div className="comm-sangha-grid">
                {displayedSanghas.map((s) => renderSanghaCard(s))}
              </div>
            </div>
          )}
        </div>

        {/* ── Create Sangha Modal ── */}
        {showCreateModal && (
          <div className="comm-modal-backdrop" onClick={() => setShowCreateModal(false)}>
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <h3 className="comm-modal-title">Start a Sacred Sangha</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} color="var(--comm-text-muted)" />
                </button>
              </div>

              <form onSubmit={handleCreateSangha} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
                    Sangha Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vrindavan Japa Circle, Bengaluru Meditators"
                    className="comm-input-field"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    id="new-sangha-name-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
                    Circle Type
                  </label>
                  <select
                    className="comm-input-field"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    id="new-sangha-type-select"
                  >
                    <option value="interest">Practice & Japa (Interest)</option>
                    <option value="local">Local / City Chapter</option>
                    <option value="program">Program / Mandala Cohort</option>
                    <option value="event">Sacred Event / Yatra</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 6 }}>
                    Circle Privacy & Admission Policy *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div
                      onClick={() => setNewIsPrivate(false)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '2px solid',
                        borderColor: !newIsPrivate ? 'var(--comm-terracotta)' : 'var(--comm-border-hairline)',
                        background: !newIsPrivate ? 'rgba(217, 87, 43, 0.06)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: !newIsPrivate ? 'var(--comm-terracotta)' : 'inherit', marginBottom: 2 }}>
                        🌐 Public Circle
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--comm-text-muted)', lineHeight: 1.35 }}>
                        Open to all seekers. Instant entry without approval.
                      </div>
                    </div>

                    <div
                      onClick={() => setNewIsPrivate(true)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '2px solid',
                        borderColor: newIsPrivate ? 'var(--comm-terracotta)' : 'var(--comm-border-hairline)',
                        background: newIsPrivate ? 'rgba(217, 87, 43, 0.06)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: newIsPrivate ? 'var(--comm-terracotta)' : 'inherit', marginBottom: 2 }}>
                        🔒 Private Circle
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--comm-text-muted)', lineHeight: 1.35 }}>
                        Protected sanctuary. Seekers must be approved by you.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
                    Tagline (One-line intention)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Walking together in silence, sadhana, and mutual grace."
                    className="comm-input-field"
                    value={newTagline}
                    onChange={(e) => setNewTagline(e.target.value)}
                    maxLength={180}
                    id="new-sangha-tagline-input"
                  />
                </div>

                {newType === 'local' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
                      Location / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, Karnataka or New York, NY"
                      className="comm-input-field"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      id="new-sangha-location-input"
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>
                    Description & Guidelines
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the intention, gathering times, or practices of this circle..."
                    className="comm-input-field"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    id="new-sangha-desc-input"
                  />
                </div>

                {createError && (
                  <div style={{ color: '#b4421b', fontSize: '0.84rem' }}>{createError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    className="comm-btn-small"
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: 'transparent', border: '1px solid var(--comm-border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="comm-btn-share"
                    disabled={creating}
                    id="btn-confirm-create-sangha"
                  >
                    {creating ? 'Creating...' : 'Create Sacred Sangha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
