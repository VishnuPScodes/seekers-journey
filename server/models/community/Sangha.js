const mongoose = require('mongoose');

const sanghaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sangha name is required'],
      trim: true,
      maxlength: [100, 'Sangha name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Sangha slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
      maxlength: [180, 'Tagline cannot exceed 180 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['local', 'event', 'program', 'interest'],
      required: [true, 'Sangha type is required'],
      index: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    joinPolicy: {
      type: String,
      enum: ['open', 'request'],
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },
    membersCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Slug auto-generation fallback helper before validation if missing
sanghaSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

sanghaSchema.index({ type: 1, visibility: 1, isFeatured: -1 });

module.exports = mongoose.model('Sangha', sanghaSchema);
