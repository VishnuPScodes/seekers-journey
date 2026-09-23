import React, { useState, useEffect } from 'react';
import { X, Shield, Eye, EyeOff, Save, Check } from 'lucide-react';
import api from '../../../api';

export default function PrivacySettingsModal({ isOpen, onClose, onSaved = null }) {
  const [privacySettings, setPrivacySettings] = useState({
    showCity: true,
    showPractices: true,
    showPrograms: true,
    showPradakshinaCount: true,
  });
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
            });
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
      });
      setSaveSuccess(true);
      if (onSaved) onSaved(res.data);
      setTimeout(() => {
        onClose();
      }, 700);
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
  ];

  return (
    <div
      className="comm-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(25, 20, 15, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 1350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="comm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          width: '100%',
          minHeight: 'auto',
          height: 'auto',
          background: 'linear-gradient(180deg, #fdfaf2 0%, #f6efdc 100%)',
          border: '1.5px solid rgba(217, 87, 43, 0.28)',
          borderRadius: 18,
          boxShadow: '0 20px 48px rgba(35, 26, 18, 0.32), 0 0 0 1px rgba(196, 154, 69, 0.2)',
          padding: '18px 20px 16px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.74rem',
                color: '#b4421b',
                background: 'rgba(217, 87, 43, 0.08)',
                border: '1px solid rgba(217, 87, 43, 0.25)',
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 700,
                letterSpacing: '0.02em',
                marginBottom: 4,
              }}
            >
              <Shield size={12} />
              <span>Sacred Privacy Controls</span>
            </div>
            <h2
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.3rem',
                fontWeight: 700,
                margin: 0,
                color: '#201912',
                lineHeight: 1.2,
              }}
            >
              Public Profile Privacy
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#6e6353', margin: '2px 0 0', lineHeight: 1.3 }}>
              Choose what fellow seekers and circle members can view on your profile.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#8c7e6c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d9572b')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8c7e6c')}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div className="spinner" style={{ width: 26, height: 26, margin: '0 auto 8px' }} />
            <p style={{ color: '#d9572b', fontSize: '0.82rem', margin: 0 }}>Loading privacy options...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Visibility Settings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#8c7e6c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 1,
                }}
              >
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
                      padding: '9px 12px',
                      background: isEnabled ? 'rgba(255, 255, 255, 0.78)' : 'rgba(238, 231, 211, 0.35)',
                      border: '1px solid',
                      borderColor: isEnabled ? 'rgba(196, 154, 69, 0.38)' : 'rgba(110, 99, 83, 0.16)',
                      borderRadius: 11,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isEnabled ? '0 1px 4px rgba(44, 38, 31, 0.04)' : 'none',
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isEnabled
                        ? 'rgba(217, 87, 43, 0.45)'
                        : 'rgba(110, 99, 83, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isEnabled
                        ? 'rgba(196, 154, 69, 0.38)'
                        : 'rgba(110, 99, 83, 0.16)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#201912', lineHeight: 1.25 }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6e6353', marginTop: 1, lineHeight: 1.2 }}>
                          {opt.desc}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        background: isEnabled ? 'rgba(78, 99, 70, 0.12)' : 'rgba(110, 99, 83, 0.1)',
                        color: isEnabled ? '#3d5236' : '#6e6353',
                        border: '1px solid',
                        borderColor: isEnabled ? 'rgba(78, 99, 70, 0.25)' : 'rgba(110, 99, 83, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isEnabled ? (
                        <>
                          <Eye size={11} /> Public
                        </>
                      ) : (
                        <>
                          <EyeOff size={11} /> Private
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <div style={{ color: '#b4421b', fontSize: '0.78rem', marginTop: 2 }}>{error}</div>}

            {saveSuccess && (
              <div
                style={{
                  background: 'rgba(78, 99, 70, 0.12)',
                  color: '#3d5236',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                <Check size={14} /> Settings saved successfully!
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 6,
                paddingTop: 10,
                borderTop: '1px solid rgba(217, 87, 43, 0.12)',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(110, 99, 83, 0.32)',
                  borderRadius: 18,
                  padding: '6px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4a3e2e',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(110, 99, 83, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 18px',
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #d9572b 0%, #b4421b 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(217, 87, 43, 0.28)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!saving) e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 87, 43, 0.4)';
                }}
                onMouseLeave={(e) => {
                  if (!saving) e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 87, 43, 0.28)';
                }}
              >
                <Save size={13} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
