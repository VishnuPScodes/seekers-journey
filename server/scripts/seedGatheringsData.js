/**
 * Seed rich, authentic Isha Gatherings with venue, agenda, guidelines, host contacts,
 * join requests, and initial gathering chat messages.
 */

const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch (_) {}
const mongoose = require('mongoose');
const User = require('../models/User');
const { Sangha, SanghaEvent, GatheringChatMessage } = require('../models/community');

async function seedGatherings() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { tls: true });
    console.log('✅ Connected to MongoDB Atlas');

    // Find our primary users
    const [dikshant, rajesh, meera, anand, vikram, priya] = await Promise.all([
      User.findOne({ email: 'dikshantbisht10@gmail.com' }),
      User.findOne({ email: 'rajesh.menon@seekers.journey' }),
      User.findOne({ email: 'meera.iyer@seekers.journey' }),
      User.findOne({ email: 'anand.sharma@seekers.journey' }),
      User.findOne({ email: 'vikram.joshi@seekers.journey' }),
      User.findOne({ email: 'priya.nair@seekers.journey' }),
    ]);

    if (!dikshant || !rajesh || !meera) {
      console.error('⚠️ Required users not found. Make sure users are created first.');
      process.exit(1);
    }

    const citySangha = await Sangha.findOne({ type: 'local' }) || await Sangha.findOne({});

    // Clean existing SanghaEvents & GatheringChatMessages to ensure fresh structured state
    await SanghaEvent.deleteMany({});
    await GatheringChatMessage.deleteMany({});
    console.log('🧹 Cleaned existing gatherings and gathering chats');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(5, 30, 0, 0);

    const fullMoon = new Date();
    fullMoon.setDate(fullMoon.getDate() + 3);
    fullMoon.setHours(18, 30, 0, 0);

    const weekendTrek = new Date();
    weekendTrek.setDate(weekendTrek.getDate() + 5);
    weekendTrek.setHours(7, 0, 0, 0);

    const suryaSunday = new Date();
    suryaSunday.setDate(suryaSunday.getDate() + 6);
    suryaSunday.setHours(6, 15, 0, 0);

    const gatheringsData = [
      {
        sanghaId: citySangha?._id,
        title: 'Brahma Muhurta 5:30 AM Group Sadhana & Guru Pooja',
        description: 'Join local Bengaluru meditators in the serene quiet of early dawn for consecrated Guru Pooja, followed by Shambhavi Mahamudra Kriya together in unison.',
        eventType: 'in_person',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 2.5 * 3600000),
        venue: {
          name: 'Cubbon Park Lotus Gazebo',
          address: 'Near Central Library & Bamboo Grove, Cubbon Park',
          city: 'Bengaluru',
          mapLink: 'https://maps.google.com/?q=Cubbon+Park+Bengaluru',
        },
        contactPerson: {
          name: 'Dr. Rajesh Menon',
          phone: '+91 98450 11204',
          email: 'rajesh.menon@seekers.journey',
          ishaRole: 'Senior Isha Meditator & Hatha Mentor (30+ Yrs)',
        },
        agenda: [
          { time: '05:30 AM', activity: 'Guru Pooja & Invocation', description: 'Consecration of the sitting space with chants.' },
          { time: '05:45 AM', activity: 'Shambhavi Mahamudra Kriya', description: 'Complete preparatory asanas and 21-minute kriya together.' },
          { time: '06:45 AM', activity: 'Sukha Kriya & AUM Chanting', description: 'Stabilizing pranic currents in deep absorption.' },
          { time: '07:15 AM', activity: 'Sadhguru Discourse Reflection', description: 'Brief reflection on staying conscious in modern activity.' },
          { time: '07:45 AM', activity: 'Pranic Sattvic Herbal Tea', description: 'Gentle warm herbal tea and soaked almonds before departing.' },
        ],
        guidelines: [
          'Strict empty stomach condition required (minimum 4 hours after full dinner, or 2.5 hours after light snack).',
          'Please wear loose-fitting, light-colored natural cotton or linen clothing.',
          'Bring your own yoga mat or natural fiber sitting cloth.',
          'Maintain noble silence inside the gazebo area prior to the opening chant.',
        ],
        requiresApproval: true,
        capacity: 35,
        createdBy: rajesh._id,
        attendees: [rajesh._id, anand._id, dikshant._id],
        attendeesCount: 3,
        joinRequests: [
          {
            userId: dikshant._id,
            status: 'accepted',
            requestedAt: new Date(Date.now() - 3600000 * 12),
            note: 'Would love to join for dawn sadhana before morning work.',
          },
          {
            userId: priya._id,
            status: 'pending',
            requestedAt: new Date(Date.now() - 3600000 * 2),
            note: 'Completed my 40-day mandala and eager for group rhythm!',
          },
        ],
      },
      {
        sanghaId: citySangha?._id,
        title: 'Pournami Full Moon Silent Meditation & Devi Stotram',
        description: 'Immerse in the potent lunar night energies of Pournami. We gather for Linga Bhairavi arati, followed by unbroken collective silence and energized prasadam.',
        eventType: 'in_person',
        startTime: fullMoon,
        endTime: new Date(fullMoon.getTime() + 2 * 3600000),
        venue: {
          name: 'Isha Chidambaram Hall',
          address: '42, 100ft Road, Near HAL 2nd Stage, Indiranagar',
          city: 'Bengaluru',
          mapLink: 'https://maps.google.com/?q=Indiranagar+Bengaluru',
        },
        contactPerson: {
          name: 'Meera Iyer',
          phone: '+91 97412 88390',
          email: 'meera.iyer@seekers.journey',
          ishaRole: 'Devi Vandana & Bhairavi Seva Sadhaka',
        },
        agenda: [
          { time: '06:30 PM', activity: 'Linga Bhairavi Arati & Chants', description: 'Opening sounds and traditional offering lamp.' },
          { time: '07:00 PM', activity: 'Devi Stotram Chanting', description: 'Group resonance with consecrated mantras.' },
          { time: '07:45 PM', activity: '45-Min Pournami Silent Meditation', description: 'Conscious stillness under full moon lunar window.' },
          { time: '08:30 PM', activity: 'Consecrated Prasadam Distribution', description: 'Warm sweet payasam offering.' },
        ],
        guidelines: [
          'Open to all seekers initiated into Isha Kriya or Shambhavi Mahamudra.',
          'Traditional Indian clothing or modest light attire strongly encouraged.',
          'Mobile devices must be placed on silent mode / turned off during meditation.',
        ],
        requiresApproval: true,
        capacity: 50,
        createdBy: meera._id,
        attendees: [meera._id, priya._id, dikshant._id],
        attendeesCount: 3,
        joinRequests: [
          {
            userId: dikshant._id,
            status: 'accepted',
            requestedAt: new Date(Date.now() - 3600000 * 24),
            note: 'Looking forward to the silent meditation.',
          },
        ],
      },
      {
        sanghaId: citySangha?._id,
        title: 'Kailash Manasarovar Yatra: High-Altitude Breathwork & Satsang',
        description: 'Online sanctuary session designed for aspiring and returning Kailash yatris. Focuses on diaphragmatic training, lung expansion via Simha Kriya, and altitude readiness.',
        eventType: 'online',
        startTime: weekendTrek,
        endTime: new Date(weekendTrek.getTime() + 1.5 * 3600000),
        locationOrLink: 'https://meet.jit.si/SeekersKailashSanctuaryLive',
        venue: {
          name: 'Consecrated Virtual Zoom Sanctuary',
          address: 'Online Video Link (Shared upon acceptance)',
          city: 'Global',
          mapLink: '',
        },
        contactPerson: {
          name: 'Vikram Joshi',
          phone: '+91 99230 44109',
          email: 'vikram.joshi@seekers.journey',
          ishaRole: '5-Time Kailash Yatra Volunteer & Guide',
        },
        agenda: [
          { time: '07:00 AM', activity: 'High Altitude Physiology & Breath', description: 'Understanding oxygen saturation and thoracic capacity.' },
          { time: '07:30 AM', activity: 'Guided Simha Kriya & Nadi Shuddhi', description: 'Powerful respiratory activation for lung strength.' },
          { time: '08:00 AM', activity: 'Packing & Sacred Etiquette on Yatra', description: 'Practical recommendations from veteran yatris.' },
          { time: '08:30 AM', activity: 'Q&A & Kailash Chants', description: 'Chanting Shiva Shambho together.' },
        ],
        guidelines: [
          'Ensure a well-ventilated, quiet room free from distractions.',
          'Keep a notebook and drinking water accessible.',
          'Keep your camera turned on during breathwork demonstrations for posture guidance.',
        ],
        requiresApproval: false,
        capacity: 100,
        createdBy: vikram._id,
        attendees: [vikram._id, anand._id, dikshant._id],
        attendeesCount: 3,
        joinRequests: [],
      },
      {
        sanghaId: citySangha?._id,
        title: 'Sunday Morning Surya Kriya Mandalam & Posture Alignment',
        description: 'A focused workshop for Surya Kriya practitioners to refine geometry, breathe with precision, and deepen solar energy balance.',
        eventType: 'in_person',
        startTime: suryaSunday,
        endTime: new Date(suryaSunday.getTime() + 2 * 3600000),
        venue: {
          name: 'Sankey Tank Yoga Pavilion',
          address: 'Forest Gate Entrance, Malleshwaram West',
          city: 'Bengaluru',
          mapLink: 'https://maps.google.com/?q=Sankey+Tank+Bengaluru',
        },
        contactPerson: {
          name: 'Anand Sharma',
          phone: '+91 98112 55901',
          email: 'anand.sharma@seekers.journey',
          ishaRole: 'Certified Classical Hatha Yoga Sadhaka',
        },
        agenda: [
          { time: '06:15 AM', activity: 'Solar Invocation & Sukha Kriya', description: 'Calibrating the ida and pingala nadis.' },
          { time: '06:30 AM', activity: 'Surya Kriya Practice (3 Cycles)', description: 'Practicing slowly to align internal geometry.' },
          { time: '07:20 AM', activity: 'Posture Correction & Q&A', description: 'Personalized attention to spine elongation and foot angles.' },
          { time: '07:50 AM', activity: 'Shanti Mantra & Soaked Almonds', description: 'Gentle closing.' },
        ],
        guidelines: [
          'Strictly for practitioners already initiated into Surya Kriya.',
          'Empty stomach condition mandatory (4 hours minimum after meal).',
          'Please bring your own organic cotton or natural rubber mat.',
        ],
        requiresApproval: true,
        capacity: 20,
        createdBy: anand._id,
        attendees: [anand._id, rajesh._id],
        attendeesCount: 2,
        joinRequests: [
          {
            userId: priya._id,
            status: 'pending',
            requestedAt: new Date(Date.now() - 3600000 * 5),
            note: 'Would love to calibrate my Surya Kriya breath rhythm.',
          },
        ],
      },
    ];

    const insertedEvents = await SanghaEvent.insertMany(gatheringsData);
    console.log(`✅ Seeded ${insertedEvents.length} rich gatherings with full agenda and guidelines`);

    // Seed realistic Gathering Chat Messages for the dawn gathering & full moon gathering
    const dawnEvent = insertedEvents[0];
    const fullMoonEvent = insertedEvents[1];

    const dawnMessages = [
      {
        gatheringId: dawnEvent._id,
        senderId: rajesh._id,
        content: 'Pranam everyone 🙏 The morning weather in Cubbon Park is crisp and cool. The gazebo floor has been swept and consecrated. Looking forward to sitting together tomorrow at 5:30 AM.',
        createdAt: new Date(Date.now() - 3600000 * 8),
      },
      {
        gatheringId: dawnEvent._id,
        senderId: anand._id,
        content: 'Pranam Dr. Rajesh! I will bring extra organic cotton blankets for anyone who feels the morning chill during Shambhavi.',
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        gatheringId: dawnEvent._id,
        senderId: dikshant._id,
        content: 'Thank you both. I have confirmed my empty stomach window and will arrive by 5:20 AM so we can settle into silence before 5:30 AM.',
        createdAt: new Date(Date.now() - 3600000 * 1),
      },
    ];

    const fullMoonMessages = [
      {
        gatheringId: fullMoonEvent._id,
        senderId: meera._id,
        content: 'Devi prasad has been lovingly prepared with dry fruits, cardamom, and mountain honey. Please arrive 15 minutes before 6:30 PM so we can start the arati on time. 🌺',
        createdAt: new Date(Date.now() - 3600000 * 14),
      },
      {
        gatheringId: fullMoonEvent._id,
        senderId: dikshant._id,
        content: 'Pranam Meera ji, looking forward to the 45-minute collective silence under the Pournami moon.',
        createdAt: new Date(Date.now() - 3600000 * 6),
      },
    ];

    await GatheringChatMessage.insertMany([...dawnMessages, ...fullMoonMessages]);
    console.log('✅ Seeded authentic Gathering Chat discussions for accepted attendees');

    console.log('🎉 Gatherings seeding complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding gatherings:', err);
    process.exit(1);
  }
}

seedGatherings();
