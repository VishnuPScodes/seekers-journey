import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';
import {
  Sparkles,
  Plus,
  Calendar,
  Filter,
  Trash2,
  Edit2,
  X,
  Compass,
  CheckCircle2,
  AlertCircle,
  Clock,
  HeartHandshake,
  BookOpen,
  Mountain,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all',       label: 'All Memories', icon: '✦' },
  { id: 'program',   label: 'Programs',     icon: '🏛️' },
  { id: 'sadhana',   label: 'Sadhana',      icon: '🪷' },
  { id: 'milestone', label: 'Milestones',   icon: '🏔️' },
  { id: 'seva',      label: 'Seva',         icon: '🙏' },
  { id: 'personal',  label: 'Personal',     icon: '✨' },
];

const SUGGESTED_TITLES = [
  { title: 'First Heard About Sadhguru', category: 'personal' },
  { title: 'Completed Inner Engineering 7-Day', category: 'program' },
  { title: 'Initiated into Shambhavi Mahamudra', category: 'sadhana' },
  { title: 'First Visit to Isha Yoga Center Coimbatore', category: 'personal' },
  { title: 'Volunteered for Mahashivratri Seva', category: 'seva' },
  { title: 'Completed Bhava Spandana Program (BSP)', category: 'program' },
  { title: 'Attended Shoonya Intensive Program', category: 'program' },
  { title: 'Participated in Sadhanapada', category: 'seva' },
];

const CATEGORY_COLORS = {
  start:     { bg: 'rgba(93, 117, 80, 0.15)', text: '#5d7550', border: 'rgba(93, 117, 80, 0.3)' },
  program:   { bg: 'rgba(196, 107, 62, 0.15)', text: '#c46b3e', border: 'rgba(196, 107, 62, 0.3)' },
  sadhana:   { bg: 'rgba(167, 88, 48, 0.15)',  text: '#a75830', border: 'rgba(167, 88, 48, 0.3)' },
  milestone: { bg: 'rgba(133, 69, 36, 0.15)',  text: '#854524', border: 'rgba(133, 69, 36, 0.3)' },
  seva:      { bg: 'rgba(93, 117, 80, 0.15)', text: '#5d7550', border: 'rgba(93, 117, 80, 0.3)' },
  personal:  { bg: 'rgba(196, 107, 62, 0.12)', text: '#c46b3e', border: 'rgba(196, 107, 62, 0.25)' },
  community: { bg: 'rgba(62, 56, 45, 0.12)',  text: '#3e382d', border: 'rgba(62, 56, 45, 0.25)' },
};

export default function PersonalJourney() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('personal');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/journey/events');
      setEvents(data.events || []);
    } catch (err) {
      console.error('Fetch journey events failed:', err);
      setError('Failed to load your personal journey timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filtered list
  const filteredEvents = useMemo(() => {
    if (activeCategory === 'all') return events;
    return events.filter(e => e.category === activeCategory);
  }, [events, activeCategory]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = events.length;
    const sadhanaCount = events.filter(e => e.category === 'sadhana').length;
    const programsCount = events.filter(e => e.category === 'program').length;
    const sevaCount = events.filter(e => e.category === 'seva').length;
    return { total, sadhanaCount, programsCount, sevaCount };
  }, [events]);

  const openCreateModal = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormCategory('personal');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setModalOpen(true);
    setError('');
  };

  const openEditModal = (event) => {
    setEditingEventId(event._id);
    setFormTitle(event.title);
    setFormCategory(event.category || 'personal');
    setFormDate(new Date(event.date).toISOString().split('T')[0]);
    setFormDescription(event.description || '');
    setModalOpen(true);
    setError('');
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Please enter a milestone title');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingEventId) {
        // Edit existing
        const { data } = await api.put(`/journey/events/${editingEventId}`, {
          title: formTitle,
          category: formCategory,
          date: formDate,
          description: formDescription,
        });
        setEvents(prev => prev.map(ev => ev._id === editingEventId ? data.event : ev));
      } else {
        // Create new
        const { data } = await api.post('/journey/events', {
          title: formTitle,
          category: formCategory,
          date: formDate,
          description: formDescription,
        });
        setEvents(prev => [data.event, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this memory from your timeline?')) return;
    try {
      await api.delete(`/journey/events/${id}`);
      setEvents(prev => prev.filter(e => e._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container-lg animate-in" style={{ maxWidth: 680, padding: '0 8px' }}>
          {/* Header Card */}
          <div className="glass-card" style={{ marginBottom: 20, textAlign: 'center', padding: '24px 20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(196, 107, 62, 0.12)',
              color: 'var(--gold-accent)',
              marginBottom: 12,
            }}>
              <Compass size={26} strokeWidth={1.5} />
            </div>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px',
            }}>
              My Journey with Isha
            </h1>

            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              maxWidth: 480,
              margin: '0 auto 18px',
              lineHeight: 1.5,
            }}>
              A living, automatically updating chronicle celebrating your spiritual initiations,
              sadhana milestones, and personal moments on the path.
            </p>

            {/* Quick Stats Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              padding: '12px 8px',
              background: 'rgba(62, 56, 45, 0.04)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 18,
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Memories</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-accent)' }}>{stats.sadhanaCount}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sadhana</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--emerald-400)' }}>{stats.programsCount}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Programs</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#854524' }}>{stats.sevaCount}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Seva</div>
              </div>
            </div>

            {/* Action Button */}
            <button
              id="add-journey-event-btn"
              className="btn btn-primary"
              onClick={openCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                fontSize: 14,
                borderRadius: 100,
              }}
            >
              <Plus size={16} /> Record a Sacred Memory / Event
            </button>
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 16,
            scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    borderRadius: 100,
                    border: `1px solid ${active ? 'var(--gold-accent)' : 'var(--border)'}`,
                    background: active ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.4)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              );
            })}
          </div>

          {/* Timeline Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gathering your journey milestones...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🪷</div>
              <h3 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>
                No moments recorded in this category yet
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 16px' }}>
                Every step on the path is sacred. Record when you first encountered Sadhguru, programs completed, or moments of profound grace.
              </p>
              <button className="btn btn-outline" onClick={openCreateModal} style={{ fontSize: 13 }}>
                <Plus size={14} /> Add First Memory
              </button>
            </div>
          ) : (
            <div className="timeline-container" style={{ position: 'relative', paddingLeft: 24, paddingRight: 4 }}>
              {/* Timeline continuous vertical line */}
              <div style={{
                position: 'absolute',
                top: 16,
                bottom: 24,
                left: 11,
                width: 2,
                background: 'linear-gradient(to bottom, var(--gold-accent), rgba(62, 56, 45, 0.15))',
                borderRadius: 2,
              }} />

              {filteredEvents.map((event, idx) => {
                const colorScheme = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.personal;
                const isAuto = event.type === 'auto';

                return (
                  <div
                    key={event._id}
                    className="timeline-item animate-in"
                    style={{
                      position: 'relative',
                      marginBottom: 20,
                      animationDelay: `${Math.min(idx * 0.05, 0.3)}s`,
                    }}
                  >
                    {/* Node Dot / Icon Badge */}
                    <div style={{
                      position: 'absolute',
                      left: -24,
                      top: 14,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--bg-primary)',
                      border: `2px solid ${colorScheme.text}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      zIndex: 2,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                    }}>
                      {event.icon || '🪷'}
                    </div>

                    {/* Event Card */}
                    <div
                      className="glass-card"
                      style={{
                        padding: '16px 18px',
                        background: 'rgba(255, 255, 255, 0.55)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 8px rgba(62, 56, 45, 0.04)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          {/* Metadata row: Category pill + date + badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: colorScheme.bg,
                              color: colorScheme.text,
                              border: `1px solid ${colorScheme.border}`,
                            }}>
                              {event.category}
                            </span>

                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={12} /> {formatDate(event.date)}
                            </span>

                            {isAuto ? (
                              <span style={{
                                fontSize: 9,
                                padding: '1px 6px',
                                borderRadius: 100,
                                background: 'rgba(93, 117, 80, 0.1)',
                                color: 'var(--emerald-400)',
                                border: '1px solid rgba(93, 117, 80, 0.25)',
                                fontWeight: 500,
                              }}>
                                Auto Milestone
                              </span>
                            ) : (
                              <span style={{
                                fontSize: 9,
                                padding: '1px 6px',
                                borderRadius: 100,
                                background: 'rgba(196, 107, 62, 0.1)',
                                color: 'var(--gold-accent)',
                                border: '1px solid rgba(196, 107, 62, 0.25)',
                                fontWeight: 500,
                              }}>
                                Seeker Memory
                              </span>
                            )}
                          </div>

                          {/* Event Title */}
                          <h3 style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: '0 0 6px',
                            lineHeight: 1.3,
                          }}>
                            {event.title}
                          </h3>
                        </div>

                        {/* Actions for User-Created Events */}
                        {!isAuto && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(event)}
                              title="Edit memory"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(event._id)}
                              title="Remove memory"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(196, 107, 62, 0.7)',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Description / Journal notes */}
                      {event.description && (
                        <p style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          margin: 0,
                          fontStyle: isAuto ? 'normal' : 'italic',
                        }}>
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add / Edit Memory Modal */}
          {modalOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(62, 56, 45, 0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}>
              <div
                className="glass-card animate-in"
                style={{
                  width: '100%',
                  maxWidth: 500,
                  background: '#f4efd8',
                  border: '1px solid rgba(62, 56, 45, 0.2)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
                  padding: 24,
                  borderRadius: 12,
                }}
              >
                {/* Modal Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <Sparkles size={20} color="var(--gold-accent)" />
                    {editingEventId ? 'Edit Journey Memory' : 'Record a Journey Memory'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {error && (
                  <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form onSubmit={handleSaveEvent}>
                  {/* Suggested Quick Inspiration Chips (only when creating new) */}
                  {!editingEventId && (
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Suggestions for inspiration:
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {SUGGESTED_TITLES.slice(0, 4).map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormTitle(s.title);
                              setFormCategory(s.category);
                            }}
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 100,
                              background: 'rgba(255, 255, 255, 0.6)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            + {s.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Title Input */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Milestone / Memory Title *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Completed Inner Engineering, Sadhana in Dhyanalinga"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      style={{ fontSize: 14, padding: '10px 12px' }}
                    />
                  </div>

                  {/* Category Selection */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Category
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormCategory(cat.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            borderRadius: 6,
                            border: `1px solid ${formCategory === cat.id ? 'var(--gold-accent)' : 'var(--border)'}`,
                            background: formCategory === cat.id ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.6)',
                            color: formCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Input */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Date of Occurrence
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      style={{ fontSize: 13, padding: '8px 12px' }}
                    />
                  </div>

                  {/* Description / Reflections */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Personal Reflections & Memories (Optional)
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Write your reflection, how it touched you, or what you felt during this sacred moment..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      style={{ fontSize: 13, padding: '8px 12px', resize: 'vertical' }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="btn btn-outline"
                      style={{ padding: '8px 16px', fontSize: 13 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ padding: '8px 22px', fontSize: 13 }}
                    >
                      {saving ? <span className="spinner" /> : editingEventId ? 'Save Changes' : '✓ Save to Timeline'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
