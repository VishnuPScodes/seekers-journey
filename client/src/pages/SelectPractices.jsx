import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';
import { AlertCircle, Sun, Plus, Minus, Sparkles, X, Check } from 'lucide-react';
import { getPracticeIcon } from '../utils/practiceIcons';

const DEFAULT_PRACTICES = [
  { id: 'shoonya',     name: 'Shoonya Meditation',   category: 'Meditation',  desc: 'Inner stillness & conscious non-doing' },
  { id: 'shambhavi',   name: 'Shambhavi Mahamudra',  category: 'Kriya',       desc: 'Aligning body, mind, emotions & energy' },
  { id: 'shakti',      name: 'Shakti Chalana Kriya', category: 'Kriya',       desc: 'Energy activation & pranic flow' },
  { id: 'surya',       name: 'Surya Kriya',          category: 'Hatha Yoga',  desc: 'Solar vitality & inner balance' },
  { id: 'yogasanas',   name: 'Yogasanas',            category: 'Hatha Yoga',  desc: 'Physical postures to elevate consciousness' },
  { id: 'angamardana', name: 'Angamardana',          category: 'Hatha Yoga',  desc: 'Total body fitness & tendon strength' },
  { id: 'sukha',       name: 'Sukha Kriya',          category: 'Pranayama',   desc: 'Balancing the breath & nadis' },
  { id: 'samyama',     name: 'Samyama Sadhana',      category: 'Meditation',  desc: 'Deep absorption & meditative stillness' },
  { id: 'breath',      name: 'Breath Watching',      category: 'Meditation',  desc: 'Mindful breathing throughout the day' },
  { id: 'suryashakti', name: 'Surya Shakti',         category: 'Hatha Yoga',  desc: 'Dynamic solar flow & cardio endurance' },
  { id: 'bhastrika',   name: 'Bhastrika Kriya',      category: 'Pranayama',   desc: 'Purifying & energizing breath practice' },
];

const DEFAULT_TARGETS = {
  'Shoonya Meditation': 2,
  'Shambhavi Mahamudra': 2,
  'Shakti Chalana Kriya': 2,
  'Surya Kriya': 1,
  'Yogasanas': 1,
  'Angamardana': 1,
  'Sukha Kriya': 2,
  'Samyama Sadhana': 1,
  'Breath Watching': 2,
  'Surya Shakti': 1,
  'Bhastrika Kriya': 2,
};

const CATEGORIES = ['Hatha Yoga', 'Kriya', 'Meditation', 'Chanting', 'Pranayama', 'General'];

export default function SelectPractices() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(() => user?.selectedPractices || []);
  const [customList, setCustomList] = useState(() => user?.customPractices || []);

  const [targets, setTargets] = useState(() => {
    const initial = {};
    // Seed defaults
    Object.entries(DEFAULT_TARGETS).forEach(([name, target]) => {
      initial[name] = target;
    });
    // Override from user.practiceConfig
    (user?.practiceConfig || []).forEach(p => {
      if (p && p.name) initial[p.name] = p.dailyTarget || DEFAULT_TARGETS[p.name] || 2;
    });
    return initial;
  });

  // Modal / Inline Add Custom Practice State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Hatha Yoga');
  const [customTarget, setCustomTarget] = useState(1);
  const [customDesc, setCustomDesc] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Synchronize state when user profile updates
  useEffect(() => {
    if (user?.selectedPractices && user.selectedPractices.length > 0) {
      setSelected(user.selectedPractices);
    }
    if (user?.customPractices) {
      setCustomList(user.customPractices);
    }
    if (user?.practiceConfig && user.practiceConfig.length > 0) {
      setTargets(prev => {
        const next = { ...prev };
        user.practiceConfig.forEach(p => {
          if (p && p.name) next[p.name] = p.dailyTarget || DEFAULT_TARGETS[p.name] || 2;
        });
        return next;
      });
    }
  }, [user?.selectedPractices, user?.practiceConfig, user?.customPractices]);

  // Combined practices list (standard + custom)
  const allPractices = useMemo(() => {
    const customConverted = (customList || []).map(cp => ({
      id: `custom-${cp.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: cp.name,
      category: cp.category || 'General',
      desc: cp.desc || 'Custom seeker practice',
      isCustom: true,
    }));
    return [...DEFAULT_PRACTICES, ...customConverted];
  }, [customList]);

  const togglePractice = (name) => {
    setSelected(prev => {
      if (prev.includes(name)) {
        return prev.filter(p => p !== name);
      } else {
        return [...prev, name];
      }
    });
    setError('');
  };

  const updateTarget = (name, delta) => {
    setTargets(prev => {
      const current = prev[name] || DEFAULT_TARGETS[name] || 2;
      const next = Math.max(1, Math.min(108, current + delta));
      return { ...prev, [name]: next };
    });
    // If the practice wasn't selected, tapping stepper also selects it
    setSelected(prev => (prev.includes(name) ? prev : [...prev, name]));
    setError('');
  };

  // Add a new custom practice
  const handleAddCustomPractice = async (e) => {
    e.preventDefault();
    if (!customName.trim()) {
      setError('Please enter a practice name');
      return;
    }

    const trimmed = customName.trim();
    if (allPractices.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A practice with this name already exists');
      return;
    }

    setAddingCustom(true);
    setError('');

    try {
      const { data } = await api.post('/user/custom-practice', {
        name: trimmed,
        category: customCategory,
        dailyTarget: customTarget,
        desc: customDesc || `${customCategory} practice`,
      });

      // Update local state
      setCustomList(data.customPractices || []);
      setSelected(data.selectedPractices || []);
      setTargets(prev => ({
        ...prev,
        [trimmed]: customTarget,
      }));
      updateUser({
        selectedPractices: data.selectedPractices,
        practiceConfig: data.practiceConfig,
        customPractices: data.customPractices,
        practicesSelected: true,
      });

      // Reset form
      setCustomName('');
      setCustomDesc('');
      setCustomTarget(1);
      setShowAddModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add custom practice');
    } finally {
      setAddingCustom(false);
    }
  };

  // Save all selected practices & configured daily targets
  const handleSubmit = async () => {
    if (selected.length === 0) {
      return setError('Please select at least one practice');
    }

    setLoading(true);
    try {
      const payload = selected.map(name => {
        const item = allPractices.find(p => p.name === name);
        return {
          name,
          dailyTarget: targets[name] || DEFAULT_TARGETS[name] || 2,
          category: item?.category || 'General',
          desc: item?.desc || '',
          isCustom: Boolean(item?.isCustom),
        };
      });

      const { data } = await api.post('/user/practices', { practices: payload });
      updateUser({
        selectedPractices: data.selectedPractices,
        practiceConfig: data.practiceConfig,
        customPractices: data.customPractices,
        practicesSelected: true,
      });
      navigate('/');
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
        <div className="container-lg animate-in" style={{ maxWidth: 460, padding: '0 4px' }}>
          <div className="glass-card">
            {/* Header */}
            <div className="brand" style={{ marginBottom: 16 }}>
              <div className="brand-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <Sun size={28} strokeWidth={1.5} />
              </div>
              <h1 className="brand-title font-serif">
                {isEditing ? 'Configure Practices' : 'Your Daily Sadhana'}
              </h1>
              <p className="brand-subtitle" style={{ marginBottom: 0 }}>
                Select practices and set your daily target / cycles
              </p>
            </div>

            {/* Selected summary */}
            {selected.length > 0 && (
              <div
                className="alert alert-success animate-in"
                style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>✓ {selected.length} practice{selected.length > 1 ? 's' : ''} active</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>Target per day configured</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 14 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Practices Grid */}
            <div className="practices-grid" style={{ gap: 10 }}>
              {allPractices.map((practice, i) => {
                const isSelected = selected.includes(practice.name);
                const target = targets[practice.name] || DEFAULT_TARGETS[practice.name] || 2;

                return (
                  <div
                    key={practice.id}
                    id={`practice-option-${practice.id}`}
                    className={`practice-option animate-in animate-in-delay-${Math.min(i + 1, 3)} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => togglePractice(practice.name)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && togglePractice(practice.name)}
                    style={{
                      padding: '12px 14px',
                      alignItems: 'flex-start',
                      position: 'relative',
                    }}
                  >
                    {/* Checkbox */}
                    <div className="practice-option-check" style={{ marginTop: 2 }}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="practice-option-name">{practice.name}</span>
                        {practice.isCustom && (
                          <span style={{
                            fontSize: 9,
                            padding: '1px 5px',
                            background: 'rgba(167, 139, 250, 0.2)',
                            color: 'var(--purple-300)',
                            borderRadius: 4,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}>
                            Custom
                          </span>
                        )}
                        <span style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}>
                          {practice.category}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                        {practice.desc}
                      </div>

                      {/* ── Daily Target Stepper — Available for ALL practices ──────────────── */}
                      <div
                        className="target-stepper-row"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 8,
                          padding: '4px 8px',
                          background: isSelected ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isSelected ? 'rgba(251, 191, 36, 0.25)' : 'var(--border)'}`,
                          borderRadius: 8,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: 11, color: isSelected ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: 500 }}>
                          Target / day:
                        </span>

                        <button
                          type="button"
                          className="stepper-btn"
                          title="Decrease daily target"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTarget(practice.name, -1);
                          }}
                          disabled={target <= 1}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: '1px solid var(--border)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: target <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: target <= 1 ? 'default' : 'pointer',
                            padding: 0,
                            opacity: target <= 1 ? 0.35 : 1,
                          }}
                        >
                          <Minus size={12} />
                        </button>

                        <span style={{
                          minWidth: 20,
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                          color: isSelected ? 'var(--gold-accent)' : 'var(--text-secondary)',
                        }}>
                          {target}
                        </span>

                        <button
                          type="button"
                          className="stepper-btn"
                          title="Increase daily target"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTarget(practice.name, 1);
                          }}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: '1px solid var(--border)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <Plus size={12} />
                        </button>

                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 1 }}>
                          {practice.name.includes('Surya Namaskar') ? 'cycles' : 'rounds'}
                        </span>
                      </div>
                    </div>

                    {/* Icon */}
                    <span className="practice-option-icon" style={{ display: 'flex', marginTop: 2 }}>
                      {getPracticeIcon(practice.name, practice.category)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── + Add Custom Practice Button & Form ─────────────────────────── */}
            <div style={{ marginTop: 14 }}>
              {!showAddModal ? (
                <button
                  type="button"
                  id="open-add-custom-practice-btn"
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-outline"
                  style={{
                    width: '100%',
                    borderStyle: 'dashed',
                    borderColor: 'rgba(251, 191, 36, 0.4)',
                    color: 'var(--gold-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    fontSize: 13,
                  }}
                >
                  <Plus size={16} /> Add Additional Practice / Cycles
                </button>
              ) : (
                <form
                  onSubmit={handleAddCustomPractice}
                  className="animate-in"
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} /> Add New Practice
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Practice Name */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Practice Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Surya Namaskar, Simha Kriya, AUM Chanting"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      style={{ fontSize: 13, padding: '8px 12px' }}
                    />
                  </div>

                  {/* Category Selection */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Category
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCustomCategory(cat)}
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            borderRadius: 100,
                            border: `1px solid ${customCategory === cat ? 'var(--gold-accent)' : 'var(--border)'}`,
                            background: customCategory === cat ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            color: customCategory === cat ? 'var(--gold-accent)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Target / Cycles */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Daily Target / Number of Cycles
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}>
                        <button
                          type="button"
                          onClick={() => setCustomTarget(Math.max(1, customTarget - 1))}
                          disabled={customTarget <= 1}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: '1px solid var(--border)',
                            background: 'none',
                            color: customTarget <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: customTarget <= 1 ? 'default' : 'pointer',
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'center', color: 'var(--gold-accent)' }}>
                          {customTarget}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomTarget(customTarget + 1)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: '1px solid var(--border)',
                            background: 'none',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        per day (or cycles)
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Short Description (Optional)
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 21 cycles before sunrise"
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      style={{ fontSize: 12, padding: '7px 10px' }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn btn-outline"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingCustom}
                      className="btn btn-primary"
                      style={{ padding: '6px 18px', fontSize: 12 }}
                    >
                      {addingCustom ? <span className="spinner" /> : '✓ Add Practice'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => navigate('/')}
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
                  `Save Configuration (${selected.length})`
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
