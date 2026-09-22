const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const User = require('../models/User');

async function updateActiveStatus() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in process.env!');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully!');

    const users = await User.find({});
    console.log(`Found ${users.length} total users in DB.`);

    let updatedCount = 0;
    const now = new Date();

    for (const user of users) {
      let needsSave = false;

      // Ensure lastActivityDate exists
      if (!user.lastActivityDate) {
        user.lastActivityDate = user.createdAt || user.journeyStartDate || now;
        needsSave = true;
      }

      // If user joined recently, ensure active status is aligned
      if (needsSave) {
        await user.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} users with lastActivityDate!`);
    mongoose.connection.close();
  } catch (err) {
    console.error('Error updating active status:', err);
    process.exit(1);
  }
}

updateActiveStatus();
