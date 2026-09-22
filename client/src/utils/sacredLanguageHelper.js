/**
 * Sacred Language Helper for Daily Sadhana Consecration
 * 
 * Rooted in the timeless yogic principle:
 * "Svalpam apy asya dharmasya trayate mahato bhayat" (Bhagavad Gita 2.40)
 * — Even a little of this practice protects one from great fear; no effort is ever lost.
 * 
 * Non-judgmental, warm, elevating reflections for any degree of practice (1, 3, or all 10).
 */

export function getSacredCompletionTier(completedCount, totalCount, practices = []) {
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  if (completedCount === 0) {
    return {
      tier: 'quiet_dawn',
      headline: 'The Sacred Space Awaits',
      badge: '🕊️ Quiet Presence',
      badgeClass: 'badge-quiet',
      message: `On this quiet ${dayName}, your inner altar is open. Whenever you are ready, sit in silence or take one conscious breath.`,
      subtext: 'No haste, no burden. The sacred journey unfolds moment by moment.',
      suggestedReflection: `Greeting this ${dayName} with quiet presence and stillness. 🙏`,
      canShare: false,
    };
  }

  const ratio = totalCount > 0 ? completedCount / totalCount : 0;
  const practiceListStr = practices.slice(0, 3).join(', ');
  const moreCount = practices.length > 3 ? practices.length - 3 : 0;
  const summaryStr = moreCount > 0 ? `${practiceListStr} +${moreCount} more` : practiceListStr;

  if (completedCount === 1) {
    return {
      tier: 'sacred_spark',
      headline: 'A Sacred Seed Planted',
      badge: '🌱 Single Offering',
      badgeClass: 'badge-spark',
      message: `One practice consecrated on this ${dayName}: ${summaryStr}. A single conscious offering shifts inner energies and grounds the soul.`,
      subtext: 'Every breath upon this path holds infinite value. No effort is ever wasted.',
      suggestedReflection: `Consecrated ${summaryStr} today. One conscious step upon the path. Quietly grateful. 🙏`,
      canShare: true,
    };
  }

  if (ratio < 0.5) {
    // E.g. 3 out of 10
    return {
      tier: 'steady_flame',
      headline: `${completedCount} Sacred Offerings Grounding Your ${dayName}`,
      badge: '🪷 Steady Flame',
      badgeClass: 'badge-flame',
      message: `You consecrated ${completedCount} practices today (${summaryStr}). The flame of sadhana is steadily burning. Consistency of the heart matters far more than checking every box.`,
      subtext: 'Living sadhana is meeting life with presence, however much time you gave today.',
      suggestedReflection: `Anchored ${completedCount} sacred practices today (${summaryStr}). Flowing with steady grace this ${dayName}. 🙏`,
      canShare: true,
    };
  }

  if (ratio < 1.0) {
    // E.g. 6-8 out of 10
    return {
      tier: 'luminous_flow',
      headline: `${completedCount} of ${totalCount} Sadhanas in Harmony`,
      badge: '☀️ Luminous Flow',
      badgeClass: 'badge-luminous',
      message: `A deep, luminous rhythm on this ${dayName}. ${completedCount} practices consecrated with unwavering presence and dedication.`,
      subtext: 'Your inner compass is steady and bright. Grace flows through daily discipline.',
      suggestedReflection: `Completed ${completedCount} practices today including ${summaryStr}. Deep peace and clarity in the flow. 🪷`,
      canShare: true,
    };
  }

  // 100% completed
  return {
    tier: 'complete_mandala',
    headline: 'Full Mandala of Practice Consecrated',
    badge: '🏔️ Complete Mandala',
    badgeClass: 'badge-mandala',
    message: `All ${totalCount} sacred practices offered today in complete stillness and dedication. A sacred sanctuary within.`,
    subtext: 'A day of complete inner consecration. May the stillness and peace remain with you always.',
    suggestedReflection: `Completed all ${totalCount} sacred practices today on ${dayName}. Boundless gratitude for the path and the fellowship. 🏔️🙏`,
    canShare: true,
  };
}
