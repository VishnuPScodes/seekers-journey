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

// POST /api/auth/switch-persona — Instantly switch active session between synthetic persona archetypes
router.post('/switch-persona', async (req, res) => {
  try {
    const { personaId } = req.body;
    let user;
    if (!personaId || personaId === 'DEMO' || personaId === 'MAIN') {
      user = await User.findOne({ email: 'diksh@gmail.com' });
    } else {
      user = await User.findOne({ cohortPersona: personaId.toUpperCase(), isSynthetic: true });
    }

    if (!user) {
      user = await User.findOne();
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
        selectedPractices: user.selectedPractices,
        practiceConfig: user.practiceConfig || [],
        practicesSelected: user.practicesSelected,
        cohortPersona: user.cohortPersona || 'B',
        city: user.city,
        region: user.region,
      },
    });
  } catch (err) {
    console.error('Switch persona error:', err);
    res.status(500).json({ message: 'Server error switching persona' });
  }
});

module.exports = router;

