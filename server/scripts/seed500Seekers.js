try {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
} catch (_) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Bhavna', 'Chetan', 'Deepa', 'Dev', 'Divya', 'Gautam',
  'Ishaan', 'Kavita', 'Madhav', 'Meera', 'Nikhil', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Rhea',
  'Rohan', 'Sakshi', 'Sanjay', 'Shreya', 'Siddharth', 'Sneha', 'Tanvi', 'Varun', 'Vidya', 'Vikram',
  'Abhinav', 'Akanksha', 'Amit', 'Anushka', 'Ashok', 'Bhaskar', 'Chitra', 'Deepak', 'Ganesh', 'Harish',
  'Jyoti', 'Karthik', 'Lakshmi', 'Manish', 'Nandini', 'Pallavi', 'Rajesh', 'Ritu', 'Sameer', 'Swati',
  'Tarun', 'Uma', 'Venkatesh', 'Yash', 'Aishwarya', 'Alok', 'Archana', 'Balaji', 'Darshan', 'Gayatri'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Iyer', 'Patel', 'Reddy', 'Verma', 'Nair', 'Menon', 'Kulkarni', 'Deshmukh', 'Joshi',
  'Rao', 'Bhat', 'Gupta', 'Singh', 'Chopra', 'Mukherjee', 'Pillai', 'Hegde', 'Shenoy', 'Bisht',
  'Nambiar', 'Gowda', 'Shetty', 'Venkatesan', 'Swamy', 'Prabhu', 'Tiwari', 'Pandey', 'Agrawal', 'Dutta'
];

const CITIES = [
  { city: 'Bengaluru', region: 'Karnataka' },
  { city: 'Coimbatore', region: 'Tamil Nadu' },
  { city: 'Chennai', region: 'Tamil Nadu' },
  { city: 'Hyderabad', region: 'Telangana' },
  { city: 'Mumbai', region: 'Maharashtra' },
  { city: 'Delhi NCR', region: 'Delhi' },
  { city: 'Pune', region: 'Maharashtra' },
  { city: 'Kochi', region: 'Kerala' },
  { city: 'Mysuru', region: 'Karnataka' },
  { city: 'Jaipur', region: 'Rajasthan' },
  { city: 'Ahmedabad', region: 'Gujarat' },
  { city: 'Thiruvananthapuram', region: 'Kerala' },
];

const NON_SHAMBHAVI_PRACTICES = [
  ['Surya Kriya', 'Sukha Kriya'],
  ['Isha Kriya', 'Nadi Shuddhi', 'Guru Pooja'],
  ['Surya Namaskar', 'Sukha Kriya', 'Simha Kriya'],
  ['Yoga Namaskar', 'Isha Kriya'],
  ['Surya Kriya', 'Bhakti Sadhana', 'Nadi Shuddhi'],
  ['Isha Kriya', 'Surya Namaskar', 'Chanting'],
  ['Surya Kriya', 'Guru Pooja'],
  ['Yoga Namaskar', 'Sukha Kriya', 'Isha Kriya'],
];

const SHAMBHAVI_PRACTICES = [
  ['Shambhavi Mahamudra'],
  ['Shambhavi Mahamudra', 'Surya Kriya'],
  ['Shambhavi Mahamudra', 'Sukha Kriya', 'Isha Kriya'],
  ['Shambhavi Mahamudra', 'Surya Namaskar', 'Nadi Shuddhi'],
  ['Shambhavi Mahamudra', 'Surya Kriya', 'Guru Pooja'],
  ['Shambhavi Mahamudra', 'Shoonya Meditation', 'Shakti Chalana Kriya'],
];

async function generate500Seekers() {
  console.log('🌱 Generating 500 authentic Indian seekers...');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing in environment variables');
    process.exit(1);
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  }

  const hashedPassword = await bcrypt.hash('seeker123', 10);

  // Clean old synthetic users (preserve admin and demo users)
  console.log('🧹 Purging old synthetic seekers dataset...');
  await User.deleteMany({ isSynthetic: true, email: { $nin: ['admin@sadhana.com', 'admin@seekers.com', 'diksh@gmail.com'] } });

  const now = new Date();
  const usersToInsert = [];

  for (let i = 1; i <= 500; i++) {
    const fName = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
    const lName = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)];
    const name = `${fName} ${lName}`;
    const email = `seeker_${i}_${fName.toLowerCase()}${i}@seekers.sadhana.io`;
    const loc = CITIES[Math.floor(Math.random() * CITIES.length)];

    // 50% Meditators (have Shambhavi Mahamudra), 50% Non-Meditators (other sadhanas)
    const isMeditator = Math.random() < 0.50;
    const selectedPractices = isMeditator
      ? SHAMBHAVI_PRACTICES[Math.floor(Math.random() * SHAMBHAVI_PRACTICES.length)]
      : NON_SHAMBHAVI_PRACTICES[Math.floor(Math.random() * NON_SHAMBHAVI_PRACTICES.length)];

    // Join date distribution:
    // 35% joined in last 100 days (1 to 99 days ago)
    // 65% joined older (101 to 900 days ago)
    const isNewJoiner = Math.random() < 0.35;
    const daysAgo = isNewJoiner
      ? Math.floor(Math.random() * 95) + 1
      : Math.floor(Math.random() * 800) + 101;

    const joinDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Levels: range 1 to 108. Non-meditators can also be high level (e.g. Lvl 45, 78, 108)!
    // Generate realistic cumulative scores
    const currentLevel = Math.floor(Math.random() * 108) + 1;
    const totalCumulativeScore = currentLevel * 100 + Math.floor(Math.random() * 95);

    const practiceConfig = selectedPractices.map(pName => ({
      name: pName,
      dailyTarget: pName.includes('Shambhavi') ? 2 : pName.includes('Namaskar') ? 12 : 1,
      category: pName.includes('Kriya') ? 'Kriya' : pName.includes('Meditation') ? 'Meditation' : 'Hatha Yoga',
      isCustom: false,
    }));

    // Activity distribution:
    // 25% active today (0 days ago)
    // 35% active 1 to 7 days ago
    // 25% active 8 to 30 days ago
    // 15% active 31 to 120 days ago
    const actRand = Math.random();
    const daysInactive = actRand < 0.25 ? 0
      : actRand < 0.60 ? Math.floor(Math.random() * 7) + 1
      : actRand < 0.85 ? Math.floor(Math.random() * 23) + 8
      : Math.floor(Math.random() * 90) + 31;

    const lastActiveDate = new Date(Math.max(joinDate.getTime(), now.getTime() - daysInactive * 24 * 60 * 60 * 1000));

    usersToInsert.push({
      name,
      email,
      password: hashedPassword,
      city: loc.city,
      region: loc.region,
      selectedPractices,
      practiceConfig,
      practicesSelected: true,
      currentLevel,
      totalCumulativeScore,
      createdAt: joinDate,
      journeyStartDate: joinDate,
      lastActivityDate: lastActiveDate,
      isSynthetic: true,
      isAdmin: false,
      mandalaStatus: {
        active: isMeditator && Math.random() < 0.4,
        practiceName: 'Shambhavi Mahamudra',
        targetDays: 40,
        currentDay: Math.floor(Math.random() * 30) + 1,
        completedDays: Math.floor(Math.random() * 25) + 1,
      },
    });
  }

  console.log(`📥 Batch inserting 500 Seekers into MongoDB...`);
  await User.insertMany(usersToInsert, { ordered: false });

  // Count summary
  const total = await User.countDocuments();
  const nonMeditatorsCount = usersToInsert.filter(u => !u.selectedPractices.some(p => p.toLowerCase().includes('shambhavi'))).length;
  const newJoinersCount = usersToInsert.filter(u => u.createdAt >= new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)).length;

  console.log(`\n🎉 Success! Seeded 500 Seekers:`);
  console.log(`   • Total Users in DB: ${total}`);
  console.log(`   • Non-Meditators (no Shambhavi): ${nonMeditatorsCount}`);
  console.log(`   • New Joiners (Last 100 Days): ${newJoinersCount}`);
  console.log(`   • Level Distribution: Both Meditators and Non-Meditators span Level 1 to 108!`);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  generate500Seekers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error generating 500 seekers:', err);
      process.exit(1);
    });
}

module.exports = generate500Seekers;
