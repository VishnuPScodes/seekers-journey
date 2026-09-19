const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SadhanaLog = require('../models/SadhanaLog');
const User = require('../models/User');

// ─── Level Calculation ────────────────────────────────────────────────────────
function scoreToLevel(score) {
  const level = Math.floor(score / 100) + 1;
  return Math.min(Math.max(level, 1), 108);
}

// ─── Scoring Constants ────────────────────────────────────────────────────────
const SCORE_ONCE = 10;        // points for doing a practice once
const SCORE_TWICE = 25;       // points for doing a practice twice (bonus)
const PERFECT_DAY_BONUS = 20; // bonus if ALL selected practices done >= once

// Bonus points for kapalabhati rounds in Shakti Chalana Kriya
const KAPALABHATI_SCORES = {
  20:  5,
  50:  10,
  100: 20,
  150: 30,
  200: 45,
};

function calculateScore(practices, selectedPractices) {
  let total = 0;
  const scoredPractices = practices.map(p => {
    let score = 0;
    if (p.count === 1) score = SCORE_ONCE;
    if (p.count === 2) score = SCORE_TWICE;

    // Extra bonus for kapalabhati rounds (Shakti Chalana Kriya only)
    if (p.kapalabhatiCount && KAPALABHATI_SCORES[p.kapalabhatiCount]) {
      score += KAPALABHATI_SCORES[p.kapalabhatiCount];
    }

    total += score;
    return { ...p, score };
  });

  // Perfect day bonus: all selected practices done at least once
  const doneNames = practices.filter(p => p.count > 0).map(p => p.name);
  const isPerfectDay = selectedPractices.length > 0 &&
    selectedPractices.every(sp => doneNames.includes(sp));

  if (isPerfectDay) total += PERFECT_DAY_BONUS;

  return { scoredPractices, totalScore: total, isPerfectDay };
}

// POST /api/sadhana/log — save today's sadhana log with score
router.post('/log', auth, async (req, res) => {
  try {
    const { practices } = req.body;

    if (!practices || !Array.isArray(practices)) {
      return res.status(400).json({ message: 'Invalid practices data' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ── TESTING: duplicate-submission block temporarily disabled ─────────────
    // const existing = await SadhanaLog.findOne({ userId: req.user._id, date: today });
    // if (existing) {
    //   return res.status(409).json({
    //     message: "You've already completed your sadhana for today. See you tomorrow! 🙏",
    //     alreadySubmitted: true,
    //     log: existing,
    //   });
    // }
    // ─────────────────────────────────────────────────────────────────────────

    const user = await User.findById(req.user._id);
    const { scoredPractices, totalScore, isPerfectDay } = calculateScore(
      practices,
      user.selectedPractices
    );

    // Upsert (testing mode — overwrites today's log freely)
    const log = await SadhanaLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { practices: scoredPractices, totalScore, isPerfectDay },
      { upsert: true, new: true }
    );

    // Also increment cumulative score on the User document
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { totalCumulativeScore: totalScore } },
      { new: true }
    );
    const newLevel = scoreToLevel(updatedUser.totalCumulativeScore);
    if (newLevel !== updatedUser.currentLevel) {
      await User.findByIdAndUpdate(req.user._id, { currentLevel: newLevel });
    }

    res.json({ message: 'Sadhana log saved!', log, totalScore, isPerfectDay });
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
