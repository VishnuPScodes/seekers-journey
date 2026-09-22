// Load .env in local dev (on Render/Netlify env vars are injected directly)
try {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
} catch (_) {}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const sadhanaRoutes = require('./routes/sadhana');
const lifeRoutes = require('./routes/life');
const journeyRoutes = require('./routes/journey');
const insightsRoutes = require('./routes/insights');
const adminRoutes = require('./routes/admin');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sadhana', sadhanaRoutes);
app.use('/api/life', lifeRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);

// ─── Health Checks & Root Route ───────────────────────────────────────────────
const healthCheck = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.json({
    status: 'OK',
    message: 'Sadhana Tracker API is running smoothly 🙏',
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatusMap[dbState] || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
};

app.get('/', healthCheck);
app.get('/api', healthCheck);
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// ─── MongoDB + Start ──────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: false,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
