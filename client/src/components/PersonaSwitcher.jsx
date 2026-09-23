import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function PersonaSwitcher({ onSwitched }) {
  const { user, switchPersona } = useAuth();
  const [personas, setPersonas] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const { data } = await api.get('/journey/personas');
        const list = data.personas || data.spiritualPersonas || [];
        setPersonas(list);
      } catch (err) {
        console.error('Failed to load personas:', err);
      }
    };
    fetchPersonas();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (personaId) => {
    if (switchingId) return;
    setSwitchingId(personaId);
    try {
      await switchPersona(personaId);
      setIsOpen(false);
      if (onSwitched) onSwitched();
      window.location.reload();
    } catch (err) {
      console.error('Error switching persona:', err);
    } finally {
      setSwitchingId(null);
    }
  };

  // Determine current display label
  const activePersona = personas.find(
    (p) => p.email?.toLowerCase() === user?.email?.toLowerCase()
  );

  const displayLabel = activePersona
    ? `${activePersona.icon} ${activePersona.name.split(' ')[0]} (Lvl ${activePersona.currentLevel})`
    : user?.name
    ? `${user.name.split(' ')[0]} (Lvl ${user.currentLevel || 1})`
    : 'Seeker Persona';

  return (
    <div
      ref={dropdownRef}
      className="persona-switcher-wrapper"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        className="persona-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch active seeker persona to inspect distinct sadhanas, circles, and perspectives"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'rgba(26, 20, 15, 0.94)',
          border: '1px solid rgba(217, 87, 43, 0.45)',
          borderRadius: 20,
          padding: '5px 13px',
          color: '#f4efd8',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'Outfit, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(217, 87, 43, 0.75)';
          e.currentTarget.style.boxShadow = '0 0 12px rgba(217, 87, 43, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(217, 87, 43, 0.45)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
        }}
      >
        <span>{displayLabel}</span>
        <span
          style={{
            fontSize: 9,
            color: 'var(--amber-400)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="persona-dropdown animate-in"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 380,
            maxWidth: '92vw',
            background: '#130f0c',
            border: '1px solid rgba(217, 87, 43, 0.35)',
            borderRadius: 14,
            boxShadow: '0 18px 40px rgba(0,0,0,0.8), 0 0 1px rgba(217,87,43,0.3)',
            padding: 14,
            zIndex: 1100,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f4efd8', letterSpacing: '0.02em' }}>
                  Seeker Sanctuary
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: 'rgba(217, 87, 43, 0.2)',
                    color: '#e88f5f',
                    border: '1px solid rgba(217, 87, 43, 0.35)',
                  }}
                >
                  {personas.length} Seekers
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Select a seeker to inspect their distinct sadhanas, circles & journey
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 4px',
                borderRadius: 4,
              }}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Unified Curated Personas List */}
          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingRight: 2,
            }}
          >
            {personas.map((p) => {
              const isActive = user?.email?.toLowerCase() === p.email?.toLowerCase();
              const isSwitchingThis = switchingId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    cursor: isSwitchingThis ? 'wait' : 'pointer',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(93, 117, 80, 0.28) 0%, rgba(26, 38, 22, 0.4) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isActive
                      ? '1px solid rgba(93, 117, 80, 0.7)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 0.18s ease',
                    boxShadow: isActive ? '0 2px 10px rgba(93, 117, 80, 0.15)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.borderColor = 'rgba(217, 87, 43, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  {/* Top Row: Icon + Name + Isolation Badge + Level / Active */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 17, lineHeight: 1 }}>{p.icon}</span>
                      <strong style={{ fontSize: 13, color: '#f4efd8', fontWeight: 600 }}>
                        {p.name}
                      </strong>
                      {p.isSynthetic ? (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: 'rgba(100, 116, 139, 0.2)',
                            color: '#94a3b8',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                          }}
                        >
                          🧪 Test Seeker
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: 'rgba(217, 87, 43, 0.25)',
                            color: '#f09268',
                            border: '1px solid rgba(217, 87, 43, 0.45)',
                          }}
                        >
                          🌟 Host Seeker
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: 'rgba(217, 87, 43, 0.22)',
                          color: '#e88f5f',
                          border: '1px solid rgba(217, 87, 43, 0.35)',
                        }}
                      >
                        Lvl {p.currentLevel}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            color: 'var(--emerald-400)',
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.35)',
                            padding: '1px 5px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          ● Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Title & City */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#f0b37e', fontWeight: 500 }}>
                      {p.role}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      📍 {p.city}
                    </span>
                  </div>

                  {/* Tagline */}
                  {p.tagline && (
                    <div style={{ fontSize: 11, color: '#a59887', marginTop: 3, lineHeight: 1.35 }}>
                      {p.tagline}
                    </div>
                  )}

                  {/* Stats & Practices */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 6,
                      paddingTop: 5,
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {p.totalCumulativeScore.toLocaleString()} pts • {p.pradakshinaCount} Pradakshinas
                    </div>
                    {p.practices && p.practices.length > 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: '#d4c7b8',
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={p.practices.join(' · ')}
                      >
                        🪷 {p.practices.slice(0, 2).join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Inline Switching Status */}
                  {isSwitchingThis && (
                    <div
                      style={{
                        textAlign: 'center',
                        marginTop: 6,
                        fontSize: 11,
                        color: '#e88f5f',
                        fontWeight: 600,
                      }}
                    >
                      Connecting to {p.name}'s sanctuary...
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--text-muted)',
            }}
          >
            <span>🛡️ Isolated synthetic test environment</span>
            <span style={{ color: '#d9572b', fontWeight: 600 }}>Seeker's Journey</span>
          </div>
        </div>
      )}
    </div>
  );
}
