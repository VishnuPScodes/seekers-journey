const mongoose = require('mongoose');

const volunteeringEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  activityType: {
    type: String,
    enum: ['ashram_seva', 'mahashivratri_seva', 'program_volunteering', 'community_seva'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: 'Isha Yoga Center, Coimbatore',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  durationHours: {
    type: Number,
    default: 8,
  },
  reflection: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

volunteeringEventSchema.index({ userId: 1, startDate: -1 });

module.exports = mongoose.model('VolunteeringEvent', volunteeringEventSchema);
