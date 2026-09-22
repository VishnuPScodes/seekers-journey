const mongoose = require('mongoose');

const sanghaEventSchema = new mongoose.Schema(
  {
    sanghaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sangha',
      required: false,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Gathering title is required'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['online', 'in_person', 'retreat'],
      default: 'in_person',
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
    },
    locationOrLink: {
      type: String,
      default: '',
      trim: true,
    },
    venue: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: 'Bengaluru' },
      mapLink: { type: String, default: '' },
    },
    contactPerson: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      ishaRole: { type: String, default: 'Sangha Coordinator' },
    },
    agenda: [
      {
        time: { type: String, required: true },
        activity: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    guidelines: [
      {
        type: String,
      },
    ],
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    capacity: {
      type: Number,
      default: 40,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attendeesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    joinRequests: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

sanghaEventSchema.index({ sanghaId: 1, startTime: 1 });
sanghaEventSchema.index({ startTime: 1 });

module.exports = mongoose.model('SanghaEvent', sanghaEventSchema);
