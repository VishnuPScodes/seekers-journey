import React, { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
  X,
  Compass,
} from 'lucide-react';
import './Community.css';

export default function SanghasDirectory() {
  const navigate = useNavigate();
  const [sanghas, setSanghas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMyOnly, setIsMyOnly] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('interest');
  const [newLocation, setNewLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchSanghas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (isMyOnly) params.append('my', 'true');

      const res = await api.get(`/community/sanghas?${params.toString()}`);
      setSanghas(res.data.sanghas || []);
    } catch (err) {
      console.error('Failed to fetch sanghas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, searchQuery, isMyOnly]);

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
              ? { ...s, isMember: res.data.isMember, membersCount: res.data.membersCount }
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
      });

      if (res.data?.sangha) {
        setShowCreateModal(false);
        setNewName('');
        setNewTagline('');
        setNewDesc('');
        setNewLocation('');
        // Navigate directly to the new sangha
        navigate(`/community/sanghas/${res.data.sangha.slug || res.data.sangha._id}`);
      }
    } catch (err) {
      console.error('Failed to create sangha:', err);
      setCreateError(err.response?.data?.message || 'Could not create Sangha.');
    } finally {
      setCreating(false);
    }
  };

  const filterPills = [
    { id: 'all', label: 'All Circles', icon: '🏛️' },
    { id: 'local', label: 'Local / City', icon: '📍' },
    { id: 'interest', label: 'Practice & Japa', icon: '🪷' },
    { id: 'program', label: 'Program Cohorts', icon: '🌿' },
    { id: 'event', label: 'Sacred Events', icon: '🏔️' },
  ];

  return (
    <>
      <Navbar />

      <main className="comm-root-container">
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          {/* ── Directory Header ── */}
          <header className="comm-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="comm-header-badge">
                <Shield size={14} />
                <span>Sacred Circles & Communities</span>
              </div>
              <h1 className="comm-header-title">Sangha Directory</h1>
              <p className="comm-header-subtitle">
                Walk your path in fellowship. Join city circles, meditation groups, and program cohorts.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/community" className="comm-action-btn" style={{ background: 'var(--comm-bg-card)', padding: '8px 16px' }}>
                <Compass size={16} /> Feed View
              </Link>
              <button
                type="button"
                className="comm-btn-share"
                onClick={() => setShowCreateModal(true)}
                id="btn-create-sangha-modal"
              >
                <Plus size={16} /> Start a Sangha
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

              <button
                className={`comm-filter-pill-btn ${isMyOnly ? 'active' : ''}`}
                onClick={() => setIsMyOnly(!isMyOnly)}
                id="btn-my-sanghas-filter"
              >
                My Circles
              </button>
            </div>

            <div className="comm-filter-pills" role="tablist">
              {filterPills.map((pill) => (
                <button
                  key={pill.id}
                  className={`comm-filter-pill-btn ${selectedType === pill.id ? 'active' : ''}`}
                  onClick={() => setSelectedType(pill.id)}
                  id={`filter-pill-${pill.id}`}
                >
                  <span>{pill.icon}</span> <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Sangha Grid ── */}
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
          ) : (
            <div className="comm-sangha-grid">
              {sanghas.map((s) => (
                <div key={s._id} className="comm-sangha-card-item" id={`sangha-card-${s.slug || s._id}`}>
                  <div>
                    <div className="comm-sangha-card-top">
                      <div className="comm-sangha-big-icon">🏛️</div>
                      <div className="comm-sangha-title-block">
                        <h3 className="comm-sangha-name">{s.name}</h3>
                        <span className="comm-level-badge" style={{ textTransform: 'capitalize' }}>
                          {s.type} circle
                        </span>
                      </div>
                    </div>

                    <p className="comm-sangha-tagline">
                      {s.tagline || 'A circle of seekers walking the spiritual path in harmony and mutual encouragement.'}
                    </p>

                    <div className="comm-sangha-metrics-row">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Users size={14} /> {s.membersCount || 1}{' '}
                        {s.membersCount === 1 ? 'seeker' : 'seekers'}
                      </span>
                      {s.location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} /> {s.location}
                        </span>
                      )}
                      <span>• {s.postsCount || 0} posts</span>
                    </div>
                  </div>

                  <div className="comm-sangha-card-footer">
                    <button
                      type="button"
                      className={`comm-btn-small ${s.isMember ? 'joined' : ''}`}
                      onClick={() => handleJoinToggle(s._id)}
                      id={`sangha-card-join-btn-${s._id}`}
                    >
                      {s.isMember ? 'Joined Circle' : 'Join Circle'}
                    </button>

                    <Link
                      to={`/community/sanghas/${s.slug || s._id}`}
                      className="comm-action-btn"
                      style={{ color: 'var(--comm-terracotta)', fontWeight: 600 }}
                      id={`enter-circle-btn-${s.slug || s._id}`}
                    >
                      <span>Enter Circle</span> <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="comm-action-btn"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="comm-btn-share"
                    id="submit-create-sangha-btn"
                  >
                    <Sparkles size={15} />
                    <span>{creating ? 'Inaugurating Circle...' : 'Inaugurate Sangha'}</span>
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
