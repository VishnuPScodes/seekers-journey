/**
 * Seekers Journey — Shared Scoring Utilities
 *
 * All scoring logic lives here. Route files should import these functions
 * rather than defining their own. This ensures consistent behaviour
 * across the Sadhana Tracker, bubble taps, and any future entry points.
 */

const {
  POINTS_PER_LEVEL,
  MAX_LEVEL,
  SCORE_ONCE,
  SCORE_TWICE,
  PERFECT_DAY_BONUS,
  KAPALABHATI_SCORES,
} = require('../config/pointRules');

// ── Level from Score ─────────────────────────────────────────────────────────
/**
 * Convert a cumulative score to a level (1–108).
 * 100 points = 1 level. Score is never decremented by this function.
 */
function scoreToLevel(score) {
  const level = Math.floor(score / POINTS_PER_LEVEL) + 1;
  return Math.min(Math.max(level, 1), MAX_LEVEL);
}

// ── Sadhana Session Scoring ──────────────────────────────────────────────────
/**
 * Calculate the score for a daily sadhana submission.
 *
 * @param {Array}  practices         — array of { name, count, kapalabhatiCount }
 * @param {Array}  selectedPractices — the user's configured practice list (names)
 * @param {Array}  practiceConfig    — array of { name, dailyTarget } (optional)
 * @returns {{ scoredPractices, totalScore, isPerfectDay }}
 */
function calculateSadhanaScore(practices, selectedPractices = [], practiceConfig = []) {
  let total = 0;

  // Build target lookup map (defaults to 2 if not configured)
  const targetMap = {};
  if (Array.isArray(practiceConfig)) {
    practiceConfig.forEach((pc) => {
      if (pc && pc.name) targetMap[pc.name] = pc.dailyTarget || 2;
    });
  }

  const scoredPractices = practices.map((p) => {
    let score = 0;
    const target = targetMap[p.name] !== undefined ? targetMap[p.name] : 2;

    // Scored count is capped at target; true count (p.count) is preserved
    const scoredCount = Math.min(p.count || 0, target);

    if (scoredCount === 1) score = SCORE_ONCE;
    if (scoredCount >= 2) score = SCORE_TWICE;

    // Kapalabhati bonus applies only to Shakti Chalana Kriya
    if (p.kapalabhatiCount && KAPALABHATI_SCORES[p.kapalabhatiCount]) {
      score += KAPALABHATI_SCORES[p.kapalabhatiCount];
    }

    total += score;
    return { ...p, score };
  });

  // Perfect day: every selected practice completed at least once
  const doneNames = practices.filter((p) => p.count > 0).map((p) => p.name);
  const isPerfectDay =
    selectedPractices.length > 0 &&
    selectedPractices.every((sp) => doneNames.includes(sp));

  if (isPerfectDay) total += PERFECT_DAY_BONUS;

  return { scoredPractices, totalScore: total, isPerfectDay };
}

module.exports = { scoreToLevel, calculateSadhanaScore };
