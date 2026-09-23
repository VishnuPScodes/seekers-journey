/**
 * journeyDataUtils.js
 * Comprehensive normalization and utility functions for Personal Journey.
 * Guarantees that any seeker profile (new user, non-seeded account, or synthetic personas A-G)
 * receives complete, robust, and emotionally evocative data without blank states or NaN errors.
 */

export const CATEGORY_COLORS = {
  start:     { text: '#4e6346', border: 'rgba(78, 99, 70, 0.4)',   bg: 'rgba(78, 99, 70, 0.12)', label: 'Awakening' },
  program:   { text: '#d9572b', border: 'rgba(217, 87, 43, 0.4)',  bg: 'rgba(217, 87, 43, 0.12)', label: 'Sacred Program' },
  sadhana:   { text: '#e65c00', border: 'rgba(230, 92, 0, 0.4)',   bg: 'rgba(230, 92, 0, 0.12)',  label: 'Daily Sadhana' },
  milestone: { text: '#c49a45', border: 'rgba(196, 154, 69, 0.4)', bg: 'rgba(196, 154, 69, 0.12)', label: 'Ascent Milestone' },
  seva:      { text: '#4e6346', border: 'rgba(78, 99, 70, 0.4)',   bg: 'rgba(78, 99, 70, 0.12)', label: 'Sacred Seva' },
  personal:  { text: '#b4421b', border: 'rgba(180, 66, 27, 0.35)', bg: 'rgba(180, 66, 27, 0.10)', label: 'Whisper of Grace' },
  community: { text: '#4a7079', border: 'rgba(74, 112, 121, 0.35)', bg: 'rgba(74, 112, 121, 0.10)', label: 'Satsang Circle' },
};

export const CATEGORIES = [
  { id: 'all',       label: 'All Memories',    icon: '✨' },
  { id: 'program',   label: 'Programs',        icon: '🏛️' },
  { id: 'sadhana',   label: 'Sadhana',         icon: '🪷' },
  { id: 'milestone', label: 'Milestones',      icon: '🏔️' },
  { id: 'seva',      label: 'Seva & Offering', icon: '🙏' },
  { id: 'personal',  label: 'Whispers',        icon: '🪶' },
];

/**
 * Calculates human-readable time on path with safe date parsing
 */
export function formatTimeOnPath(startDate) {
  if (!startDate) return '4 moons on the sacred path';
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 'On the sacred path';
    const elapsedMs = Math.max(0, Date.now() - start.getTime());
    const totalDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);

    if (years === 0 && months === 0) return 'Newly stepped onto the sacred path';
    if (years === 0) return `${months} month${months > 1 ? 's' : ''} on the sacred path`;
    if (months === 0) return `${years} year${years > 1 ? 's' : ''} on the sacred path`;
    return `${years} yr${years > 1 ? 's' : ''}, ${months} mo${months > 1 ? 's' : ''} on the sacred path`;
  } catch {
    return 'Walking the sacred path';
  }
}

/**
 * Generates inspiring baseline milestones if a user has 0 historical events
 */
export function generateSeedMilestones(user) {
  const regDate = user?.journeyStartDate || user?.createdAt || new Date();
  const dateObj = new Date(regDate);
  const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const practices = (user?.selectedPractices && user.selectedPractices.length > 0)
    ? user.selectedPractices
    : ['Shambhavi Mahamudra'];

  const seed = [];

  // Milestone 1: The First Spark
  seed.push({
    _id: 'seed-start',
    type: 'auto',
    category: 'start',
    title: 'The First Spark of Seeking',
    description: user?.originStory?.originStoryText?.slice(0, 140) ||
      'Stepped onto the consecrated path of inner engineering, longing for clarity and conscious living.',
    date: safeDate.toISOString(),
    icon: '🌱',
    isSeed: true,
  });

  // Milestone 2: Sacred Initiation for each practice
  practices.forEach((pName, idx) => {
    const initDate = new Date(safeDate.getTime() + (idx + 1) * 3600000 * 24 * 7);
    seed.push({
      _id: `seed-init-${idx}`,
      type: 'auto',
      category: 'sadhana',
      title: `Initiated into ${pName}`,
      description: `Received the sacred transmission of ${pName}. Committed to dawn sadhana and inner alignment.`,
      date: initDate.toISOString(),
      icon: '🪷',
      isSeed: true,
    });
  });

  // Milestone 3: Ascent Milestone
  const level = user?.currentLevel || 1;
  const score = user?.totalCumulativeScore || 0;
  seed.push({
    _id: 'seed-level',
    type: 'auto',
    category: 'milestone',
    title: `Ascended to Level ${level} Seeker`,
    description: `Consecrated ${score.toLocaleString()} points of conscious effort along the pilgrimage to Kailash.`,
    date: new Date().toISOString(),
    icon: '🏔️',
    isSeed: true,
  });

  return seed;
}

/**
 * Normalizes all fields of the /journey/me response and context user
 */
export function normalizeJourneyData(apiData, authUser) {
  const rawUser = apiData?.user || authUser || {};

  const name = rawUser.name || authUser?.name || 'Seeker of Grace';
  const city = rawUser.city || 'Bengaluru';
  const region = rawUser.region || 'India';
  const journeyStartDate = rawUser.journeyStartDate || rawUser.createdAt || new Date();
  const timeOnPathLabel = rawUser.timeOnPathLabel || formatTimeOnPath(journeyStartDate);
  const selectedPractices = (rawUser.selectedPractices && rawUser.selectedPractices.length > 0)
    ? rawUser.selectedPractices
    : (authUser?.selectedPractices?.length ? authUser.selectedPractices : ['Shambhavi Mahamudra']);

  const currentLevel = rawUser.currentLevel || authUser?.currentLevel || 1;
  const totalCumulativeScore = rawUser.totalCumulativeScore ?? authUser?.totalCumulativeScore ?? 0;
  const pradakshinaCount = rawUser.pradakshinaCount || 0;
  const cohortPersona = rawUser.cohortPersona || 'B';

  // Origin Story
  const originStory = {
    discoveryDate: rawUser.originStory?.discoveryDate || null,
    discoveryChannel: rawUser.originStory?.discoveryChannel || 'YouTube Video Discourse',
    firstAttraction: rawUser.originStory?.firstAttraction || 'Clarity and profound logic of Sadhguru',
    initialMotivation: rawUser.originStory?.initialMotivation || 'Seeking inner balance and conscious growth',
    originStoryText: rawUser.originStory?.originStoryText ||
      'First encountered Sadhguru during a pivotal life transition. The razor-sharp clarity and practical yogic technologies dismantled intellectual resistance, opening a deep longing for daily sadhana.',
  };

  const normalizedUser = {
    ...rawUser,
    name,
    city,
    region,
    journeyStartDate,
    timeOnPathLabel,
    selectedPractices,
    currentLevel,
    totalCumulativeScore,
    pradakshinaCount,
    cohortPersona,
    originStory,
  };

  // Events normalization
  let rawEvents = Array.isArray(apiData?.events) ? apiData.events : [];
  if (rawEvents.length === 0) {
    rawEvents = generateSeedMilestones(normalizedUser);
  }

  // Ensure all events have valid date strings and categories
  const events = rawEvents
    .map((e, idx) => {
      let safeDate = e.date;
      if (!safeDate || isNaN(new Date(safeDate).getTime())) {
        safeDate = new Date(Date.now() - (rawEvents.length - idx) * 86400000 * 30).toISOString();
      }
      return {
        ...e,
        date: safeDate,
        category: e.category || 'personal',
        icon: e.icon || (CATEGORY_COLORS[e.category] ? '🪷' : '✨'),
        title: e.title || 'Sacred Moment',
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Programs & Official Programs
  const programs = Array.isArray(apiData?.programs) ? apiData.programs : [];
  const officialPrograms = Array.isArray(apiData?.officialPrograms) && apiData.officialPrograms.length > 0
    ? apiData.officialPrograms
    : [
        {
          id: 'inner_engineering',
          name: 'Inner Engineering',
          shortName: 'IE',
          description: 'A 7-session experiential technology for inner wellbeing imparting the sacred Shambhavi Mahamudra Kriya.',
          category: 'foundational',
          transmitsPractices: ['Shambhavi Mahamudra'],
          prerequisites: [],
          typicalLocations: ['Bengaluru', 'Coimbatore Ashram', 'Online'],
          duration: '7 Days / 4 Days Residential',
          icon: '🏛️',
        },
        {
          id: 'bhava_spandana',
          name: 'Bhava Spandana Program',
          shortName: 'BSP',
          description: 'A profound 4-day residential immersion taking the seeker beyond physical and psychological limitations into unbounded devotion.',
          category: 'advanced',
          prerequisites: ['inner_engineering'],
          typicalLocations: ['Isha Yoga Center, Coimbatore'],
          duration: '4 Days Residential',
          icon: '🌸',
        },
        {
          id: 'surya_kriya',
          name: 'Surya Kriya',
          shortName: 'Surya Kriya',
          description: 'A potent 21-step Hatha Yoga practice activating the solar plexus and balancing the system.',
          category: 'hatha_yoga',
          transmitsPractices: ['Surya Kriya'],
          prerequisites: [],
          typicalLocations: ['Local Isha Centers', 'Ashram'],
          duration: '2 Days Weekend Workshop',
          icon: '☀️',
        },
        {
          id: 'shoonya_intensive',
          name: 'Shoonya Intensive',
          shortName: 'Shoonya',
          description: 'An advanced 4-day residential program imparting Shakti Chalana Kriya and the conscious stillness of Shoonya meditation.',
          category: 'advanced',
          transmitsPractices: ['Shoonya Meditation', 'Shakti Chalana Kriya'],
          prerequisites: ['inner_engineering'],
          typicalLocations: ['Isha Yoga Center, Coimbatore'],
          duration: '4 Days Residential',
          icon: '✨',
        },
        {
          id: 'samyama',
          name: 'Samyama',
          shortName: 'Samyama',
          description: 'An intense 8-day silence program providing the experience of unallocated consciousness and deepest meditative absorption.',
          category: 'advanced',
          transmitsPractices: ['Samyama Sadhana'],
          prerequisites: ['inner_engineering', 'bhava_spandana', 'shoonya_intensive'],
          typicalLocations: ['Isha Yoga Center, Coimbatore'],
          duration: '8 Days Residential in Silence',
          icon: '🏔️',
        },
      ];

  const mandala = apiData?.mandala || null;
  const seva = Array.isArray(apiData?.seva) ? apiData.seva : [];
  const registrations = Array.isArray(apiData?.registrations) ? apiData.registrations : [];

  return {
    user: normalizedUser,
    events,
    programs,
    officialPrograms,
    registrations,
    mandala,
    seva,
  };
}
