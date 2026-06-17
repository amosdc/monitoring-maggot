require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');

const socketHandler = require('./socket');
const mqttHandler = require('./mqtt');
const User = require('./models/User');
const Setting = require('./models/Setting');
const Feed = require('./models/Feed');
const bcrypt = require('bcryptjs');

// Import Routes
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensor');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const feedRoutes = require('./routes/feed');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Seeder Data Awal (User Default & Settings)
async function seedDefaultData() {
  try {
    // 1. Seed admin user
    const userExists = await User.findOne({ username: 'admin' });
    if (!userExists) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('maggot2025', salt);
      await User.create({
        username: 'admin',
        passwordHash,
        role: 'admin'
      });
      console.log('[Seeder] Akun admin default berhasil dibuat (username: admin, password: maggot2025)');
    }

    // 2. Seed settings default
    const settingExists = await Setting.findOne();
    if (!settingExists) {
      await Setting.create({
        tempMin: 25,
        tempMax: 35,
        humMin: 50,
        humMax: 80
      });
      console.log('[Seeder] Threshold settings default berhasil dibuat.');
    }

    // 3. Seed feeds default jika belum ada data pakan sama sekali
    const feedExists = await Feed.findOne();
    if (!feedExists) {
      const dummyFeeds = [
        {
          feed_name: 'Sampah Sayuran Pasar',
          weight: 4.5,
          feed_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 hari lalu
          notes: 'Sisa kol, sawi, dan bayam dari pasar tradisional, kondisi dicacah halus'
        },
        {
          feed_name: 'Ampas Tahu',
          weight: 6.2,
          feed_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 hari lalu
          notes: 'Kondisi segar, kelembaban tinggi, disebar di Box A1-A3'
        },
        {
          feed_name: 'Sisa Makanan Katering',
          weight: 3.8,
          feed_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 hari lalu
          notes: 'Nasi dan lauk sisa katering perkantoran, dipilah dari minyak berlebih'
        },
        {
          feed_name: 'Kulit Buah Campur',
          weight: 5.0,
          feed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 hari lalu
          notes: 'Kulit pepaya, melon, dan pisang matang, difermentasi EM4 selama 24 jam'
        },
        {
          feed_name: 'Dedak Padi & Ampas Kelapa',
          weight: 2.5,
          feed_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 hari lalu
          notes: 'Pakan tambahan penstabil kelembaban di media tumbuh'
        },
        {
          feed_name: 'Sampah Organik Rumah Tangga',
          weight: 3.2,
          feed_date: new Date(), // Hari ini
          notes: 'Sisa kupasan sayur dan kulit kentang dari warga sekitar'
        }
      ];
      await Feed.insertMany(dummyFeeds);
      console.log('[Seeder] Data dummy pakan maggot berhasil dibuat.');
    }
  } catch (error) {
    console.error('[Seeder] Error saat menjalankan seeder:', error);
  }
}

// Koneksi ke MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://amosdompak6_db:amosdompakchristian@cluster0.7pm9kr4.mongodb.net/maggot_db?appName=Cluster0';
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('[MongoDB] Berhasil terhubung ke MongoDB Atlas.');
    // Jalankan seeder setelah DB terhubung
    await seedDefaultData();
  })
  .catch((err) => {
    console.error('[MongoDB] Gagal terhubung ke MongoDB Atlas:', err);
  });

// Inisialisasi Socket.IO
socketHandler.init(server, process.env.CLIENT_URL);

// Inisialisasi MQTT
const mqttConfig = {
  host: process.env.MQTT_HOST || 'be7faf1c29994f1abd518d25486fdd7f.s1.eu.hivemq.cloud',
  port: parseInt(process.env.MQTT_PORT) || 8883,
  username: process.env.MQTT_USER || 'Kelompok1',
  password: process.env.MQTT_PASS || 'Kelompok1',
  topic: process.env.MQTT_TOPIC || 'maggot/sensor'
};
mqttHandler.connect(mqttConfig);

// Registrasi API Routes
app.use('/api/auth', authRoutes);
app.use('/api', sensorRoutes); // Mount /latest dan /history langsung pada /api
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feeds', feedRoutes);

// GET /api/health - Status Sistem (Tanpa Auth)
app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  let mongoStatusText = 'Disconnected';
  if (mongoState === 1) mongoStatusText = 'Connected';
  if (mongoState === 2) mongoStatusText = 'Connecting';
  if (mongoState === 3) mongoStatusText = 'Disconnecting';

  const mqttStatus = mqttHandler.getStatus();

  return res.json({
    success: true,
    status: 'Healthy',
    uptime: Math.round(process.uptime()), // Detik
    database: {
      status: mongoStatusText,
      readyState: mongoState
    },
    mqtt: {
      status: mqttStatus.statusText,
      connected: mqttStatus.connected
    }
  });
});

// Jalankan Express Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] Berjalan di port ${PORT}`);
});
