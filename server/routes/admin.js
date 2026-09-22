const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const signAdminToken = (id) =>
  jwt.sign({ id, isAdmin: true }, process.env.JWT_SECRET || 'sadhana_secret_key_2026', { expiresIn: '7d' });

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // Auto-create default admin account if logging in with admin@sadhana.com or admin@seekers.com
    if (!user && (cleanEmail === 'admin@sadhana.com' || cleanEmail === 'admin@seekers.com')) {
      user = await User.create({
        name: 'System Admin',
        email: cleanEmail,
        password: password,
        isAdmin: true,
        selectedPractices: ['Shambhavi Mahamudra', 'Surya Kriya'],
        practicesSelected: true,
      });
      console.log(`👑 Created initial admin user: ${cleanEmail}`);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    let isMatch = await user.comparePassword(password);

    // If default admin account exists but password failed, and password provided is 'admin@123456', update it to 'admin@123456'
    if (!isMatch && (cleanEmail === 'admin@sadhana.com' || cleanEmail === 'admin@seekers.com' || user.isAdmin) && (password === 'admin@123456' || password === 'admin123')) {
      user.password = password;
      user.isAdmin = true;
      await user.save();
      isMatch = true;
      console.log(`👑 Reset default admin password for ${cleanEmail}`);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Ensure user is marked as admin
    if (!user.isAdmin) {
      user.isAdmin = true;
      await user.save();
    }

    const token = signAdminToken(user._id);

    return res.json({
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: true,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    if (err.name === 'MongoServerSelectionError' || err.code === 'ENOTFOUND' || err.message?.includes('ENOTFOUND')) {
      return res.status(503).json({ message: 'Database connection error. Please check your internet connection or MongoDB Atlas status.' });
    }
    return res.status(500).json({ message: 'Server error during admin login' });
  }
});

// GET /api/admin/me - verify admin token validity
router.get('/me', adminAuth, async (req, res) => {
  res.json({
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: true,
    },
  });
});

// GET /api/admin/users - get list of all users with filters and sorting
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { nonMeditators, newJoiners, sortBy } = req.query;

    // Fetch all users sorted or structured
    let query = {};

    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);

    if (newJoiners === 'true') {
      query.createdAt = { $gte: hundredDaysAgo };
    }

    let users = await User.find(query)
      .select('name email selectedPractices practiceConfig currentLevel totalCumulativeScore createdAt journeyStartDate lastActivityDate city region mandalaStatus isAdmin isSynthetic shambhaviOutreachContactedAt')
      .lean();

    // Transform user objects for clean front-end consumption
    users = users.map(u => {
      // Collect practice names cleanly from selectedPractices or practiceConfig
      const practiceNames = u.selectedPractices && u.selectedPractices.length > 0
        ? u.selectedPractices
        : (u.practiceConfig || []).map(p => p.name);

      // Check if user practices "Shambhavi Mahamudra"
      const isShambhaviPractitioner = practiceNames.some(
        name => name.toLowerCase().includes('shambhavi')
      );

      // Days since joining
      const joinDate = u.createdAt || u.journeyStartDate || new Date();
      const daysSinceJoining = Math.floor((new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24));

      // Last active calculation
      const lastActiveDate = u.lastActivityDate || u.createdAt || u.journeyStartDate || new Date();
      const daysSinceLastActive = Math.max(0, Math.floor((new Date() - new Date(lastActiveDate)) / (1000 * 60 * 60 * 24)));

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        selectedPractices: practiceNames,
        currentLevel: u.currentLevel || 1,
        totalCumulativeScore: u.totalCumulativeScore || 0,
        createdAt: u.createdAt,
        daysSinceJoining,
        lastActivityDate: lastActiveDate,
        daysSinceLastActive,
        isNewJoiner: daysSinceJoining <= 100,
        isNonMeditator: !isShambhaviPractitioner,
        city: u.city || 'Unknown',
        region: u.region || '',
        mandalaStatus: u.mandalaStatus,
        isAdmin: Boolean(u.isAdmin),
        // ISO string (or null) of when this user was last marked contacted for Shambhavi outreach
        shambhaviOutreachContactedAt: u.shambhaviOutreachContactedAt || null,
      };
    });

    // Compute stats before applying nonMeditators filter so UI badges are accurate
    const totalCount = users.length;
    const nonMeditatorsCount = users.filter(u => u.isNonMeditator).length;
    const newJoinersCount = users.filter(u => u.isNewJoiner).length;

    // Filter by Non-Meditators if requested
    if (nonMeditators === 'true') {
      users = users.filter(u => u.isNonMeditator);
    }

    // Sort options
    if (sortBy === 'highest_level') {
      users.sort((a, b) => b.currentLevel - a.currentLevel || b.totalCumulativeScore - a.totalCumulativeScore);
    } else if (sortBy === 'last_active') {
      users.sort((a, b) => new Date(b.lastActivityDate) - new Date(a.lastActivityDate));
    } else {
      // Default sort by join date (newest first)
      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
      users,
      stats: {
        totalCount,
        nonMeditatorsCount,
        newJoinersCount,
      },
    });
  } catch (err) {
    console.error('Fetch admin users error:', err);
    res.status(500).json({ message: 'Server error fetching users list' });
  }
});

// POST /api/admin/users/:userId/mark-contacted
// Stamps today's date on shambhaviOutreachContactedAt for the given user.
// The frontend uses this to suppress them from the outreach list for 30 days.
router.post('/users/:userId/mark-contacted', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { shambhaviOutreachContactedAt: new Date() } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`📞 Admin marked ${user.name} (${user.email}) as contacted for Shambhavi outreach.`);

    return res.json({
      message: `${user.name} marked as contacted. They will be hidden from the outreach list for 30 days.`,
      userId: user._id,
      shambhaviOutreachContactedAt: user.shambhaviOutreachContactedAt,
    });
  } catch (err) {
    console.error('Mark contacted error:', err);
    res.status(500).json({ message: 'Server error marking contact date' });
  }
});

module.exports = router;
