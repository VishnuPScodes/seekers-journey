import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';
import { AlertCircle, Hand, Sun } from 'lucide-react';
import { PRACTICE_ICONS } from '../utils/practiceIcons';

const ALL_PRACTICES = [
  { id: 'shoonya',    name: 'Shoonya Meditation',  desc: 'Inner stillness' },
  { id: 'shambhavi', name: 'Shambhavi Mahamudra', desc: 'Mystical practice' },
  { id: 'shakti',    name: 'Shakti Chalana Kriya',desc: 'Energy activation' },
  { id: 'surya',     name: 'Surya Kriya',          desc: 'Solar vitality' },
  { id: 'yogasanas', name: 'Yogasanas',             desc: 'Physical postures' },
  { id: 'angamardana',name: 'Angamardana',          desc: 'Physical fitness' },
  { id: 'sukha',     name: 'Sukha Kriya',           desc: 'Gentle practice' },
  { id: 'samyama',   name: 'Samyama Sadhana',       desc: 'Deep absorption' },
  { id: 'breath',    name: 'Breath Watching',        desc: 'Mindful breathing' },
  { id: 'suryashakti',name: 'Surya Shakti',          desc: 'Solar energy flow' },
  { id: 'bhastrika', name: 'Bhastrika Kriya',        desc: 'Energizing breath' },
];

export default function SelectPractices() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(() => user?.selectedPractices || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user?.selectedPractices && user.selectedPractices.length > 0) {
      setSelected(user.selectedPractices);
    }
  }, [user?.selectedPractices]);

  const togglePractice = (name) => {
    setSelected(prev =>
      prev.includes(name)
        ? prev.filter(p => p !== name)
        : [...prev, name]
    );
    setError('');
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      return setError('Please select at least one practice');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/user/practices', { practices: selected });
      updateUser({ selectedPractices: data.selectedPractices, practicesSelected: true });
      navigate('/tracker');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save practices');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(user?.practicesSelected);

  return (
    <>
      {user && <Navbar />}
      <div className="page">
        <div className="container-lg animate-in" style={{ maxWidth: 440, padding: '0 4px' }}>
          <div className="glass-card">
          <div className="brand">
            <div className="brand-icon" style={{ display: 'flex', justifyContent: 'center' }}><Sun size={28} strokeWidth={1.5} /></div>
            <h1 className="brand-title">
              {isEditing ? 'Edit Your Practices' : 'Your Practices'}
            </h1>
            <p className="brand-subtitle" style={{ marginBottom: 0 }}>
              {isEditing
                ? 'Add or remove sadhanas from your daily monitoring list'
                : 'Select the sadhanas you wish to track daily'}
            </p>
          </div>

          {selected.length > 0 && (
            <div
              className="alert alert-success animate-in"
              style={{ marginBottom: 20 }}
            >
              ✓ {selected.length} practice{selected.length > 1 ? 's' : ''} selected
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={16} /> {error}</div>
          )}

          <div className="practices-grid">
            {ALL_PRACTICES.map((practice, i) => (
              <div
                key={practice.id}
                id={`practice-option-${practice.id}`}
                className={`practice-option animate-in animate-in-delay-${Math.min(i + 1, 3)} ${
                  selected.includes(practice.name) ? 'selected' : ''
                }`}
                onClick={() => togglePractice(practice.name)}
                role="checkbox"
                aria-checked={selected.includes(practice.name)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && togglePractice(practice.name)}
              >
                <div className="practice-option-check">
                  {selected.includes(practice.name) && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="practice-option-name">{practice.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {practice.desc}
                  </div>
                </div>
                <span className="practice-option-icon" style={{ display: 'flex' }}>{PRACTICE_ICONS[practice.name] || <Hand size={20} />}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {isEditing && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => navigate('/tracker')}
              >
                ← Back
              </button>
            )}
            <button
              id="save-practices-btn"
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={handleSubmit}
              disabled={loading || selected.length === 0}
            >
              {loading ? (
                <span className="spinner" />
              ) : isEditing ? (
                `Save Changes (${selected.length})`
              ) : (
                `Continue with ${selected.length} practice${selected.length !== 1 ? 's' : ''} →`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
