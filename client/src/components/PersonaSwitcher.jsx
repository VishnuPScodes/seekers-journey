import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function PersonaSwitcher({ onSwitched }) {
  const { user, switchPersona } = useAuth();
  const [spiritualPersonas, setSpiritualPersonas] = useState([]);
  const [cohortPersonas, setCohortPersonas] = useState([]);
  const [activeTab, setActiveTab] = useState('spiritual'); // 'spiritual' | 'cohort'
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const { data } = await api.get('/journey/personas');
        if (data.spiritualPersonas && data.spiritualPersonas.length > 0) {
          setSpiritualPersonas(data.spiritualPersonas);
        }
        setCohortPersonas(data.personas || []);
      } catch (err) {
        console.error('Failed to load personas:', err);
      }
    };
    fetchPersonas();
  }, []);

  const handleSelect = async (personaId) => {
    if (switching) return;
    setSwitching(true);
    try {
      await switchPersona(personaId);
      setIsOpen(false);
      if (onSwitched) onSwitched();
      window.location.reload();
    } catch (err) {
      console.error('Error switching persona:', err);
    } finally {
      setSwitching(false);
    }
  };

  // Determine current display label
  const activeSpiritual = spiritualPersonas.find(p => p.email?.toLowerCase() === user?.email?.toLowerCase());
  const currentCohort = cohortPersonas.find(p => p.id === user?.cohortPersona);

  const displayLabel = activeSpiritual
    ? `${activeSpiritual.icon} ${activeSpiritual.name.split(' ')[0]} (Lvl ${activeSpiritual.currentLevel})`
    : currentCohort
    ? `🎭 Persona ${currentCohort.id}: ${currentCohort.name}`
    : user?.name
    ? `${user.name.split(' ')[0]} (Lvl ${user.currentLevel || 1})`
    : 'Seeker Persona';

  return (
    <div className="persona-switcher-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="persona-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch active seeker persona to inspect different journeys, insights, and feed records"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'rgba(26, 20, 15, 0.92)',
          border: '1px solid rgba(217, 87, 43, 0.45)',
          borderRadius: 20,
          padding: '5px 12px',
          color: '#f4efd8',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'Outfit, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <span>{displayLabel}</span>
        <span style={{ fontSize: 9, color: 'var(--amber-400)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="persona-dropdown animate-in"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 360,
            maxWidth: '92vw',
            background: '#14100c',
            border: '1px solid rgba(217, 87, 43, 0.35)',
            borderRadius: 14,
            boxShadow: '0 14px 36px rgba(0,0,0,0.7)',
            padding: 14,
            zIndex: 1100,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setActiveTab('spiritual')}
                style={{
                  background: activeTab === 'spiritual' ? 'rgba(217, 87, 43, 0.25)' : 'transparent',
                  border: activeTab === 'spiritual' ? '1px solid #d9572b' : '1px solid transparent',
                  borderRadius: 12,
                  padding: '3px 10px',
                  color: activeTab === 'spiritual' ? '#f4efd8' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Spiritual Personas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cohort')}
                style={{
                  background: activeTab === 'cohort' ? 'rgba(217, 87, 43, 0.25)' : 'transparent',
                  border: activeTab === 'cohort' ? '1px solid #d9572b' : '1px solid transparent',
                  borderRadius: 12,
                  padding: '3px 10px',
                  color: activeTab === 'cohort' ? '#f4efd8' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Cohort Archetypes
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 4 }}
            >
              ✕
            </button>
          </div>

          {/* TAB 1: SPIRITUAL PERSONAS (Real Database Records) */}
          {activeTab === 'spiritual' && (
            <div style={{ maxHeight: 310, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {spiritualPersonas.map((p) => {
                const isActive = user?.email?.toLowerCase() === p.email?.toLowerCase();
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: isActive ? 'rgba(93, 117, 80, 0.3)' : 'rgba(255,255,255,0.03)',
                      border: isActive ? '1px solid rgba(93, 117, 80, 0.6)' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{p.icon}</span>
                        <strong style={{ fontSize: 13, color: '#f4efd8' }}>{p.name}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: 'rgba(217, 87, 43, 0.25)',
                          color: '#e88f5f',
                          border: '1px solid rgba(217, 87, 43, 0.4)',
                        }}>
                          Level {p.currentLevel}
                        </span>
                        {isActive && (
                          <span style={{ color: 'var(--emerald-400)', fontSize: 11, fontWeight: 600 }}>● Active</span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      {p.role} • {p.totalCumulativeScore} pts • {p.pradakshinaCount} Pradakshinas
                    </div>

                    <div style={{ fontSize: 10, color: '#a59682', marginTop: 4 }}>
                      🪷 {p.practices?.slice(0, 3).join(' · ')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SYNTHETIC COHORT ARCHETYPES */}
          {activeTab === 'cohort' && (
            <div style={{ maxHeight: 310, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                Statistical models representing 2,000 longitudinal seeker trajectories.
              </div>
              {cohortPersonas.map((p) => {
                const isActive = user?.cohortPersona === p.id && !spiritualPersonas.some(sp => sp.email?.toLowerCase() === user?.email?.toLowerCase());
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isActive ? 'rgba(93, 117, 80, 0.25)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid rgba(93, 117, 80, 0.5)' : '1px solid transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f4efd8' }}>
                        Persona {p.id}: {p.name}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--amber-400)' }}>
                        {p.yearsOnPath}y path
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.tagline}
                    </div>
                    <div style={{ fontSize: 10, color: '#9c8a74', marginTop: 3 }}>
                      {p.practices?.join(' · ')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {switching && (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#d9572b', fontWeight: 600 }}>
              Connecting to persona sanctuary...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
