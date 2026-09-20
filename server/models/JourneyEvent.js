const mongoose = require('mongoose');

const journeyEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['auto', 'user'],
    default: 'user',
  },
  category: {
    type: String,
    enum: ['start', 'milestone', 'program', 'sadhana', 'personal', 'seva', 'community'],
    default: 'personal',
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  icon: {
    type: String,
    default: '🪷',
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient user timeline queries
journeyEventSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('JourneyEvent', journeyEventSchema);
