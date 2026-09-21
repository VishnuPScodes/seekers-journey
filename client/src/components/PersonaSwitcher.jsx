import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function PersonaSwitcher({ onSwitched }) {
  const { user, switchPersona } = useAuth();
  const [personas, setPersonas] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const { data } = await api.get('/journey/personas');
        setPersonas(data.personas || []);
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

  const currentPersona = personas.find(p => p.id === user?.cohortPersona);

  return (
    <div className="persona-switcher-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="persona-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch between synthetic cohort archetypes to preview different seeker journeys"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(30, 24, 18, 0.85)',
          border: '1px solid rgba(196, 107, 62, 0.35)',
          borderRadius: 20,
          padding: '6px 14px',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontFamily: 'Outfit, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ fontSize: 14 }}>🎭</span>
        <span>
          <strong>Persona:</strong> {currentPersona ? `${currentPersona.name} (${currentPersona.id})` : (user?.cohortPersona ? `Persona ${user.cohortPersona}` : 'Demo Seeker')}
        </span>
        <span style={{ fontSize: 10, color: 'var(--amber-400)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="persona-dropdown animate-in"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 340,
            maxWidth: '90vw',
            background: '#15110d',
            border: '1px solid rgba(196, 107, 62, 0.3)',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            padding: 12,
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c46b3e', fontWeight: 600 }}>
              Cohort Archetypes (2,000 Seekers)
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </div>

          {/* Reset to default Dikshant account */}
          <div
            onClick={() => handleSelect('DEMO')}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 6,
              background: user?.email === 'diksh@gmail.com' ? 'rgba(196, 107, 62, 0.2)' : 'rgba(255,255,255,0.03)',
              border: user?.email === 'diksh@gmail.com' ? '1px solid rgba(196, 107, 62, 0.4)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f4efd8' }}>
                🌟 Primary Seeker (Dikshant)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                4.5 yrs on path · 333+ sadhana logs · Shambhavi & Surya Kriya
              </div>
            </div>
            {user?.email === 'diksh@gmail.com' && <span style={{ color: 'var(--emerald-400)', fontSize: 12 }}>● Active</span>}
          </div>

          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {personas.map(p => {
              const isActive = user?.cohortPersona === p.id && user?.email !== 'diksh@gmail.com';
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f4efd8' }}>
                      Persona {p.id}: {p.name}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--amber-400)', fontWeight: 500 }}>
                      {p.yearsOnPath}y path
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                    {p.tagline}
                  </div>
                  <div style={{ fontSize: 10, color: '#9c8a74', marginTop: 4 }}>
                    {p.practices?.join(' · ')}
                  </div>
                </div>
              );
            })}
          </div>

          {switching && (
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--amber-400)' }}>
              Switching seeker context...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
