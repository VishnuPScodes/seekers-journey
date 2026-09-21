// Synthetic Seeker Cohort Generator
// Generates 2,000 realistic synthetic practitioners across 7 authentic Isha personas
// with longitudinal event-level data (SadhanaLogs, UserPrograms, Mandalas, JourneyEvents, Seva)

try {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
} catch (_) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SadhanaLog = require('../models/SadhanaLog');
const JourneyEvent = require('../models/JourneyEvent');
const UserProgram = require('../models/UserProgram');
const Mandala = require('../models/Mandala');
const VolunteeringEvent = require('../models/VolunteeringEvent');
const { OFFICIAL_PROGRAMS, VOLUNTEERING_PATHWAYS, SYNTHETIC_PERSONAS } = require('../config/ishaReferenceData');

const CITIES = [
  { city: 'Bengaluru', region: 'Karnataka, India' },
  { city: 'Coimbatore', region: 'Tamil Nadu, India' },
  { city: 'Chennai', region: 'Tamil Nadu, India' },
  { city: 'Hyderabad', region: 'Telangana, India' },
  { city: 'Mumbai', region: 'Maharashtra, India' },
  { city: 'Delhi NCR', region: 'Delhi, India' },
  { city: 'Pune', region: 'Maharashtra, India' },
  { city: 'Kochi', region: 'Kerala, India' },
  { city: 'San Francisco', region: 'California, USA' },
  { city: 'London', region: 'UK' },
  { city: 'Singapore', region: 'Singapore' },
  { city: 'Sydney', region: 'Australia' },
];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Bhavna', 'Chetan', 'Deepa', 'Dev', 'Divya', 'Gautam',
  'Ishaan', 'Kavita', 'Madhav', 'Meera', 'Nikhil', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Rhea',
  'Rohan', 'Sakshi', 'Sanjay', 'Shreya', 'Siddharth', 'Sneha', 'Tanvi', 'Varun', 'Vidya', 'Vikram',
  'Elena', 'Marcus', 'Sophia', 'Lucas', 'Maya', 'Gabriel', 'Chloe', 'Julian', 'Amara', 'Liam'
];

const LAST_NAMES = [
  'Sharma', 'Iyer', 'Patel', 'Reddy', 'Verma', 'Nair', 'Menon', 'Kulkarni', 'Deshmukh', 'Joshi',
  'Rao', 'Bhat', 'Gupta', 'Singh', 'Chopra', 'Mukherjee', 'Pillai', 'Hegde', 'Shenoy', 'Bisht',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans', 'Thomas', 'Roberts'
];

const DISCOVERY_STORIES = [
  { channel: 'YouTube Video Discourse', attraction: 'Sadhguru’s utter clarity, razor-sharp logic, and refusal to impose dogmatic beliefs.', motivation: 'Relief from chronic mental chatter and a deep search for conscious clarity.' },
  { channel: 'Book (Inner Engineering / Karma)', attraction: 'The scientific, practical explanation of human mechanics without religious dogma.', motivation: 'Overcoming inner resistance and taking charge of my own destiny.' },
  { channel: 'Friend / Family Recommendation', attraction: 'Seeing the palpable calm, joyful balance, and transformation in my friend after Inner Engineering.', motivation: 'Seeking genuine tools for inner balance amidst demanding work and life.' },
  { channel: 'Podcast / Interview', attraction: 'The uncompromising perspective on life, death, and human potential.', motivation: 'Exploring deep spiritual possibilities beyond intellectual concepts.' },
];

const REFLECTIONS_POOL = [
  'Deep stillness during the shambhavi bhandas this morning. Felt completely centered before sunrise.',
  'Felt a noticeable wave of warmth and pranic circulation during Surya Kriya.',
  'A bit of restlessness initially, but watching the breath brought a deep, gentle quietude.',
  'The morning air was cool and still. Immense gratitude for this practice and the master’s grace.',
  'Noticeable shift in mental clarity throughout the workday after completing sadhana at 5:45 AM.',
  'Felt light and joyful throughout the day. Sukha Kriya harmonized my breath completely.',
  'Practicing after a long travel week. The system quickly re-aligned and re-charged.',
];

async function generateCohort(totalUsers = 2000) {
  console.log(`\n🌱 Starting Synthetic Seeker Cohort Generation (${totalUsers} Seekers)...`);

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is missing in environment variables');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Pre-hash a standard password for demo performance
  const defaultHashedPassword = await bcrypt.hash('password123', 10);

  // 1. Clean existing synthetic users only (never touch real accounts)
  console.log('🧹 Purging previous synthetic data...');
  const existingSynth = await User.find({ isSynthetic: true }).select('_id');
  const synthIds = existingSynth.map(u => u._id);
  if (synthIds.length > 0) {
    await SadhanaLog.deleteMany({ userId: { $in: synthIds } });
    await JourneyEvent.deleteMany({ userId: { $in: synthIds } });
    await UserProgram.deleteMany({ userId: { $in: synthIds } });
    await Mandala.deleteMany({ userId: { $in: synthIds } });
    await VolunteeringEvent.deleteMany({ userId: { $in: synthIds } });
    await User.deleteMany({ _id: { $in: synthIds } });
    console.log(`Deleted ${synthIds.length} old synthetic records.`);
  }

  // Persona Distribution counts for 2,000 users
  // A: 300, B: 400, C: 250, D: 250, E: 200, F: 300, G: 300 = 2000
  const personaDistribution = [
    { personaId: 'A', count: 300 },
    { personaId: 'B', count: 400 },
    { personaId: 'C', count: 250 },
    { personaId: 'D', count: 250 },
    { personaId: 'E', count: 200 },
    { personaId: 'F', count: 300 },
    { personaId: 'G', count: 300 },
  ];

  const now = new Date();
  const createdUsers = [];
  const allLogs = [];
  const allJourneyEvents = [];
  const allPrograms = [];
  const allMandalas = [];
  const allSeva = [];

  let userCounter = 1;

  for (const { personaId, count } of personaDistribution) {
    const personaMeta = SYNTHETIC_PERSONAS.find(p => p.id === personaId);

    for (let i = 0; i < count; i++) {
      const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const loc = CITIES[Math.floor(Math.random() * CITIES.length)];
      const disc = DISCOVERY_STORIES[Math.floor(Math.random() * DISCOVERY_STORIES.length)];

      const yearsBack = personaMeta.yearsOnPath + (Math.random() * 0.4 - 0.2);
      const joinDate = new Date(now.getTime() - yearsBack * 365.25 * 86400000);
      const discoveryDate = new Date(joinDate.getTime() - (60 + Math.random() * 180) * 86400000);

      const userId = new mongoose.Types.ObjectId();
      const email = `seeker_${personaId.toLowerCase()}_${userCounter}@synthetic.isha.demo`;

      // Base user record
      const practiceConfig = personaMeta.practices.map(pName => ({
        name: pName,
        dailyTarget: pName.includes('Shambhavi') ? 2 : 1,
        category: pName.includes('Kriya') ? 'Kriya' : pName.includes('Meditation') ? 'Meditation' : 'Hatha Yoga',
        isCustom: false,
      }));

      const cumulativeScore = Math.floor(personaMeta.consistency * yearsBack * 365 * 25);
      const earnedLevel = Math.min(108, Math.max(1, Math.floor(cumulativeScore / 100) + 1));

      const userDoc = {
        _id: userId,
        name: `${fName} ${lName}`,
        email,
        password: defaultHashedPassword,
        city: loc.city,
        region: loc.region,
        discoveryDate,
        discoveryChannel: disc.channel,
        firstAttraction: disc.attraction,
        initialMotivation: disc.motivation,
        originStoryText: `Encountered Sadhguru through ${disc.channel}. Attracted by ${disc.attraction}.`,
        cohortPersona: personaId,
        journeyStartDate: joinDate,
        isSynthetic: true,
        selectedPractices: personaMeta.practices,
        practiceConfig,
        practicesSelected: true,
        totalCumulativeScore: cumulativeScore,
        currentLevel: earnedLevel,
        pradakshinaCount: Math.floor(Math.random() * 50) + 5,
        lastActivityDate: new Date(now.getTime() - Math.random() * 86400000 * 2),
        mandalaStatus: {
          active: personaMeta.activeMandala,
          practiceName: 'Shambhavi Mahamudra',
          targetDays: 40,
          currentDay: personaMeta.activeMandala ? Math.floor(Math.random() * 30) + 5 : 40,
          completedDays: personaMeta.activeMandala ? Math.floor(Math.random() * 25) + 5 : 40,
          startDate: new Date(now.getTime() - 25 * 86400000),
          lastCompletedDate: now.toISOString().split('T')[0],
        },
        createdAt: joinDate,
        updatedAt: now,
      };
      createdUsers.push(userDoc);

      // ── 1. Programs Completed ──
      personaMeta.programs.forEach((progId, pIdx) => {
        const progMeta = OFFICIAL_PROGRAMS.find(p => p.id === progId);
        if (progMeta) {
          const completionDate = new Date(joinDate.getTime() + (pIdx * 240 + 30) * 86400000);
          if (completionDate <= now) {
            allPrograms.push({
              userId,
              programId: progId,
              programName: progMeta.name,
              status: 'completed',
              completionDate,
              location: loc.city.includes('India') ? 'Isha Yoga Center, Coimbatore' : loc.city,
              reflection: `Attending ${progMeta.name} was a watershed moment in my spiritual evolution.`,
              transmitsPractices: progMeta.transmitsPractices || [],
            });

            // Journey event for program
            allJourneyEvents.push({
              userId,
              type: 'auto',
              category: 'program',
              title: `Completed ${progMeta.name}`,
              description: `Attained experiential initiation at ${progMeta.name}.`,
              date: completionDate,
              icon: progMeta.icon || '🏛️',
            });
          }
        }
      });

      // ── 2. Origin & Initiation Journey Events ──
      allJourneyEvents.push({
        userId,
        type: 'user',
        category: 'start',
        title: `First Heard About Sadhguru`,
        description: `Discovered discourse through ${disc.channel}.`,
        date: discoveryDate,
        icon: '🌱',
      });

      allJourneyEvents.push({
        userId,
        type: 'auto',
        category: 'sadhana',
        title: `Initiated into Shambhavi Mahamudra`,
        description: `Received the sacred transmission of the 21-minute kriya.`,
        date: new Date(joinDate.getTime() + 7 * 86400000),
        icon: '🪷',
      });

      // ── 3. Mandala Records ──
      const mandalaDays = [];
      for (let d = 1; d <= 40; d++) {
        const isDone = Math.random() < personaMeta.consistency;
        mandalaDays.push({
          dayNumber: d,
          status: isDone ? 'completed' : 'missed',
          completedSessions: isDone ? 2 : 0,
          targetSessionsPerDay: 2,
          timeOfDay: 'morning',
          reflection: d % 10 === 0 ? 'Felt tremendous stillness and vitality.' : '',
        });
      }

      allMandalas.push({
        userId,
        practiceName: 'Shambhavi Mahamudra',
        title: '40-Day Initiation Mandala',
        totalDays: 40,
        currentDay: personaMeta.activeMandala ? 25 : 40,
        startDate: new Date(joinDate.getTime() + 10 * 86400000),
        status: personaMeta.activeMandala ? 'active' : 'completed',
        consistencyPercentage: Math.round(personaMeta.consistency * 100),
        completedDaysCount: Math.round(40 * personaMeta.consistency),
        days: mandalaDays,
        completionReflection: 'Completing the mandala established an anchor of stability in my everyday life.',
      });

      if (!personaMeta.activeMandala) {
        allJourneyEvents.push({
          userId,
          type: 'auto',
          category: 'milestone',
          title: 'Completed 40-Day Mandala',
          description: 'Successfully established Shambhavi Mahamudra with twice-daily sadhana.',
          date: new Date(joinDate.getTime() + 50 * 86400000),
          icon: '✨',
        });
      }

      // ── 4. Seva / Volunteering Events ──
      if (personaMeta.volunteeringCount > 0) {
        const sevaPath = VOLUNTEERING_PATHWAYS[Math.floor(Math.random() * VOLUNTEERING_PATHWAYS.length)];
        const sevaDate = new Date(joinDate.getTime() + 180 * 86400000);
        if (sevaDate <= now) {
          allSeva.push({
            userId,
            activityType: sevaPath.id,
            title: sevaPath.name,
            location: sevaPath.location,
            startDate: sevaDate,
            durationHours: 12,
            reflection: 'Experiencing the beauty of offering action with zero expectation of return.',
          });

          allJourneyEvents.push({
            userId,
            type: 'user',
            category: 'seva',
            title: `Volunteered at ${sevaPath.name}`,
            description: `Offered selfless seva at ${sevaPath.location}.`,
            date: sevaDate,
            icon: sevaPath.icon || '🙏',
          });
        }
      }

      // ── 5. Detailed Daily SadhanaLogs (Last 90 Days for Synthetic Cohort) ──
      // To keep DB performance blazing fast, generate 90 continuous days per synthetic user
      const logDays = Math.min(90, Math.floor(yearsBack * 365));
      for (let dayOffset = 0; dayOffset < logDays; dayOffset++) {
        const logDateObj = new Date(now.getTime() - dayOffset * 86400000);
        const dateStr = logDateObj.toISOString().split('T')[0];

        const didPractice = Math.random() < personaMeta.consistency;
        if (!didPractice) continue; // Missed day

        const practicesScored = personaMeta.practices.map(pName => {
          // Morning adherence is higher than evening adherence (87% morning vs 41% evening)
          const isMorning = Math.random() < 0.85;
          const count = pName.includes('Shambhavi') ? (Math.random() < 0.7 ? 2 : 1) : 1;
          return {
            name: pName,
            count,
            score: count >= 2 ? 25 : 10,
            timeOfDay: isMorning ? 'morning' : 'evening',
            sessionTime: isMorning ? '05:45' : '18:15',
            durationMinutes: pName.includes('Shambhavi') ? 21 : 30,
          };
        });

        const totalScore = practicesScored.reduce((s, p) => s + p.score, 0);
        const focusPct = Math.floor(65 + Math.random() * 30);
        const awarenessPct = Math.floor(60 + Math.random() * 32);

        allLogs.push({
          userId,
          date: dateStr,
          practices: practicesScored,
          totalScore,
          isPerfectDay: true,
          source: 'tracker',
          focusPercentage: focusPct,
          awarenessPercentage: awarenessPct,
          guruPujaAttended: Math.random() < 0.35,
          pradakshinaCount: Math.random() < 0.2 ? 3 : 0,
        });
      }

      userCounter++;
    }
  }

  // ── 6. Batch Insert in Chunks ──
  console.log(`📥 Inserting ${createdUsers.length} Users...`);
  await User.insertMany(createdUsers, { ordered: false });

  console.log(`📥 Inserting ${allPrograms.length} User Programs...`);
  await UserProgram.insertMany(allPrograms, { ordered: false });

  console.log(`📥 Inserting ${allMandalas.length} Mandalas...`);
  await Mandala.insertMany(allMandalas, { ordered: false });

  console.log(`📥 Inserting ${allSeva.length} Volunteering Events...`);
  await VolunteeringEvent.insertMany(allSeva, { ordered: false });

  console.log(`📥 Inserting ${allJourneyEvents.length} Journey Events...`);
  await JourneyEvent.insertMany(allJourneyEvents, { ordered: false });

  console.log(`📥 Inserting ${allLogs.length} Sadhana Logs in chunks...`);
  const CHUNK_SIZE = 10000;
  for (let c = 0; c < allLogs.length; c += CHUNK_SIZE) {
    const chunk = allLogs.slice(c, c + CHUNK_SIZE);
    await SadhanaLog.insertMany(chunk, { ordered: false });
    process.stdout.write(`   Batch ${Math.floor(c / CHUNK_SIZE) + 1}/${Math.ceil(allLogs.length / CHUNK_SIZE)} inserted\r`);
  }

  // ── 7. Seed Demo Active User (`diksh@gmail.com`) with Full 365-day Longitudinal Data ──
  await seedActiveDemoUser(defaultHashedPassword);

  console.log('\n\n✅ 2,000 Synthetic Seekers Cohort & Demo Seeker Successfully Generated! 🙏');
  return { usersCount: createdUsers.length, logsCount: allLogs.length };
}

// Seed or update the active user with a rich 4.5-year spiritual trajectory (Persona B/E)
async function seedActiveDemoUser(defaultHashedPassword) {
  const email = 'diksh@gmail.com';
  console.log(`\n💎 Enriching active demo seeker (${email})...`);

  let user = await User.findOne({ email });
  const userId = user ? user._id : new mongoose.Types.ObjectId();
  const now = new Date();
  const joinDate = new Date(now.getTime() - 4.5 * 365.25 * 86400000); // 4.5 years ago (2022)
  const discoveryDate = new Date(joinDate.getTime() - 90 * 86400000);

  const practiceConfig = [
    { name: 'Shambhavi Mahamudra', dailyTarget: 2, category: 'Kriya', isCustom: false },
    { name: 'Surya Kriya', dailyTarget: 1, category: 'Hatha Yoga', isCustom: false },
    { name: 'Sukha Kriya', dailyTarget: 2, category: 'Pranayama', isCustom: false },
    { name: 'Surya Namaskar', dailyTarget: 12, category: 'Hatha Yoga', isCustom: true },
  ];

  const updateFields = {
    name: user?.name || 'Dikshant Bisht',
    email,
    password: user?.password || defaultHashedPassword,
    city: 'Bengaluru',
    region: 'Karnataka, India',
    discoveryDate,
    discoveryChannel: 'YouTube Video Discourse (Death & Karma series)',
    firstAttraction: 'Uncompromising clarity and razor-sharp logic of Sadhguru on how the human mechanism functions.',
    initialMotivation: 'Seeking freedom from incessant psychological drama and yearning for experiential spiritual depth.',
    originStoryText: 'First heard Sadhguru during a demanding career transition in late 2021. The profound logic of Inner Engineering dismantled years of intellectual conditioning, opening the doorway to daily sadhana.',
    cohortPersona: 'B',
    journeyStartDate: joinDate,
    selectedPractices: practiceConfig.map(p => p.name),
    practiceConfig,
    practicesSelected: true,
    totalCumulativeScore: 4850,
    currentLevel: 49,
    pradakshinaCount: 42,
    lastActivityDate: now,
    mandalaStatus: {
      active: true,
      practiceName: 'Shambhavi Mahamudra',
      targetDays: 40,
      currentDay: 28,
      completedDays: 26,
      startDate: new Date(now.getTime() - 28 * 86400000),
      lastCompletedDate: now.toISOString().split('T')[0],
    },
  };

  user = await User.findByIdAndUpdate(userId, updateFields, { upsert: true, new: true, setDefaultsOnInsert: true });

  // Clean old logs & records for this user to make room for clean 365-day dataset
  await SadhanaLog.deleteMany({ userId });
  await JourneyEvent.deleteMany({ userId });
  await UserProgram.deleteMany({ userId });
  await Mandala.deleteMany({ userId });
  await VolunteeringEvent.deleteMany({ userId });

  // 1. Programs Completed
  await UserProgram.insertMany([
    {
      userId,
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(joinDate.getTime() + 14 * 86400000),
      location: 'Bengaluru, India',
      reflection: 'The initiation into Shambhavi Mahamudra was the first time I experienced life beyond my thoughts and emotions.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      userId,
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(joinDate.getTime() + 380 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'An overwhelming explosion of devotion at Spanda Hall. Boundaries melted effortlessly.',
    },
    {
      userId,
      programId: 'shoonya_intensive',
      programName: 'Shoonya Intensive',
      status: 'completed',
      completionDate: new Date(joinDate.getTime() + 720 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Experiencing the non-doing of Shoonya meditation in conscious awareness.',
      transmitsPractices: ['Shoonya Meditation', 'Shakti Chalana Kriya'],
    },
    {
      userId,
      programId: 'surya_kriya',
      programName: 'Surya Kriya',
      status: 'completed',
      completionDate: new Date(joinDate.getTime() + 180 * 86400000),
      location: 'Isha Life Center, Bengaluru',
      reflection: 'Learning the 21 geometric postures to balance the pingala and ida nadis.',
      transmitsPractices: ['Surya Kriya'],
    },
  ]);

  // 2. Journey Events Chronology (Wave Timeline Milestones)
  await JourneyEvent.insertMany([
    {
      userId,
      type: 'user',
      category: 'start',
      title: 'First Encounter with Sadhguru',
      description: 'Listened to a discourse on conscious living late at night; felt a profound resonance.',
      date: discoveryDate,
      icon: '🌱',
    },
    {
      userId,
      type: 'auto',
      category: 'program',
      title: 'Completed Inner Engineering 7-Day',
      description: 'Received transmission of Shambhavi Mahamudra Kriya in Bengaluru.',
      date: new Date(joinDate.getTime() + 14 * 86400000),
      icon: '🏛️',
    },
    {
      userId,
      type: 'auto',
      category: 'sadhana',
      title: 'Initiated into Shambhavi Mahamudra',
      description: 'Committed to the 40-day twice-daily mandala.',
      date: new Date(joinDate.getTime() + 15 * 86400000),
      icon: '🪷',
    },
    {
      userId,
      type: 'auto',
      category: 'milestone',
      title: 'Completed 40-Day Initiation Mandala',
      description: 'Completed 40 unbroken days of twice-daily sadhana before sunrise.',
      date: new Date(joinDate.getTime() + 55 * 86400000),
      icon: '✨',
    },
    {
      userId,
      type: 'user',
      category: 'personal',
      title: 'First Pilgrimage to Dhyanalinga',
      description: 'Sat in the profound silence of Dhyanalinga dome at sunset; completely unburdened.',
      date: new Date(joinDate.getTime() + 180 * 86400000),
      icon: '🏔️',
    },
    {
      userId,
      type: 'auto',
      category: 'sadhana',
      title: 'Initiated into Surya Kriya',
      description: 'Learned the 21-step solar flow to activate the sun within.',
      date: new Date(joinDate.getTime() + 210 * 86400000),
      icon: '☀️',
    },
    {
      userId,
      type: 'user',
      category: 'seva',
      title: 'Volunteered for Mahashivratri Seva',
      description: 'Served water and food to thousands of devotees through the night under the Adiyogi.',
      date: new Date(joinDate.getTime() + 420 * 86400000),
      icon: '🌙',
    },
    {
      userId,
      type: 'auto',
      category: 'program',
      title: 'Completed Bhava Spandana Program (BSP)',
      description: 'Experiencing boundless devotion at the Spanda Hall in Coimbatore.',
      date: new Date(joinDate.getTime() + 520 * 86400000),
      icon: '🌸',
    },
    {
      userId,
      type: 'auto',
      category: 'program',
      title: 'Completed Shoonya Intensive',
      description: 'Four days in silence mastering Shakti Chalana Kriya and Shoonya meditation.',
      date: new Date(joinDate.getTime() + 850 * 86400000),
      icon: '✨',
    },
    {
      userId,
      type: 'auto',
      category: 'milestone',
      title: 'Ascended to Level 45 Milestone',
      description: 'Attained Level 45 with over 4,500 cumulative sadhana points.',
      date: new Date(now.getTime() - 40 * 86400000),
      icon: '🏔️',
    },
    {
      userId,
      type: 'auto',
      category: 'sadhana',
      title: 'Initiated in Surya Namaskar 12 Cycles',
      description: 'Added 12 daily dawn cycles to the sadhana routine.',
      date: new Date(now.getTime() - 10 * 86400000),
      icon: '🪷',
    },
  ]);

  // 3. 40-Day Mandala Record
  const activeMandalaDays = [];
  for (let d = 1; d <= 40; d++) {
    const isCompleted = d <= 26;
    const isPartial = d === 27;
    activeMandalaDays.push({
      dayNumber: d,
      date: new Date(now.getTime() - (28 - d) * 86400000).toISOString().split('T')[0],
      status: isCompleted ? 'completed' : isPartial ? 'partial' : d <= 28 ? 'missed' : 'upcoming',
      completedSessions: isCompleted ? 2 : isPartial ? 1 : 0,
      targetSessionsPerDay: 2,
      timeOfDay: 'morning',
      reflection: d === 1 ? 'Began with great reverence.' : d === 21 ? 'Midway mandala check-in — energy is vibrant.' : '',
    });
  }

  await Mandala.create({
    userId,
    practiceName: 'Shambhavi Mahamudra',
    title: 'Autumn 40-Day Re-Commitment Mandala',
    totalDays: 40,
    currentDay: 28,
    startDate: new Date(now.getTime() - 28 * 86400000),
    status: 'active',
    consistencyPercentage: 93,
    completedDaysCount: 26,
    days: activeMandalaDays,
  });

  // 4. Volunteering Record
  await VolunteeringEvent.insertMany([
    {
      userId,
      activityType: 'mahashivratri_seva',
      title: 'Mahashivratri All-Night Seva',
      location: 'Adiyogi, Coimbatore Ashram',
      startDate: new Date(now.getTime() - 180 * 86400000),
      durationHours: 14,
      reflection: 'Staying awake in vibrant stillness while offering water to millions of seekers.',
    },
    {
      userId,
      activityType: 'ashram_seva',
      title: 'Dhyanalinga Dome Care Seva',
      location: 'Isha Yoga Center, Coimbatore',
      startDate: new Date(now.getTime() - 360 * 86400000),
      durationHours: 8,
      reflection: 'Maintaining the silence and sacred geometry inside the dome.',
    },
  ]);

  // 5. Full 365 Days of Sadhana Logs for Deep-Dive Analytics
  const demoLogs = [];
  for (let offset = 0; offset < 365; offset++) {
    const dObj = new Date(now.getTime() - offset * 86400000);
    const dateStr = dObj.toISOString().split('T')[0];

    // High consistency: 89% practiced
    const isPracticed = Math.random() < 0.89;
    if (!isPracticed) continue;

    // Morning adherence is 87%, evening adherence is 41%
    const morningPractice = Math.random() < 0.87;
    const shambhaviCount = morningPractice ? (Math.random() < 0.8 ? 2 : 1) : 1;

    const practices = [
      {
        name: 'Shambhavi Mahamudra',
        count: shambhaviCount,
        score: shambhaviCount >= 2 ? 25 : 10,
        timeOfDay: morningPractice ? 'morning' : 'evening',
        sessionTime: morningPractice ? '05:45' : '18:30',
        durationMinutes: 21,
      },
      {
        name: 'Surya Kriya',
        count: 1,
        score: 10,
        timeOfDay: 'morning',
        sessionTime: '06:15',
        durationMinutes: 30,
      },
      {
        name: 'Sukha Kriya',
        count: 2,
        score: 25,
        timeOfDay: 'morning',
        sessionTime: '06:45',
        durationMinutes: 10,
      },
    ];

    if (offset < 20) {
      // Recent practice includes Surya Namaskar
      practices.push({
        name: 'Surya Namaskar',
        count: 12,
        score: 25,
        timeOfDay: 'morning',
        sessionTime: '06:00',
        durationMinutes: 15,
      });
    }

    const totalScore = practices.reduce((sum, p) => sum + p.score, 0) + 20; // +20 perfect day bonus
    const focusPct = Math.floor(75 + Math.random() * 22);
    const awarenessPct = Math.floor(70 + Math.random() * 26);

    demoLogs.push({
      userId,
      date: dateStr,
      practices,
      totalScore,
      isPerfectDay: true,
      source: offset % 4 === 0 ? 'bubble' : 'tracker',
      focusPercentage: focusPct,
      awarenessPercentage: awarenessPct,
      guruPujaAttended: offset % 3 === 0,
      pradakshinaCount: offset % 7 === 0 ? 3 : 0,
    });
  }

  await SadhanaLog.insertMany(demoLogs, { ordered: false });
  console.log(`✅ Demo Seeker ${email} populated with ${demoLogs.length} days of sadhana history and full journey!`);
}

// Allow direct CLI execution
if (require.main === module) {
  generateCohort(2000)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error generating cohort:', err);
      process.exit(1);
    });
}

module.exports = { generateCohort, seedActiveDemoUser };
