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
