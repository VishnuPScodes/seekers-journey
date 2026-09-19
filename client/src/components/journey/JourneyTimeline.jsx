import React, { useRef, useEffect } from 'react';
import { getCategoryById, JOURNEY_CATEGORIES } from '../../constants/journeyCategories';
import { formatDisplayDate } from './JourneyEventModal';

// ─── Year label helpers ───────────────────────────────────────────────────────

function getYear(event) {
  return event.date?.split('-')[0] || '';
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  const suggestions = [
    'First heard about Sadhguru',
    'First interacted with Isha',
    'First visited Isha Yoga Center',
    'First attended a program',
    'Started a daily practice',
  ];

  return (
    <div className="journey-empty-state">
      <div className="journey-empty-icon">🌱</div>
      <h2 className="journey-empty-title">Where did your journey begin?</h2>
      <p className="journey-empty-subtitle">
        Start by adding the first meaningful moment of your journey with Isha.
      </p>
      <button className="btn btn-primary journey-empty-btn" onClick={onAdd}>
        + Add First Journey Event
      </button>
      <div className="journey-empty-suggestions">
        <p className="journey-empty-suggestions-label">Some moments to start with:</p>
        {suggestions.map((s) => (
          <span key={s} className="journey-suggestion-chip" onClick={onAdd}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Single Node ──────────────────────────────────────────────────────────────

function JourneyNode({ event, index, onClick }) {
  const cat = getCategoryById(event.category);
  const isAbove = index % 2 === 0; // alternate labels above/below

  return (
    <div className="journey-node-wrap" onClick={() => onClick(event)}>
      {/* Label above */}
      {isAbove && (
        <div className="journey-node-label journey-node-label--above">
          <div className="journey-node-title">{event.title}</div>
          <div className="journey-node-date">{formatDisplayDate(event.date, event.datePrecision)}</div>
        </div>
      )}

      {/* The dot */}
      <div
        className="journey-node-dot"
        style={{ '--node-color': cat.color }}
        title={event.title}
        aria-label={event.title}
      >
        <span className="journey-node-icon">{cat.icon}</span>
      </div>

      {/* Label below */}
      {!isAbove && (
        <div className="journey-node-label journey-node-label--below">
          <div className="journey-node-title">{event.title}</div>
          <div className="journey-node-date">{formatDisplayDate(event.date, event.datePrecision)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Year Marker ─────────────────────────────────────────────────────────────

function YearMarker({ year }) {
  return (
    <div className="journey-year-marker">
      <span className="journey-year-label">{year}</span>
    </div>
  );
}

// ─── Main Timeline ────────────────────────────────────────────────────────────

export default function JourneyTimeline({ events, onNodeClick, onAdd }) {
  const scrollRef = useRef(null);

  // Auto-scroll to end (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [events.length]);

  if (events.length === 0) {
    return <EmptyState onAdd={onAdd} />;
  }

  // Build the sequence, inserting year markers when the year changes
  const items = [];
  let lastYear = null;

  events.forEach((event, idx) => {
    const year = getYear(event);
    if (year !== lastYear) {
      items.push({ type: 'year', year, key: `year-${year}-${idx}` });
      lastYear = year;
    }
    items.push({ type: 'event', event, index: idx, key: event._id });
  });

  return (
    <div className="journey-timeline-outer">
      {/* Scrollable track */}
      <div className="journey-timeline-scroll" ref={scrollRef}>
        <div className="journey-timeline-track">
          {/* The connecting line */}
          <div className="journey-timeline-line" />

          {/* Nodes + year markers */}
          {items.map((item) =>
            item.type === 'year' ? (
              <YearMarker key={item.key} year={item.year} />
            ) : (
              <JourneyNode
                key={item.key}
                event={item.event}
                index={item.index}
                onClick={onNodeClick}
              />
            )
          )}
        </div>
      </div>

      {/* Fade edges to hint at scroll */}
      <div className="journey-timeline-fade-left" />
      <div className="journey-timeline-fade-right" />

      {/* Legend */}
      <div className="journey-legend">
        {JOURNEY_CATEGORIES.map((cat) => (
          <div key={cat.id} className="journey-legend-item">
            <span className="journey-legend-dot" style={{ background: cat.color }} />
            <span className="journey-legend-label">{cat.icon} {cat.label}</span>
          </div>
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div className="journey-vertical-list">
        {events.map((event, idx) => {
          const cat = getCategoryById(event.category);
          const year = getYear(event);
          const prevYear = idx > 0 ? getYear(events[idx - 1]) : null;
          return (
            <React.Fragment key={event._id}>
              {year !== prevYear && (
                <div className="journey-vert-year">{year}</div>
              )}
              <div className="journey-vert-item" onClick={() => onNodeClick(event)}>
                <div className="journey-vert-dot" style={{ '--node-color': cat.color }}>
                  {cat.icon}
                </div>
                <div className="journey-vert-info">
                  <div className="journey-vert-title">{event.title}</div>
                  <div className="journey-vert-date">
                    {formatDisplayDate(event.date, event.datePrecision)} · {cat.label}
                  </div>
                  {event.description && (
                    <div className="journey-vert-desc">{event.description}</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
