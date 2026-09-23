const mongoose = require('mongoose');

const sanghaMembershipSchema = new mongoose.Schema(
  {
    sanghaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sangha',
      required: [true, 'Sangha ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'blocked'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// Unique compound index: A seeker can only have one membership record per sangha
sanghaMembershipSchema.index({ sanghaId: 1, userId: 1 }, { unique: true });

// Efficient lookups for user sanghas and member listings
sanghaMembershipSchema.index({ userId: 1, status: 1 });
sanghaMembershipSchema.index({ sanghaId: 1, status: 1, role: 1 });

module.exports = mongoose.model('SanghaMembership', sanghaMembershipSchema);
