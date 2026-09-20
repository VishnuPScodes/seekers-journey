/**
 * Seekers Journey — Point Rules (Authoritative Configuration)
 *
 * This is the SINGLE source of truth for all scoring values.
 * Do NOT define scoring constants in individual route files.
 * Modify values here; they propagate everywhere automatically.
 */

module.exports = {
  // ── Level Progression ───────────────────────────────────────────────────────
  POINTS_PER_LEVEL: 100,       // cumulative points required to advance one level
  MAX_LEVEL: 108,              // Kailash = level 108

  // ── Practice Session Scoring ────────────────────────────────────────────────
  SCORE_ONCE: 10,              // points for completing a practice once in a day
  SCORE_TWICE: 25,             // points for completing a practice twice in a day

  // ── Perfect Day Bonus ───────────────────────────────────────────────────────
  PERFECT_DAY_BONUS: 20,       // bonus when ALL selected practices done ≥ once

  // ── Shakti Chalana Kriya — Kapalabhati Round Bonuses ───────────────────────
  // Additional points awarded on top of the base session score
  KAPALABHATI_SCORES: {
    20:  5,
    50:  10,
    100: 20,
    150: 30,
    200: 45,
  },

  // ── Quick Bubble Tap (home screen) ─────────────────────────────────────────
  // Used during Phase 1 only. Phase 2 will unify this into SadhanaLog.
  POINTS_PER_TAP: 10,

  // ── Default Practice Daily Targets ──────────────────────────────────────────
  DEFAULT_DAILY_TARGET: 2,
  DEFAULT_TARGETS: {
    'Shoonya Meditation': 2,
    'Shambhavi Mahamudra': 2,
    'Shakti Chalana Kriya': 2,
    'Surya Kriya': 1,
    'Yogasanas': 1,
    'Angamardana': 1,
    'Sukha Kriya': 2,
    'Samyama Sadhana': 1,
    'Breath Watching': 2,
    'Surya Shakti': 1,
    'Bhastrika Kriya': 2,
  },

  // ── Level Decay ─────────────────────────────────────────────────────────────
  // Applied to currentLevel when a seeker is inactive.
  // totalCumulativeScore and SadhanaLog history are NEVER modified by decay.
  decay: {
    enabled: true,
    inactivityThresholdDays: 30,   // days with no practice before decay begins
    decayIntervalDays: 7,          // how often decay ticks after threshold passed
    levelsPerInterval: 1,          // levels lost per interval
    minimumLevel: 1,               // currentLevel never drops below this
  },
};
