const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  selectedPractices: {
    type: [String],
    default: [],
  },
  practiceConfig: [{
    name: { type: String, required: true },
    dailyTarget: { type: Number, default: 2, min: 1 },
    category: { type: String, default: 'General' },
    desc: { type: String, default: '' },
    isCustom: { type: Boolean, default: false },
  }],
  customPractices: [{
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    dailyTarget: { type: Number, default: 1, min: 1 },
    desc: { type: String, default: '' },
  }],
  lastActivityDate: {
    type: Date,
    default: Date.now,
  },
  practicesSelected: {
    type: Boolean,
    default: false,
  },
  pradakshinaCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalCumulativeScore: {
    type: Number,
    default: 0,
    min: 0,
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 108,
  },
  pebblePositions: {
    type: Map,
    of: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    },
    default: {},
  },
  // Origin Story & Personal Discovery
  city: {
    type: String,
    default: 'Bengaluru',
  },
  region: {
    type: String,
    default: 'India',
  },
  discoveryDate: {
    type: Date,
  },
  discoveryChannel: {
    type: String,
    default: 'YouTube / Video Discourse',
  },
  firstAttraction: {
    type: String,
    default: 'Clarity, profound logic, and experiential nature of Sadhguru',
  },
  initialMotivation: {
    type: String,
    default: 'Seeking inner balance, mental clarity, and spiritual depth',
  },
  originStoryText: {
    type: String,
    default: '',
  },
  cohortPersona: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Custom'],
    default: 'Custom',
  },
  journeyStartDate: {
    type: Date,
    default: Date.now,
  },
  isSynthetic: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // Date an admin last marked this user as "contacted" for Shambhavi outreach.
  // Used to suppress them from the outreach list for 30 days after contact.
  shambhaviOutreachContactedAt: {
    type: Date,
    default: null,
  },

  mandalaStatus: {
    active: { type: Boolean, default: false },
    practiceName: { type: String, default: 'Shambhavi Mahamudra' },
    targetDays: { type: Number, default: 40 },
    currentDay: { type: Number, default: 1 },
    completedDays: { type: Number, default: 0 },
    startDate: { type: Date },
    lastCompletedDate: { type: String },
  },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
