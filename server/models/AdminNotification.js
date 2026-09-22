const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'program_interest',
      'level_milestone',
      'streak_milestone',
      'inactive_high_level',
      'shambhavi_added',
      'inner_engineering_completed',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  dedupKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

adminNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
