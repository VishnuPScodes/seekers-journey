const mongoose = require('mongoose');

/**
 * JourneyEvent — the single source of truth for a user's Isha journey milestones.
 *
 * Layer 1: Personal Journey Timeline
 * Future layers (Practice History, Program History, Seva Journey, Reflections, Insights)
 * can query this same collection with category filters.
 */
const journeyEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title must be 200 characters or fewer'],
    },

    /**
     * Category — determines how the event is displayed and filtered.
     * Keep extensible: add new values here as new journey layers are built.
     */
    category: {
      type: String,
      enum: [
        'beginning',        // First contact with Isha / Sadhguru
        'program',          // IE, BSP, Shoonya, Sadhanapada, Samyama, etc.
        'practice',         // Started Shambhavi, Surya Kriya, Yogasanas, etc.
        'volunteering',     // Seva at any level
        'event',            // Mahashivratri, retreats, visits, special events
        'personal_milestone', // Meaningful personal moments on the journey
      ],
      required: [true, 'Category is required'],
    },

    /**
     * date — stored as a string to support partial dates gracefully:
     *   "2019"          (year only)
     *   "2020-08"       (month + year)
     *   "2020-08-12"    (full date)
     *
     * datePrecision tells consumers how to render and sort the date.
     */
    date: {
      type: String,
      required: [true, 'Date is required'],
    },

    datePrecision: {
      type: String,
      enum: ['day', 'month', 'year'],
      required: true,
      default: 'day',
    },

    // Optional enrichment fields
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be 1000 characters or fewer'],
      default: '',
    },

    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location must be 200 characters or fewer'],
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index: fast chronological queries per user
journeyEventSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('JourneyEvent', journeyEventSchema);
