import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import PersonaSwitcher from '../../components/PersonaSwitcher';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  ArrowRight,
  Shield,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import GatheringDetailModal from './components/GatheringDetailModal';
import './Community.css';

const TYPE_FILTERS = [
  { label: 'All Gatherings', value: 'all' },
  { label: 'In-Person 🏛️', value: 'in_person' },
  { label: 'Online Sanctuary 🌐', value: 'online' },
  { label: 'Retreats 🌲', value: 'retreat' },
];

export default function GatheringsDirectory() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [gatherings, setGatherings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGatheringId, setSelectedGatheringId] = useState(null);

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
    fetchGatherings();
    const gId = searchParams.get('id');
    if (gId) {
      setSelectedGatheringId(gId);
    }
  }, []);

  const filteredGatherings = gatherings.filter((g) => {
    const matchesType = selectedType === 'all' || g.eventType === selectedType;
    const matchesSearch =
      !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.venue?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.venue?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.contactPerson?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

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

  return (
    <div className="comm-app-container">
      <Navbar />

      {/* Top Bar with Persona Switcher */}
      <div className="comm-top-banner">
        <div className="comm-top-banner-inner">
          <div className="comm-top-breadcrumb">
            <Link to="/community">Sangha Sanctuary</Link>
            <span style={{ margin: '0 6px', color: 'var(--comm-border-medium)' }}>/</span>
            <span style={{ color: 'var(--comm-text-charcoal)', fontWeight: 600 }}>Gatherings</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PersonaSwitcher />
          </div>
        </div>
      </div>

      <main className="comm-main-layout">
        <div style={{ maxWidth: 1040, margin: '0 auto', width: '100%' }}>
          {/* Ambient Spiritual Hero */}
          <div
            className="comm-welcome-hero"
            style={{ marginBottom: 24, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--comm-terracotta)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Calendar size={14} />
                <span>Sacred Convocations & Group Practice</span>
              </div>
              <h1 className="comm-serif" style={{ fontSize: '2rem', fontWeight: 700, margin: '4px 0 6px', color: 'var(--comm-text-charcoal)' }}>
                Sangha Gatherings
              </h1>
              <p style={{ fontSize: '0.94rem', color: 'var(--comm-text-muted)', margin: 0, maxWidth: 640 }}>
                Sit in consecrated silence, synchronize breathwork, and deepen sadhana alongside fellow seekers in physical pavilions and virtual spaces.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/community/circles" className="comm-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Shield size={15} />
                <span>Browse Circles</span>
              </Link>
              <Link to="/community" className="comm-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>Community Feed</span>
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div
            style={{
              background: 'var(--comm-bg-card)',
              border: '1px solid var(--comm-border-hairline)',
              borderRadius: 'var(--comm-radius-md)',
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
                <Search size={16} color="var(--comm-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="comm-input"
                  placeholder="Search by gathering title, location, city, or host..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 36, width: '100%' }}
                />
              </div>

              {/* Type Pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`comm-btn-small ${selectedType === f.value ? 'joined' : ''}`}
                    onClick={() => setSelectedType(f.value)}
                    style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: '14px', background: 'rgba(217, 87, 43, 0.1)', color: 'var(--comm-terracotta)', borderRadius: 8, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Gatherings Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--comm-text-muted)' }}>
              Gathering sacred schedules...
            </div>
          ) : filteredGatherings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--comm-text-muted)', background: 'var(--comm-bg-card)', borderRadius: 12, border: '1px solid var(--comm-border-hairline)' }}>
              <Calendar size={36} color="var(--comm-terracotta)" style={{ margin: '0 auto 12px' }} />
              <h3 className="comm-serif" style={{ fontSize: '1.2rem', color: 'var(--comm-text-charcoal)' }}>
                No gatherings found
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: 400, margin: '6px auto' }}>
                Try adjusting your search terms or filter selection.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filteredGatherings.map((g) => {
                const { month, day } = formatDateBadge(g.startTime);
                const spots = Math.max(0, (g.capacity || 40) - (g.attendeesCount || 0));

                return (
                  <div
                    key={g._id}
                    className="comm-post-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--comm-radius-md)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedGatheringId(g._id)}
                  >
                    <div>
                      {/* Card Header with Date Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                        <div
                          style={{
                            background: 'var(--comm-bg-parchment)',
                            border: '1px solid var(--comm-border-medium)',
                            borderRadius: 8,
                            padding: '6px 12px',
                            textAlign: 'center',
                            minWidth: 54,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                          }}
                        >
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--comm-terracotta)', letterSpacing: '0.05em' }}>
                            {month}
                          </div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--comm-text-charcoal)', lineHeight: 1.1 }}>
                            {day}
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: g.eventType === 'in_person' ? 'rgba(78,99,70,0.1)' : 'rgba(196,154,69,0.15)',
                                color: g.eventType === 'in_person' ? 'var(--comm-olive)' : 'var(--comm-gold)',
                              }}
                            >
                              {g.eventType === 'in_person' ? 'In-Person' : g.eventType === 'online' ? 'Online' : 'Retreat'}
                            </span>
                            {g.isAttending && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--comm-olive)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <CheckCircle2 size={12} /> Confirmed
                              </span>
                            )}
                            {g.myJoinRequest?.status === 'pending' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--comm-gold)' }}>
                                ⏳ Pending Approval
                              </span>
                            )}
                          </div>

                          <h3
                            className="comm-serif"
                            style={{
                              fontSize: '1.12rem',
                              fontWeight: 700,
                              color: 'var(--comm-text-charcoal)',
                              margin: 0,
                              lineHeight: 1.35,
                            }}
                          >
                            {g.title}
                          </h3>
                        </div>
                      </div>

                      {/* Time & Venue */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem', color: 'var(--comm-text-muted)', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} color="var(--comm-terracotta)" />
                          <span>{formatTime(g.startTime, g.endTime)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} color="var(--comm-terracotta)" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {g.venue?.name || g.locationOrLink || 'Bengaluru'} ({g.venue?.city || 'Bengaluru'})
                          </span>
                        </div>
                        {g.contactPerson?.name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={14} color="var(--comm-terracotta)" />
                            <span>Host: <strong>{g.contactPerson.name}</strong> • {g.contactPerson.ishaRole || 'Coordinator'}</span>
                          </div>
                        )}
                      </div>

                      {/* Description excerpt */}
                      {g.description && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--comm-text-charcoal)',
                            lineHeight: 1.5,
                            margin: '0 0 14px',
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
                        paddingTop: 12,
                        borderTop: '1px solid var(--comm-border-hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--comm-text-muted)' }}>
                        <strong style={{ color: 'var(--comm-text-charcoal)' }}>{g.attendeesCount || 0}</strong> attending
                        {spots > 0 && <span> • <span style={{ color: 'var(--comm-olive)' }}>{spots} spots</span></span>}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {g.isAttending && (
                          <button
                            type="button"
                            className="comm-btn-small joined"
                            onClick={() => setSelectedGatheringId(g._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <MessageSquare size={13} />
                            <span>Chat</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="comm-btn-small"
                          onClick={() => setSelectedGatheringId(g._id)}
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Gathering Detail & Chat Modal */}
      {selectedGatheringId && (
        <GatheringDetailModal
          gatheringId={selectedGatheringId}
          onClose={() => setSelectedGatheringId(null)}
          onUpdated={fetchGatherings}
        />
      )}
    </div>
  );
}
