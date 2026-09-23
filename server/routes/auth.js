const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        selectedPractices: user.selectedPractices,
        practiceConfig: user.practiceConfig || [],
        practicesSelected: user.practicesSelected,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update active status date on login
    user.lastActivityDate = new Date();
    await user.save();

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        selectedPractices: user.selectedPractices,
        practiceConfig: user.practiceConfig || [],
        practicesSelected: user.practicesSelected,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/switch-persona — Instantly switch active session between personas
router.post('/switch-persona', async (req, res) => {
  try {
    const { personaId } = req.body;
    let user;
    const target = (personaId || 'DIKSHANT').toString().trim().toUpperCase();

    if (target === 'DEMO' || target === 'MAIN' || target === 'DIKSHANT') {
      user = await User.findOne({ email: 'dikshantbisht10@gmail.com' })
        || await User.findOne({ email: 'diksh@gmail.com' })
        || await User.findOne({ email: { $regex: /dikshant/i } });
    } else if (target === 'PRIYA') {
      user = await User.findOne({ email: 'priya.nair@seekers.journey' });
    } else if (target === 'ANAND') {
      user = await User.findOne({ email: 'anand.sharma@seekers.journey' });
    } else if (target === 'RAJESH') {
      user = await User.findOne({ email: 'rajesh.menon@seekers.journey' });
    } else if (target === 'MEERA') {
      user = await User.findOne({ email: 'meera.iyer@seekers.journey' });
    } else if (target === 'VIKRAM') {
      user = await User.findOne({ email: 'vikram.joshi@seekers.journey' });
    } else if (personaId && personaId.includes('@')) {
      user = await User.findOne({ email: personaId.toLowerCase().trim() });
    } else {
      user = await User.findOne({ cohortPersona: target, isSynthetic: true });
    }

    if (!user) {
      user = await User.findOne({ email: 'dikshantbisht10@gmail.com' })
        || await User.findOne({ email: 'diksh@gmail.com' })
        || await User.findOne();
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentLevel: user.currentLevel || 1,
        totalCumulativeScore: user.totalCumulativeScore || 0,
        pradakshinaCount: user.pradakshinaCount || 0,
        selectedPractices: user.selectedPractices || [],
        practiceConfig: user.practiceConfig || [],
        practicesSelected: user.practicesSelected,
        cohortPersona: user.cohortPersona || 'B',
        city: user.city || 'Bengaluru',
        region: user.region || 'India',
        isSynthetic: !!user.isSynthetic,
      },
    });
  } catch (err) {
    console.error('Switch persona error:', err);
    res.status(500).json({ message: 'Server error switching persona' });
  }
});

module.exports = router;

