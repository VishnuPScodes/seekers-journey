/**
 * Seed authentic Isha Program Completion records for all primary seeker personas.
 * Enforces true lineage & prerequisites:
 * - Inner Engineering (Foundation -> Shambhavi Mahamudra Initiation)
 * - Bhava Spandana Program (BSP)
 * - Shoonya Intensive (Requires IE + completed Shambhavi Mandala)
 * - Samyama (Requires IE + BSP + Shoonya Intensive)
 * - Classical Hatha Yoga (Surya Kriya, Yogasanas, Angamardana, Bhuta Shuddhi)
 */

const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch (_) {}
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProgram = require('../models/UserProgram');

const PERSONA_PROGRAMS = {
  'dikshantbisht10@gmail.com': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 500 * 86400000),
      location: 'Bengaluru, India',
      reflection: 'The initiation into Shambhavi Mahamudra was the first time I experienced life beyond my thoughts and emotions.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      programId: 'surya_kriya',
      programName: 'Surya Kriya',
      status: 'completed',
      completionDate: new Date(Date.now() - 360 * 86400000),
      location: 'Bengaluru, India',
      reflection: 'A profound solar practice that creates immense stability and inner furnace.',
      transmitsPractices: ['Surya Kriya'],
    },
    {
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(Date.now() - 210 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Spanda Hall melted every boundary. An overwhelming explosion of devotion beyond thought.',
      transmitsPractices: [],
    },
  ],
  'dikshant@gmail.com': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 500 * 86400000),
      location: 'Bengaluru, India',
      reflection: 'The initiation into Shambhavi Mahamudra was the first time I experienced life beyond my thoughts and emotions.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      programId: 'surya_kriya',
      programName: 'Surya Kriya',
      status: 'completed',
      completionDate: new Date(Date.now() - 360 * 86400000),
      location: 'Bengaluru, India',
      reflection: 'A profound solar practice that creates immense stability and inner furnace.',
      transmitsPractices: ['Surya Kriya'],
    },
    {
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(Date.now() - 210 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Spanda Hall melted every boundary. An overwhelming explosion of devotion beyond thought.',
      transmitsPractices: [],
    },
  ],
  'diksh@gmail.com': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 500 * 86400000),
      location: 'Bengaluru, India',
      reflection: 'The initiation into Shambhavi Mahamudra was the first time I experienced life beyond my thoughts and emotions.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      programId: 'surya_kriya',
      programName: 'Surya Kriya',
      status: 'completed',
      completionDate: new Date(Date.now() - 360 * 86400000),
      location: 'Bengaluru, India',
      reflection: 'A profound solar practice that creates immense stability and inner furnace.',
      transmitsPractices: ['Surya Kriya'],
    },
    {
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(Date.now() - 210 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Spanda Hall melted every boundary. An overwhelming explosion of devotion beyond thought.',
      transmitsPractices: [],
    },
    {
      programId: 'shoonya_intensive',
      programName: 'Shoonya Intensive',
      status: 'completed',
      completionDate: new Date(Date.now() - 60 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Conscious stillness in Shoonya. Prana actively vibrant through Shakti Chalana.',
      transmitsPractices: ['Shoonya Meditation', 'Shakti Chalana Kriya'],
    },
  ],
  'priya.nair@seekers.journey': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 110 * 86400000),
      location: 'Kochi, Kerala',
      reflection: 'Stepping into conscious living. Shambhavi has brought stillness to anxious days.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
  ],
  'anand.sharma@seekers.journey': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 900 * 86400000),
      location: 'New Delhi, India',
      reflection: 'A turning point that grounded my high-stress corporate career.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      programId: 'surya_kriya',
      programName: 'Surya Kriya',
      status: 'completed',
      completionDate: new Date(Date.now() - 750 * 86400000),
      location: 'New Delhi, India',
      reflection: 'Physical agility and rhythmic breath aligning together.',
      transmitsPractices: ['Surya Kriya'],
    },
    {
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(Date.now() - 540 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Devotion felt as tangible reality, not mere belief.',
      transmitsPractices: [],
    },
    {
      programId: 'shoonya_intensive',
      programName: 'Shoonya Intensive',
      status: 'completed',
      completionDate: new Date(Date.now() - 240 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Conscious stillness in Shoonya. Prana actively vibrant through Shakti Chalana.',
      transmitsPractices: ['Shoonya Meditation', 'Shakti Chalana Kriya'],
    },
  ],
  'rajesh.menon@seekers.journey': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 3000 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Over three decades of clinical practice transformed into deep inner perception.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      programId: 'surya_kriya',
      programName: 'Surya Kriya',
      status: 'completed',
      completionDate: new Date(Date.now() - 2600 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'The sun within awakened.',
      transmitsPractices: ['Surya Kriya'],
    },
    {
      programId: 'yogasanas',
      programName: 'Yogasanas',
      status: 'completed',
      completionDate: new Date(Date.now() - 2200 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Geometry aligning with existence.',
      transmitsPractices: ['Yogasanas'],
    },
    {
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(Date.now() - 2000 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'An ocean of tenderness.',
      transmitsPractices: [],
    },
    {
      programId: 'shoonya_intensive',
      programName: 'Shoonya Intensive',
      status: 'completed',
      completionDate: new Date(Date.now() - 1700 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Stillness that is completely awake.',
      transmitsPractices: ['Shoonya Meditation', 'Shakti Chalana Kriya'],
    },
    {
      programId: 'samyama',
      programName: 'Samyama',
      status: 'completed',
      completionDate: new Date(Date.now() - 1100 * 86400000),
      location: 'Spanda Hall, Isha Yoga Center, Coimbatore',
      reflection: 'Eight days of profound silence in the presence of the Master. Everything dissolved.',
      transmitsPractices: ['Samyama Sadhana'],
    },
  ],
  'meera.iyer@seekers.journey': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 400 * 86400000),
      location: 'Chennai, India',
      reflection: 'The chants and Shambhavi opened an inner wellspring of joy.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      programId: 'bhuta_shuddhi',
      programName: 'Bhuta Shuddhi',
      status: 'completed',
      completionDate: new Date(Date.now() - 300 * 86400000),
      location: 'Chennai, India',
      reflection: 'Deep cleansing of elements before daily sadhana.',
      transmitsPractices: ['Bhuta Shuddhi'],
    },
    {
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(Date.now() - 150 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Tears of pure gratitude at Spanda Hall.',
      transmitsPractices: [],
    },
  ],
  'vikram.joshi@seekers.journey': [
    {
      programId: 'inner_engineering',
      programName: 'Inner Engineering',
      status: 'completed',
      completionDate: new Date(Date.now() - 700 * 86400000),
      location: 'Pune, Maharashtra',
      reflection: 'Structured logic with an experiential breakthrough.',
      transmitsPractices: ['Shambhavi Mahamudra'],
    },
    {
      programId: 'surya_kriya',
      programName: 'Surya Kriya',
      status: 'completed',
      completionDate: new Date(Date.now() - 550 * 86400000),
      location: 'Pune, Maharashtra',
      reflection: 'Steadiness of body during high-altitude treks.',
      transmitsPractices: ['Surya Kriya'],
    },
    {
      programId: 'angamardana',
      programName: 'Angamardana',
      status: 'completed',
      completionDate: new Date(Date.now() - 400 * 86400000),
      location: 'Pune, Maharashtra',
      reflection: 'Endurance and tendon strength elevated completely.',
      transmitsPractices: ['Angamardana'],
    },
    {
      programId: 'bhava_spandana',
      programName: 'Bhava Spandana Program (BSP)',
      status: 'completed',
      completionDate: new Date(Date.now() - 180 * 86400000),
      location: 'Isha Yoga Center, Coimbatore',
      reflection: 'Beyond mental boundaries.',
      transmitsPractices: [],
    },
  ],
};

const { syncUserProgramEvents } = require('../utils/programSyncHelper');

async function seedUserPrograms() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { tls: true });
    console.log('✅ Connected to MongoDB Atlas');

    let totalInserted = 0;

    for (const [email, programs] of Object.entries(PERSONA_PROGRAMS)) {
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`⚠️ User not found for ${email}`);
        continue;
      }

      // Upsert programs for this user
      for (const prog of programs) {
        await UserProgram.findOneAndUpdate(
          { userId: user._id, programId: prog.programId },
          {
            $set: {
              ...prog,
              userId: user._id,
            },
          },
          { upsert: true, new: true }
        );
        totalInserted++;
      }

      // Synchronize with JourneyEvents River of Time timeline
      await syncUserProgramEvents(user._id);

      console.log(`✅ Seeded & synced ${programs.length} authentic programs for ${user.name} (${email})`);
    }

    console.log(`🎉 Finished seeding. Total programs upserted: ${totalInserted}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding user programs:', err);
    process.exit(1);
  }
}

seedUserPrograms();
