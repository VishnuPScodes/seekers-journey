const mongoose = require('mongoose');

const practiceEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, default: 0, min: 0 },
  score: { type: Number, default: 0 }, // points earned for this practice
  kapalabhatiCount: { type: Number, default: null }, // only for Shakti Chalana Kriya
});

const sadhanaLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // stored as YYYY-MM-DD
    required: true,
  },
  practices: [practiceEntrySchema],
  totalScore: { type: Number, default: 0 },
  isPerfectDay: { type: Boolean, default: false }, // all selected practices done ≥ once
  source: {
    type: String,
    enum: ['tracker', 'bubble', 'api'],
    default: 'tracker',
  },
  pradakshinaCount: { type: Number, default: 0, min: 0 },
  guruPujaAttended: { type: Boolean, default: false },
  focusPercentage: { type: Number, default: 0 },
  awarenessPercentage: { type: Number, default: 0 },
}, { timestamps: true });

// One log per user per day
sadhanaLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SadhanaLog', sadhanaLogSchema);
