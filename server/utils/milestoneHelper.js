const JourneyEvent = require('../models/JourneyEvent');
const SadhanaLog = require('../models/SadhanaLog');
const Mandala = require('../models/Mandala');

/**
 * Calculate current consecutive active sadhana streak from SadhanaLog.
 */
async function calculateActiveStreak(userId, targetDateStr) {
  try {
    const allLogsDesc = await SadhanaLog.find({ userId }).sort({ date: -1 }).lean();
    if (!allLogsDesc || allLogsDesc.length === 0) return 0;

    const todayStr = targetDateStr || new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr + 'T12:00:00Z');
    const yesterdayDate = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate() - 1));
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // Check if the most recent log is today or yesterday
    const latestLog = allLogsDesc[0];
    if (latestLog.date !== todayStr && latestLog.date !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(latestLog.date + 'T12:00:00Z');

    for (const log of allLogsDesc) {
      const expectedStr = checkDate.toISOString().split('T')[0];
      const hasActivity = (log.practices || []).some(p => (p.count || 0) > 0) || (log.totalScore || 0) > 0;

      if (log.date === expectedStr && hasActivity) {
        streak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (err) {
    console.warn('Error calculating streak in milestoneHelper:', err.message);
    return 0;
  }
}

/**
 * Evaluates and auto-generates JourneyEvent milestones & Mandala progress
 * whenever sadhana is logged (via bubble tap or daily tracker).
 *
 * @param {Object} params
 * @param {ObjectId} params.userId
 * @param {Number} params.newLevel
 * @param {Number} params.oldLevel
 * @param {Number} params.cumulativeScore
 * @param {Boolean} params.isPerfectDay
 * @param {Boolean} params.wasPerfectDay
 * @param {Array}  params.practices
 * @param {String} params.dateStr (YYYY-MM-DD)
 * @returns {Array} newlyCreatedMilestones
 */
async function evaluateSadhanaMilestones({
  userId,
  newLevel = 1,
  oldLevel = 1,
  cumulativeScore = 0,
  isPerfectDay = false,
  wasPerfectDay = false,
  practices = [],
  dateStr,
}) {
  const createdMilestones = [];

  try {
    // ── 1. Level Promotion Milestone ─────────────────────────────────────────
    if (newLevel > oldLevel) {
      const existingMilestone = await JourneyEvent.findOne({
        userId,
        category: 'milestone',
        'metadata.level': newLevel,
      });

      if (!existingMilestone) {
        const levelEvent = await JourneyEvent.create({
          userId,
          type: 'auto',
          category: 'milestone',
          title: `Ascended to Level ${newLevel}`,
          description: `Attained Level ${newLevel} on the path with ${cumulativeScore} cumulative sadhana points.`,
          icon: '🏔️',
          metadata: { level: newLevel, score: cumulativeScore },
          date: new Date(),
        });
        createdMilestones.push(levelEvent);
      }
    }

    // ── 2. First Perfect Sadhana Day Milestone ────────────────────────────────
    if (isPerfectDay && !wasPerfectDay) {
      const pastPerfect = await JourneyEvent.findOne({
        userId,
        title: 'First Perfect Sadhana Day',
      });

      if (!pastPerfect) {
        const perfectEvent = await JourneyEvent.create({
          userId,
          type: 'auto',
          category: 'sadhana',
          title: 'First Perfect Sadhana Day',
          description: 'Completed all dedicated daily sadhana practices and targets in a single day.',
          icon: '✨',
          metadata: { date: dateStr },
          date: new Date(),
        });
        createdMilestones.push(perfectEvent);
      }
    }

    // ── 3. Major Streak Milestones (7, 21, 40, 108) ──────────────────────────
    const currentStreak = await calculateActiveStreak(userId, dateStr);
    const significantStreaks = [7, 21, 40, 108];

    if (significantStreaks.includes(currentStreak)) {
      const existingStreakMilestone = await JourneyEvent.findOne({
        userId,
        category: 'milestone',
        'metadata.streakDays': currentStreak,
      });

      if (!existingStreakMilestone) {
        const streakEvent = await JourneyEvent.create({
          userId,
          type: 'auto',
          category: 'milestone',
          title: `${currentStreak}-Day Sadhana Continuity`,
          description: `Cultivated unwavering stillness across ${currentStreak} continuous days of daily sadhana.`,
          icon: '🔥',
          metadata: { streakDays: currentStreak },
          date: new Date(),
        });
        createdMilestones.push(streakEvent);
      }
    }

    // ── 4. Active Mandala Progress Synchronization ───────────────────────────
    try {
      const activeMandalas = await Mandala.find({ userId, status: 'active' });
      for (const mandala of activeMandalas) {
        const practiceMatch = practices.find(
          p => p.name && p.name.trim().toLowerCase() === mandala.practiceName.trim().toLowerCase()
        );

        if (practiceMatch && (practiceMatch.count || 0) > 0) {
          const sessionsDone = practiceMatch.count || 1;
          const targetSessions = 2; // Twice daily standard initiation mandala

          // Find or create day entry in mandala
          let dayEntry = (mandala.days || []).find(d => d.date === dateStr);
          const wasDayCompleted = dayEntry && dayEntry.status === 'completed';

          if (!dayEntry) {
            const nextDayNumber = (mandala.completedDaysCount || 0) + 1;
            dayEntry = {
              dayNumber: Math.min(nextDayNumber, mandala.totalDays || 40),
              date: dateStr,
              status: sessionsDone >= targetSessions ? 'completed' : 'partial',
              completedSessions: sessionsDone,
              targetSessionsPerDay: targetSessions,
            };
            if (!mandala.days) mandala.days = [];
            mandala.days.push(dayEntry);
          } else {
            dayEntry.completedSessions = sessionsDone;
            if (sessionsDone >= targetSessions) {
              dayEntry.status = 'completed';
            }
          }

          // If day just reached completed status, increment completedDaysCount
          if (sessionsDone >= targetSessions && !wasDayCompleted) {
            mandala.completedDaysCount = Math.min(
              (mandala.completedDaysCount || 0) + 1,
              mandala.totalDays || 40
            );
            mandala.currentDay = Math.min(mandala.completedDaysCount + 1, mandala.totalDays || 40);

            // Check if Mandala is fully completed!
            if (mandala.completedDaysCount >= (mandala.totalDays || 40)) {
              mandala.status = 'completed';
              mandala.endDate = new Date();

              // Auto-create Mandala Completion Milestone
              const mandalaEvent = await JourneyEvent.create({
                userId,
                type: 'auto',
                category: 'program',
                title: `${mandala.practiceName} 40-Day Mandala Consecrated`,
                description: `Successfully completed the full 40-day twice-daily initiation mandala for ${mandala.practiceName}.`,
                icon: '🪷',
                metadata: { practice: mandala.practiceName, totalDays: mandala.totalDays },
                date: new Date(),
              });
              createdMilestones.push(mandalaEvent);
            }
          }

          mandala.consistencyPercentage = Math.round(
            ((mandala.completedDaysCount || 0) / (mandala.totalDays || 40)) * 100
          );
          await mandala.save();
        }
      }
    } catch (mandalaErr) {
      console.warn('Mandala sync warning (non-fatal):', mandalaErr.message);
    }

  } catch (err) {
    console.error('Milestone evaluation error (non-fatal):', err);
  }

  return createdMilestones;
}

module.exports = {
  evaluateSadhanaMilestones,
  calculateActiveStreak,
};
