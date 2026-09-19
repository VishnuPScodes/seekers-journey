/**
 * Journey Categories — the extensible category system for Personal Journey events.
 * Import this wherever you need category metadata (labels, icons, colors).
 *
 * To add a new category in the future:
 *  1. Add an entry here.
 *  2. Add it to the enum in server/models/JourneyEvent.js.
 */
export const JOURNEY_CATEGORIES = [
  {
    id: 'beginning',
    label: 'Beginning',
    icon: '🌱',
    color: '#7a6012',
    description: 'First contact with Sadhguru or Isha',
  },
  {
    id: 'program',
    label: 'Program',
    icon: '📿',
    color: '#c46b3e',
    description: 'IE, BSP, Shoonya, Sadhanapada, Samyama, and others',
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: '🧘',
    color: '#5d7550',
    description: 'Starting or deepening a daily practice',
  },
  {
    id: 'volunteering',
    label: 'Volunteering / Seva',
    icon: '🤝',
    color: '#4a7a6a',
    description: 'Any form of volunteering or seva',
  },
  {
    id: 'event',
    label: 'Event',
    icon: '✨',
    color: '#8b6b3d',
    description: 'Mahashivratri, retreats, visits, special events',
  },
  {
    id: 'personal_milestone',
    label: 'Personal Milestone',
    icon: '🌟',
    color: '#6b5a8a',
    description: 'A meaningful personal moment on the journey',
  },
];

/** Lookup by id */
export function getCategoryById(id) {
  return JOURNEY_CATEGORIES.find((c) => c.id === id) ?? JOURNEY_CATEGORIES[0];
}
