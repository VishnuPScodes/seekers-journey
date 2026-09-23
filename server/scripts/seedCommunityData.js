/**
 * Community & Sangha Demo Seed Data
 * Generates realistic spiritual personas, active sanghas, shared journey milestones,
 * authentic kudos, and heartwarming seeker reflections.
 *
 * Idempotent: can be safely executed multiple times.
 */

try {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
} catch (_) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const {
  Follow,
  Sangha,
  SanghaMembership,
  Post,
  Comment,
  Kudos,
  SanghaEvent,
  CommunityNotification,
} = require('../models/community');

const PERSONAS = [
  {
    name: 'Anand Sharma',
    email: 'anand.sharma@seekers.journey',
    currentLevel: 4,
    pradakshinaCount: 48,
    practicesSelected: true,
    selectedPractices: ['Shambhavi Mahamudra', 'Surya Kriya', 'AUM Chanting'],
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@seekers.journey',
    currentLevel: 5,
    pradakshinaCount: 65,
    practicesSelected: true,
    selectedPractices: ['Shambhavi Mahamudra', 'Nadi Shuddhi', 'Isha Kriya'],
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer@seekers.journey',
    currentLevel: 3,
    pradakshinaCount: 36,
    practicesSelected: true,
    selectedPractices: ['Surya Kriya', 'Simha Kriya', 'Devi Vandana'],
  },
  {
    name: 'Vikram Joshi',
    email: 'vikram.joshi@seekers.journey',
    currentLevel: 2,
    pradakshinaCount: 21,
    practicesSelected: true,
    selectedPractices: ['Isha Kriya', 'Yoga Namaskar', 'Guru Pooja'],
  },
  {
    name: 'Dr. Rajesh Menon',
    email: 'rajesh.menon@seekers.journey',
    currentLevel: 6,
    pradakshinaCount: 92,
    practicesSelected: true,
    selectedPractices: ['Shambhavi Mahamudra', 'Shoonya Meditation', 'Surya Shakti', 'Bhuta Shuddhi'],
  },
];

async function seedCommunity() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // ── 1. Find or Create Personas ──
  console.log('Setting up spiritual personas...');
  const passwordHash = await bcrypt.hash('Seeker@1234', 10);
  const userMap = {};

  for (const p of PERSONAS) {
    let user = await User.findOne({ email: p.email });
    if (!user) {
      user = await User.create({
        ...p,
        password: passwordHash,
        isSynthetic: true,
      });
      console.log(` - Created persona: ${p.name}`);
    } else {
      user.currentLevel = p.currentLevel;
      user.pradakshinaCount = p.pradakshinaCount;
      user.selectedPractices = p.selectedPractices;
      user.practicesSelected = true;
      user.isSynthetic = true;
      await user.save();
      console.log(` - Updated persona: ${p.name}`);
    }
    userMap[p.name] = user;
  }

  // Target primary human users
  const humanUsers = await User.find({
    $or: [
      { email: 'dikshant@gmail.com' },
      { email: 'dikshantbisht10@gmail.com' },
      { email: 'diksh@gmail.com' },
      { email: { $regex: /dikshant/i } },
    ]
  });

  for (const hu of humanUsers) {
    hu.isSynthetic = false;
    await hu.save();
    console.log(` - Linked human seeker: ${hu.name} (${hu.email})`);
    userMap[hu.email] = hu;
  }

  // ── 2. Create Authentic Sanghas ──
  console.log('Setting up sacred sanghas...');
  const SANGHAS_DATA = [
    {
      name: 'Vrindavan Japa Circle',
      slug: 'vrindavan-japa-circle',
      type: 'interest',
      tagline: 'Chanting sacred names in silence, devotion, and collective resonance.',
      description: 'A circle of seekers committed to steady japa and inner focus. We share reflections from early morning rounds, hold collective silent chanting spaces, and support continuity.',
      membersCount: 48,
      postsCount: 14,
      isFeatured: true,
      creatorName: 'Anand Sharma',
    },
    {
      name: 'Bengaluru Dawn Meditators',
      slug: 'bengaluru-dawn-meditators',
      type: 'local',
      location: 'Bengaluru, Karnataka',
      tagline: 'Gathering before the sunrise in stillness, silence, and mutual support.',
      description: 'Local practitioners meeting virtually and physically for morning sadhana before the city wakes. Practicing silence, Surya Kriya, and meditation.',
      membersCount: 34,
      postsCount: 9,
      isFeatured: true,
      creatorName: 'Priya Nair',
    },
    {
      name: 'Kailash Yatra 2026 Cohort',
      slug: 'kailash-yatra-2026-cohort',
      type: 'event',
      tagline: 'Preparation, sadhana, and inner pilgrimage for the sacred Mount Kailash.',
      description: 'A dedicated preparation circle for seekers aspiring to undertake the sacred pilgrimage to Mount Kailash. We focus on endurance, breathwork, and inner consecration.',
      membersCount: 62,
      postsCount: 18,
      isFeatured: true,
      creatorName: 'Dr. Rajesh Menon',
    },
    {
      name: 'Shambhavi Mandala Practitioners',
      slug: 'shambhavi-mandala-practitioners',
      type: 'program',
      tagline: '40-day continuity support and daily inspiration for Shambhavi sadhakas.',
      description: 'Holding the sacred space for those currently walking their 40-day or 90-day mandala. Encouragement, discipline, and answering practical practice questions.',
      membersCount: 85,
      postsCount: 22,
      isFeatured: true,
      creatorName: 'Priya Nair',
    },
    {
      name: 'Himalayan Silence & Seva',
      slug: 'himalayan-silence-seva',
      type: 'interest',
      tagline: 'Practicing inner stillness amidst dynamic seva and conscious action.',
      description: 'Dedicated to living spirituality in action. We share ways of bringing the meditative quality into everyday work, volunteering, and selfless service.',
      membersCount: 29,
      postsCount: 6,
      isFeatured: false,
      creatorName: 'Meera Iyer',
    },
  ];

  const sanghaMap = {};

  for (const s of SANGHAS_DATA) {
    const creator = userMap[s.creatorName] || Object.values(userMap)[0];
    let sangha = await Sangha.findOne({ slug: s.slug });
    if (!sangha) {
      sangha = await Sangha.create({
        name: s.name,
        slug: s.slug,
        type: s.type,
        location: s.location || '',
        tagline: s.tagline,
        description: s.description,
        membersCount: s.membersCount,
        postsCount: s.postsCount,
        isFeatured: s.isFeatured,
        createdBy: creator._id,
      });
      console.log(` - Created Sangha: ${s.name}`);
    } else {
      sangha.membersCount = s.membersCount;
      sangha.postsCount = s.postsCount;
      sangha.isFeatured = s.isFeatured;
      await sangha.save();
      console.log(` - Updated Sangha: ${s.name}`);
    }
    sanghaMap[s.slug] = sangha;

    // Enroll creator as owner
    await SanghaMembership.findOneAndUpdate(
      { sanghaId: sangha._id, userId: creator._id },
      { role: 'owner', status: 'active' },
      { upsert: true, new: true }
    );

    // Enroll all users (personas + human users) as active members
    for (const u of Object.values(userMap)) {
      if (u._id.toString() !== creator._id.toString()) {
        await SanghaMembership.findOneAndUpdate(
          { sanghaId: sangha._id, userId: u._id },
          { role: 'member', status: 'active' },
          { upsert: true, new: true }
        );
      }
    }
  }

  // ── 3. Establish Mutual Follow Network Between Personas & Humans ──
  console.log('Establishing follow network...');
  const personaUsers = PERSONAS.map(p => userMap[p.name]).filter(Boolean);

  // Cross-follow between all personas
  for (const p1 of personaUsers) {
    for (const p2 of personaUsers) {
      if (p1._id.toString() !== p2._id.toString()) {
        await Follow.findOneAndUpdate(
          { followerId: p1._id, followingId: p2._id },
          { status: 'active' },
          { upsert: true, new: true }
        );
      }
    }
  }

  // Mutual follow between all personas and all human users
  for (const hu of humanUsers) {
    for (const p of personaUsers) {
      // Human follows persona
      await Follow.findOneAndUpdate(
        { followerId: hu._id, followingId: p._id },
        { status: 'active' },
        { upsert: true, new: true }
      );
      // Persona follows human
      await Follow.findOneAndUpdate(
        { followerId: p._id, followingId: hu._id },
        { status: 'active' },
        { upsert: true, new: true }
      );
    }
  }
  console.log(' - Follow network populated.');

  // ── 4. Seed Rich Posts ──
  console.log('Publishing rich spiritual posts across all 5 Sangha circles...');
  const POSTS_DATA = [
    // ── 1. Shambhavi Mandala Practitioners ──
    {
      authorName: 'Priya Nair',
      body: 'Completed Day 40 of the Shambhavi Mandala today at sunrise. The morning air feels fundamentally different when the mind has stopped chattering. Sending quiet encouragement to everyone in the middle of their 40 days — stay with it, every morning matters.',
      type: 'milestone',
      sharedEntity: {
        entityType: 'milestone',
        title: '40-Day Shambhavi Mandala Completed',
        subtitle: 'Consecutive Daily Practice • 21 mins',
        metricValue: 'Day 40/40',
        icon: '🪷',
        originalDate: new Date(Date.now() - 3 * 3600000),
      },
      sanghaSlug: 'shambhavi-mandala-practitioners',
      visibility: 'public',
      createdAt: new Date(Date.now() - 3 * 3600000),
    },
    {
      authorName: 'Dr. Rajesh Menon',
      body: 'To all mandala practitioners: when you sit for the 21 minutes, keep the spine erect as an effortless channel of light. The practice works subtly on the nadis. Do not look for dramatic fireworks; watch the stillness unfold like dawn.',
      type: 'experience',
      sharedEntity: { entityType: 'none' },
      sanghaSlug: 'shambhavi-mandala-practitioners',
      visibility: 'public',
      createdAt: new Date(Date.now() - 9 * 3600000),
    },
    {
      authorName: 'Meera Iyer',
      body: 'Day 24 check-in! The initial restlessness from week 2 has given way to an effortless flow. The morning stillness is becoming my natural resting state throughout the day.',
      type: 'metric',
      sharedEntity: {
        entityType: 'sadhana_log',
        title: 'Shambhavi Mandala Continuity',
        subtitle: 'Day 24 Milestone',
        metricValue: '24 Days Streak',
        icon: '🪷',
        originalDate: new Date(Date.now() - 18 * 3600000),
      },
      sanghaSlug: 'shambhavi-mandala-practitioners',
      visibility: 'public',
      createdAt: new Date(Date.now() - 18 * 3600000),
    },

    // ── 2. Vrindavan Japa Circle ──
    {
      authorName: 'Anand Sharma',
      body: '16 rounds of Japa completed during Brahma Muhurta. After the 8th round, the breath naturally slows down to a gentle whisper. Don’t rush through the beads — let each sacred repetition settle into your chest like dew.',
      type: 'metric',
      sharedEntity: {
        entityType: 'sadhana_log',
        title: 'Morning Japa Sadhana',
        subtitle: 'Brahma Muhurta • 4:30 AM',
        metricValue: '16 Rounds (1728 counts)',
        icon: '📿',
        originalDate: new Date(Date.now() - 7 * 3600000),
      },
      sanghaSlug: 'vrindavan-japa-circle',
      visibility: 'public',
      createdAt: new Date(Date.now() - 7 * 3600000),
    },
    {
      authorName: 'Meera Iyer',
      body: '12 rounds of twilight chanting as the temple lamps are lit. The sacred sound vibrates through every cell, washing away the mental debris of a busy day.',
      type: 'metric',
      sharedEntity: {
        entityType: 'sadhana_log',
        title: 'Sandhya Twilight Japa',
        subtitle: '12 Rounds Consecrated',
        metricValue: '12 Rounds',
        icon: '📿',
        originalDate: new Date(Date.now() - 12 * 3600000),
      },
      sanghaSlug: 'vrindavan-japa-circle',
      visibility: 'public',
      createdAt: new Date(Date.now() - 12 * 3600000),
    },
    {
      authorName: 'Dr. Rajesh Menon',
      body: 'Sound is the primal vibration from which creation arose. When you chant with complete involvement and no hurry, you tune the physical body to an ancient cosmic frequency.',
      type: 'experience',
      sharedEntity: { entityType: 'none' },
      sanghaSlug: 'vrindavan-japa-circle',
      visibility: 'public',
      createdAt: new Date(Date.now() - 25 * 3600000),
    },

    // ── 3. Bengaluru Dawn Meditators ──
    {
      authorName: 'Vikram Joshi',
      body: 'Finished day 14 of Surya Kriya practice. The physical stiffness in the morning is noticeably softening into ease and suppleness. Deeply grateful for the discipline this path is instilling.',
      type: 'metric',
      sharedEntity: {
        entityType: 'sadhana_log',
        title: 'Surya Kriya — 14-Day Continuity',
        subtitle: 'Hatha Yoga Foundation',
        metricValue: '14 Days Streak',
        icon: '☀️',
        originalDate: new Date(Date.now() - 32 * 3600000),
      },
      sanghaSlug: 'bengaluru-dawn-meditators',
      visibility: 'public',
      createdAt: new Date(Date.now() - 32 * 3600000),
    },
    {
      authorName: 'Priya Nair',
      body: 'Dawn gathering at Cubbon Park under the ancient banyan trees. 14 seekers sitting in unbroken silence before the city traffic began. There is immense strength in practicing together.',
      type: 'photo',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
          caption: 'Morning meditation under the canopy',
        },
      ],
      sharedEntity: { entityType: 'none' },
      sanghaSlug: 'bengaluru-dawn-meditators',
      visibility: 'public',
      createdAt: new Date(Date.now() - 40 * 3600000),
    },
    {
      authorName: 'Anand Sharma',
      body: 'Consecrated 5:45 AM group sadhana online today. Nadi Shuddhi followed by 21 minutes of deep silence. A tranquil start to the working week.',
      type: 'metric',
      sharedEntity: {
        entityType: 'sadhana_log',
        title: 'Dawn Pranayama Session',
        subtitle: 'Bengaluru Circle Check-in',
        metricValue: '45 mins Sadhana',
        icon: '🌬️',
        originalDate: new Date(Date.now() - 48 * 3600000),
      },
      sanghaSlug: 'bengaluru-dawn-meditators',
      visibility: 'public',
      createdAt: new Date(Date.now() - 48 * 3600000),
    },

    // ── 4. Kailash Yatra 2026 Cohort ──
    {
      authorName: 'Dr. Rajesh Menon',
      body: 'A seeker asked me today: "Doctor, how do I deal with heavy thoughts when sitting in stillness?" The answer is simple: you don’t fight them. Let them rise and dissolve like mist over Kailash. You are not the weather; you are the mountain.',
      type: 'experience',
      sharedEntity: { entityType: 'none' },
      sanghaSlug: 'kailash-yatra-2026-cohort',
      visibility: 'public',
      createdAt: new Date(Date.now() - 22 * 3600000),
    },
    {
      authorName: 'Vikram Joshi',
      body: 'Preparation week 6! Completed 8 km endurance walk with steady nasal breathing, followed by Sukha Kriya. Preparing the body as an offering for the sacred mountain.',
      type: 'metric',
      sharedEntity: {
        entityType: 'sadhana_log',
        title: 'Yatra Trek Training',
        subtitle: 'Endurance & Breath Sync',
        metricValue: '8.2 km • 108 Pradakshinas',
        icon: '🏔️',
        originalDate: new Date(Date.now() - 50 * 3600000),
      },
      sanghaSlug: 'kailash-yatra-2026-cohort',
      visibility: 'public',
      createdAt: new Date(Date.now() - 50 * 3600000),
    },
    {
      authorName: 'Priya Nair',
      body: 'Holding the Kailash intention deep in the heart. When the desire for the sacred peak becomes an inner longing rather than a destination, every breath begins to prepare you.',
      type: 'experience',
      sharedEntity: { entityType: 'none' },
      sanghaSlug: 'kailash-yatra-2026-cohort',
      visibility: 'public',
      createdAt: new Date(Date.now() - 60 * 3600000),
    },

    // ── 5. Himalayan Silence & Seva ──
    {
      authorName: 'Meera Iyer',
      body: 'Quiet evening by the temple waters. When the surface of the lake becomes still, the temple spires reflect without a single distortion. In the same way, when the mind settles into silence, grace reflects effortlessly.',
      type: 'photo',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
          caption: 'Temple pond at dusk',
        },
      ],
      sharedEntity: { entityType: 'none' },
      sanghaSlug: 'himalayan-silence-seva',
      visibility: 'public',
      createdAt: new Date(Date.now() - 14 * 3600000),
    },
    {
      authorName: 'Dr. Rajesh Menon',
      body: 'True seva is not an act of charity; it is an act of dissolution. When you chop wood or sweep the hall with total involvement and no desire for praise, the rigid boundary of "I" gently dissolves.',
      type: 'experience',
      sharedEntity: { entityType: 'none' },
      sanghaSlug: 'himalayan-silence-seva',
      visibility: 'public',
      createdAt: new Date(Date.now() - 65 * 3600000),
    },
    {
      authorName: 'Anand Sharma',
      body: 'Served the afternoon meal in silence at the dining hall today. Serving food to 200 seekers with folded hands brings a quiet humility that no intellectual discourse can match.',
      type: 'metric',
      sharedEntity: {
        entityType: 'sadhana_log',
        title: 'Anna Daan Sacred Seva',
        subtitle: 'Ashram Dining Hall',
        metricValue: '3 Hours Dedicated Seva',
        icon: '🥣',
        originalDate: new Date(Date.now() - 75 * 3600000),
      },
      sanghaSlug: 'himalayan-silence-seva',
      visibility: 'public',
      createdAt: new Date(Date.now() - 75 * 3600000),
    },

    // ── 6. Personal Seeker Milestones (Cross-Feed) ──
    {
      authorName: 'Dr. Rajesh Menon',
      body: 'Level 50 Ascension reached after sustained practice over several years. The path never gets old; with every passing year, the stillness deepens.',
      type: 'milestone',
      sharedEntity: {
        entityType: 'milestone',
        title: 'Level 50 Seeker Ascension',
        subtitle: 'Devotion to the Inner Flame',
        metricValue: 'Level 50 Reached',
        icon: '🏔️',
        originalDate: new Date(Date.now() - 85 * 3600000),
      },
      visibility: 'public',
      createdAt: new Date(Date.now() - 85 * 3600000),
    },
  ];

  const createdPosts = [];

  for (const pd of POSTS_DATA) {
    const author = userMap[pd.authorName];
    const sangha = pd.sanghaSlug ? sanghaMap[pd.sanghaSlug] : null;

    const audienceIds = ['public', 'followers'];
    if (sangha) audienceIds.push(`sangha:${sangha._id}`);

    let post = await Post.findOne({
      authorId: author._id,
      body: pd.body,
    });

    if (!post) {
      post = await Post.create({
        authorId: author._id,
        body: pd.body,
        type: pd.type,
        media: pd.media || [],
        sharedEntity: pd.sharedEntity || { entityType: 'none' },
        sanghaId: sangha ? sangha._id : null,
        audienceIds,
        visibility: pd.visibility,
        createdAt: pd.createdAt,
        kudosCount: 0,
        commentsCount: 0,
      });
      console.log(` - Created post by ${pd.authorName}`);
    }
    createdPosts.push(post);
  }

  // ── 5. Seed Authentic Kudos & Reflections ──
  console.log('Seeding kudos and reflections...');
  for (const post of createdPosts) {
    // Cross-give kudos from personas
    for (const u of personaUsers) {
      if (u._id.toString() !== post.authorId.toString()) {
        const existing = await Kudos.findOne({ postId: post._id, userId: u._id });
        if (!existing) {
          await Kudos.create({ postId: post._id, userId: u._id });
          await Post.findByIdAndUpdate(post._id, { $inc: { kudosCount: 1 } });
        }
      }
    }
  }

  // Seed sample reflections
  const p1 = createdPosts[0]; // Priya's 40-day mandala
  if (p1) {
    const anand = userMap['Anand Sharma'];
    const meera = userMap['Meera Iyer'];
    if (anand) {
      await Comment.findOneAndUpdate(
        { postId: p1._id, userId: anand._id },
        { body: 'Pranam Priya! Wonderful inspiration for all our mandala practitioners. A sacred milestone! 🙏' },
        { upsert: true, new: true }
      );
    }
    if (meera) {
      await Comment.findOneAndUpdate(
        { postId: p1._id, userId: meera._id },
        { body: 'Such dedication. May grace continue to deepen your inner walk.' },
        { upsert: true, new: true }
      );
    }
    const cCount = await Comment.countDocuments({ postId: p1._id });
    await Post.findByIdAndUpdate(p1._id, { commentsCount: cCount });
  }

  const p2 = createdPosts[1]; // Anand's japa
  if (p2) {
    const vikram = userMap['Vikram Joshi'];
    const rajesh = userMap['Dr. Rajesh Menon'];
    if (vikram) {
      await Comment.findOneAndUpdate(
        { postId: p2._id, userId: vikram._id },
        { body: 'Anandji, thank you for the reminder not to rush. I was hurrying today; will slow down to settle the breath tomorrow.' },
        { upsert: true, new: true }
      );
    }
    if (rajesh) {
      await Comment.findOneAndUpdate(
        { postId: p2._id, userId: rajesh._id },
        { body: 'The breath is the master key. Well observed.' },
        { upsert: true, new: true }
      );
    }
    const cCount = await Comment.countDocuments({ postId: p2._id });
    await Post.findByIdAndUpdate(p2._id, { commentsCount: cCount });
  }

  const p4 = createdPosts[3]; // Dr. Rajesh mountain quote
  if (p4) {
    const priya = userMap['Priya Nair'];
    if (priya) {
      await Comment.findOneAndUpdate(
        { postId: p4._id, userId: priya._id },
        { body: '"You are not the weather; you are the mountain" — writing this down in my journal. Pranam Doctor 🙏' },
        { upsert: true, new: true }
      );
      const cCount = await Comment.countDocuments({ postId: p4._id });
      await Post.findByIdAndUpdate(p4._id, { commentsCount: cCount });
    }
  }

  // Comments on Bengaluru Dawn gathering post
  const pBengaluruPhoto = createdPosts.find(p => p.body.includes('Cubbon Park'));
  if (pBengaluruPhoto) {
    const vikram = userMap['Vikram Joshi'];
    if (vikram) {
      await Comment.findOneAndUpdate(
        { postId: pBengaluruPhoto._id, userId: vikram._id },
        { body: 'It was deeply powerful sitting together under the banyan trees. Thank you Priya for organizing.' },
        { upsert: true, new: true }
      );
      const cCount = await Comment.countDocuments({ postId: pBengaluruPhoto._id });
      await Post.findByIdAndUpdate(pBengaluruPhoto._id, { commentsCount: cCount });
    }
  }

  // Comments on Himalayan Seva post
  const pSeva = createdPosts.find(p => p.body.includes('Anna Daan'));
  if (pSeva) {
    const meera = userMap['Meera Iyer'];
    if (meera) {
      await Comment.findOneAndUpdate(
        { postId: pSeva._id, userId: meera._id },
        { body: 'Such a blessed offering, Anandji. Seva in silence transforms the atmosphere completely.' },
        { upsert: true, new: true }
      );
      const cCount = await Comment.countDocuments({ postId: pSeva._id });
      await Post.findByIdAndUpdate(pSeva._id, { commentsCount: cCount });
    }
  }

  // Recalculate and update postsCount on all Sanghas
  for (const sangha of Object.values(sanghaMap)) {
    const count = await Post.countDocuments({ sanghaId: sangha._id, status: 'active' });
    sangha.postsCount = count;
    await sangha.save();
    console.log(` - Sangha [${sangha.name}]: ${count} active posts.`);
  }

  // ── 6. Seed Upcoming Gatherings ──
  console.log('Seeding upcoming sacred gatherings...');
  const vrindavan = sanghaMap['vrindavan-japa-circle'];
  const bengaluru = sanghaMap['bengaluru-dawn-meditators'];
  const kailash = sanghaMap['kailash-yatra-2026-cohort'];

  if (vrindavan) {
    await SanghaEvent.findOneAndUpdate(
      { sanghaId: vrindavan._id, title: 'Pournami Full Moon Silent Meditation' },
      {
        description: 'An extended period of silence and collective japa to harness the heightened lunar energies.',
        eventType: 'online',
        startTime: new Date(Date.now() + 24 * 3600000),
        endTime: new Date(Date.now() + 26 * 3600000),
        locationOrLink: 'Zoom Live Stream',
        createdBy: vrindavan.createdBy,
        attendees: [vrindavan.createdBy, userMap['Priya Nair']._id, userMap['Meera Iyer']._id],
        attendeesCount: 38,
      },
      { upsert: true, new: true }
    );
  }

  if (bengaluru) {
    await SanghaEvent.findOneAndUpdate(
      { sanghaId: bengaluru._id, title: 'Brahma Muhurta 5:45 AM Group Sadhana' },
      {
        description: 'Daily dawn sitting in silence. Starting with Guru Pooja and settling into Surya Kriya.',
        eventType: 'in_person',
        startTime: new Date(Date.now() + 14 * 3600000),
        endTime: new Date(Date.now() + 16 * 3600000),
        locationOrLink: 'Cubbon Park Lotus Gazebo, Bengaluru',
        createdBy: bengaluru.createdBy,
        attendees: [bengaluru.createdBy, userMap['Vikram Joshi']._id],
        attendeesCount: 22,
      },
      { upsert: true, new: true }
    );
  }

  if (kailash) {
    await SanghaEvent.findOneAndUpdate(
      { sanghaId: kailash._id, title: 'Kailash Yatra Acclimatization & Pranayama' },
      {
        description: 'Altitude preparation breathwork and spiritual grounding for upcoming yatris.',
        eventType: 'online',
        startTime: new Date(Date.now() + 72 * 3600000),
        endTime: new Date(Date.now() + 74 * 3600000),
        locationOrLink: 'Private Seeker Stream',
        createdBy: kailash.createdBy,
        attendees: [kailash.createdBy, userMap['Anand Sharma']._id],
        attendeesCount: 45,
      },
      { upsert: true, new: true }
    );
  }

  // ── 7. Seed Sample Notifications for All Human Seekers ──
  console.log('Seeding sacred notifications...');
  for (const human of humanUsers) {
    const notifications = [
      {
        recipientId: human._id,
        actorId: userMap['Priya Nair']._id,
        type: 'kudos',
        message: 'Priya Nair offered Kudos (🙏) to your morning sadhana',
        isRead: false,
      },
      {
        recipientId: human._id,
        actorId: userMap['Anand Sharma']._id,
        type: 'comment',
        message: 'Anand Sharma reflected on your post: "May grace deepen your inner walk 🙏"',
        isRead: false,
      },
      {
        recipientId: human._id,
        actorId: userMap['Dr. Rajesh Menon']._id,
        type: 'follow',
        message: 'Dr. Rajesh Menon is now walking with you on the path',
        isRead: false,
      },
      {
        recipientId: human._id,
        actorId: userMap['Meera Iyer']._id,
        type: 'sangha_join',
        message: 'Meera Iyer joined Vrindavan Japa Circle',
        isRead: true,
      },
    ];

    for (const notif of notifications) {
      await CommunityNotification.findOneAndUpdate(
        { recipientId: notif.recipientId, message: notif.message },
        notif,
        { upsert: true, new: true }
      );
    }
  }

  console.log('✅ DEMO SEED DATA COMPLETE AND VERIFIED!');
  process.exit(0);
}

seedCommunity().catch((err) => {
  console.error('❌ Seed script error:', err);
  process.exit(1);
});
