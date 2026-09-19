import React, { useState } from 'react';
import { X, MapPin, Calendar } from 'lucide-react';
import { JOURNEY_CATEGORIES, getCategoryById } from '../../constants/journeyCategories';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Build the payload date string from form state */
function buildDate(precision, year, month, day) {
  if (precision === 'year') return year;
  if (precision === 'month') return `${year}-${String(month).padStart(2, '0')}`;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Parse an existing event's date back into form fields */
function parseDate(date, precision) {
  if (!date) return { year: '', month: '1', day: '1' };
  const parts = date.split('-');
  return {
    year: parts[0] || '',
    month: parts[1] ? String(parseInt(parts[1], 10)) : '1',
    day: parts[2] ? String(parseInt(parts[2], 10)) : '1',
  };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * JourneyEventModal
 *
 * mode = 'add'  → blank form, "Save Event" button
 * mode = 'view' → read-only with Edit / Delete buttons
 * mode = 'edit' → editable form for existing event
 */
export default function JourneyEventModal({ mode: initialMode, event, onClose, onSave, onDelete }) {
  const isNew = initialMode === 'add';
  const [mode, setMode] = useState(initialMode);

  const parsed = parseDate(event?.date, event?.datePrecision);

  const [title, setTitle] = useState(event?.title || '');
  const [category, setCategory] = useState(event?.category || 'beginning');
  const [precision, setPrecision] = useState(event?.datePrecision || 'day');
  const [year, setYear] = useState(parsed.year || String(new Date().getFullYear()));
  const [month, setMonth] = useState(parsed.month || '1');
  const [day, setDay] = useState(parsed.day || '1');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cat = getCategoryById(category);

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('Please enter an event name.'); return; }
    if (!year || isNaN(parseInt(year, 10))) { setError('Please enter a valid year.'); return; }

    const dateStr = buildDate(precision, year, month, day);
    const payload = {
      title: title.trim(),
      category,
      date: dateStr,
      datePrecision: precision,
      description: description.trim(),
      location: location.trim(),
    };

    setSaving(true);
    try {
      await onSave(payload, event?._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await onDelete(event._id);
      onClose();
    } catch {
      setError('Could not delete event.');
      setDeleting(false);
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isReadOnly = mode === 'view';

  return (
    <div className="journey-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="journey-modal">
        {/* Header */}
        <div className="journey-modal-header">
          <div className="journey-modal-title-row">
            <span className="journey-modal-cat-icon">{cat.icon}</span>
            <h2 className="journey-modal-title">
              {isNew ? 'Add Journey Event' : isReadOnly ? 'Journey Moment' : 'Edit Event'}
            </h2>
          </div>
          <button className="journey-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="journey-modal-body">
          {error && <div className="journey-modal-error">{error}</div>}

          {/* ── View mode: show details ── */}
          {isReadOnly ? (
            <div className="journey-view-body">
              <div className="journey-view-cat" style={{ color: cat.color }}>
                {cat.icon} {cat.label}
              </div>
              <h3 className="journey-view-title">{event.title}</h3>
              <div className="journey-view-date">
                <Calendar size={14} style={{ flexShrink: 0 }} />
                {formatDisplayDate(event.date, event.datePrecision)}
              </div>
              {event.description && (
                <p className="journey-view-desc">{event.description}</p>
              )}
              {event.location && (
                <div className="journey-view-loc">
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  {event.location}
                </div>
              )}
            </div>
          ) : (
            /* ── Add / Edit form ── */
            <>
              {/* Event Name */}
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Inner Engineering, First visit to Isha..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  autoFocus
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-input journey-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {JOURNEY_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon}  {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Precision toggle */}
              <div className="form-group">
                <label className="form-label">How well do you remember the date?</label>
                <div className="journey-precision-tabs">
                  {[
                    { value: 'year', label: 'Year only' },
                    { value: 'month', label: 'Month & Year' },
                    { value: 'day', label: 'Exact Date' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`journey-precision-tab ${precision === opt.value ? 'active' : ''}`}
                      onClick={() => setPrecision(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date fields */}
              <div className="form-group">
                <label className="form-label">
                  {precision === 'year' ? 'Year' : precision === 'month' ? 'Month & Year' : 'Date'}
                </label>
                <div className="journey-date-row">
                  {(precision === 'month' || precision === 'day') && (
                    <select
                      className="form-input journey-select"
                      value={month}
                      onChange={(e) => { setMonth(e.target.value); setDay('1'); }}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={String(i + 1)}>{m}</option>
                      ))}
                    </select>
                  )}
                  {precision === 'day' && (
                    <select
                      className="form-input journey-select"
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                    >
                      {dayOptions.map((d) => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </select>
                  )}
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                    style={{ maxWidth: precision === 'year' ? '100%' : '90px' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description <span className="form-label-opt">(optional)</span></label>
                <textarea
                  className="form-input journey-textarea"
                  placeholder="What happened? What did you feel? What changed?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Location <span className="form-label-opt">(optional)</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Isha Yoga Center, Online..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={200}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="journey-modal-footer">
          {isReadOnly ? (
            <>
              <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setMode('edit')}>
                Edit
              </button>
              <button
                className={`btn ${confirmDelete ? 'btn-danger' : 'btn-outline-danger'}`}
                style={{ width: 'auto' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : confirmDelete ? 'Confirm Delete' : 'Delete'}
              </button>
              {confirmDelete && (
                <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-outline" style={{ width: 'auto' }} onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Save Event' : 'Update Event'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Display date formatter ───────────────────────────────────────────────────

export function formatDisplayDate(date, precision) {
  if (!date) return '';
  const parts = date.split('-');
  const year = parts[0];
  const month = parts[1] ? parseInt(parts[1], 10) : null;
  const day = parts[2] ? parseInt(parts[2], 10) : null;

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  if (precision === 'year') return year;
  if (precision === 'month' && month) return `${MONTHS[month - 1]} ${year}`;
  if (precision === 'day' && month && day) return `${day} ${MONTHS[month - 1]} ${year}`;
  return date;
}
