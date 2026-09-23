import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, Video, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../../api';

export default function UpcomingGatheringsWidget({ sanghaId = null, isEmbedded = false }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const url = sanghaId
        ? `/community/events?sanghaId=${sanghaId}`
        : '/community/events';
      const res = await api.get(url);
      setEvents(res.data.events || res.data.gatherings || []);
    } catch (err) {
      console.error('Failed to load gatherings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [sanghaId]);

  const formatEventTime = (startTime) => {
    if (!startTime) return 'Upcoming';
    const d = new Date(startTime);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const content = (
    <>
      {!isEmbedded && (
        <h3 className="comm-sidebar-title">
          <Calendar size={18} color="var(--comm-terracotta)" />
          <span>Sacred Gatherings</span>
        </h3>
      )}

      {loading ? (
        <div style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)', textAlign: 'center', padding: '12px 0' }}>
          Finding circles in practice...
        </div>
      ) : events.length === 0 ? (
        <div style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)', padding: '6px 0' }}>
          No scheduled gatherings at this moment.
        </div>
      ) : (
        <div className="comm-sidebar-list">
          {events.slice(0, 3).map((ev) => (
            <div
              key={ev._id}
              onClick={() => navigate(`/community/gatherings/${ev._id}`)}
              style={{
                background: 'var(--comm-bg-card)',
                border: '1px solid var(--comm-border-hairline)',
                borderRadius: 'var(--comm-radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
              }}
              title="Click to view full gathering details and RSVP"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--comm-text-charcoal)' }}>
                    {ev.title}
                  </div>
                  {ev.sanghaId?.name && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--comm-terracotta)', fontWeight: 600, marginTop: 1 }}>
                      🏛️ {ev.sanghaId.name}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 6px',
                    borderRadius: 'var(--comm-radius-sm)',
                    background: ev.eventType === 'in_person' ? 'var(--comm-olive-light)' : 'var(--comm-gold-light)',
                    color: ev.eventType === 'in_person' ? 'var(--comm-olive)' : 'var(--comm-gold)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  {ev.eventType === 'in_person' ? (
                    <>
                      <MapPin size={10} /> In-Person
                    </>
                  ) : (
                    <>
                      <Video size={10} /> Online
                    </>
                  )}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--comm-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} color="var(--comm-gold)" />
                <span>{formatEventTime(ev.startTime)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--comm-text-light)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Users size={13} /> {ev.attendeesCount || 0} attending
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ev.isAttending && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--comm-olive)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 size={12} /> Confirmed
                    </span>
                  )}
                  <span
                    className="comm-btn-small"
                    style={{ fontSize: '0.76rem', padding: '3px 10px' }}
                    id={`view-btn-${ev._id}`}
                  >
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--comm-border-hairline)', textAlign: 'center' }}>
        <Link
          to="/community/gatherings"
          className="comm-link-accent"
          id="sidebar-browse-all-gatherings"
        >
          Browse All Gatherings Directory <ArrowRight size={13} />
        </Link>
      </div>
    </>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="comm-sidebar-card" id="upcoming-gatherings-widget">
      {content}
    </div>
  );
}
