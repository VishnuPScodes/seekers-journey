const mongoose = require('mongoose');

const communityNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['kudos', 'comment', 'follow', 'sangha_join', 'gathering_rsvp', 'join_request', 'join_approved'],
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    sanghaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sangha',
      default: null,
    },
    gatheringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SanghaEvent',
      default: null,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityType: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

communityNotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityNotification', communityNotificationSchema);
