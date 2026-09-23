import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Eye, EyeOff, Save, Check, Sparkles } from 'lucide-react';
import api from '../../../api';

export default function PrivacySettingsModal({ isOpen, onClose, onSaved = null }) {
  const [privacySettings, setPrivacySettings] = useState({
    showCity: true,
    showPractices: true,
    showPrograms: true,
    showPradakshinaCount: true,
    showBio: true,
  });
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      setSaveSuccess(false);
      api
        .get('/user/privacy')
        .then((res) => {
          if (res.data) {
            setPrivacySettings({
              showCity: res.data.privacySettings?.showCity !== false,
              showPractices: res.data.privacySettings?.showPractices !== false,
              showPrograms: res.data.privacySettings?.showPrograms !== false,
              showPradakshinaCount: res.data.privacySettings?.showPradakshinaCount !== false,
              showBio: res.data.privacySettings?.showBio !== false,
            });
            setBio(res.data.bio || '');
          }
        })
        .catch((err) => {
          console.error('Failed to load privacy settings:', err);
          setError('Could not load privacy settings.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await api.put('/user/privacy', {
        privacySettings,
        bio,
      });
      setSaveSuccess(true);
      if (onSaved) onSaved(res.data);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Save privacy error:', err);
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const options = [
    {
      key: 'showCity',
      label: 'Location / City',
      icon: '📍',
      desc: 'Let circle members and fellow seekers see which city or region you practice in.',
    },
    {
      key: 'showPractices',
      label: 'Sadhana & Practices',
      icon: '🪷',
      desc: 'Display your daily kriyas (e.g. Shambhavi, Surya Kriya, Japa) on your profile.',
    },
    {
      key: 'showPrograms',
      label: 'Initiated Programs',
      icon: '🌿',
      desc: 'Display your completed programs (Inner Engineering, BSP, Shoonya) to inspire others.',
    },
    {
      key: 'showPradakshinaCount',
      label: 'Sacred Pradakshina',
      icon: '🏔️',
      desc: 'Show your pradakshina round count and Kailash progress on your community profile.',
    },
    {
      key: 'showBio',
      label: 'Spiritual Bio & Reflection',
      icon: '🕊️',
      desc: 'Share your personal intention and reflection on why you walk this sacred path.',
    },
  ];

  return (
    <div className="comm-modal-backdrop" onClick={onClose} style={{ zIndex: 1350 }}>
      <div
        className="comm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          width: '92%',
          background: '#fffdf8',
          border: '1px solid var(--comm-border-gold)',
          borderRadius: 20,
          boxShadow: '0 14px 44px rgba(44, 38, 31, 0.25)',
          padding: 24,
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#8b6b1b', fontWeight: 700 }}>
              <Shield size={14} />
              <span>Sacred Privacy Controls</span>
            </div>
            <h2 style={{ fontFamily: 'var(--comm-font-serif)', fontSize: '1.45rem', margin: '4px 0 0', color: 'var(--comm-text-charcoal)' }}>
              Public Profile Privacy
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--comm-text-muted)', margin: '2px 0 0' }}>
              Choose what fellow seekers and circle guides can see when viewing your profile.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="var(--comm-text-muted)" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ width: 30, height: 30, margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--comm-terracotta)', fontSize: '0.86rem' }}>Loading privacy options...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Bio Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 4, color: 'var(--comm-text-charcoal)' }}>
                🕊️ Spiritual Intention / Short Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a sentence on what brought you to sadhana or what inspires your spiritual journey..."
                maxLength={300}
                className="comm-input-field"
                style={{ fontSize: '0.88rem', lineHeight: 1.5, resize: 'vertical' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--comm-text-light)', textAlign: 'right', marginTop: 2 }}>
                {bio.length}/300 characters
              </div>
            </div>

            {/* Privacy Toggles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--comm-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Visibility Settings
              </div>

              {options.map((opt) => {
                const isEnabled = privacySettings[opt.key];

                return (
                  <div
                    key={opt.key}
                    onClick={() => handleToggle(opt.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleToggle(opt.key);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: isEnabled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid',
                      borderColor: isEnabled ? 'var(--comm-border-gold)' : 'var(--comm-border-hairline)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem', marginTop: 1 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--comm-text-charcoal)' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--comm-text-muted)', marginTop: 2 }}>
                          {opt.desc}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        background: isEnabled ? 'rgba(78, 99, 70, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                        color: isEnabled ? '#3d5236' : 'var(--comm-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isEnabled ? (
                        <>
                          <Eye size={12} /> Public
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} /> Private
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <div style={{ color: '#b4421b', fontSize: '0.84rem' }}>{error}</div>}

            {saveSuccess && (
              <div
                style={{
                  background: 'rgba(78, 99, 70, 0.15)',
                  color: '#3d5236',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                <Check size={16} /> Privacy settings saved successfully!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                className="comm-btn-small"
                style={{ background: 'transparent', border: '1px solid var(--comm-border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="comm-btn-share"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  borderRadius: 20,
                }}
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
