require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// File DB Path
const DB_FILE = path.join(__dirname, 'database.json');

// Helper untuk membaca DB
async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Jika file tidak ada, kembalikan array kosong
    return [];
  }
}

// Helper untuk menyimpan ke DB
async function writeDB(dataArray) {
  await fs.writeFile(DB_FILE, JSON.stringify(dataArray, null, 2));
}

// ==========================================
// 1. Connect to HiveMQ Cloud
// ==========================================
const mqttClient = mqtt.connect(process.env.MQTT_HOST, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  rejectUnauthorized: false 
});

mqttClient.on('connect', () => {
  console.log('✅ Connected to HiveMQ Cloud');
  mqttClient.subscribe('maggot/sensor', (err) => {
    if (!err) console.log('📡 Subscribed to topic: maggot/sensor');
  });
});

// ==========================================
// 2. Handle MQTT Messages
// ==========================================
mqttClient.on('message', async (topic, message) => {
  if (topic === 'maggot/sensor') {
    try {
      const payload = JSON.parse(message.toString());
      payload.timestamp = new Date().toISOString(); // Tambahkan timestamp
      console.log('📥 Received Data:', payload);

      // Save to JSON File DB
      const db = await readDB();
      db.push(payload);
      
      // Batasi histori misal 500 data terakhir agar file tidak terlalu besar
      if (db.length > 500) db.shift();
      
      await writeDB(db);

      // Emit to all connected Socket.IO clients (Frontend)
      io.emit('sensor_data', payload);

    } catch (err) {
      console.error('❌ Error processing MQTT message:', err);
    }
  }
});

// ==========================================
// 3. REST API Endpoints
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running normally with JSON DB' });
});

app.get('/api/latest', async (req, res) => {
  try {
    const db = await readDB();
    const latest = db.length > 0 ? db[db.length - 1] : {};
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const db = await readDB();
    // Ambil beberapa data terakhir dan balik urutannya (terbaru di awal)
    const history = db.slice(-limit).reverse();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// 4. Socket.IO Connections
// ==========================================
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// ==========================================
// 5. Start Server
// ==========================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
