import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { SacredBackgroundMotifsLayer } from '../../components/SadhanaMotifs';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

import { normalizeJourneyData } from './journeyDataUtils';
import JourneyHero from './components/JourneyHero';
import OriginStoryCard from './components/OriginStoryCard';
import RiverOfTime from './components/RiverOfTime';
import CurriculumPathways from './components/CurriculumPathways';
import MandalaSevaCard from './components/MandalaSevaCard';
import { WhisperModal, EditOriginModal, EventDetailModal } from './components/JourneyModals';

import './PersonalJourney.css';

export default function PersonalJourney() {
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [journeyData, setJourneyData] = useState(null);

  // Modals & Active Event
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [whisperModalOpen, setWhisperModalOpen] = useState(false);
  const [editOriginModalOpen, setEditOriginModalOpen] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);

  // Fetch and normalize all journey data
  const fetchJourneyData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/journey/me');
      const normalized = normalizeJourneyData(res.data, authUser);
      setJourneyData(normalized);
    } catch (err) {
      console.error('Failed to fetch personal journey data:', err);
      // Even if network or server error occurs, construct graceful offline profile
      const fallback = normalizeJourneyData({}, authUser);
      setJourneyData(fallback);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchJourneyData();
  }, [fetchJourneyData]);

  // Handle saving Whisper of Grace reflection
  const handleSaveReflection = async (text) => {
    try {
      setSavingReflection(true);
      const practiceName = journeyData?.user?.selectedPractices?.[0] || 'Sadhana';
      await api.post('/journey/voice-reflection', {
        text,
        practiceName,
      });
      setWhisperModalOpen(false);
      await fetchJourneyData();
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setSavingReflection(false);
    }
  };

  // Handle saving Origin Story
  const handleSaveOriginStory = async (formUpdates) => {
    try {
      await api.put('/journey/origin-story', formUpdates);
      setEditOriginModalOpen(false);
      await fetchJourneyData();
    } catch (err) {
      console.error('Failed to update origin story:', err);
    }
  };

  if (loading && !journeyData) {
    return (
      <>
        <Navbar />
        <div className="pj-root-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'var(--pj-terracotta) transparent' }} />
            <p className="pj-serif" style={{ fontSize: 20, color: 'var(--pj-text-charcoal)' }}>
              Gathering your sacred chronicle...
            </p>
          </div>
        </div>
      </>
    );
  }

  const { user, events, programs, officialPrograms, mandala, seva } = journeyData;

  return (
    <>
      <Navbar />

      <div className="pj-root-container">
        {/* Background Sacred Ambient Motifs */}
        <SacredBackgroundMotifsLayer color="#d9572b" />

        <main className="pj-content-wrapper animate-in">
          {/* 1. Identity & Living Sadhana Standing */}
          <JourneyHero
            user={user}
            onOpenReflection={() => setWhisperModalOpen(true)}
            onPersonaSwitched={fetchJourneyData}
          />

          {/* 2. "Where I Started" — Origin Story */}
          <OriginStoryCard
            user={user}
            onEditStory={() => setEditOriginModalOpen(true)}
          />

          {/* 3. The Serpentine River of Time */}
          <RiverOfTime
            events={events}
            onSelectEvent={setSelectedEvent}
            onOpenAddMemory={() => setWhisperModalOpen(true)}
          />

          {/* 4. Sacred Curriculum & Mountain Ascent */}
          <CurriculumPathways
            user={user}
            programs={programs}
            officialPrograms={officialPrograms}
          />

          {/* 5. Mandala Rhythm & Sacred Seva */}
          <MandalaSevaCard
            user={user}
            mandala={mandala}
            seva={seva}
          />
        </main>

        {/* ── MODALS ── */}
        <WhisperModal
          isOpen={whisperModalOpen}
          onClose={() => setWhisperModalOpen(false)}
          onSave={handleSaveReflection}
          saving={savingReflection}
        />

        <EditOriginModal
          isOpen={editOriginModalOpen}
          onClose={() => setEditOriginModalOpen(false)}
          initialForm={user?.originStory || {}}
          onSave={handleSaveOriginStory}
        />

        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    </>
  );
}
