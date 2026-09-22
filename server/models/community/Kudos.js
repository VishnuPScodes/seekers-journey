const mongoose = require('mongoose');

const kudosSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: A seeker can offer Kudos (🙏) to a post only once
kudosSchema.index({ postId: 1, userId: 1 }, { unique: true });

// Index for viewing recent kudos offered by a user
kudosSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Kudos', kudosSchema);
