import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Compass, MapPin, Calendar, Phone, Mail, User, Sparkles } from 'lucide-react';

const ASHRAM_LOCATIONS = [
  'Isha Yoga Center, Coimbatore (Ashram)',
  'Isha Institute of Inner-sciences (iii), Tennessee, USA',
  'Sadhana Sthali, Bengaluru Center',
  'Delhi NCR / Northern Chapter Center',
  'Mumbai / Western Chapter Center',
  'Other / Local City Center',
];

const TIMEFRAMES = [
  'Upcoming 1–3 Months (Earliest Cohort)',
  'Next 3–6 Months',
  'Within 1 Year',
  'Mahashivratri / Consecration Season Immersion',
];

export default function ProgramRegistrationModal({
  isOpen,
  onClose,
  program,
  isEligible = true,
  currentUser = {},
  onSave,
  saving = false,
}) {
  const [formData, setFormData] = useState({
    seekerName: '',
    seekerEmail: '',
    seekerPhone: '',
    preferredLocation: ASHRAM_LOCATIONS[0],
    preferredTimeframe: TIMEFRAMES[0],
    spiritualAspiration: '',
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && program) {
      setSubmittedSuccess(false);
      setFormData({
        seekerName: currentUser?.name || '',
        seekerEmail: currentUser?.email || '',
        seekerPhone: currentUser?.phone || '',
        preferredLocation: ASHRAM_LOCATIONS[0],
        preferredTimeframe: TIMEFRAMES[0],
        spiritualAspiration: '',
      });
    }
  }, [isOpen, program, currentUser]);

  if (!isOpen || !program) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.seekerName.trim() || !formData.seekerEmail.trim()) {
      alert('Please provide your name and email address.');
      return;
    }

    const payload = {
      programId: program.id,
      programName: program.name,
      seekerName: formData.seekerName.trim(),
      seekerEmail: formData.seekerEmail.trim(),
      seekerPhone: formData.seekerPhone.trim(),
      preferredLocation: formData.preferredLocation,
      preferredTimeframe: formData.preferredTimeframe,
      spiritualAspiration: formData.spiritualAspiration.trim(),
      prerequisitesStatus: isEligible ? 'Eligible' : 'Prerequisites Pending',
    };

    const success = await onSave(payload);
    if (success) {
      setSubmittedSuccess(true);
      setTimeout(() => {
        onClose();
        setSubmittedSuccess(false);
      }, 1600);
    }
  };

  return (
    <div className="pj-modal-backdrop" onClick={onClose}>
      <div
        className="pj-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 500, padding: '24px 26px' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>{program.icon || '🏛️'}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--pj-radius-pill)',
                  background: isEligible ? 'var(--pj-terracotta-glow)' : 'rgba(78, 99, 70, 0.15)',
                  color: isEligible ? 'var(--pj-terracotta)' : 'var(--pj-olive)',
                  border: `1px solid ${isEligible ? 'var(--pj-border-strong)' : 'transparent'}`,
                }}
              >
                {isEligible ? '✨ Eligible for Intake' : '📋 Express Interest'}
              </span>
            </div>
            <h3
              className="pj-serif"
              style={{ fontSize: 22, fontWeight: 700, color: 'var(--pj-text-charcoal)', margin: 0 }}
            >
              Register: {program.name}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--pj-text-muted)', margin: '2px 0 0' }}>
              {program.duration || 'Residential Consecrated Immersion'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="pj-modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {submittedSuccess ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(78, 99, 70, 0.15)',
                color: 'var(--pj-olive)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <CheckCircle2 size={32} color="var(--pj-olive)" />
            </div>
            <h4 className="pj-serif" style={{ fontSize: 20, color: 'var(--pj-text-charcoal)', margin: '0 0 6px' }}>
              Registration Interest Inscribed 🙏
            </h4>
            <p style={{ fontSize: 13, color: 'var(--pj-text-muted)', margin: 0, lineHeight: 1.45 }}>
              Your interest for <strong>{program.name}</strong> has been stored in the consecrated ledger.
              The program coordinator will reach out as admissions open.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 4 }}>
                  Seeker Name *
                </label>
                <input
                  type="text"
                  className="pj-input"
                  value={formData.seekerName}
                  onChange={(e) => setFormData({ ...formData, seekerName: e.target.value })}
                  placeholder="Your Full Name"
                  required
                />
              </div>

              <div>
                <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 4 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  className="pj-input"
                  value={formData.seekerEmail}
                  onChange={(e) => setFormData({ ...formData, seekerEmail: e.target.value })}
                  placeholder="name@domain.com"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 4 }}>
                Phone / WhatsApp Number (for Ashram Coordinator)
              </label>
              <input
                type="tel"
                className="pj-input"
                value={formData.seekerPhone}
                onChange={(e) => setFormData({ ...formData, seekerPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 4 }}>
                  Preferred Center / Location
                </label>
                <select
                  className="pj-input"
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: 12 }}
                >
                  {ASHRAM_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 4 }}>
                  Target Timeframe
                </label>
                <select
                  className="pj-input"
                  value={formData.preferredTimeframe}
                  onChange={(e) => setFormData({ ...formData, preferredTimeframe: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: 12 }}
                >
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="pj-tag" style={{ color: 'var(--pj-text-muted)', display: 'block', marginBottom: 4 }}>
                Spiritual Longing / Preparation Notes (Optional)
              </label>
              <textarea
                className="pj-input"
                rows={3}
                value={formData.spiritualAspiration}
                onChange={(e) => setFormData({ ...formData, spiritualAspiration: e.target.value })}
                placeholder="What draws you to this sacred program? Any questions or sadhana milestones you wish to share..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--pj-border)',
                  color: 'var(--pj-text-secondary)',
                  borderRadius: 'var(--pj-radius-sm)',
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="pj-whisper-trigger-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {saving ? 'Inscribing...' : '✓ Submit Registration Interest 🙏'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
