// 108 Sacred Locations — Seeker's Journey to Kailash
// Level 1 = Isha Yoga Center → Level 108 = Mount Kailash

export const LOCATIONS = [
  // ── South India ───────────────────────────────────────────────────────────
  { level: 1,   name: 'Isha Yoga Center',          region: 'Tamil Nadu',     desc: 'The seat of Sadhguru, the beginning of all journeys', color: '#8b5cf6' },
  { level: 2,   name: 'Velliangiri Hills',          region: 'Tamil Nadu',     desc: 'The Seven Hills pilgrimage, the abode of Shiva', color: '#7c3aed' },
  { level: 3,   name: 'Dhyanalinga Temple',         region: 'Tamil Nadu',     desc: 'A powerful meditative space radiating pure yogic energy', color: '#6d28d9' },
  { level: 4,   name: 'Spanda Hall',                region: 'Tamil Nadu',     desc: 'Where deep inner silence is cultivated', color: '#5b21b6' },
  { level: 5,   name: 'Adiyogi Shiva Statue',       region: 'Tamil Nadu',     desc: 'The first yogi, source of yogic science', color: '#4c1d95' },
  { level: 6,   name: 'Palani Murugan Temple',      region: 'Tamil Nadu',     desc: 'Sacred hill temple of Lord Murugan', color: '#7c3aed' },
  { level: 7,   name: 'Madurai Meenakshi Amman',   region: 'Tamil Nadu',     desc: 'Ancient temple city, seat of the Divine Mother', color: '#8b5cf6' },
  { level: 8,   name: 'Rameshwaram',                region: 'Tamil Nadu',     desc: 'Where Ram built the bridge to Lanka, one of the Char Dham', color: '#a78bfa' },
  { level: 9,   name: 'Kanyakumari',                region: 'Tamil Nadu',     desc: 'The southernmost tip where three oceans meet', color: '#7c3aed' },
  { level: 10,  name: 'Kodaikanal Hills',            region: 'Tamil Nadu',     desc: 'Misty peaks where seers meditated for millennia', color: '#6d28d9' },

  // ── Kerala & Karnataka ────────────────────────────────────────────────────
  { level: 11,  name: 'Sabarimala',                 region: 'Kerala',         desc: 'Pilgrim path of Ayyappa through dense forest', color: '#059669' },
  { level: 12,  name: 'Guruvayur Temple',            region: 'Kerala',         desc: 'The Dwarka of the South, abode of Krishna', color: '#047857' },
  { level: 13,  name: 'Thrissur Pooram',             region: 'Kerala',         desc: 'Festival of grand processions and divine energy', color: '#065f46' },
  { level: 14,  name: 'Kollur Mookambika',           region: 'Karnataka',      desc: 'Sacred temple in the Western Ghats jungle', color: '#047857' },
  { level: 15,  name: 'Udupi Krishna Matha',         region: 'Karnataka',      desc: 'Ancient Krishna temple founded by Madhvacharya', color: '#059669' },
  { level: 16,  name: 'Kukke Subramanya',            region: 'Karnataka',      desc: 'Temple in the forest where serpents are worshipped', color: '#10b981' },
  { level: 17,  name: 'Hornadu Annapoorneshwari',    region: 'Karnataka',      desc: 'Divine Mother temple in the Bhadra river valley', color: '#34d399' },
  { level: 18,  name: 'Sringeri Sharada Peetham',    region: 'Karnataka',      desc: 'Adi Shankaracharya\'s first monastery, in the forest', color: '#059669' },
  { level: 19,  name: 'Murdeshwar Shiva Temple',     region: 'Karnataka',      desc: 'Massive Shiva statue on a coastal promontory', color: '#047857' },
  { level: 20,  name: 'Hampi Virupaksha Temple',     region: 'Karnataka',      desc: 'Ancient city of Vijayanagara, ruins of glory', color: '#065f46' },

  // ── Andhra & Telangana ────────────────────────────────────────────────────
  { level: 21,  name: 'Srisailam Mallikarjuna',      region: 'Andhra Pradesh', desc: 'Jyotirlinga on the banks of the Krishna river', color: '#d97706' },
  { level: 22,  name: 'Amaravati Stupa',             region: 'Andhra Pradesh', desc: 'Ancient Buddhist stupa, center of enlightenment', color: '#b45309' },
  { level: 23,  name: 'Simhachalam Temple',          region: 'Andhra Pradesh', desc: 'Temple of Narasimha on a sacred hilltop', color: '#92400e' },
  { level: 24,  name: 'Pushpagiri Srirangapatna',    region: 'Andhra Pradesh', desc: 'Sacred Shiva shrine in the Eastern Ghats', color: '#d97706' },
  { level: 25,  name: 'Yadadri Lakshmi Narasimha',  region: 'Telangana',      desc: 'Hilltop temple where Lord appeared from rocks', color: '#b45309' },
  { level: 26,  name: 'Warangal Thousand Pillars',   region: 'Telangana',      desc: 'Medieval temple with intricate Kakatiya art', color: '#92400e' },
  { level: 27,  name: 'Basara Gnana Saraswathi',     region: 'Telangana',      desc: 'Ancient Saraswathi temple on the Godavari banks', color: '#d97706' },
  { level: 28,  name: 'Kondagatu Bramarambha',       region: 'Andhra Pradesh', desc: 'Shaktipeeth in the dense forest of Nallamala', color: '#b45309' },
  { level: 29,  name: 'Ahobilam Narasimha',          region: 'Andhra Pradesh', desc: 'Nine forms of Narasimha in the sacred hills', color: '#92400e' },
  { level: 30,  name: 'Tirupati Tirumala',           region: 'Andhra Pradesh', desc: 'Venkateswara, the richest and most visited temple on earth', color: '#d97706' },

  // ── Maharashtra & Goa ─────────────────────────────────────────────────────
  { level: 31,  name: 'Shirdi Sai Baba',             region: 'Maharashtra',    desc: 'The abode of the saint who dissolved all divisions', color: '#f59e0b' },
  { level: 32,  name: 'Pandharpur Vitthal',          region: 'Maharashtra',    desc: 'The wari pilgrimage destination of Maharashtra saints', color: '#d97706' },
  { level: 33,  name: 'Tuljapur Bhavani',            region: 'Maharashtra',    desc: 'Shaktipeeth, family deity of Chhatrapati Shivaji', color: '#b45309' },
  { level: 34,  name: 'Jejuri Khandoba',             region: 'Maharashtra',    desc: 'Hilltop temple where turmeric rains at festivals', color: '#f59e0b' },
  { level: 35,  name: 'Trimbakeshwar Jyotirlinga',  region: 'Maharashtra',    desc: 'Jyotirlinga at the source of the Godavari river', color: '#d97706' },
  { level: 36,  name: 'Nashik Panchavati',           region: 'Maharashtra',    desc: 'Where Ram, Sita & Lakshmana stayed during exile', color: '#b45309' },
  { level: 37,  name: 'Grishneshwar Jyotirlinga',   region: 'Maharashtra',    desc: 'The twelfth Jyotirlinga near Ellora Caves', color: '#92400e' },
  { level: 38,  name: 'Ashtavinayak Pilgrimage',    region: 'Maharashtra',    desc: 'Eight sacred Ganesha temples in the Deccan', color: '#f59e0b' },
  { level: 39,  name: 'Old Goa Basilica',            region: 'Goa',            desc: 'Ancient spiritual center where St Francis Xavier rests', color: '#d97706' },
  { level: 40,  name: 'Lonavala Karla Caves',        region: 'Maharashtra',    desc: 'Ancient Buddhist caves in the misty Sahyadri range', color: '#b45309' },

  // ── Madhya Pradesh & Rajasthan ────────────────────────────────────────────
  { level: 41,  name: 'Ujjain Mahakaleshwar',        region: 'Madhya Pradesh', desc: 'Jyotirlinga of Mahakala, time destroyer, on the Shipra', color: '#ef4444' },
  { level: 42,  name: 'Omkareshwar Jyotirlinga',    region: 'Madhya Pradesh', desc: 'Island shaped like Om on the Narmada river', color: '#dc2626' },
  { level: 43,  name: 'Amarkantak — Narmada Udgam', region: 'Madhya Pradesh', desc: 'Source of the sacred Narmada river, in the forest', color: '#b91c1c' },
  { level: 44,  name: 'Orchha Ram Raja Mandir',      region: 'Madhya Pradesh', desc: 'The only place where Ram is worshipped as king', color: '#ef4444' },
  { level: 45,  name: 'Khajuraho Temples',           region: 'Madhya Pradesh', desc: 'Tantric temples depicting the fullness of life', color: '#dc2626' },
  { level: 46,  name: 'Sanchi Stupa',                region: 'Madhya Pradesh', desc: 'The oldest Buddhist structure, built by Emperor Ashoka', color: '#b91c1c' },
  { level: 47,  name: 'Pushkar Brahma Temple',       region: 'Rajasthan',      desc: 'The only Brahma temple, on the sacred Pushkar lake', color: '#ef4444' },
  { level: 48,  name: 'Ajmer Dargah Sharif',         region: 'Rajasthan',      desc: 'Sufi shrine where devotion transcends religion', color: '#dc2626' },
  { level: 49,  name: 'Eklingji Temple',             region: 'Rajasthan',      desc: 'The family deity of the Mewar royal family', color: '#b91c1c' },
  { level: 50,  name: 'Nathdwara Srinathji',         region: 'Rajasthan',      desc: 'Where Krishna came as a child form to bless devotees', color: '#ef4444' },

  // ── Gujarat ───────────────────────────────────────────────────────────────
  { level: 51,  name: 'Dwarka Dwarkadhish Temple',  region: 'Gujarat',        desc: 'Krishna\'s legendary city, one of the Char Dham', color: '#f97316' },
  { level: 52,  name: 'Somnath Jyotirlinga',        region: 'Gujarat',        desc: 'The first Jyotirlinga, on the shores of the Arabian Sea', color: '#ea580c' },
  { level: 53,  name: 'Palitana Shatrunjaya',        region: 'Gujarat',        desc: 'Sacred Jain mountain with 900 marble temples', color: '#c2410c' },
  { level: 54,  name: 'Ambaji Shaktipeeth',          region: 'Gujarat',        desc: 'The powerful Mother Goddess temple near Mt. Abu', color: '#f97316' },
  { level: 55,  name: 'Dakor Ranchhodrai',           region: 'Gujarat',        desc: 'Temple where Krishna himself chose to dwell', color: '#ea580c' },
  { level: 56,  name: 'Pavagadh Kalika Mata',        region: 'Gujarat',        desc: 'Hilltop Shaktipeeth above ancient Champaner city', color: '#c2410c' },
  { level: 57,  name: 'Girnar Dattatreya Peak',      region: 'Gujarat',        desc: 'Sacred mountain where five peaks hold divine energy', color: '#f97316' },
  { level: 58,  name: 'Akshardham Gandhinagar',      region: 'Gujarat',        desc: 'Grand temple of the Swaminarayan tradition', color: '#ea580c' },
  { level: 59,  name: 'Adi Kumbeswar Temple',        region: 'Gujarat',        desc: 'Ancient Shiva temple in the heart of Gujarat', color: '#c2410c' },
  { level: 60,  name: 'Dwaraka Gomti Sangam',        region: 'Gujarat',        desc: 'Where Gomti river meets the sea at Krishna\'s city', color: '#f97316' },

  // ── Uttar Pradesh ─────────────────────────────────────────────────────────
  { level: 61,  name: 'Vrindavan Banke Bihari',     region: 'Uttar Pradesh',  desc: 'Forest of love, where Krishna danced with Radha', color: '#3b82f6' },
  { level: 62,  name: 'Mathura Krishna Janmabhoomi',region: 'Uttar Pradesh',  desc: 'The birthplace of Lord Krishna', color: '#2563eb' },
  { level: 63,  name: 'Prayagraj Triveni Sangam',   region: 'Uttar Pradesh',  desc: 'Confluence of Ganga, Yamuna & mystical Saraswathi', color: '#1d4ed8' },
  { level: 64,  name: 'Varanasi Kashi Vishwanath',  region: 'Uttar Pradesh',  desc: 'The eternal city, where Shiva grants liberation to all', color: '#3b82f6' },
  { level: 65,  name: 'Sarnath',                    region: 'Uttar Pradesh',  desc: 'Where the Buddha gave his first sermon after enlightenment', color: '#2563eb' },
  { level: 66,  name: 'Vindhyachal Vindhyavasini',  region: 'Uttar Pradesh',  desc: 'The Shaktipeeth of Mother Vindhyavasini', color: '#1d4ed8' },
  { level: 67,  name: 'Chitrakoot Ramghat',         region: 'Uttar Pradesh',  desc: 'Scenic forest where Ram and Sita lived during exile', color: '#3b82f6' },
  { level: 68,  name: 'Ayodhya Ram Janmabhoomi',   region: 'Uttar Pradesh',  desc: 'The birthplace of Lord Ram, sacred since eternity', color: '#2563eb' },
  { level: 69,  name: 'Dudhwa National Park',       region: 'Uttar Pradesh',  desc: 'Tiger reserve, where wild forest energy is alive', color: '#1d4ed8' },
  { level: 70,  name: 'Vinayaka Nainital Malla',    region: 'Uttarakhand',    desc: 'Peaceful lake town in the Kumaon Himalayas', color: '#3b82f6' },

  // ── Himalayas Gateway ─────────────────────────────────────────────────────
  { level: 71,  name: 'Haridwar Har Ki Pauri',      region: 'Uttarakhand',    desc: 'Gateway to the Himalayas where Ganga enters the plains', color: '#06b6d4' },
  { level: 72,  name: 'Rishikesh Triveni Ghat',     region: 'Uttarakhand',    desc: 'Yoga capital of the world, where Ganga is crystal clear', color: '#0891b2' },
  { level: 73,  name: 'Neelkanth Mahadev',          region: 'Uttarakhand',    desc: 'Temple where Shiva drank the poison during samudra manthan', color: '#0e7490' },
  { level: 74,  name: 'Devi Kund — Uttarkashi',     region: 'Uttarakhand',    desc: 'Glacial lake with a small Shiva temple at high altitude', color: '#06b6d4' },
  { level: 75,  name: 'Chardham — Yamunotri',       region: 'Uttarakhand',    desc: 'Source of the Yamuna, first of the four Char Dham dhams', color: '#0891b2' },
  { level: 76,  name: 'Chardham — Gangotri',        region: 'Uttarakhand',    desc: 'Temple at the origin of the holy Ganga river', color: '#0e7490' },
  { level: 77,  name: 'Gaumukh Glacier',            region: 'Uttarakhand',    desc: 'The cow\'s mouth where Ganga emerges from the glacier', color: '#06b6d4' },
  { level: 78,  name: 'Tapovan Meadow',             region: 'Uttarakhand',    desc: 'High-altitude meadow used by yogis for penance', color: '#0891b2' },
  { level: 79,  name: 'Chardham — Kedarnath',       region: 'Uttarakhand',    desc: 'Jyotirlinga at 3,583m, the Himalayan abode of Shiva', color: '#0e7490' },
  { level: 80,  name: 'Vasuki Tal',                 region: 'Uttarakhand',    desc: 'Glacial lake above Kedarnath, where Vasuki serpent dwelt', color: '#06b6d4' },

  // ── High Himalayas ────────────────────────────────────────────────────────
  { level: 81,  name: 'Chardham — Badrinath',       region: 'Uttarakhand',    desc: 'Vishnu\'s abode at 3,133m, last Char Dham', color: '#8b5cf6' },
  { level: 82,  name: 'Valley of Flowers',          region: 'Uttarakhand',    desc: 'UNESCO World Heritage valley blooming with rare flowers', color: '#7c3aed' },
  { level: 83,  name: 'Hemkund Sahib',              region: 'Uttarakhand',    desc: 'Sikh shrine at 4,329m on a glacial lake', color: '#6d28d9' },
  { level: 84,  name: 'Mana Village',               region: 'Uttarakhand',    desc: 'Last Indian village before Tibet, gateway to the beyond', color: '#8b5cf6' },
  { level: 85,  name: 'Satopanth Lake',             region: 'Uttarakhand',    desc: 'Triangular glacial lake, where the Trinity bathed', color: '#7c3aed' },
  { level: 86,  name: 'Spiti Valley',               region: 'Himachal Pradesh',desc: 'Cold desert valley with ancient Buddhist monasteries', color: '#6d28d9' },
  { level: 87,  name: 'Key Monastery (Spiti)',      region: 'Himachal Pradesh',desc: 'Thousand-year-old Tibetan Buddhist monastery at 4,166m', color: '#8b5cf6' },
  { level: 88,  name: 'Chandratal Lake',            region: 'Himachal Pradesh',desc: 'Crescent moon lake at 4,300m in the Himalayas', color: '#7c3aed' },
  { level: 89,  name: 'Baralacha La Pass',          region: 'Himachal Pradesh',desc: 'High mountain pass at 4,890m, gateway to Ladakh', color: '#6d28d9' },
  { level: 90,  name: 'Leh Palace & Namgyal Hill', region: 'Ladakh',         desc: 'Ancient Ladakhi kingdom, roof of India', color: '#8b5cf6' },

  // ── Ladakh & Tibetan Border ────────────────────────────────────────────────
  { level: 91,  name: 'Pangong Tso Lake',           region: 'Ladakh',         desc: 'Shimmering blue lake at 4,350m, spanning India & China', color: '#06b6d4' },
  { level: 92,  name: 'Thiksey Monastery',          region: 'Ladakh',         desc: 'Grand Buddhist monastery overlooking the Indus valley', color: '#0891b2' },
  { level: 93,  name: 'Hemis Monastery',            region: 'Ladakh',         desc: 'Largest monastery in Ladakh, home of the sacred Hemis festival', color: '#0e7490' },
  { level: 94,  name: 'Nubra Valley',               region: 'Ladakh',         desc: 'Sand dunes in a high-altitude valley, between mountain ranges', color: '#06b6d4' },
  { level: 95,  name: 'Khardung La Pass',           region: 'Ladakh',         desc: 'One of the world\'s highest motorable passes at 5,359m', color: '#0891b2' },
  { level: 96,  name: 'Tso Moriri Lake',            region: 'Ladakh',         desc: 'A pristine high-altitude wetland ecosystem', color: '#0e7490' },
  { level: 97,  name: 'Alchi Monastery',            region: 'Ladakh',         desc: 'Ancient 11th-century monastery with original murals', color: '#06b6d4' },
  { level: 98,  name: 'Indo-Tibet Border (Demchok)',region: 'Ladakh',         desc: 'The mystical crossing point into Tibet', color: '#0891b2' },
  { level: 99,  name: 'Saga (Tibet)',               region: 'Tibet',          desc: 'Last major town before the sacred mountain journey begins', color: '#0e7490' },
  { level: 100, name: 'Darchen Base Town',          region: 'Tibet',          desc: 'The starting point of the sacred Kailash Parikrama', color: '#06b6d4' },

  // ── The Kailash Approach ───────────────────────────────────────────────────
  { level: 101, name: 'Manasarovar Lake',           region: 'Tibet',          desc: 'The sacred lake at 4,590m, created by Brahma\'s mind', color: '#a78bfa' },
  { level: 102, name: 'Rakshas Tal (Demon Lake)',   region: 'Tibet',          desc: 'The twin dark lake opposite Manasarovar', color: '#8b5cf6' },
  { level: 103, name: 'Ashtapada Peak',             region: 'Tibet',          desc: 'Sacred peak where Jain tradition says Rishabha attained moksha', color: '#7c3aed' },
  { level: 104, name: 'Dirapuk Monastery',          region: 'Tibet',          desc: 'Monastery with the closest view of Kailash\'s north face', color: '#6d28d9' },
  { level: 105, name: 'Dolma La Pass (5,636m)',     region: 'Tibet',          desc: 'The highest point of Kailash Parikrama, Goddess Tara\'s pass', color: '#a78bfa' },
  { level: 106, name: 'Zuthulphuk Monastery',       region: 'Tibet',          desc: 'Monastery on the south side of Kailash, end of Parikrama', color: '#8b5cf6' },
  { level: 107, name: 'Kailash South Face',         region: 'Tibet',          desc: 'Standing beneath the sacred summit, on hallowed ground', color: '#7c3aed' },
  { level: 108, name: 'Mount Kailash — Kailasa',   region: 'Tibet',          desc: 'The cosmic axis, Shiva\'s eternal abode — the journey is complete 🏔', color: '#fbbf24' },
];

// Points required to reach each level (100 pts per level)
export const POINTS_PER_LEVEL = 100;

export function getLevelFromScore(score) {
  const level = Math.floor(score / POINTS_PER_LEVEL) + 1;
  return Math.min(Math.max(level, 1), 108);
}

export function getPointsToNextLevel(score) {
  const pointsInCurrentLevel = score % POINTS_PER_LEVEL;
  return POINTS_PER_LEVEL - pointsInCurrentLevel;
}

export function getLevelProgress(score) {
  return (score % POINTS_PER_LEVEL) / POINTS_PER_LEVEL;
}

export function getLocation(level) {
  return LOCATIONS.find(l => l.level === level) || LOCATIONS[0];
}
