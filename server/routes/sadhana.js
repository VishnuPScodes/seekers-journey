const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SadhanaLog = require('../models/SadhanaLog');
const User = require('../models/User');
const JourneyEvent = require('../models/JourneyEvent');
const { scoreToLevel, calculateSadhanaScore } = require('../utils/scoring');

// POST /api/sadhana/log — save today's sadhana log with score
router.post('/log', auth, async (req, res) => {
  try {
    const { practices, source = 'tracker' } = req.body;

    if (!practices || !Array.isArray(practices)) {
      return res.status(400).json({ message: 'Invalid practices data' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Existing score for today ensures no double counting
    const existingLog = await SadhanaLog.findOne({ userId: req.user._id, date: today });
    const oldScore = existingLog ? (existingLog.totalScore || 0) : 0;

    const { scoredPractices, totalScore, isPerfectDay } = calculateSadhanaScore(
      practices,
      user.selectedPractices,
      user.practiceConfig
    );

    const deltaScore = totalScore - oldScore;

    // Upsert today's log
    const log = await SadhanaLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { practices: scoredPractices, totalScore, isPerfectDay, source },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Increment cumulative score only by deltaScore
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { totalCumulativeScore: deltaScore },
        $set: { lastActivityDate: new Date() },
      },
      { new: true }
    );

    const newLevel = scoreToLevel(updatedUser.totalCumulativeScore);
    const oldLevel = updatedUser.currentLevel || 1;
    if (newLevel !== oldLevel) {
      updatedUser.currentLevel = newLevel;
      await updatedUser.save();
    }

    // ── Auto-generate JourneyEvent milestones (non-blocking) ──
    try {
      // 1. Major level milestone
      if (newLevel > oldLevel && (newLevel % 5 === 0 || newLevel === 108 || (newLevel === 2 && oldLevel === 1))) {
        const existingMilestone = await JourneyEvent.findOne({
          userId: req.user._id,
          category: 'milestone',
          'metadata.level': newLevel,
        });
        if (!existingMilestone) {
          await JourneyEvent.create({
            userId: req.user._id,
            type: 'auto',
            category: 'milestone',
            title: `Ascended to Level ${newLevel}`,
            description: `Attained Level ${newLevel} on the path with ${updatedUser.totalCumulativeScore} cumulative sadhana points.`,
            icon: '🏔️',
            metadata: { level: newLevel, score: updatedUser.totalCumulativeScore },
            date: new Date(),
          });
        }
      }

      // 2. First Perfect Day milestone
      if (isPerfectDay && (!existingLog || !existingLog.isPerfectDay)) {
        const pastPerfect = await JourneyEvent.findOne({
          userId: req.user._id,
          title: 'First Perfect Sadhana Day',
        });
        if (!pastPerfect) {
          await JourneyEvent.create({
            userId: req.user._id,
            type: 'auto',
            category: 'sadhana',
            title: 'First Perfect Sadhana Day',
            description: 'Completed all dedicated daily sadhana practices and targets in a single day.',
            icon: '✨',
            date: new Date(),
          });
        }
      }
    } catch (milestoneErr) {
      console.warn('Auto journey event milestone error (non-fatal):', milestoneErr.message);
    }

    res.json({
      message: 'Sadhana log saved!',
      log,
      totalScore,
      deltaScore,
      isPerfectDay,
      totalCumulativeScore: updatedUser.totalCumulativeScore,
      currentLevel: updatedUser.currentLevel,
    });
  } catch (err) {
    console.error('Sadhana log error:', err);
    res.status(500).json({ message: 'Server error saving sadhana log' });
  }
});

// GET /api/sadhana/today — get today's log (if any) and user pradakshina count
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let log = await SadhanaLog.findOne({ userId: req.user._id, date: today });
    const user = await User.findById(req.user._id).select('pradakshinaCount');
    if (!log) {
      log = {
        guruPujaAttended: false,
        practices: [],
        totalScore: 0,
        isPerfectDay: false,
      };
    }
    res.json({
      log,
      pradakshinaCount: user?.pradakshinaCount || 0,
    });
  } catch (err) {
    console.error('Fetch today log error:', err);
    res.status(500).json({ message: 'Server error fetching log' });
  }
});

// POST /api/sadhana/pradakshina — increment total pradakshina count in User schema
router.post('/pradakshina', auth, async (req, res) => {
  try {
    const incrementBy = req.body.incrementBy ? parseInt(req.body.incrementBy) : 1;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { pradakshinaCount: incrementBy } },
      { new: true }
    );
    res.json({
      message: 'Pradakshina logged! 🙏',
      pradakshinaCount: user.pradakshinaCount,
    });
  } catch (err) {
    console.error('Pradakshina log error:', err);
    res.status(500).json({ message: 'Server error updating pradakshina' });
  }
});

// POST /api/sadhana/guru-puja — mark guru puja as attended for today (only once)
router.post('/guru-puja', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const log = await SadhanaLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { $set: { guruPujaAttended: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({
      message: 'Guru Puja attended recorded! 🙏',
      guruPujaAttended: log.guruPujaAttended,
      log,
    });
  } catch (err) {
    console.error('Guru Puja log error:', err);
    res.status(500).json({ message: 'Server error updating guru puja' });
  }
});

// POST /api/sadhana/reflection — save focus and awareness percentages
router.post('/reflection', auth, async (req, res) => {
  try {
    const { focusPercentage, awarenessPercentage } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const update = {};
    if (focusPercentage !== undefined) update.focusPercentage = focusPercentage;
    if (awarenessPercentage !== undefined) update.awarenessPercentage = awarenessPercentage;

    const log = await SadhanaLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Reflection updated', log });
  } catch (err) {
    console.error('Reflection update error:', err);
    res.status(500).json({ message: 'Server error updating reflection' });
  }
});

// GET /api/sadhana/history — get up to 180 days of logs for progress graph
router.get('/history', auth, async (req, res) => {
  try {
    const requested = parseInt(req.query.days) || 14;
    const days = Math.min(Math.max(requested, 1), 180); // clamp: 1–180

    // Build date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const logs = await SadhanaLog.find({
      userId: req.user._id,
      date: { $gte: startStr, $lte: endStr },
    }).sort({ date: 1 });

    // Build a full date array (fill missing days with 0)
    const dateMap = {};
    logs.forEach(log => { dateMap[log.date] = log; });

    const result = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split('T')[0];
      const log = dateMap[dateStr];
      result.push({
        date: dateStr,
        totalScore: log ? log.totalScore : 0,
        isPerfectDay: log ? log.isPerfectDay : false,
        practices: log ? log.practices : [],
        practiced: !!log,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Summary stats
    const totalDaysPracticed = logs.length;
    const perfectDays = logs.filter(l => l.isPerfectDay).length;
    const overallScore = logs.reduce((sum, l) => sum + l.totalScore, 0);
    const currentStreak = calculateStreak(result);

    res.json({
      history: result,
      stats: { totalDaysPracticed, perfectDays, overallScore, currentStreak },
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Server error fetching history' });
  }
});

// Helper: calculate current streak (consecutive days ending today)
function calculateStreak(history) {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].practiced) streak++;
    else break;
  }
  return streak;
}

module.exports = router;
