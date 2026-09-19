import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import JourneyTimeline from '../components/journey/JourneyTimeline';
import JourneyEventModal from '../components/journey/JourneyEventModal';
import { useJourneyEvents } from '../hooks/useJourneyEvents';

export default function PersonalJourney() {
  const { events, loading, error, fetchEvents, addEvent, updateEvent, deleteEvent } = useJourneyEvents();

  // Modal state
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'view'|'edit', event?: object }

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openAdd = () => setModal({ mode: 'add' });
  const openView = (event) => setModal({ mode: 'view', event });
  const closeModal = () => setModal(null);

  const handleSave = async (payload, existingId) => {
    if (existingId) {
      await updateEvent(existingId, payload);
    } else {
      await addEvent(payload);
    }
  };

  const handleDelete = async (id) => {
    await deleteEvent(id);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="personal-journey-page">
      <Navbar />

      <div className="personal-journey-inner">
        {/* Page header */}
        <div className="journey-page-header">
          <div className="journey-page-title-block">
            <h1 className="journey-page-title">Personal Journey</h1>
            <p className="journey-page-subtitle">Your journey, one moment at a time.</p>
          </div>
          {events.length > 0 && (
            <button className="btn btn-primary journey-add-btn" onClick={openAdd}>
              + Add Journey Event
            </button>
          )}
        </div>

        {/* Journey count badge */}
        {events.length > 0 && (
          <div className="journey-count-badge">
            {events.length} {events.length === 1 ? 'moment' : 'moments'} recorded
          </div>
        )}

        {/* Main content */}
        {loading ? (
          <div className="journey-loading">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <span>Gathering your journey…</span>
          </div>
        ) : error ? (
          <div className="journey-error-state">
            <p>{error}</p>
            <button className="btn btn-outline" style={{ width: 'auto', marginTop: 12 }} onClick={fetchEvents}>
              Try again
            </button>
          </div>
        ) : (
          <JourneyTimeline
            events={events}
            onNodeClick={openView}
            onAdd={openAdd}
          />
        )}
      </div>

      {/* Modal */}
      {modal && (
        <JourneyEventModal
          mode={modal.mode}
          event={modal.event}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
