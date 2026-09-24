import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { ArrowLeft } from 'lucide-react';

import { normalizeJourneyData } from './journeyDataUtils';
import JourneyHero from './components/JourneyHero';
import OriginStoryCard from './components/OriginStoryCard';
import RiverOfTime from './components/RiverOfTime';
import CurriculumPathways from './components/CurriculumPathways';
import ProgramRegistrationModal from './components/ProgramRegistrationModal';
import { WhisperModal, EditOriginModal, EventDetailModal, AddMilestoneModal } from './components/JourneyModals';

import './PersonalJourney.css';

export default function PersonalJourney() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [journeyData, setJourneyData] = useState(null);

  // Modals & Active Event
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [whisperModalOpen, setWhisperModalOpen] = useState(false);
  const [editOriginModalOpen, setEditOriginModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [registerModalData, setRegisterModalData] = useState(null); // { program, isEligible }
  const [savingReflection, setSavingReflection] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [savingRegistration, setSavingRegistration] = useState(false);

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

  // Handle saving manual milestone into River of Time
  const handleSaveMilestone = async (milestoneData) => {
    try {
      setSavingMilestone(true);
      await api.post('/journey/events', milestoneData);
      setMilestoneModalOpen(false);
      await fetchJourneyData();
    } catch (err) {
      console.error('Failed to create milestone:', err);
      alert(err.response?.data?.message || 'Failed to save milestone');
    } finally {
      setSavingMilestone(false);
    }
  };

  // Handle saving advanced program registration interest
  const handleSaveRegistration = async (registrationPayload) => {
    try {
      setSavingRegistration(true);
      await api.post('/journey/program-registrations', registrationPayload);
      await fetchJourneyData();
      return true;
    } catch (err) {
      console.error('Failed to submit program registration:', err);
      alert(err.response?.data?.message || 'Failed to submit registration. Please try again.');
      return false;
    } finally {
      setSavingRegistration(false);
    }
  };

  if (loading || !journeyData) {
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

  const { user = {}, events = [], programs = [], officialPrograms = [], registrations = [] } = journeyData || {};

  return (
    <>
      <Navbar />

      <div className="pj-root-container">
        <main className="pj-content-wrapper animate-in">
          {/* Back Navigation */}
          <button
            type="button"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            id="btn-back-nav"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--pj-terracotta)',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              marginBottom: 14,
              padding: 0,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* 1. Identity & Living Sadhana Standing */}
          <JourneyHero
            user={user}
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
            onOpenAddMilestone={() => setMilestoneModalOpen(true)}
            onOpenAddMemory={() => setMilestoneModalOpen(true)}
          />

          {/* 4. Sacred Curriculum & Mountain Ascent */}
          <CurriculumPathways
            user={user}
            programs={programs}
            officialPrograms={officialPrograms}
            registrations={registrations}
            onOpenRegistration={(prog, isEligible) => setRegisterModalData({ program: prog, isEligible })}
          />
        </main>

        {/* ── MODALS ── */}
        <ProgramRegistrationModal
          isOpen={Boolean(registerModalData)}
          onClose={() => setRegisterModalData(null)}
          program={registerModalData?.program}
          isEligible={registerModalData?.isEligible}
          currentUser={user}
          onSave={handleSaveRegistration}
          saving={savingRegistration}
        />

        <AddMilestoneModal
          isOpen={milestoneModalOpen}
          onClose={() => setMilestoneModalOpen(false)}
          onSave={handleSaveMilestone}
          saving={savingMilestone}
        />

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
