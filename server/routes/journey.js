const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const JourneyEvent = require('../models/JourneyEvent');
const User = require('../models/User');
const UserProgram = require('../models/UserProgram');
const Mandala = require('../models/Mandala');
const VolunteeringEvent = require('../models/VolunteeringEvent');
const { OFFICIAL_PROGRAMS, VOLUNTEERING_PATHWAYS, SYNTHETIC_PERSONAS } = require('../config/ishaReferenceData');
const { notifyProgramInterest, notifyInnerEngineeringCompleted } = require('../services/notificationService');
const { evaluateProgramEligibility, PROGRAM_CATALOG } = require('../utils/programPrerequisites');

const CATEGORY_DEFAULT_ICONS = {
  start: '🌱',
  program: '🏛️',
  milestone: '🏔️',
  sadhana: '🪷',
  seva: '🙏',
  personal: '✨',
  community: '🕊️',
};

// GET /api/journey/me — Complete multi-dimensional spiritual journey profile
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Chronological wave events sorted ascending (from past to today)
    const events = await JourneyEvent.find({ userId }).sort({ date: 1, createdAt: 1 });

    // 2. Programs completed
    const programs = await UserProgram.find({ userId }).sort({ completionDate: 1 });

    // 3. Active / latest Mandala
    const mandala = await Mandala.findOne({ userId }).sort({ createdAt: -1 });

    // 4. Volunteering / Seva history
    const seva = await VolunteeringEvent.find({ userId }).sort({ startDate: -1 });

    // Calculate years and months elapsed on the path
    const startDate = user.journeyStartDate || user.createdAt || new Date();
    const elapsedMs = Math.max(0, Date.now() - new Date(startDate).getTime());
    const totalDaysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const yearsElapsed = Math.floor(totalDaysElapsed / 365);
    const monthsElapsed = Math.floor((totalDaysElapsed % 365) / 30);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city || 'Bengaluru',
        region: user.region || 'India',
        journeyStartDate: startDate,
        yearsElapsed,
        monthsElapsed,
        timeOnPathLabel: yearsElapsed > 0
          ? `${yearsElapsed} yr${yearsElapsed > 1 ? 's' : ''}, ${monthsElapsed} mo${monthsElapsed > 1 ? 's' : ''}`
          : `${monthsElapsed} month${monthsElapsed > 1 ? 's' : ''}`,
        cohortPersona: user.cohortPersona || 'B',
        selectedPractices: user.selectedPractices || [],
        practiceConfig: user.practiceConfig || [],
        totalCumulativeScore: user.totalCumulativeScore || 0,
        currentLevel: user.currentLevel || 1,
        pradakshinaCount: user.pradakshinaCount || 0,
        originStory: {
          discoveryDate: user.discoveryDate,
          discoveryChannel: user.discoveryChannel || 'YouTube Video Discourse',
          firstAttraction: user.firstAttraction || 'Clarity and profound logic of Sadhguru',
          initialMotivation: user.initialMotivation || 'Seeking inner balance and conscious growth',
          originStoryText: user.originStoryText || '',
        },
        mandalaStatus: user.mandalaStatus || { active: false },
      },
      events,
      programs,
      mandala,
      seva,
      officialPrograms: OFFICIAL_PROGRAMS,
      volunteeringPathways: VOLUNTEERING_PATHWAYS,
    });
  } catch (err) {
    console.error('Fetch journey/me error:', err);
    res.status(500).json({ message: 'Server error fetching journey profile' });
  }
});

// GET /api/journey/personas — Archetype & named persona definitions for Persona Switcher
router.get('/personas', auth, async (req, res) => {
  try {
    const namedEmails = [
      { id: 'DIKSHANT', email: 'dikshantbisht10@gmail.com', role: 'Primary Seeker', icon: '🌟' },
      { id: 'PRIYA', email: 'priya.nair@seekers.journey', role: 'Mandala Sadhaka', icon: '🪷' },
      { id: 'ANAND', email: 'anand.sharma@seekers.journey', role: 'Surya Kriya & Japa', icon: '☀️' },
      { id: 'RAJESH', email: 'rajesh.menon@seekers.journey', role: 'Elder Mentor & Seva', icon: '🏔️' },
      { id: 'MEERA', email: 'meera.iyer@seekers.journey', role: 'Devotional Seeker', icon: '🌸' },
      { id: 'VIKRAM', email: 'vikram.joshi@seekers.journey', role: 'Yatra Sadhaka', icon: '👣' },
    ];

    const spiritualPersonas = [];
    for (const item of namedEmails) {
      let u = await User.findOne({ email: item.email }).select('name email currentLevel totalCumulativeScore pradakshinaCount selectedPractices');
      if (!u && item.id === 'DIKSHANT') {
        u = await User.findOne({ email: 'diksh@gmail.com' }).select('name email currentLevel totalCumulativeScore pradakshinaCount selectedPractices');
      }
      if (u) {
        spiritualPersonas.push({
          id: item.id,
          name: u.name,
          email: u.email,
          role: item.role,
          icon: item.icon,
          currentLevel: u.currentLevel || 1,
          totalCumulativeScore: u.totalCumulativeScore || 0,
          pradakshinaCount: u.pradakshinaCount || 0,
          practices: u.selectedPractices || [],
        });
      }
    }

    res.json({
      spiritualPersonas,
      personas: SYNTHETIC_PERSONAS,
    });
  } catch (err) {
    console.error('Error fetching personas:', err);
    res.json({
      spiritualPersonas: [],
      personas: SYNTHETIC_PERSONAS,
    });
  }
});

// GET /api/journey/prerequisites-status — Evaluates user's completed programs and eligibility
router.get('/prerequisites-status', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userPrograms = await UserProgram.find({ userId, status: 'completed' }).sort({ completionDate: 1 });
    const completedProgramIds = userPrograms.map(p => p.programId);

    const mandala = await Mandala.findOne({ userId }).sort({ createdAt: -1 });
    const mandalaStatus = {
      ...(user.mandalaStatus || {}),
      completedDays: mandala ? mandala.completedDaysCount : (user.mandalaStatus?.completedDays || 0),
    };

    const statusCatalog = evaluateProgramEligibility(completedProgramIds, mandalaStatus);

    res.json({
      completedCount: completedProgramIds.length,
      completedPrograms: userPrograms,
      catalog: statusCatalog,
      mandalaStatus,
    });
  } catch (err) {
    console.error('Error in prerequisites-status:', err);
    res.status(500).json({ message: 'Server error evaluating program prerequisites' });
  }
});

// PUT /api/journey/origin-story — Update seeker's discovery and origin story
router.put('/origin-story', auth, async (req, res) => {
  try {
    const { discoveryChannel, firstAttraction, initialMotivation, originStoryText, discoveryDate } = req.body;
    const update = {};
    if (discoveryChannel !== undefined) update.discoveryChannel = discoveryChannel;
    if (firstAttraction !== undefined) update.firstAttraction = firstAttraction;
    if (initialMotivation !== undefined) update.initialMotivation = initialMotivation;
    if (originStoryText !== undefined) update.originStoryText = originStoryText;
    if (discoveryDate !== undefined) update.discoveryDate = new Date(discoveryDate);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    res.json({
      message: 'Origin story saved 🙏',
      originStory: {
        discoveryDate: user.discoveryDate,
        discoveryChannel: user.discoveryChannel,
        firstAttraction: user.firstAttraction,
        initialMotivation: user.initialMotivation,
        originStoryText: user.originStoryText,
      },
    });
  } catch (err) {
    console.error('Update origin story error:', err);
    res.status(500).json({ message: 'Server error updating origin story' });
  }
});

// POST /api/journey/voice-reflection — Record a whisper of grace (quick reflection)
router.post('/voice-reflection', auth, async (req, res) => {
  try {
    const { text, practiceName } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reflection text is required' });
    }

    const event = new JourneyEvent({
      userId: req.user._id,
      type: 'user',
      category: 'personal',
      title: practiceName ? `Reflection: ${practiceName}` : 'Sacred Reflection',
      description: text.trim(),
      date: new Date(),
      icon: '✨',
    });
    await event.save();

    res.status(201).json({
      message: 'Reflection recorded 🙏',
      event,
    });
  } catch (err) {
    console.error('Voice reflection error:', err);
    res.status(500).json({ message: 'Server error saving reflection' });
  }
});

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

    await JourneyEvent.findByIdAndDelete(req.params.id);

    res.json({ message: 'Journey event deleted successfully' });
  } catch (err) {
    console.error('Delete journey event error:', err);
    res.status(500).json({ message: 'Server error deleting journey event' });
  }
});

// POST /api/journey/program — Express interest or record completed program
router.post('/program', auth, async (req, res) => {
  try {
    const { programId, programName, status = 'interested', location, reflection } = req.body;

    if (!programId || !programName) {
      return res.status(400).json({ message: 'Program ID and name are required' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let program = await UserProgram.findOne({ userId, programId });
    if (program) {
      program.status = status;
      if (location) program.location = location;
      if (reflection) program.reflection = reflection;
      await program.save();
    } else {
      program = await UserProgram.create({
        userId,
        programId,
        programName,
        status,
        location: location || 'Isha Yoga Center',
        reflection: reflection || '',
      });
    }

    // Trigger Admin Notifications
    if (status === 'interested' || status === 'registered') {
      notifyProgramInterest(user, programName, status).catch(err => console.error('Notify program interest error:', err));
    }
    if (programName.toLowerCase().includes('inner engineering') && status === 'completed') {
      notifyInnerEngineeringCompleted(user).catch(err => console.error('Notify Inner Engineering error:', err));
    }

    res.status(201).json({
      message: `Program status recorded as ${status} 🙏`,
      program,
    });
  } catch (err) {
    console.error('Save program error:', err);
    res.status(500).json({ message: 'Server error saving program' });
  }
});

module.exports = router;

