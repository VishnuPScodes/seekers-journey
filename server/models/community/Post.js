const mongoose = require('mongoose');

const mediaItemSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
  },
  { _id: false }
);

const sharedEntitySchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['sadhana_log', 'milestone', 'experience', 'routine', 'none'],
      default: 'none',
    },
    entityId: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    metricValue: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: '',
      trim: true,
    },
    originalDate: {
      type: Date,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['standard', 'experience', 'milestone', 'metric', 'photo'],
      default: 'standard',
      index: true,
    },
    body: {
      type: String,
      default: '',
      trim: true,
    },
    media: [mediaItemSchema],
    sharedEntity: {
      type: sharedEntitySchema,
      default: () => ({ entityType: 'none' }),
    },
    // Multi-audience tags for unified fan-out feed queries:
    // e.g. ['public', 'followers', 'sangha:64f...']
    audienceIds: {
      type: [String],
      default: [],
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'sangha_only'],
      default: 'followers',
      index: true,
    },
    sanghaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sangha',
      default: null,
      index: true,
    },
    kudosCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'flagged'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// High-performance feed index: fetches posts for any matched audience sorted by date
postSchema.index({ audienceIds: 1, createdAt: -1, status: 1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ sanghaId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
