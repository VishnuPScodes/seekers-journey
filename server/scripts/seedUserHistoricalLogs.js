// server/scripts/seedUserHistoricalLogs.js
// Seeds 60 days of authentic daily sadhana logs, JourneyEvent milestones,
// and Mandala progress into MongoDB Atlas for primary seeker accounts and spiritual personas.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const SadhanaLog = require('../models/SadhanaLog');
const JourneyEvent = require('../models/JourneyEvent');
const Mandala = require('../models/Mandala');

const TARGET_USERS = [
  {
    email: 'dikshantbisht10@gmail.com',
    name: 'Dikshant Bisht',
    practices: [
      { name: 'Shambhavi Mahamudra', dailyTarget: 2, category: 'Kriya', desc: 'Inner Engineering core kriya', scorePer: 20 },
      { name: 'Surya Kriya', dailyTarget: 1, category: 'Hatha Yoga', desc: 'Solar activating practice', scorePer: 15 },
      { name: 'AUM Chanting', dailyTarget: 1, category: 'Upayoga', desc: 'Sound resonance & pranayam', scorePer: 10 },
      { name: 'Sukha Kriya', dailyTarget: 1, category: 'Upayoga', desc: 'Nadi balancing breath', scorePer: 5 },
    ],
    pradakshinaCount: 54,
    streakLength: 18,
    consistencyRatio: 0.88,
  },
  {
    email: 'dikshant@gmail.com',
    name: 'Dikshant Bisht',
    practices: [
      { name: 'Shambhavi Mahamudra', dailyTarget: 2, category: 'Kriya', desc: 'Inner Engineering core kriya', scorePer: 20 },
      { name: 'Surya Kriya', dailyTarget: 1, category: 'Hatha Yoga', desc: 'Solar activating practice', scorePer: 15 },
      { name: 'AUM Chanting', dailyTarget: 1, category: 'Upayoga', desc: 'Sound resonance & pranayam', scorePer: 10 },
      { name: 'Sukha Kriya', dailyTarget: 1, category: 'Upayoga', desc: 'Nadi balancing breath', scorePer: 5 },
    ],
    pradakshinaCount: 54,
    streakLength: 18,
    consistencyRatio: 0.88,
  },
  {
    email: 'priya.nair@seekers.journey',
    name: 'Priya Nair',
    practices: [
      { name: 'Shambhavi Mahamudra', dailyTarget: 2, category: 'Kriya', desc: 'Mandala Sadhana', scorePer: 20 },
      { name: 'Nadi Shuddhi', dailyTarget: 1, category: 'Upayoga', desc: 'Breath purification', scorePer: 10 },
      { name: 'Isha Kriya', dailyTarget: 1, category: 'Meditation', desc: 'Guided awareness', scorePer: 15 },
    ],
    pradakshinaCount: 65,
    streakLength: 26,
    consistencyRatio: 0.94,
  },
  {
    email: 'anand.sharma@seekers.journey',
    name: 'Anand Sharma',
    practices: [
      { name: 'Shambhavi Mahamudra', dailyTarget: 2, category: 'Kriya', desc: 'Daily kriya', scorePer: 20 },
      { name: 'Surya Kriya', dailyTarget: 1, category: 'Hatha Yoga', desc: 'Solar energizing', scorePer: 15 },
      { name: 'AUM Chanting', dailyTarget: 1, category: 'Upayoga', desc: 'Sound consecration', scorePer: 10 },
    ],
    pradakshinaCount: 38,
    streakLength: 14,
    consistencyRatio: 0.82,
  },
  {
    email: 'rajesh.menon@seekers.journey',
    name: 'Dr. Rajesh Menon',
    practices: [
      { name: 'Shambhavi Mahamudra', dailyTarget: 2, category: 'Kriya', desc: 'Decade-long discipline', scorePer: 20 },
      { name: 'Shoonya Meditation', dailyTarget: 1, category: 'Advanced', desc: 'Conscious non-doing', scorePer: 25 },
      { name: 'Bhuta Shuddhi', dailyTarget: 1, category: 'Element Purification', desc: 'Daily elemental alignment', scorePer: 20 },
    ],
    pradakshinaCount: 92,
    streakLength: 42,
    consistencyRatio: 0.96,
  },
  {
    email: 'meera.iyer@seekers.journey',
    name: 'Meera Iyer',
    practices: [
      { name: 'Surya Kriya', dailyTarget: 1, category: 'Hatha Yoga', desc: 'Solar energizing', scorePer: 15 },
      { name: 'Simha Kriya', dailyTarget: 1, category: 'Upayoga', desc: 'Immunity & lung capacity', scorePer: 10 },
      { name: 'Devi Vandana', dailyTarget: 1, category: 'Devotion', desc: 'Bhairavi chant & stillness', scorePer: 10 },
    ],
    pradakshinaCount: 36,
    streakLength: 12,
    consistencyRatio: 0.85,
  },
  {
    email: 'vikram.joshi@seekers.journey',
    name: 'Vikram Joshi',
    practices: [
      { name: 'Surya Kriya', dailyTarget: 1, category: 'Hatha Yoga', desc: 'Solar energizing', scorePer: 15 },
      { name: 'Yoga Namaskar', dailyTarget: 1, category: 'Upayoga', desc: 'Spine activation', scorePer: 10 },
      { name: 'Isha Kriya', dailyTarget: 1, category: 'Meditation', desc: 'Guided meditation', scorePer: 10 },
    ],
    pradakshinaCount: 28,
    streakLength: 14,
    consistencyRatio: 0.80,
  }
];

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function seedHistoricalLogs() {
  console.log('🌿 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB Atlas.');

  const now = new Date();
  const todayStr = formatDate(now);

  for (const config of TARGET_USERS) {
    let user = await User.findOne({ email: config.email });
    if (!user) {
      console.log(` User ${config.email} not found, skipping.`);
      continue;
    }

    console.log(`\n───────────────────────────────────────────────────`);
    console.log(`Hydrating historical sadhana records for: ${user.name} (${user.email})`);

    // 1. Update practice configuration & selected practices
    user.selectedPractices = config.practices.map(p => p.name);
    user.practiceConfig = config.practices.map(p => ({
      name: p.name,
      dailyTarget: p.dailyTarget,
      category: p.category,
      desc: p.desc,
      isCustom: false,
    }));
    user.pradakshinaCount = config.pradakshinaCount;
    user.practicesSelected = true;

    // Set journeyStartDate to 60 days ago
    const journeyStartDate = new Date(now);
    journeyStartDate.setDate(now.getDate() - 60);
    user.journeyStartDate = journeyStartDate;

    // 2. Clear old SadhanaLogs for this user
    await SadhanaLog.deleteMany({ userId: user._id });
    console.log(` Cleared previous SadhanaLogs for ${user.email}.`);

    // 3. Generate 60 days of realistic logs
    const daysCount = 60;
    let cumulativeScore = 0;
    const logsToInsert = [];

    for (let offset = daysCount - 1; offset >= 0; offset--) {
      const logDate = new Date(now);
      logDate.setDate(now.getDate() - offset);
      const dateStr = formatDate(logDate);

      // Determine if practice was performed on this day
      // Ensure the streak period leading up to today is 100% active
      const isWithinStreak = offset < config.streakLength;
      const isPracticing = isWithinStreak || Math.random() < config.consistencyRatio;

      if (!isPracticing) {
        // Rest or travel day: empty log
        logsToInsert.push({
          userId: user._id,
          date: dateStr,
          practices: config.practices.map(p => ({
            name: p.name,
            count: 0,
            score: 0,
            timeOfDay: 'morning',
            sessionTime: '06:00',
            durationMinutes: 21,
          })),
          totalScore: 0,
          isPerfectDay: false,
          pradakshinaCount: 0,
          source: 'bubble',
        });
        continue;
      }

      // Generate practice sessions
      let dayScore = 0;
      let completedAll = true;
      const practiceEntries = [];

      for (const p of config.practices) {
        // High likelihood of meeting target
        let cnt = 0;
        if (isWithinStreak) {
          cnt = p.dailyTarget;
        } else {
          cnt = Math.random() > 0.15 ? p.dailyTarget : (Math.random() > 0.5 ? 1 : 0);
        }

        if (cnt < p.dailyTarget) completedAll = false;
        const practiceScore = cnt * p.scorePer;
        dayScore += practiceScore;

        practiceEntries.push({
          name: p.name,
          count: cnt,
          score: practiceScore,
          timeOfDay: cnt > 1 ? 'evening' : 'morning',
          sessionTime: cnt > 1 ? '18:15' : '05:45',
          durationMinutes: 21 * Math.max(1, cnt),
        });
      }

      cumulativeScore += dayScore;

      logsToInsert.push({
        userId: user._id,
        date: dateStr,
        practices: practiceEntries,
        totalScore: dayScore,
        isPerfectDay: completedAll && dayScore > 0,
        pradakshinaCount: isWithinStreak ? Math.floor(Math.random() * 2) + 1 : 0,
        source: 'bubble',
      });
    }

    await SadhanaLog.insertMany(logsToInsert);
    console.log(` Inserted ${logsToInsert.length} daily SadhanaLogs (Cumulative Score: ${cumulativeScore}).`);

    // 4. Update user's score and level
    user.totalCumulativeScore = cumulativeScore;
    user.currentLevel = Math.max(1, Math.min(108, Math.floor(cumulativeScore / 100) + 1));
    await user.save();
    console.log(` Updated ${user.name}: Level ${user.currentLevel}, Total Score: ${user.totalCumulativeScore}.`);

    // 5. Seed JourneyEvents / Milestones
    await JourneyEvent.deleteMany({ userId: user._id });

    const milestoneDates = [
      { daysAgo: 60, title: 'Sacred Journey Began', desc: 'Inaugurated the sacred daily sadhana path in conscious stillness.', cat: 'start', icon: '🪷' },
      { daysAgo: 53, title: 'First Perfect Sadhana Day', desc: 'Completed 100% of all daily consecrated practices before twilight.', cat: 'milestone', icon: '✨' },
      { daysAgo: 45, title: '7-Day Continuous Flame', desc: '7 unbroken consecutive days of morning practice during Brahma Muhurta.', cat: 'milestone', icon: '🔥' },
      { daysAgo: 32, title: '21-Day Neural Rewiring', desc: 'Completed 21 continuous days. Systemic ease and clarity palpably deepen.', cat: 'milestone', icon: '🌟' },
      { daysAgo: 18, title: 'Level 10 Ascension Milestone', desc: 'Ascended beyond Level 10 through steadfast devotion to the inner flame.', cat: 'milestone', icon: '🏔️' },
      { daysAgo: 7, title: 'Brahma Muhurta Deepening', desc: 'Consecrated dawn practice at 5:15 AM with deep breath retention.', cat: 'sadhana', icon: '🌅' },
    ];

    const eventsToInsert = milestoneDates.map(m => {
      const evDate = new Date(now);
      evDate.setDate(now.getDate() - m.daysAgo);
      return {
        userId: user._id,
        type: 'auto',
        category: m.cat,
        title: m.title,
        description: m.desc,
        date: evDate,
        icon: m.icon,
        isPrivate: false,
        metadata: { score: 100, streak: 60 - m.daysAgo },
      };
    });

    await JourneyEvent.insertMany(eventsToInsert);
    console.log(` Inserted ${eventsToInsert.length} JourneyEvent milestones.`);

    // 6. Seed active Mandala record
    await Mandala.deleteMany({ userId: user._id });
    const mandalaStartDate = new Date(now);
    mandalaStartDate.setDate(now.getDate() - 25);

    const mandalaDays = [];
    for (let d = 1; d <= 40; d++) {
      const dayDate = new Date(mandalaStartDate);
      dayDate.setDate(mandalaStartDate.getDate() + (d - 1));
      const status = d <= 25 ? 'completed' : 'upcoming';
      mandalaDays.push({
        dayNumber: d,
        date: formatDate(dayDate),
        status,
        completedSessions: d <= 25 ? 2 : 0,
        targetSessionsPerDay: 2,
        reflection: d <= 25 ? 'Deep stillness and breath awareness.' : '',
        timeOfDay: 'morning',
      });
    }

    const mandala = new Mandala({
      userId: user._id,
      practiceName: 'Shambhavi Mahamudra',
      title: '40-Day Initiation Mandala',
      totalDays: 40,
      currentDay: 26,
      startDate: mandalaStartDate,
      status: 'active',
      consistencyPercentage: 96,
      completedDaysCount: 25,
      days: mandalaDays,
    });
    await mandala.save();
    console.log(` Consecrated active 40-Day Mandala for ${user.name}.`);
  }

  console.log('\n All seeker accounts hydrated with authentic historical sadhana records.');
  await mongoose.disconnect();
}

seedHistoricalLogs().catch(err => {
  console.error(' Seeding failed:', err);
  process.exit(1);
});
