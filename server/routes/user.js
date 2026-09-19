const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ─── Score → Level Utility ────────────────────────────────────────────────────
// 100 points per level, levels 1–108
function scoreToLevel(score) {
  const level = Math.floor(score / 100) + 1;
  return Math.min(Math.max(level, 1), 108);
}

// GET /api/user/me — get current user info
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select(
    'name email selectedPractices practicesSelected pradakshinaCount totalCumulativeScore currentLevel'
  );
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    selectedPractices: user.selectedPractices,
    practicesSelected: user.practicesSelected,
    pradakshinaCount: user.pradakshinaCount,
    totalCumulativeScore: user.totalCumulativeScore || 0,
    currentLevel: user.currentLevel || 1,
  });
});

// POST /api/user/practices — save selected practices
router.post('/practices', auth, async (req, res) => {
  try {
    const { practices } = req.body;

    if (!practices || !Array.isArray(practices) || practices.length === 0) {
      return res.status(400).json({ message: 'Please select at least one practice' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { selectedPractices: practices, practicesSelected: true },
      { new: true }
    );

    res.json({
      message: 'Practices saved successfully',
      selectedPractices: user.selectedPractices,
      practicesSelected: user.practicesSelected,
    });
  } catch (err) {
    console.error('Save practices error:', err);
    res.status(500).json({ message: 'Server error saving practices' });
  }
});

// POST /api/user/tap-sadhana — increment cumulative score by 10 pts for a single tap
router.post('/tap-sadhana', auth, async (req, res) => {
  try {
    const POINTS_PER_TAP = 10;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { totalCumulativeScore: POINTS_PER_TAP } },
      { new: true }
    );

    // Recalculate level
    const newLevel = scoreToLevel(user.totalCumulativeScore);
    if (newLevel !== user.currentLevel) {
      user.currentLevel = newLevel;
      await user.save();
    }

    res.json({
      message: 'Sadhana tapped! +10 pts',
      totalCumulativeScore: user.totalCumulativeScore,
      currentLevel: user.currentLevel,
      leveledUp: newLevel !== req.user.currentLevel,
    });
  } catch (err) {
    console.error('Tap sadhana error:', err);
    res.status(500).json({ message: 'Server error updating score' });
  }
});

module.exports = router;
module.exports.scoreToLevel = scoreToLevel;
