const mongoose = require('mongoose');

const mandalaDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  date: { type: String }, // YYYY-MM-DD
  status: {
    type: String,
    enum: ['completed', 'missed', 'partial', 'upcoming'],
    default: 'upcoming',
  },
  completedSessions: { type: Number, default: 0 },
  targetSessionsPerDay: { type: Number, default: 2 },
  reflection: { type: String, default: '' },
  timeOfDay: { type: String, default: 'morning' },
});

const mandalaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  practiceName: {
    type: String,
    required: true,
    default: 'Shambhavi Mahamudra',
  },
  title: {
    type: String,
    default: '40-Day Initiation Mandala',
  },
  totalDays: {
    type: Number,
    default: 40,
  },
  currentDay: {
    type: Number,
    default: 1,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'interrupted'],
    default: 'active',
  },
  consistencyPercentage: {
    type: Number,
    default: 100,
  },
  completedDaysCount: {
    type: Number,
    default: 0,
  },
  days: [mandalaDaySchema],
  completionReflection: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

mandalaSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Mandala', mandalaSchema);
