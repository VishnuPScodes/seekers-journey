try {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
} catch (_) {}

const mongoose = require('mongoose');
const User = require('../models/User');
const AdminNotification = require('../models/AdminNotification');
const { syncAdminNotifications } = require('../services/notificationService');

async function seedNotifications() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ MONGO_URI missing in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('🌱 Connected to MongoDB for notification seeding...');

    // Trigger sync & dummy generation
    await syncAdminNotifications();

    const count = await AdminNotification.countDocuments({});
    const unread = await AdminNotification.countDocuments({ isRead: false });

    console.log(`✅ Successfully seeded notifications! Total: ${count} | Unread: ${unread}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding notifications failed:', err);
    process.exit(1);
  }
}

seedNotifications();
