import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  ArrowRight,
  ArrowLeft,
  Shield,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Plus,
  Compass,
  Video,
  Lock,
  Crown,
  Flower2,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Community.css';

export default function GatheringsDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [gatherings, setGatherings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Propose Gathering Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('in_person'); // 'in_person' | 'online' | 'retreat'
  const [newStartDate, setNewStartDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('06:00');
  const [newEndTime, setNewEndTime] = useState('08:00');
  const [newVenueName, setNewVenueName] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newAddress, setNewAddress] = useState('');
  const [newOnlineLink, setNewOnlineLink] = useState('');
  const [newRequiresApproval, setNewRequiresApproval] = useState(true);
  const [newCapacity, setNewCapacity] = useState(30);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchGatherings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/community/gatherings');
      setGatherings(res.data.gatherings || []);
    } catch (err) {
      console.error('Failed to load gatherings directory:', err);
      setError('Could not load gatherings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const gId = searchParams.get('id');
    if (gId) {
      navigate(`/community/gatherings/${gId}`);
      return;
    }
    fetchGatherings();
  }, [searchParams, navigate]);

  // Handle Propose Gathering
  const handleCreateGathering = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartDate) {
      setCreateError('Please provide a gathering title and start date.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const combinedStart = new Date(`${newStartDate}T${newStartTime || '06:00'}:00`);
      const combinedEnd = newEndTime ? new Date(`${newStartDate}T${newEndTime}:00`) : null;

      const res = await api.post('/community/gatherings', {
        title: newTitle.trim(),
        description: newDesc.trim(),
        eventType: newType,
        startTime: combinedStart,
        endTime: combinedEnd,
        locationOrLink: newType === 'online' ? newOnlineLink.trim() : newVenueName.trim(),
        venue: {
          name: newVenueName.trim() || (newType === 'online' ? 'Online Consecrated Space' : 'Sadhana Space'),
          address: newAddress.trim(),
          city: newCity.trim() || 'Bengaluru',
        },
        contactPerson: {
          name: user?.name || 'Isha Volunteer',
          ishaRole: 'Satsang Guide',
        },
        requiresApproval: newRequiresApproval,
        capacity: Number(newCapacity) || 30,
      });

      if (res.data?.gathering) {
        setShowCreateModal(false);
        navigate(`/community/gatherings/${res.data.gathering._id}`);
      }
    } catch (err) {
      console.error('Failed to propose gathering:', err);
      setCreateError(err.response?.data?.message || 'Could not create gathering.');
    } finally {
      setCreating(false);
    }
  };

  // Grouping for featured panel grid
  const hostedGatherings = useMemo(() => gatherings.filter((g) => g.isOwner || g.isCreator), [gatherings]);
  const attendingGatherings = useMemo(() => gatherings.filter((g) => (g.isAttending || g.myJoinRequest) && !g.isOwner && !g.isCreator), [gatherings]);
  const exploreGatherings = useMemo(() => gatherings.filter((g) => !g.isAttending && !g.myJoinRequest && !g.isOwner && !g.isCreator), [gatherings]);

  // Total pending requests across all hosted gatherings
  const totalPendingRequests = useMemo(() => {
    return hostedGatherings.reduce((sum, g) => sum + (g.pendingRequestsCount || 0), 0);
  }, [hostedGatherings]);

  const filteredGatherings = useMemo(() => {
    return gatherings.filter((g) => {
      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'hosted' && (g.isOwner || g.isCreator)) ||
        (selectedType === 'attending' && (g.isAttending || g.myJoinRequest)) ||
        g.eventType === selectedType;

      const matchesSearch =
        !searchQuery.trim() ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.venue?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.venue?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.contactPerson?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [gatherings, selectedType, searchQuery]);

  const formatDateBadge = (dateStr) => {
    if (!dateStr) return { month: 'UPCOMING', day: '•' };
    const d = new Date(dateStr);
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = d.getDate();
    return { month, day };
  };

  const formatTime = (start, end) => {
    if (!start) return '';
    const s = new Date(start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (!end) return s;
    const e = new Date(end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${s} – ${e}`;
  };

  const filterPills = [
    { id: 'all', label: 'All Gatherings', icon: '🏛️', count: gatherings.length },
    {
      id: 'hosted',
      label: 'Hosted by You',
      icon: '👑',
      count: hostedGatherings.length,
      alert: totalPendingRequests > 0 ? `${totalPendingRequests} pending` : null,
    },
    { id: 'attending', label: 'You Attend', icon: '🪷', count: attendingGatherings.length },
    { id: 'in_person', label: 'In-Person 🏛️', count: gatherings.filter((g) => g.eventType === 'in_person').length },
    { id: 'online', label: 'Online Sanctuary 🌐', count: gatherings.filter((g) => g.eventType === 'online').length },
    { id: 'retreat', label: 'Sacred Retreats 🌲', count: gatherings.filter((g) => g.eventType === 'retreat').length },
  ];

  // Render a Single Gathering Card
  const renderGatheringCard = (g) => {
    const { month, day } = formatDateBadge(g.startTime);
    const isHost = g.isOwner || g.isCreator;
    const isAttending = g.isAttending;
    const isPending = g.myJoinRequest?.status === 'pending';
    const spotsLeft = Math.max(0, (g.capacity || 40) - (g.attendeesCount || 0));

    const cardClass = `comm-gathering-card-item ${
      isHost ? 'is-owner' : isAttending ? 'is-joined' : isPending ? 'is-pending' : ''
    }`;

    return (
      <div
        key={g._id}
        className={cardClass}
        id={`gathering-card-${g._id}`}
        onClick={() => navigate(`/community/gatherings/${g._id}`)}
      >
        <div>
          {/* Card Top: Date Badge & Badges */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            <div className="comm-gathering-date-box">
              <div className="comm-gathering-date-month">{month}</div>
              <div className="comm-gathering-date-day">{day}</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {isHost ? (
                  <span className="comm-sangha-badge-owner">
                    <Crown size={12} /> You Are Hosting
                  </span>
                ) : isAttending ? (
                  <span className="comm-sangha-badge-joined">
                    <CheckCircle2 size={12} /> Confirmed Attendee
                  </span>
                ) : isPending ? (
                  <span className="comm-sangha-badge-pending">
                    <Clock size={12} /> Blessing Pending
                  </span>
                ) : null}

                {isHost && g.pendingRequestsCount > 0 && (
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
                    ⚡ {g.pendingRequestsCount} Pending
                  </span>
                )}

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: g.eventType === 'in_person' ? 'rgba(78,99,70,0.1)' : 'rgba(196,154,69,0.15)',
                    color: g.eventType === 'in_person' ? 'var(--comm-olive)' : '#8b6b1b',
                  }}
                >
                  {g.eventType === 'in_person' ? '🏛️ In-Person' : g.eventType === 'online' ? '🌐 Online' : '🌲 Retreat'}
                </span>

                {g.requiresApproval ? (
                  <span className="comm-sangha-badge-protected">
                    <Lock size={10} /> Blessing Required
                  </span>
                ) : (
                  <span className="comm-sangha-badge-joined" style={{ background: 'rgba(78, 99, 70, 0.08)', color: '#3d5236' }}>
                    🌐 Open
                  </span>
                )}
              </div>

              <h3
                className="comm-serif"
                style={{
                  fontSize: '1.24rem',
                  fontWeight: 700,
                  color: 'var(--comm-text-charcoal)',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {g.title}
              </h3>
            </div>
          </div>

          {/* Time & Venue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem', color: 'var(--comm-text-muted)', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="var(--comm-terracotta)" />
              <span style={{ fontWeight: 600, color: 'var(--comm-text-charcoal)' }}>{formatTime(g.startTime, g.endTime)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="var(--comm-terracotta)" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {g.venue?.name || g.locationOrLink || 'Bengaluru Ashram'} ({g.venue?.city || 'Bengaluru'})
              </span>
            </div>

            {g.contactPerson?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <Users size={13} color="var(--comm-gold)" />
                <span>Guide: <strong>{g.contactPerson.name}</strong> • {g.contactPerson.ishaRole || 'Coordinator'}</span>
              </div>
            )}
          </div>

          {/* Description excerpt */}
          {g.description && (
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--comm-text-charcoal)',
                lineHeight: 1.5,
                margin: '0 0 16px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {g.description}
            </p>
          )}
        </div>

        {/* Card Footer */}
        <div
          style={{
            paddingTop: 14,
            borderTop: '1px solid var(--comm-border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--comm-text-muted)' }}>
            <strong style={{ color: 'var(--comm-text-charcoal)' }}>{g.attendeesCount || 0}</strong> attending
            {spotsLeft > 0 && (
              <span> • <span style={{ color: 'var(--comm-olive)', fontWeight: 600 }}>{spotsLeft} spots open</span></span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isHost && g.pendingRequestsCount > 0 ? (
              <button
                type="button"
                className="comm-btn-small"
                onClick={() => navigate(`/community/gatherings/${g._id}?tab=requests`)}
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 16,
                }}
              >
                ⚡ Review ({g.pendingRequestsCount})
              </button>
            ) : isAttending ? (
              <button
                type="button"
                className="comm-btn-small joined"
                onClick={() => navigate(`/community/gatherings/${g._id}?tab=chat`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <MessageSquare size={13} />
                <span>Chat</span>
              </button>
            ) : null}

            <button
              type="button"
              className="comm-action-btn"
              onClick={() => navigate(`/community/gatherings/${g._id}`)}
              style={{ color: 'var(--comm-terracotta)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}
            >
              <span>View Gathering</span>
              <ArrowRight size={14} />
            </button>
          </div>
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
              marginBottom: 24,
            }}
          >
            <div>
              <div className="comm-header-badge">
                <Calendar size={14} />
                <span>Sacred Convocations & Group Practice</span>
              </div>
              <h1 className="comm-header-title">Sangha Gatherings</h1>
              <p className="comm-header-subtitle">
                Sit in consecrated silence, synchronize breathwork, and deepen sadhana alongside fellow seekers in physical pavilions and virtual spaces.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                to="/community"
                className="comm-action-btn"
                style={{ background: 'var(--comm-bg-card)', padding: '8px 16px' }}
              >
                <Compass size={16} /> Community Feed
              </Link>
              <Link
                to="/community/circles"
                className="comm-action-btn"
                style={{ background: 'var(--comm-bg-card)', padding: '8px 16px' }}
              >
                <Shield size={16} /> Browse Circles
              </Link>
              <button
                type="button"
                className="comm-btn-share"
                onClick={() => setShowCreateModal(true)}
                id="btn-propose-gathering-modal"
              >
                <Plus size={16} /> Propose a Gathering
              </button>
            </div>
          </header>

          {/* ── Toolbar: Search & Filter Pills ── */}
          <div className="comm-directory-toolbar" style={{ marginBottom: 28 }}>
            <div className="comm-search-row">
              <div className="comm-search-input-wrapper">
                <Search size={18} className="comm-search-icon-pos" />
                <input
                  type="text"
                  placeholder="Search gatherings by title, location, city, or coordinator..."
                  className="comm-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="gatherings-search-input"
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
                        opacity: 0.85,
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
                Discovering sacred gatherings...
              </p>
            </div>
          ) : gatherings.length === 0 ? (
            <div className="comm-empty-state">
              <div className="comm-empty-icon">🪷</div>
              <h3 className="comm-empty-title">No scheduled gatherings</h3>
              <p className="comm-empty-desc">
                {searchQuery
                  ? `No gatherings matched "${searchQuery}". Try a different term or propose this convocation.`
                  : 'Be the first to propose a sacred gathering for fellow seekers in your city!'}
              </p>
              <button
                type="button"
                className="comm-btn-share"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} /> Propose this Gathering
              </button>
            </div>
          ) : isSegmentedView ? (
            /* ── FEATURE PANEL GRID (Catchy Minimalist Layout) ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {/* PANEL 1: Gatherings You Host */}
              {hostedGatherings.length > 0 && (
                <section id="panel-hosted-gatherings">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                      paddingBottom: 10,
                      borderBottom: '2px solid rgba(196, 154, 69, 0.4)',
                    }}
                  >
                    <div>
                      <h2
                        className="comm-serif"
                        style={{
                          fontSize: '1.45rem',
                          color: '#8b6b1b',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>👑 Gatherings You Host</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>
                          ({hostedGatherings.length})
                        </span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>
                        Manage attendee blessing requests and coordinate consecrated satsang sessions.
                      </p>
                    </div>

                    {totalPendingRequests > 0 && (
                      <span
                        style={{
                          background: '#d97706',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          padding: '4px 12px',
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        ⚡ {totalPendingRequests} Attendee Requests Waiting
                      </span>
                    )}
                  </div>

                  <div className="comm-gathering-grid">
                    {hostedGatherings.map(renderGatheringCard)}
                  </div>
                </section>
              )}

              {/* PANEL 2: Gatherings You Attend */}
              {attendingGatherings.length > 0 && (
                <section id="panel-attending-gatherings">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                      paddingBottom: 10,
                      borderBottom: '2px solid rgba(78, 99, 70, 0.35)',
                    }}
                  >
                    <div>
                      <h2
                        className="comm-serif"
                        style={{
                          fontSize: '1.45rem',
                          color: '#344530',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>🪷 Gatherings You Attend</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>
                          ({attendingGatherings.length})
                        </span>
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>
                        Convocations where your presence is confirmed or awaiting blessing.
                      </p>
                    </div>
                  </div>

                  <div className="comm-gathering-grid">
                    {attendingGatherings.map(renderGatheringCard)}
                  </div>
                </section>
              )}

              {/* PANEL 3: Discover Upcoming Convocations */}
              <section id="panel-explore-gatherings">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 10,
                    borderBottom: '2px solid var(--comm-border)',
                  }}
                >
                  <div>
                    <h2
                      className="comm-serif"
                      style={{
                        fontSize: '1.45rem',
                        color: 'var(--comm-text-charcoal)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span>🌌 Upcoming Convocations & Satsangs</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>
                        ({exploreGatherings.length})
                      </span>
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>
                      Connect with early dawn sadhana, full moon chanting, and weekend intensives.
                    </p>
                  </div>
                </div>

                {exploreGatherings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--comm-text-muted)' }}>
                    You are already participating in all available scheduled gatherings!
                  </div>
                ) : (
                  <div className="comm-gathering-grid">
                    {exploreGatherings.map(renderGatheringCard)}
                  </div>
                )}
              </section>
            </div>
          ) : (
            /* ── Flat Filtered View ── */
            <div>
              {filteredGatherings.length === 0 ? (
                <div className="comm-empty-state">
                  <div className="comm-empty-icon">🔍</div>
                  <h3 className="comm-empty-title">No gatherings found</h3>
                  <p className="comm-empty-desc">
                    Try adjusting your search terms or filter selection.
                  </p>
                </div>
              ) : (
                <div className="comm-gathering-grid">
                  {filteredGatherings.map(renderGatheringCard)}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── PROPOSE A GATHERING MODAL ── */}
      {showCreateModal && (
        <div className="comm-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="comm-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580, width: '92%', borderRadius: 20, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="comm-modal-header" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>🪷</span>
                <h3 className="comm-modal-title" style={{ fontSize: '1.3rem' }}>
                  Propose a Sacred Gathering
                </h3>
              </div>
              <button
                type="button"
                className="comm-modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div
                style={{
                  background: 'rgba(217, 87, 43, 0.1)',
                  border: '1px solid var(--comm-terracotta)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  color: 'var(--comm-terracotta)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateGathering} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                  Gathering Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dawn Surya Kriya Mandalam & Chanting"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--comm-border)',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                  Description & Sacred Intention
                </label>
                <textarea
                  placeholder="Share what practitioners will engage in during this session..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--comm-border)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Event Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                  Gathering Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { id: 'in_person', label: 'In-Person 🏛️' },
                    { id: 'online', label: 'Online 🌐' },
                    { id: 'retreat', label: 'Retreat 🌲' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewType(t.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: newType === t.id ? '2px solid var(--comm-terracotta)' : '1px solid var(--comm-border)',
                        background: newType === t.id ? 'rgba(217, 87, 43, 0.08)' : '#ffffff',
                        fontWeight: newType === t.id ? 700 : 500,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        color: newType === t.id ? 'var(--comm-terracotta)' : 'var(--comm-text-charcoal)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--comm-border)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--comm-border)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--comm-border)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              {/* Venue details */}
              {newType === 'online' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                    Online Meeting / Sanctuary Link
                  </label>
                  <input
                    type="text"
                    placeholder="https://zoom.us/j/... (Visible to approved attendees)"
                    value={newOnlineLink}
                    onChange={(e) => setNewOnlineLink(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--comm-border)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                      Venue Name & Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cubbon Park Lotus Pavilion"
                      value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--comm-border)',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--comm-border)',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Blessing policy & Capacity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                    Capacity (Seekers)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--comm-border)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
                  <input
                    type="checkbox"
                    id="requireApprovalToggle"
                    checked={newRequiresApproval}
                    onChange={(e) => setNewRequiresApproval(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--comm-terracotta)', cursor: 'pointer' }}
                  />
                  <label htmlFor="requireApprovalToggle" style={{ fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                    Require Host Approval 🙏
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  className="comm-btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="comm-btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Consecrating...' : 'Publish Gathering 🙏'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
