const mqtt = require('mqtt');
const SensorReading = require('./models/SensorReading');
const Setting = require('./models/Setting');
const socketHandler = require('./socket');

let mqttClient = null;
let isConnected = false;

module.exports = {
  connect: (config) => {
    const { host, port, username, password, topic } = config;
    
    // Gunakan protokol mqtts:// jika port adalah 8883 (TLS/SSL)
    const protocol = port === 8883 ? 'mqtts' : 'mqtt';
    const brokerUrl = `${protocol}://${host}:${port}`;

    console.log(`[MQTT] Menghubungkan ke broker: ${brokerUrl}...`);

    mqttClient = mqtt.connect(brokerUrl, {
      username,
      password,
      rejectUnauthorized: false, // Untuk serverless HiveMQ Cloud certificate skip
      reconnectPeriod: 5000     // Coba koneksi ulang tiap 5 detik jika terputus
    });

    mqttClient.on('connect', () => {
      isConnected = true;
      console.log('[MQTT] Berhasil terhubung ke HiveMQ Cloud!');
      
      // Subscribe ke topik sensor
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          console.error(`[MQTT] Gagal subscribe ke topik ${topic}:`, err);
        } else {
          console.log(`[MQTT] Berhasil subscribe ke topik: ${topic}`);
        }
      });
    });

    mqttClient.on('message', async (receivedTopic, message) => {
      if (receivedTopic === topic) {
        try {
          const payloadString = message.toString();
          console.log(`[MQTT] Pesan masuk dari ${receivedTopic}:`, payloadString);

          const rawData = JSON.parse(payloadString);

          // 1. Ambil ambang batas (threshold) terbaru dari database
          let settings = await Setting.findOne();
          if (!settings) {
            // Default threshold jika database kosong
            settings = {
              tempMin: 25,
              tempMax: 35,
              humMin: 50,
              humMax: 80
            };
          }

          // 2. Evaluasi suhu & kelembapan secara dinamis berdasarkan database settings
          const temp = parseFloat(rawData.temp);
          const hum = parseFloat(rawData.hum);
          const alerts = [];

          if (temp > settings.tempMax) {
            alerts.push('TEMP_HIGH');
          } else if (temp < settings.tempMin) {
            alerts.push('TEMP_LOW');
          }

          if (hum > settings.humMax) {
            alerts.push('HUM_HIGH');
          } else if (hum < settings.humMin) {
            alerts.push('HUM_LOW');
          }

          // LED menyala jika ada alarm / diluar batas ideal
          const led = alerts.length > 0;

          // 3. Simpan data sensor ke MongoDB Atlas
          const sensorData = await SensorReading.create({
            device_id: rawData.device_id || 'ESP32-MF-001',
            temp,
            hum,
            led,
            alerts,
            ts: new Date()
          });

          // 4. Pancarkan ke Socket.IO agar UI dashboard terupdate realtime tanpa refresh
          socketHandler.emitSensorData(sensorData);

        } catch (error) {
          console.error('[MQTT] Gagal memproses pesan masuk:', error);
        }
      }
    });

    mqttClient.on('close', () => {
      isConnected = false;
      console.log('[MQTT] Koneksi terputus dengan broker.');
    });

    mqttClient.on('error', (err) => {
      console.error('[MQTT] Error:', err);
    });

    return mqttClient;
  },

  // Mendapatkan status koneksi MQTT untuk API Health Check
  getStatus: () => {
    return {
      connected: isConnected,
      statusText: isConnected ? 'Connected' : 'Disconnected'
    };
  }
};
