const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const JourneyEvent = require('../models/JourneyEvent');

// ─── Helper: sort key for chronological ordering ──────────────────────────────
// Normalises partial dates so "2020" → "2020-01-01" and "2020-08" → "2020-08-01"
// allowing simple string comparison to produce correct chronological order.
function sortKey(event) {
  const { date, datePrecision } = event;
  if (datePrecision === 'year') return `${date}-01-01`;
  if (datePrecision === 'month') return `${date}-01`;
  return date; // already "YYYY-MM-DD"
}

// ─── GET /api/journey ─────────────────────────────────────────────────────────
// Returns all journey events for the authenticated user, sorted chronologically.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await JourneyEvent.find({ userId: req.user._id }).lean();

    // Sort chronologically (oldest first), stable by createdAt for ties
    events.sort((a, b) => {
      const dateCompare = sortKey(a).localeCompare(sortKey(b));
      if (dateCompare !== 0) return dateCompare;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json({ events });
  } catch (err) {
    console.error('Error fetching journey events:', err);
    res.status(500).json({ message: 'Server error fetching journey events' });
  }
});

// ─── POST /api/journey ────────────────────────────────────────────────────────
// Creates a new journey event.
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, category, date, datePrecision, description, location } = req.body;

    if (!title || !category || !date || !datePrecision) {
      return res.status(400).json({ message: 'title, category, date, and datePrecision are required' });
    }

    const event = new JourneyEvent({
      userId: req.user._id,
      title: title.trim(),
      category,
      date,
      datePrecision,
      description: description?.trim() || '',
      location: location?.trim() || '',
    });

    await event.save();

    res.status(201).json({ message: 'Journey event created', event });
  } catch (err) {
    console.error('Error creating journey event:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error creating journey event' });
  }
});

// ─── PUT /api/journey/:id ─────────────────────────────────────────────────────
// Updates an existing journey event. Only the owner can edit.
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, category, date, datePrecision, description, location } = req.body;

    const event = await JourneyEvent.findOne({ _id: req.params.id, userId: req.user._id });
    if (!event) {
      return res.status(404).json({ message: 'Journey event not found' });
    }

    if (title !== undefined) event.title = title.trim();
    if (category !== undefined) event.category = category;
    if (date !== undefined) event.date = date;
    if (datePrecision !== undefined) event.datePrecision = datePrecision;
    if (description !== undefined) event.description = description.trim();
    if (location !== undefined) event.location = location.trim();

    await event.save();

    res.json({ message: 'Journey event updated', event });
  } catch (err) {
    console.error('Error updating journey event:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error updating journey event' });
  }
});

// ─── DELETE /api/journey/:id ──────────────────────────────────────────────────
// Deletes a journey event. Only the owner can delete.
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await JourneyEvent.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!event) {
      return res.status(404).json({ message: 'Journey event not found' });
    }
    res.json({ message: 'Journey event deleted' });
  } catch (err) {
    console.error('Error deleting journey event:', err);
    res.status(500).json({ message: 'Server error deleting journey event' });
  }
});

module.exports = router;
