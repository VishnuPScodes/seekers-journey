const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower ID is required'],
      index: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'blocked'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Prevent a user from following themselves
followSchema.pre('validate', function (next) {
  if (this.followerId && this.followingId && this.followerId.toString() === this.followingId.toString()) {
    return next(new Error('A seeker cannot follow themselves.'));
  }
  next();
});

// Compound unique index: A user can only follow another user once
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Query optimization indexes for followers & following lookups
followSchema.index({ followingId: 1, status: 1 });
followSchema.index({ followerId: 1, status: 1 });

module.exports = mongoose.model('Follow', followSchema);
