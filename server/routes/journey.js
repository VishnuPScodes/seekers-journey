const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const JourneyEvent = require('../models/JourneyEvent');
const User = require('../models/User');

const CATEGORY_DEFAULT_ICONS = {
  start: '🌱',
  program: '🏛️',
  milestone: '🏔️',
  sadhana: '🪷',
  seva: '🙏',
  personal: '✨',
  community: '🕊️',
};

// GET /api/journey/events — Fetch all journey timeline events for current seeker
router.get('/events', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    let events = await JourneyEvent.find({ userId }).sort({ date: -1, createdAt: -1 });

    // If seeker has zero events yet, auto-populate baseline milestones from user profile
    if (events.length === 0) {
      const user = await User.findById(userId);
      if (user) {
        const seedEvents = [];

        // 1. Account Creation / Journey Began
        const regDate = user.createdAt || new Date();
        seedEvents.push({
          userId,
          type: 'auto',
          category: 'start',
          title: "Began the Seeker's Journey",
          description: "Stepped onto the path of inner transformation and conscious living.",
          date: regDate,
          icon: '🌱',
        });

        // 2. Selected Sadhana Practices
        if (user.selectedPractices && user.selectedPractices.length > 0) {
          user.selectedPractices.forEach((pName) => {
            seedEvents.push({
              userId,
              type: 'auto',
              category: 'sadhana',
              title: `Initiated in ${pName}`,
              description: 'Configured daily practice commitment and target cycles.',
              date: regDate,
              icon: '🪷',
              metadata: { practice: pName },
            });
          });
        }

        // 3. Current Level Milestone if level >= 5
        if (user.currentLevel && user.currentLevel >= 5) {
          seedEvents.push({
            userId,
            type: 'auto',
            category: 'milestone',
            title: `Ascended to Level ${user.currentLevel}`,
            description: `Earned ${user.totalCumulativeScore || 0} points on the sacred journey.`,
            date: user.lastActivityDate || new Date(),
            icon: '🏔️',
            metadata: { level: user.currentLevel, score: user.totalCumulativeScore },
          });
        }

        if (seedEvents.length > 0) {
          await JourneyEvent.insertMany(seedEvents);
          events = await JourneyEvent.find({ userId }).sort({ date: -1, createdAt: -1 });
        }
      }
    }

    res.json({ events });
  } catch (err) {
    console.error('Fetch journey events error:', err);
    res.status(500).json({ message: 'Server error fetching journey events' });
  }
});

// POST /api/journey/events — Create a new personal journey memory / event
router.post('/events', auth, async (req, res) => {
  try {
    const { title, description = '', category = 'personal', date, icon, isPrivate = false } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Event title is required' });
    }

    const eventDate = date ? new Date(date) : new Date();
    const eventIcon = icon || CATEGORY_DEFAULT_ICONS[category] || '✨';

    const event = new JourneyEvent({
      userId: req.user._id,
      type: 'user',
      category,
      title: title.trim(),
      description: description.trim(),
      date: eventDate,
      icon: eventIcon,
      isPrivate: Boolean(isPrivate),
    });

    await event.save();

    res.status(201).json({
      message: 'Journey event created successfully 🙏',
      event,
    });
  } catch (err) {
    console.error('Create journey event error:', err);
    res.status(500).json({ message: 'Server error creating journey event' });
  }
});

// PUT /api/journey/events/:id — Edit a journey event
router.put('/events/:id', auth, async (req, res) => {
  try {
    const event = await JourneyEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Journey event not found' });
    }

    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this event' });
    }

    const { title, description, category, date, icon, isPrivate } = req.body;

    // For user-created events, all fields can be edited
    if (title !== undefined && event.type === 'user') event.title = title.trim();
    if (category !== undefined && event.type === 'user') {
      event.category = category;
      if (!icon) event.icon = CATEGORY_DEFAULT_ICONS[category] || event.icon;
    }
    if (icon !== undefined) event.icon = icon;
    if (description !== undefined) event.description = description.trim();
    if (date !== undefined) event.date = new Date(date);
    if (isPrivate !== undefined) event.isPrivate = Boolean(isPrivate);

    await event.save();

    res.json({
      message: 'Journey event updated successfully',
      event,
    });
  } catch (err) {
    console.error('Update journey event error:', err);
    res.status(500).json({ message: 'Server error updating journey event' });
  }
});

// DELETE /api/journey/events/:id — Delete a journey event
router.delete('/events/:id', auth, async (req, res) => {
  try {
    const event = await JourneyEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Journey event not found' });
    }

    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    if (event.type === 'auto') {
      return res.status(400).json({ message: 'System milestone events cannot be deleted' });
    }

    await JourneyEvent.findByIdAndDelete(req.params.id);

    res.json({ message: 'Journey event deleted successfully' });
  } catch (err) {
    console.error('Delete journey event error:', err);
    res.status(500).json({ message: 'Server error deleting journey event' });
  }
});

module.exports = router;
