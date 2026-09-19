import { useState, useCallback } from 'react';
import api from '../api';

/**
 * useJourneyEvents — custom hook that owns all journey event state + API calls.
 *
 * Returns:
 *   events        — chronologically sorted array of journey events
 *   loading       — true while initial fetch is in progress
 *   error         — string error message, or null
 *   fetchEvents   — (re)load from server
 *   addEvent      — POST a new event
 *   updateEvent   — PUT an existing event
 *   deleteEvent   — DELETE an event
 */

// Normalise partial dates so they sort correctly as strings.
function sortKey(event) {
  const { date, datePrecision } = event;
  if (datePrecision === 'year') return `${date}-01-01`;
  if (datePrecision === 'month') return `${date}-01`;
  return date;
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const dateCompare = sortKey(a).localeCompare(sortKey(b));
    if (dateCompare !== 0) return dateCompare;
    // Tie-break: preserve insertion order
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

export function useJourneyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/journey');
      setEvents(sortEvents(data.events));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load journey events.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addEvent = useCallback(async (payload) => {
    const { data } = await api.post('/journey', payload);
    setEvents((prev) => sortEvents([...prev, data.event]));
    return data.event;
  }, []);

  const updateEvent = useCallback(async (id, payload) => {
    const { data } = await api.put(`/journey/${id}`, payload);
    setEvents((prev) => sortEvents(prev.map((e) => (e._id === id ? data.event : e))));
    return data.event;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    await api.delete(`/journey/${id}`);
    setEvents((prev) => prev.filter((e) => e._id !== id));
  }, []);

  return { events, loading, error, fetchEvents, addEvent, updateEvent, deleteEvent };
}
