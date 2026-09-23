const mongoose = require('mongoose');

const programRegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  seekerName: {
    type: String,
    required: true,
  },
  seekerEmail: {
    type: String,
    required: true,
  },
  seekerPhone: {
    type: String,
    default: '',
  },
  programId: {
    type: String,
    required: true,
  },
  programName: {
    type: String,
    required: true,
  },
  preferredLocation: {
    type: String,
    default: 'Isha Yoga Center, Coimbatore',
  },
  preferredTimeframe: {
    type: String,
    default: 'Upcoming 1-3 Months',
  },
  spiritualAspiration: {
    type: String,
    default: '',
  },
  prerequisitesStatus: {
    type: String,
    default: 'Eligible',
  },
  status: {
    type: String,
    enum: ['pending_review', 'contacted', 'approved', 'waitlisted'],
    default: 'pending_review',
    index: true,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

programRegistrationSchema.index({ userId: 1, programId: 1 });
programRegistrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProgramRegistration', programRegistrationSchema);
