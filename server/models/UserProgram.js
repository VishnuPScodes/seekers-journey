const mongoose = require('mongoose');

const userProgramSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  programId: {
    type: String, // e.g. 'inner_engineering', 'bhava_spandana', 'shoonya_intensive', 'samyama'
    required: true,
  },
  programName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'registered', 'interested'],
    default: 'completed',
  },
  completionDate: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
    default: 'Isha Yoga Center, Coimbatore',
  },
  reflection: {
    type: String,
    default: '',
  },
  transmitsPractices: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userProgramSchema.index({ userId: 1, programId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgram', userProgramSchema);
