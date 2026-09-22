/**
 * Isha Foundation Spiritual Program Catalog & Authentic Prerequisite Rules
 * Modeled after the Sadhguru / Isha Guru App program architecture.
 *
 * Lineage & Progression Hierarchy:
 * 1. Inner Engineering (Foundation) -> Initiates into Shambhavi Mahamudra Kriya
 *    (Requires 40-day twice-daily mandala)
 * 2. Bhava Spandana Program (BSP) -> Requires Inner Engineering
 * 3. Shoonya Intensive -> Requires Inner Engineering + completed Shambhavi Mandala
 *    (Initiates into Shakti Chalana Kriya & Shoonya Meditation)
 * 4. Samyama (Culmination) -> Requires Inner Engineering + BSP + Shoonya Intensive
 *    (Initiates into Samyama Sadhana)
 *
 * Classical Hatha Yoga Standalones (Surya Kriya, Yogasanas, Angamardana, Bhuta Shuddhi):
 * Accessible independently to strengthen the physical vessel (Annamaya Kosha).
 */

const PROGRAM_CATALOG = [
  {
    id: 'inner_engineering',
    name: 'Inner Engineering',
    category: 'Foundation',
    level: 1,
    prerequisites: [],
    requiresMandala: false,
    transmitsPractices: ['Shambhavi Mahamudra'],
    description: 'A comprehensive 7-session technology for inner transformation, culminating in the sacred initiation into Shambhavi Mahamudra Kriya.',
    guidance: 'Open to all seekers. The essential foundation of all advanced spiritual practices in the Isha lineage.',
    duration: '4-7 Days (Online or In-Person)',
    icon: '👁️',
  },
  {
    id: 'bhava_spandana',
    name: 'Bhava Spandana Program (BSP)',
    category: 'Advanced Experiential',
    level: 2,
    prerequisites: ['inner_engineering'],
    requiresMandala: false,
    transmitsPractices: [],
    description: 'An intensive residential program conducted in consecrated spaces, dissolving individual physical and psychological boundaries into an overwhelming explosion of devotion.',
    guidance: 'Requires prior completion of Inner Engineering and initiation into Shambhavi Mahamudra.',
    duration: '4 Days (Residential)',
    icon: '🌊',
  },
  {
    id: 'shoonya_intensive',
    name: 'Shoonya Intensive',
    category: 'Advanced Kriya & Meditation',
    level: 2,
    prerequisites: ['inner_engineering'],
    requiresMandala: true,
    mandalaPractice: 'Shambhavi Mahamudra',
    transmitsPractices: ['Shoonya Meditation', 'Shakti Chalana Kriya'],
    description: 'A 4-day residential transmission combining Shakti Chalana Kriya (subtle pranic activation) and Shoonya (conscious, effortless non-doing meditation).',
    guidance: 'Requires Inner Engineering completion PLUS a committed 40-day twice-daily completion of Shambhavi Mahamudra mandala.',
    duration: '4 Days (Residential)',
    icon: '🌌',
  },
  {
    id: 'samyama',
    name: 'Samyama',
    category: 'Culmination & Deep Absorption',
    level: 3,
    prerequisites: ['inner_engineering', 'bhava_spandana', 'shoonya_intensive'],
    requiresMandala: true,
    mandalaPractice: 'Shoonya Intensive Sadhana',
    transmitsPractices: ['Samyama Sadhana'],
    description: 'The pinnacle 8-day silence program conducted by Sadhguru, opening experiential states beyond karma, physical nature, and sensory limitations.',
    guidance: 'Requires Inner Engineering, Bhava Spandana, Shoonya Intensive, and a minimum of 60 days dedicated daily practice of Shakti Chalana Kriya and Shoonya meditation.',
    duration: '8 Days (Residential Silence)',
    icon: '🏔️',
  },
  {
    id: 'surya_kriya',
    name: 'Surya Kriya',
    category: 'Classical Hatha Yoga',
    level: 1,
    prerequisites: [],
    requiresMandala: false,
    transmitsPractices: ['Surya Kriya'],
    description: 'A potent 21-step yogic practice that activates the solar plexus to raise the samat-prana, creating physical vitality and profound mental balance.',
    guidance: 'Open to any seeker aged 14+. No prior yoga experience required.',
    duration: '2 Days (Workshop)',
    icon: '☀️',
  },
  {
    id: 'yogasanas',
    name: 'Yogasanas',
    category: 'Classical Hatha Yoga',
    level: 1,
    prerequisites: [],
    requiresMandala: false,
    transmitsPractices: ['Yogasanas'],
    description: 'A set of 84 powerful postures to align human geometry with cosmic geometry, elevating spiritual consciousness naturally.',
    guidance: 'Open to all seekers. Can be learned independently or alongside Inner Engineering.',
    duration: '2-4 Days (Workshop)',
    icon: '🧘',
  },
  {
    id: 'angamardana',
    name: 'Angamardana',
    category: 'Classical Hatha Yoga',
    level: 1,
    prerequisites: [],
    requiresMandala: false,
    transmitsPractices: ['Angamardana'],
    description: 'A vigorous 31-step system utilizing the body’s own weight to strengthen ligaments, tendons, and muscles without any equipment.',
    guidance: 'Open to seekers seeking peak physical fitness, agility, and flexibility.',
    duration: '2 Days (Workshop)',
    icon: '💪',
  },
  {
    id: 'bhuta_shuddhi',
    name: 'Bhuta Shuddhi',
    category: 'Classical Hatha Yoga',
    level: 1,
    prerequisites: [],
    requiresMandala: false,
    transmitsPractices: ['Bhuta Shuddhi'],
    description: 'Purification of the five elements (Earth, Water, Fire, Air, Space) within the human system, freeing the seeker from physical and psychological compulsions.',
    guidance: 'Open to all seekers. Simple 15-minute daily sadhana using a copper consecrated kit.',
    duration: 'Half-Day Transmission',
    icon: '🪔',
  },
];

/**
 * Returns the entire program catalog map indexed by programId
 */
function getCatalogMap() {
  const map = {};
  for (const prog of PROGRAM_CATALOG) {
    map[prog.id] = prog;
  }
  return map;
}

/**
 * Evaluates the user's eligibility for all programs given:
 * @param {Array<string>} completedProgramIds - Array of program IDs the user has completed
 * @param {Object} mandalaStatus - The user's current or completed mandala state
 * @returns {Array<Object>} Program items enriched with eligibility, completion status, and missing prerequisites
 */
function evaluateProgramEligibility(completedProgramIds = [], mandalaStatus = {}) {
  const catalogMap = getCatalogMap();
  const completedSet = new Set(completedProgramIds);

  return PROGRAM_CATALOG.map((program) => {
    const isCompleted = completedSet.has(program.id);
    const missingPrerequisites = [];

    // Check prerequisite programs
    for (const prereqId of program.prerequisites) {
      if (!completedSet.has(prereqId)) {
        const prereqProg = catalogMap[prereqId];
        missingPrerequisites.push({
          programId: prereqId,
          programName: prereqProg ? prereqProg.name : prereqId,
          reason: `Requires completion of ${prereqProg ? prereqProg.name : prereqId}`,
        });
      }
    }

    // Check mandala requirement if applicable
    let mandalaSatisfied = true;
    if (program.requiresMandala && !isCompleted) {
      // If program requires Shambhavi mandala:
      if (program.id === 'shoonya_intensive') {
        const shambhaviMandalaDone = mandalaStatus?.completedDays >= 40 ||
          (mandalaStatus?.practiceName === 'Shambhavi Mahamudra' && mandalaStatus?.completedDays >= 40) ||
          completedSet.has('inner_engineering'); // IE graduates who committed to their practice
        if (!shambhaviMandalaDone && !completedSet.has('inner_engineering')) {
          mandalaSatisfied = false;
          missingPrerequisites.push({
            type: 'mandala',
            practice: 'Shambhavi Mahamudra',
            reason: 'Completion of the 40-day twice-daily Shambhavi Mahamudra mandala is required.',
          });
        }
      }
    }

    const isEligible = !isCompleted && missingPrerequisites.length === 0 && mandalaSatisfied;

    return {
      ...program,
      isCompleted,
      isEligible,
      isLocked: !isCompleted && !isEligible,
      missingPrerequisites,
    };
  });
}

module.exports = {
  PROGRAM_CATALOG,
  getCatalogMap,
  evaluateProgramEligibility,
};
