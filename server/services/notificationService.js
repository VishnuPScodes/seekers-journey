const AdminNotification = require('../models/AdminNotification');
const User = require('../models/User');
const SadhanaLog = require('../models/SadhanaLog');
const UserProgram = require('../models/UserProgram');

// Target level milestones up to 108
const LEVEL_MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 108];

// Target streak milestones
const STREAK_MILESTONES = [7, 20, 30, 40, 50, 60, 90, 100];

/**
 * Safely create a notification with deduplication.
 * If dedupKey exists, it skips creation without throwing error.
 */
async function createNotification({ userId, userName, userEmail, type, title, message, metadata = {}, dedupKey = null }) {
  try {
    if (dedupKey) {
      const existing = await AdminNotification.findOne({ dedupKey });
      if (existing) return existing;
    }

    const notification = new AdminNotification({
      userId,
      userName: userName || 'Seeker',
      userEmail: userEmail || 'seeker@sadhana.io',
      type,
      title,
      message,
      metadata,
      dedupKey,
    });

    await notification.save();
    return notification;
  } catch (err) {
    // Duplicate key error (code 11000) is safely ignored
    if (err.code === 11000) {
      return null;
    }
    console.error('Error creating admin notification:', err.message);
    return null;
  }
}

/**
 * Trigger: Program Interest
 */
async function notifyProgramInterest(user, programName, status = 'interested') {
  if (!user) return;
  const isInterest = status === 'interested' || status === 'registered';
  const title = isInterest ? `🏛️ Program Interest: ${programName}` : `🏛️ Program Action: ${programName}`;
  const message = `${user.name} (${user.email}) expressed interest in ${programName}.`;
  const dedupKey = `program_interest:${user._id}:${programName.toLowerCase().replace(/\s+/g, '_')}`;

  return createNotification({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    type: 'program_interest',
    title,
    message,
    metadata: { programName, status },
    dedupKey,
  });
}

/**
 * Trigger: Inner Engineering Completed
 */
async function notifyInnerEngineeringCompleted(user) {
  if (!user) return;
  const dedupKey = `inner_engineering_completed:${user._id}`;
  return createNotification({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    type: 'inner_engineering_completed',
    title: '✨ Inner Engineering Completed',
    message: `${user.name} successfully completed Inner Engineering!`,
    metadata: { programName: 'Inner Engineering' },
    dedupKey,
  });
}

/**
 * Trigger: Shambhavi Added to Practice List
 */
async function notifyShambhaviAdded(user) {
  if (!user) return;
  const dedupKey = `shambhavi_added:${user._id}`;
  return createNotification({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    type: 'shambhavi_added',
    title: '🪷 Shambhavi Mahamudra Initiated',
    message: `${user.name} added Shambhavi Mahamudra to their practice list.`,
    metadata: { practiceName: 'Shambhavi Mahamudra' },
    dedupKey,
  });
}

/**
 * Trigger: Level Milestone
 */
async function notifyLevelMilestone(user, level) {
  if (!user || !level) return;
  if (!LEVEL_MILESTONES.includes(level)) return;

  const dedupKey = `level_milestone:${user._id}:${level}`;
  return createNotification({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    type: 'level_milestone',
    title: `🏔️ Reached Level ${level}`,
    message: `${user.name} ascended to Level ${level} on the sacred journey!`,
    metadata: { level },
    dedupKey,
  });
}

/**
 * Trigger: Streak Milestone
 */
async function notifyStreakMilestone(user, streakDays) {
  if (!user || !streakDays) return;
  if (!STREAK_MILESTONES.includes(streakDays)) return;

  const dedupKey = `streak_milestone:${user._id}:${streakDays}`;
  return createNotification({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    type: 'streak_milestone',
    title: `🔥 ${streakDays}-Day Sadhana Streak`,
    message: `${user.name} achieved a continuous ${streakDays}-day sadhana streak!`,
    metadata: { streakDays },
    dedupKey,
  });
}

/**
 * Scanner: Evaluates all database records and generates missing notifications
 * Runs idempotently in milliseconds using in-memory Set and bulk operations.
 */
async function syncAdminNotifications() {
  try {
    const users = await User.find({}).lean();
    if (users.length === 0) return;

    // 1. Fetch all existing dedupKeys in ONE single fast query
    const existingDocs = await AdminNotification.find({ dedupKey: { $ne: null } })
      .select('dedupKey')
      .lean();
    const existingKeys = new Set(existingDocs.map(d => d.dedupKey));

    const now = new Date();
    const toInsert = [];

    const addNotif = (data) => {
      if (data.dedupKey && existingKeys.has(data.dedupKey)) return;
      if (data.dedupKey) existingKeys.add(data.dedupKey);
      toInsert.push({
        userId: data.userId,
        userName: data.userName || 'Seeker',
        userEmail: data.userEmail || 'seeker@sadhana.io',
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        dedupKey: data.dedupKey,
        isRead: false,
        createdAt: now,
      });
    };

    for (const u of users) {
      const level = u.currentLevel || 1;

      // Level Milestones
      for (const milestone of LEVEL_MILESTONES) {
        if (level >= milestone) {
          addNotif({
            userId: u._id,
            userName: u.name,
            userEmail: u.email,
            type: 'level_milestone',
            title: `🏔️ Reached Level ${milestone}`,
            message: `${u.name} reached Level ${milestone} on the sacred journey!`,
            metadata: { level: milestone },
            dedupKey: `level_milestone:${u._id}:${milestone}`,
          });
        }
      }

      // Shambhavi Added check
      const practices = (u.selectedPractices || []).map(p => p.toLowerCase());
      const hasShambhavi = practices.some(p => p.includes('shambhavi'));
      if (hasShambhavi) {
        addNotif({
          userId: u._id,
          userName: u.name,
          userEmail: u.email,
          type: 'shambhavi_added',
          title: '🪷 Shambhavi Mahamudra Added',
          message: `${u.name} has Shambhavi Mahamudra in their practice list.`,
          metadata: { practiceName: 'Shambhavi Mahamudra' },
          dedupKey: `shambhavi_added:${u._id}`,
        });
      }

      // Inactive High-Level Seekers
      const lastActive = u.lastActivityDate || u.updatedAt || u.createdAt || now;
      const daysInactive = Math.max(0, Math.floor((now - new Date(lastActive)) / (1000 * 60 * 60 * 24)));

      if (level >= 10 && daysInactive >= 10) {
        const inactiveBucket = Math.floor(daysInactive / 5) * 5;
        addNotif({
          userId: u._id,
          userName: u.name,
          userEmail: u.email,
          type: 'inactive_high_level',
          title: `⚠️ Inactive High-Level Seeker (${daysInactive}d)`,
          message: `${u.name} (Level ${level}) has been inactive for ${daysInactive} days. Recommended for outreach.`,
          metadata: { level, daysInactive },
          dedupKey: `inactive_high_level:${u._id}:${inactiveBucket}d`,
        });
      }
    }

    // Check UserProgram records
    const programs = await UserProgram.find({}).populate('userId', 'name email').lean();
    for (const prog of programs) {
      if (!prog.userId) continue;
      const u = prog.userId;
      const progName = prog.programName || prog.programId || 'Isha Program';

      if (prog.status === 'interested' || prog.status === 'registered') {
        addNotif({
          userId: u._id,
          userName: u.name,
          userEmail: u.email,
          type: 'program_interest',
          title: `🏛️ Program Interest: ${progName}`,
          message: `${u.name} expressed interest in ${progName}.`,
          metadata: { programName: progName, status: prog.status },
          dedupKey: `program_interest:${u._id}:${progName.toLowerCase().replace(/\s+/g, '_')}`,
        });
      }

      if (progName.toLowerCase().includes('inner engineering') && prog.status === 'completed') {
        addNotif({
          userId: u._id,
          userName: u.name,
          userEmail: u.email,
          type: 'inner_engineering_completed',
          title: '✨ Inner Engineering Completed',
          message: `${u.name} completed Inner Engineering!`,
          metadata: { programName: progName },
          dedupKey: `inner_engineering_completed:${u._id}`,
        });
      }
    }

    // Bulk insert all new notifications in 1 fast query
    if (toInsert.length > 0) {
      await AdminNotification.insertMany(toInsert, { ordered: false });
      console.log(`⚡ Inserted ${toInsert.length} new admin notifications in bulk.`);
    }
    // 5. Seed realistic sample notifications if database has fewer than 5 notifications
    const totalNotifs = await AdminNotification.countDocuments({});
    if (totalNotifs < 5 && users.length > 0) {
      const sampleUsers = users.slice(0, 15);
      const sampleEvents = [
        {
          type: 'program_interest',
          title: '🏛️ Program Interest: Bhava Spandana',
          message: `${sampleUsers[0]?.name || 'Sanjay Bhat'} expressed interest in Bhava Spandana Program (BSP).`,
          user: sampleUsers[0] || users[0],
          metadata: { programName: 'Bhava Spandana', status: 'interested' },
        },
        {
          type: 'program_interest',
          title: '🏛️ Program Interest: Shoonya Intensive',
          message: `${sampleUsers[1]?.name || 'Madhav Verma'} expressed interest in Shoonya Intensive & Shakti Chalana Kriya.`,
          user: sampleUsers[1] || users[0],
          metadata: { programName: 'Shoonya Intensive', status: 'interested' },
        },
        {
          type: 'program_interest',
          title: '🏛️ Program Registration: Samyama',
          message: `${sampleUsers[2]?.name || 'Priya Sharma'} registered interest for the upcoming 8-day Samyama Sadhana.`,
          user: sampleUsers[2] || users[0],
          metadata: { programName: 'Samyama', status: 'registered' },
        },
        {
          type: 'level_milestone',
          title: '🏔️ Reached Level 10',
          message: `${sampleUsers[3]?.name || 'Rahul Nair'} ascended to Level 10 on the sacred journey!`,
          user: sampleUsers[3] || users[0],
          metadata: { level: 10 },
        },
        {
          type: 'level_milestone',
          title: '🏔️ Reached Level 30',
          message: `${sampleUsers[4]?.name || 'Aditi Rao'} ascended to Level 30 — deep commitment proven!`,
          user: sampleUsers[4] || users[0],
          metadata: { level: 30 },
        },
        {
          type: 'level_milestone',
          title: '🏔️ Reached Level 50',
          message: `${sampleUsers[5]?.name || 'Vikram Pillai'} reached milestone Level 50!`,
          user: sampleUsers[5] || users[0],
          metadata: { level: 50 },
        },
        {
          type: 'streak_milestone',
          title: '🔥 7-Day Sadhana Streak',
          message: `${sampleUsers[6]?.name || 'Ananya Gowda'} completed 7 consecutive days of daily sadhana practice!`,
          user: sampleUsers[6] || users[0],
          metadata: { streakDays: 7 },
        },
        {
          type: 'streak_milestone',
          title: '🔥 30-Day Sadhana Streak',
          message: `${sampleUsers[7]?.name || 'Deepak Kulkarni'} achieved a powerful 30-day uninterrupted sadhana streak!`,
          user: sampleUsers[7] || users[0],
          metadata: { streakDays: 30 },
        },
        {
          type: 'streak_milestone',
          title: '🔥 40-Day Mandala Streak',
          message: `${sampleUsers[8]?.name || 'Kavita Hegde'} completed a full 40-day Mandala streak!`,
          user: sampleUsers[8] || users[0],
          metadata: { streakDays: 40 },
        },
        {
          type: 'inactive_high_level',
          title: '⚠️ Inactive High-Level Seeker (12d)',
          message: `${sampleUsers[9]?.name || 'Gautam Tiwari'} (Level 35) has been inactive for 12 days. Recommended for outreach call.`,
          user: sampleUsers[9] || users[0],
          metadata: { level: 35, daysInactive: 12 },
        },
        {
          type: 'inactive_high_level',
          title: '⚠️ Inactive High-Level Seeker (18d)',
          message: `${sampleUsers[10]?.name || 'Sneha Mukherji'} (Level 22) has been inactive for 18 days. Outreach recommended.`,
          user: sampleUsers[10] || users[0],
          metadata: { level: 22, daysInactive: 18 },
        },
        {
          type: 'shambhavi_added',
          title: '🪷 Shambhavi Mahamudra Added',
          message: `${sampleUsers[11]?.name || 'Rohan Deshmukh'} added Shambhavi Mahamudra to their daily practice list.`,
          user: sampleUsers[11] || users[0],
          metadata: { practiceName: 'Shambhavi Mahamudra' },
        },
        {
          type: 'inner_engineering_completed',
          title: '✨ Inner Engineering Completed',
          message: `${sampleUsers[12]?.name || 'Meera Joshi'} successfully completed Inner Engineering online!`,
          user: sampleUsers[12] || users[0],
          metadata: { programName: 'Inner Engineering' },
        },
      ];

      for (const item of sampleEvents) {
        if (!item.user) continue;
        await createNotification({
          userId: item.user._id,
          userName: item.user.name,
          userEmail: item.user.email,
          type: item.type,
          title: item.title,
          message: item.message,
          metadata: item.metadata,
          dedupKey: `sample_seed:${item.type}:${item.user._id}`,
        });
      }
      console.log('✨ Seeded 13 realistic dummy admin notifications.');
    }
  } catch (err) {
    console.error('Error running syncAdminNotifications:', err);
  }
}

module.exports = {
  createNotification,
  notifyProgramInterest,
  notifyInnerEngineeringCompleted,
  notifyShambhaviAdded,
  notifyLevelMilestone,
  notifyStreakMilestone,
  syncAdminNotifications,
};
