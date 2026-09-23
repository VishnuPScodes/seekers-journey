const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const SadhanaLog = require('../models/SadhanaLog');
const JourneyEvent = require('../models/JourneyEvent');
const { scoreToLevel, calculateSadhanaScore } = require('../utils/scoring');
const { evaluateSadhanaMilestones } = require('../utils/milestoneHelper');
const { POINTS_PER_TAP, DEFAULT_TARGETS, DEFAULT_DAILY_TARGET } = require('../config/pointRules');

const { notifyShambhaviAdded } = require('../services/notificationService');

const getDefaultTarget = (name) =>
  (DEFAULT_TARGETS && DEFAULT_TARGETS[name]) || DEFAULT_DAILY_TARGET || 2;

// GET /api/user/me — get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name email selectedPractices practiceConfig customPractices practicesSelected pradakshinaCount totalCumulativeScore currentLevel pebblePositions'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Auto-populate practiceConfig with sensible defaults if user has selectedPractices but empty practiceConfig
    if ((!user.practiceConfig || user.practiceConfig.length === 0) && user.selectedPractices && user.selectedPractices.length > 0) {
      user.practiceConfig = user.selectedPractices.map(name => ({
        name,
        dailyTarget: getDefaultTarget(name),
      }));
      await user.save();
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      selectedPractices: user.selectedPractices || [],
      practiceConfig: user.practiceConfig || [],
      customPractices: user.customPractices || [],
      practicesSelected: user.practicesSelected || false,
      pradakshinaCount: user.pradakshinaCount || 0,
      totalCumulativeScore: user.totalCumulativeScore || 0,
      currentLevel: user.currentLevel || 1,
      pebblePositions: user.pebblePositions ? Object.fromEntries(user.pebblePositions) : {},
    });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// POST /api/user/practices — save selected practices with daily targets
router.post('/practices', auth, async (req, res) => {
  try {
    const { practices } = req.body;

    if (!practices || !Array.isArray(practices) || practices.length === 0) {
      return res.status(400).json({ message: 'Please select at least one practice' });
    }

    // Support both [String] and [{ name, dailyTarget, category, desc, isCustom }]
    const selectedPractices = practices
      .map(p => (typeof p === 'string' ? p.trim() : (p && p.name ? String(p.name).trim() : null)))
      .filter(Boolean);

    if (selectedPractices.length === 0) {
      return res.status(400).json({ message: 'Valid practice names are required' });
    }

    const practiceConfig = practices
      .filter(p => p && (typeof p === 'string' || (p.name && String(p.name).trim())))
      .map(p => {
        if (typeof p === 'string') {
          const name = p.trim();
          return { name, dailyTarget: getDefaultTarget(name), category: 'General', isCustom: false };
        }
        const name = String(p.name).trim();
        return {
          name,
          dailyTarget: p.dailyTarget ? Math.max(1, Number(p.dailyTarget)) : getDefaultTarget(name),
          category: p.category ? String(p.category).trim() : 'General',
          desc: p.desc ? String(p.desc).trim() : '',
          isCustom: Boolean(p.isCustom),
        };
      });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { selectedPractices, practiceConfig, practicesSelected: true },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safe check for Shambhavi notification
    const hasShambhavi = Array.isArray(user.selectedPractices) && user.selectedPractices.some(
      p => typeof p === 'string' && p.toLowerCase().includes('shambhavi')
    );

    if (hasShambhavi) {
      notifyShambhaviAdded(user).catch(err => console.error('Notify Shambhavi error:', err.message));
    }

    return res.json({
      message: 'Practices saved successfully',
      selectedPractices: user.selectedPractices || [],
      practiceConfig: user.practiceConfig || [],
      customPractices: user.customPractices || [],
      practicesSelected: user.practicesSelected || false,
    });
  } catch (err) {
    console.error('Save practices error:', err);
    return res.status(500).json({ message: 'Server error saving practices' });
  }
});


// POST /api/user/custom-practice — add a custom practice to the user's account
router.post('/custom-practice', auth, async (req, res) => {
  try {
    const { name, category = 'General', dailyTarget = 1, desc = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Practice name is required' });
    }

    const cleanName = name.trim();
    const targetNum = Math.max(1, parseInt(dailyTarget) || 1);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.customPractices) user.customPractices = [];
    const exists = user.customPractices.some(
      cp => cp.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (!exists) {
      user.customPractices.push({
        name: cleanName,
        category,
        dailyTarget: targetNum,
        desc,
      });
    }

    // Auto-select and add to practiceConfig
    if (!user.selectedPractices.includes(cleanName)) {
      user.selectedPractices.push(cleanName);
    }

    const configIdx = (user.practiceConfig || []).findIndex(pc => pc.name === cleanName);
    if (configIdx >= 0) {
      user.practiceConfig[configIdx].dailyTarget = targetNum;
      user.practiceConfig[configIdx].category = category;
      user.practiceConfig[configIdx].desc = desc;
      user.practiceConfig[configIdx].isCustom = true;
    } else {
      user.practiceConfig.push({
        name: cleanName,
        dailyTarget: targetNum,
        category,
        desc,
        isCustom: true,
      });
    }

    user.practicesSelected = true;
    await user.save();

    // Auto-create JourneyEvent for new practice initiation (non-blocking)
    try {
      await JourneyEvent.create({
        userId: req.user._id,
        type: 'auto',
        category: 'sadhana',
        title: `Initiated in ${cleanName}`,
        description: `Added ${cleanName} (${category}) with daily target of ${targetNum} ${targetNum === 1 ? 'cycle' : 'cycles'}.`,
        icon: '🪷',
        metadata: { practice: cleanName, category, dailyTarget: targetNum },
        date: new Date(),
      });
    } catch (jErr) {
      console.warn('Auto journey event on custom practice error:', jErr.message);
    }

    res.json({
      message: 'Custom practice added and configured! 🙏',
      practice: { name: cleanName, category, dailyTarget: targetNum, desc, isCustom: true },
      selectedPractices: user.selectedPractices,
      practiceConfig: user.practiceConfig,
      customPractices: user.customPractices,
    });
  } catch (err) {
    console.error('Add custom practice error:', err);
    res.status(500).json({ message: 'Server error creating custom practice' });
  }
});

// POST /api/user/tap-sadhana — record a session tap into today's SadhanaLog and recalculate score
router.post('/tap-sadhana', auth, async (req, res) => {
  try {
    const { practiceName, date: clientDate, action = 'increment' } = req.body;
    if (!practiceName || typeof practiceName !== 'string' || !practiceName.trim()) {
      return res.status(400).json({ message: 'Valid practiceName is required' });
    }

    const cleanPracticeName = practiceName.trim();

    // Client local date support with fallback to UTC server date
    let logDate = new Date().toISOString().split('T')[0];
    if (clientDate && typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
      logDate = clientDate;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find today's log if it already exists
    let log = await SadhanaLog.findOne({ userId: req.user._id, date: logDate });
    const oldScore = log ? (log.totalScore || 0) : 0;
    const wasPerfectDay = log ? Boolean(log.isPerfectDay) : false;

    // Build the updated list of practices
    let currentPractices = log
      ? log.practices.map(p => ({
          name: p.name,
          count: Math.max(0, parseInt(p.count) || 0),
          score: p.score,
          kapalabhatiCount: p.kapalabhatiCount,
        }))
      : [];

    const existingIdx = currentPractices.findIndex(
      p => p.name && p.name.trim().toLowerCase() === cleanPracticeName.toLowerCase()
    );
    if (existingIdx >= 0) {
      if (action === 'decrement') {
        currentPractices[existingIdx].count = Math.max(0, currentPractices[existingIdx].count - 1);
      } else {
        currentPractices[existingIdx].count += 1;
      }
    } else {
      if (action !== 'decrement') {
        currentPractices.push({
          name: cleanPracticeName,
          count: 1,
          kapalabhatiCount: null,
        });
      }
    }

    // Ensure all selectedPractices exist in the log array
    (user.selectedPractices || []).forEach(sp => {
      if (!currentPractices.some(p => p.name && p.name.trim().toLowerCase() === sp.trim().toLowerCase())) {
        currentPractices.push({ name: sp, count: 0, kapalabhatiCount: null });
      }
    });

    // Score today's practices with dailyTarget rules
    const { scoredPractices, totalScore, isPerfectDay } = calculateSadhanaScore(
      currentPractices,
      user.selectedPractices,
      user.practiceConfig
    );

    const deltaScore = totalScore - oldScore;

    // Save/update today's SadhanaLog
    const updatedLog = await SadhanaLog.findOneAndUpdate(
      { userId: req.user._id, date: logDate },
      { practices: scoredPractices, totalScore, isPerfectDay, source: 'bubble' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update User cumulative score with deltaScore & update lastActivityDate
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { totalCumulativeScore: deltaScore },
        $set: { lastActivityDate: new Date() },
      },
      { new: true }
    );

    const oldLevel = user.currentLevel || 1;
    const newLevel = scoreToLevel(updatedUser.totalCumulativeScore);
    if (newLevel !== updatedUser.currentLevel) {
      updatedUser.currentLevel = newLevel;
      await updatedUser.save();
    }

    // ── Auto-evaluate JourneyEvent Milestones & Mandala Sync ──
    const newMilestones = await evaluateSadhanaMilestones({
      userId: req.user._id,
      newLevel,
      oldLevel,
      cumulativeScore: updatedUser.totalCumulativeScore,
      isPerfectDay,
      wasPerfectDay,
      practices: scoredPractices,
      dateStr: logDate,
    });

    const tappedEntry = scoredPractices.find(
      p => p.name && p.name.trim().toLowerCase() === cleanPracticeName.toLowerCase()
    );
    const targetConfig = (user.practiceConfig || []).find(
      c => c.name && c.name.trim().toLowerCase() === cleanPracticeName.toLowerCase()
    );
    const dailyTarget = targetConfig ? targetConfig.dailyTarget : 2;

    res.json({
      message: 'Practice recorded! 🙏',
      practiceName: cleanPracticeName,
      count: tappedEntry ? tappedEntry.count : 0,
      dailyTarget,
      totalScore,
      deltaScore,
      isPerfectDay,
      totalCumulativeScore: updatedUser.totalCumulativeScore,
      currentLevel: updatedUser.currentLevel,
      leveledUp: newLevel > oldLevel,
      newMilestones: newMilestones || [],
      log: updatedLog,
    });
  } catch (err) {
    console.error('Tap sadhana error:', err);
    res.status(500).json({ message: 'Server error recording practice tap' });
  }
});

// POST /api/user/pebble-positions — update user custom pebble coordinates
router.post('/pebble-positions', auth, async (req, res) => {
  try {
    const { pebblePositions } = req.body;
    if (!pebblePositions || typeof pebblePositions !== 'object') {
      return res.status(400).json({ message: 'pebblePositions object is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.pebblePositions) {
      user.pebblePositions = new Map();
    }

    Object.entries(pebblePositions).forEach(([name, pos]) => {
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        user.pebblePositions.set(name, { x: pos.x, y: pos.y });
      }
    });

    await user.save();

    res.json({
      message: 'Pebble positions saved successfully',
      pebblePositions: Object.fromEntries(user.pebblePositions),
    });
  } catch (err) {
    console.error('Save pebble positions error:', err);
    res.status(500).json({ message: 'Server error saving pebble positions' });
  }
});

module.exports = router;
