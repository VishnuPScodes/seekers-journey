import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { X, Check, Plus, Sparkles, Settings2, Moon, Flame } from 'lucide-react';
import { getPracticeIcon } from '../utils/practiceIcons';

const DEFAULT_PRACTICES = [
  { id: 'shoonya', name: 'Shoonya Meditation', category: 'Meditation', desc: 'Inner stillness & conscious non-doing' },
  { id: 'shambhavi', name: 'Shambhavi Mahamudra', category: 'Kriya', desc: 'Aligning body, mind, emotions & energy' },
  { id: 'shakti', name: 'Shakti Chalana Kriya', category: 'Kriya', desc: 'Energy activation & pranic flow' },
  { id: 'surya', name: 'Surya Kriya', category: 'Hatha Yoga', desc: 'Solar vitality & inner balance' },
  { id: 'yogasanas', name: 'Yogasanas', category: 'Hatha Yoga', desc: 'Physical postures to elevate consciousness' },
  { id: 'angamardana', name: 'Angamardana', category: 'Hatha Yoga', desc: 'Total body fitness & tendon strength' },
  { id: 'sukha', name: 'Sukha Kriya', category: 'Pranayama', desc: 'Balancing the breath & nadis' },
  { id: 'samyama', name: 'Samyama Sadhana', category: 'Meditation', desc: 'Deep absorption & meditative stillness' },
  { id: 'breath', name: 'Breath Watching', category: 'Meditation', desc: 'Mindful breathing throughout the day' },
  { id: 'suryashakti', name: 'Surya Shakti', category: 'Hatha Yoga', desc: 'Dynamic solar flow & cardio endurance' },
  { id: 'bhastrika', name: 'Bhastrika Kriya', category: 'Pranayama', desc: 'Purifying & energizing breath practice' },
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

export default function PracticeSettingsModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();

  const [selected, setSelected] = useState([]);
  const [targets, setTargets] = useState({});
  const [customList, setCustomList] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Custom Practice Form
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Hatha Yoga');
  const [customTarget, setCustomTarget] = useState(1);
  const [customDesc, setCustomDesc] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      const activePractices = user.selectedPractices || [];
      setSelected(activePractices);

      const custom = user.customPractices || [];
      setCustomList(custom);

      const initialTargets = {};
      Object.entries(DEFAULT_TARGETS).forEach(([name, target]) => {
        initialTargets[name] = target;
      });
      (user.practiceConfig || []).forEach((p) => {
        if (p && p.name) initialTargets[p.name] = p.dailyTarget || DEFAULT_TARGETS[p.name] || 2;
      });
      setTargets(initialTargets);
      setSuccessMsg('');
      setErrorMsg('');
      setShowAddCustom(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Combine default and custom practices
  const allPractices = [
    ...DEFAULT_PRACTICES,
    ...customList.map((cp) => ({
      id: `custom-${cp.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: cp.name,
      category: cp.category || 'General',
      desc: cp.desc || 'Custom seeker sadhana',
      isCustom: true,
    })),
  ];

  const categories = ['All', 'Kriya', 'Hatha Yoga', 'Meditation', 'Pranayama', 'General'];

  const filteredPractices = categoryFilter === 'All'
    ? allPractices
    : allPractices.filter((p) => p.category === categoryFilter);

  const toggleSelect = (name) => {
    if (selected.includes(name)) {
      if (selected.length === 1) {
        setErrorMsg('Please keep at least one consecrated practice selected.');
        return;
      }
      setSelected(selected.filter((item) => item !== name));
      setErrorMsg('');
    } else {
      setSelected([...selected, name]);
      setErrorMsg('');
    }
  };

  const setTargetForPractice = (name, target) => {
    setTargets((prev) => ({
      ...prev,
      [name]: target,
    }));
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (allPractices.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('A practice with this name already exists.');
      return;
    }

    const newCustom = {
      name: trimmed,
      category: customCategory,
      desc: customDesc || 'Custom seeker sadhana',
    };

    setCustomList([...customList, newCustom]);
    setSelected([...selected, trimmed]);
    setTargets((prev) => ({ ...prev, [trimmed]: customTarget }));

    setCustomName('');
    setCustomDesc('');
    setCustomTarget(1);
    setShowAddCustom(false);
    setErrorMsg('');
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      setErrorMsg('Please select at least one daily practice.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const payload = selected.map((name) => {
        const item = allPractices.find((p) => p.name === name);
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
        customPractices: data.customPractices || customList,
        practicesSelected: true,
      });

      setSuccessMsg('Daily sadhana practices and targets saved 🙏');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update practices:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save practice settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="practice-settings-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="practice-settings-dialog animate-in"
        style={{
          background: '#14100c',
          border: '1px solid rgba(217, 87, 43, 0.4)',
          borderRadius: 18,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 20px rgba(217, 87, 43, 0.15)',
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f4efd8',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(217, 87, 43, 0.12) 0%, transparent 100%)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings2 size={18} color="#e88f5f" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f4efd8' }}>
                Practice Settings
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(217, 87, 43, 0.2)',
                  color: '#e88f5f',
                  border: '1px solid rgba(217, 87, 43, 0.35)',
                }}
              >
                {selected.length} Active
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Configure your daily sadhana commitments and session targets
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Filters Bar */}
        <div
          style={{
            padding: '10px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                background: categoryFilter === cat ? 'rgba(217, 87, 43, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                border: categoryFilter === cat ? '1px solid #d9572b' : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 14,
                padding: '4px 12px',
                color: categoryFilter === cat ? '#f4efd8' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable List of Practices */}
        <div
          style={{
            padding: '16px 22px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {filteredPractices.map((practice) => {
            const isSelected = selected.includes(practice.name);
            const currentTarget = targets[practice.name] || DEFAULT_TARGETS[practice.name] || 2;

            return (
              <div
                key={practice.name}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(217, 87, 43, 0.12) 0%, rgba(30, 22, 16, 0.5) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected
                    ? '1px solid rgba(217, 87, 43, 0.45)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left: Checkbox + Icon + Details */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleSelect(practice.name)}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: isSelected ? '#d9572b' : 'rgba(255, 255, 255, 0.06)',
                      border: isSelected ? '1px solid #e88f5f' : '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <Check size={13} strokeWidth={2.5} />}
                  </div>

                  <span style={{ fontSize: 22, lineHeight: 1 }}>
                    {getPracticeIcon(practice.name)}
                  </span>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 13, color: isSelected ? '#f4efd8' : '#a39888' }}>
                        {practice.name}
                      </strong>
                      <span
                        style={{
                          fontSize: 9,
                          color: '#c49a45',
                          background: 'rgba(196, 154, 69, 0.12)',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        {practice.category}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {practice.desc}
                    </div>
                  </div>
                </div>

                {/* Right: Target Selector (Only active if practice is selected) */}
                {isSelected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>
                      Daily Target:
                    </span>
                    {[1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTargetForPractice(practice.name, val)}
                        style={{
                          background: currentTarget === val ? '#d9572b' : 'rgba(255, 255, 255, 0.05)',
                          border: currentTarget === val ? '1px solid #f09268' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 6,
                          width: 28,
                          height: 26,
                          color: currentTarget === val ? '#ffffff' : '#a59887',
                          fontSize: 11,
                          fontWeight: currentTarget === val ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Custom Sadhana Section */}
          <div
            style={{
              marginTop: 6,
              padding: 12,
              borderRadius: 12,
              border: '1px dashed rgba(217, 87, 43, 0.35)',
              background: 'rgba(217, 87, 43, 0.04)',
            }}
          >
            {!showAddCustom ? (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e88f5f',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <Plus size={14} /> Add Custom Sadhana Practice
              </button>
            ) : (
              <form onSubmit={handleAddCustom} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#f4efd8' }}>
                    New Custom Sadhana
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Practice name (e.g. Guru Pooja, Devi Stuti)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      flex: 2,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: '#f4efd8',
                      fontSize: 12,
                    }}
                    required
                  />
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#1a1410',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: '#f4efd8',
                      fontSize: 12,
                    }}
                  >
                    <option value="Hatha Yoga">Hatha Yoga</option>
                    <option value="Kriya">Kriya</option>
                    <option value="Meditation">Meditation</option>
                    <option value="Chanting">Chanting</option>
                    <option value="Pranayama">Pranayama</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Short description or intention"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: '#f4efd8',
                      fontSize: 12,
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target:</span>
                    {[1, 2].map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setCustomTarget(v)}
                        style={{
                          background: customTarget === v ? '#d9572b' : 'rgba(255,255,255,0.06)',
                          border: customTarget === v ? '1px solid #f09268' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 6,
                          width: 24,
                          height: 24,
                          color: '#fff',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        {v}x
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: '#d9572b',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div
            style={{
              padding: '6px 22px',
              fontSize: 12,
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.1)',
              borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              padding: '6px 22px',
              fontSize: 12,
              color: '#86efac',
              background: 'rgba(34, 197, 94, 0.1)',
              borderTop: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Changes reflect across today's tracker and progress stats
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 10,
                padding: '7px 14px',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #d9572b 0%, #b8441d 100%)',
                border: '1px solid #f09268',
                borderRadius: 10,
                padding: '7px 18px',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(217, 87, 43, 0.35)',
              }}
            >
              {saving ? 'Saving...' : 'Save Settings 🙏'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
