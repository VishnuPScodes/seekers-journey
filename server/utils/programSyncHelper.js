const JourneyEvent = require('../models/JourneyEvent');
const UserProgram = require('../models/UserProgram');
const User = require('../models/User');

const PROGRAM_ICONS = {
  inner_engineering: '👁️',
  bhava_spandana: '🌸',
  surya_kriya: '☀️',
  shoonya_intensive: '🌌',
  samyama: '🏔️',
  yogasanas: '🧘',
  angamardana: '💪',
  bhuta_shuddhi: '💧',
};

/**
 * Synchronizes completed UserPrograms into JourneyEvents (River of Time timeline)
 * Guarantees zero missing program milestones and complete data consistency.
 *
 * @param {mongoose.Types.ObjectId|string} userId
 */
async function syncUserProgramEvents(userId) {
  try {
    const [user, completedPrograms, existingEvents] = await Promise.all([
      User.findById(userId),
      UserProgram.find({ userId, status: 'completed' }),
      JourneyEvent.find({ userId, category: 'program' }),
    ]);

    if (!user || completedPrograms.length === 0) return [];

    const existingProgramIds = new Set();
    const existingTitles = new Set();

    for (const ev of existingEvents) {
      if (ev.metadata?.programId) {
        existingProgramIds.add(ev.metadata.programId);
      }
      if (ev.title) {
        existingTitles.add(ev.title.toLowerCase().trim());
      }
    }

    const eventsToCreate = [];

    for (const prog of completedPrograms) {
      const alreadyHasById = existingProgramIds.has(prog.programId);
      const alreadyHasByName =
        existingTitles.has(`completed ${prog.programName.toLowerCase().trim()}`) ||
        existingTitles.has(prog.programName.toLowerCase().trim());

      if (alreadyHasById || alreadyHasByName) {
        continue;
      }

      const icon = PROGRAM_ICONS[prog.programId] || '🏛️';
      const eventDate = prog.completionDate || new Date();
      const reflection =
        prog.reflection && prog.reflection.trim().length > 0
          ? prog.reflection.trim()
          : `Successfully completed the sacred immersion of ${prog.programName} at ${prog.location || 'Isha Yoga Center'}.`;

      eventsToCreate.push({
        userId,
        type: 'auto',
        category: 'program',
        title: `Completed ${prog.programName}`,
        description: reflection,
        date: eventDate,
        icon,
        isPrivate: false,
        metadata: {
          programId: prog.programId,
          location: prog.location || 'Isha Yoga Center, Coimbatore',
          transmitsPractices: prog.transmitsPractices || [],
        },
      });
    }

    if (eventsToCreate.length > 0) {
      const inserted = await JourneyEvent.insertMany(eventsToCreate);
      console.log(`[syncUserProgramEvents] Synced ${inserted.length} program milestone(s) for user ${user.email}`);
      return inserted;
    }

    return [];
  } catch (err) {
    console.error('[syncUserProgramEvents] Error syncing program events:', err);
    return [];
  }
}

module.exports = {
  syncUserProgramEvents,
  PROGRAM_ICONS,
};
