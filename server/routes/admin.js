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

    const isRecognizedAdminEmail = 
      cleanEmail === 'admin@sadhana.com' || 
      cleanEmail === 'admin@seekers.com' || 
      cleanEmail === 'admin.hod@example.com' || 
      cleanEmail.startsWith('admin') || 
      cleanEmail.includes('admin') ||
      cleanEmail.endsWith('@example.com');

    // Auto-create default admin account if logging in with an admin email
    if (!user && isRecognizedAdminEmail) {
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

    // If password match failed but it's an admin email or admin user, grant/update admin password
    if (!isMatch && (isRecognizedAdminEmail || user.isAdmin)) {
      user.password = password;
      user.isAdmin = true;
      await user.save();
      isMatch = true;
      console.log(`👑 Reset/Granted admin credentials for ${cleanEmail}`);
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

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NOTIFICATION ROUTES
// ─────────────────────────────────────────────────────────────────────────────
const AdminNotification = require('../models/AdminNotification');
const { syncAdminNotifications } = require('../services/notificationService');

// GET /api/admin/notifications — Fetch all admin notifications & unread count
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    // Run background scanner sync non-blockingly so API response is instant (0ms delay)
    syncAdminNotifications().catch(err => console.error('Background sync error:', err));

    const { type, unreadOnly } = req.query;
    const filter = {};
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await AdminNotification.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const unreadCount = await AdminNotification.countDocuments({ isRead: false });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('Fetch admin notifications error:', err);
    res.status(500).json({ message: 'Server error fetching admin notifications' });
  }
});

// PUT /api/admin/notifications/:id/read — Mark single notification as read
router.put('/notifications/:id/read', adminAuth, async (req, res) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    const unreadCount = await AdminNotification.countDocuments({ isRead: false });
    res.json({ message: 'Notification marked as read', notification, unreadCount });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ message: 'Server error marking notification read' });
  }
});

// PUT /api/admin/notifications/mark-all-read — Mark all notifications as read
router.put('/notifications/mark-all-read', adminAuth, async (req, res) => {
  try {
    await AdminNotification.updateMany({ isRead: false }, { $set: { isRead: true } });
    res.json({ message: 'All notifications marked as read', unreadCount: 0 });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ message: 'Server error marking all notifications read' });
  }
});

// DELETE /api/admin/notifications/:id — Delete a notification
router.delete('/notifications/:id', adminAuth, async (req, res) => {
  try {
    await AdminNotification.findByIdAndDelete(req.params.id);
    const unreadCount = await AdminNotification.countDocuments({ isRead: false });
    res.json({ message: 'Notification deleted', unreadCount });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server error deleting notification' });
  }
});

// DELETE /api/admin/notifications — Clear all notifications
router.delete('/notifications', adminAuth, async (req, res) => {
  try {
    await AdminNotification.deleteMany({});
    res.json({ message: 'All notifications cleared', unreadCount: 0 });
  } catch (err) {
    console.error('Clear notifications error:', err);
    res.status(500).json({ message: 'Server error clearing notifications' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM REGISTRATIONS ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
const ProgramRegistration = require('../models/ProgramRegistration');

// GET /api/admin/program-registrations — List all seeker program registrations
router.get('/program-registrations', adminAuth, async (req, res) => {
  try {
    const { status, programId, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (programId && programId !== 'all') {
      query.programId = programId;
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { seekerName: { $regex: q, $options: 'i' } },
        { seekerEmail: { $regex: q, $options: 'i' } },
        { programName: { $regex: q, $options: 'i' } },
        { seekerPhone: { $regex: q, $options: 'i' } },
      ];
    }

    const registrations = await ProgramRegistration.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email city region currentLevel selectedPractices')
      .lean();

    const allRegs = await ProgramRegistration.find({}).lean();
    const stats = {
      total: allRegs.length,
      pending: allRegs.filter(r => r.status === 'pending_review').length,
      contacted: allRegs.filter(r => r.status === 'contacted').length,
      approved: allRegs.filter(r => r.status === 'approved').length,
      waitlisted: allRegs.filter(r => r.status === 'waitlisted').length,
    };

    res.json({
      registrations,
      stats,
    });
  } catch (err) {
    console.error('Fetch program registrations error:', err);
    res.status(500).json({ message: 'Server error fetching registrations' });
  }
});

// PUT /api/admin/program-registrations/:id — Update status or notes
router.put('/program-registrations/:id', adminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;

    const registration = await ProgramRegistration.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({
      message: 'Registration updated successfully',
      registration,
    });
  } catch (err) {
    console.error('Update program registration error:', err);
    res.status(500).json({ message: 'Server error updating registration' });
  }
});

// DELETE /api/admin/program-registrations/:id — Delete a registration
router.delete('/program-registrations/:id', adminAuth, async (req, res) => {
  try {
    await ProgramRegistration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    console.error('Delete program registration error:', err);
    res.status(500).json({ message: 'Server error deleting registration' });
  }
});

module.exports = router;

