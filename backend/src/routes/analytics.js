const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const authMiddleware = require('../middleware/auth');

// GET /api/analytics - Statistik Agregat (Butuh Login)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 hari terakhir termasuk hari ini
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Agregasi untuk data Hari Ini (Min/Max/Avg)
    const todayStatsResult = await SensorReading.aggregate([
      { 
        $match: { 
          ts: { $gte: todayStart } 
        } 
      },
      {
        $group: {
          _id: null,
          minTemp: { $min: '$temp' },
          maxTemp: { $max: '$temp' },
          avgTemp: { $avg: '$temp' },
          minHum: { $min: '$hum' },
          maxHum: { $max: '$hum' },
          avgHum: { $avg: '$hum' }
        }
      }
    ]);

    // Format nilai default jika hari ini belum ada data
    const today = todayStatsResult[0] || {
      minTemp: 0,
      maxTemp: 0,
      avgTemp: 0,
      minHum: 0,
      maxHum: 0,
      avgHum: 0
    };

    // Bulatkan hasil rata-rata jika ada
    if (today.avgTemp) today.avgTemp = Math.round(today.avgTemp * 10) / 10;
    if (today.avgHum) today.avgHum = Math.round(today.avgHum * 10) / 10;

    // 2. Agregasi Tren Harian (7 Hari Terakhir) untuk Suhu dan Kelembapan
    const dailyTrend = await SensorReading.aggregate([
      {
        $match: {
          ts: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } },
          avgTemp: { $avg: '$temp' },
          avgHum: { $avg: '$hum' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Bulatkan hasil tren harian dan ubah format _id menjadi date
    const formattedTrend = dailyTrend.map(item => ({
      date: item._id,
      avgTemp: Math.round(item.avgTemp * 10) / 10,
      avgHum: Math.round(item.avgHum * 10) / 10
    }));

    // 3. Agregasi Frekuensi Alert Harian (7 Hari Terakhir)
    const alertsTrend = await SensorReading.aggregate([
      {
        $match: {
          ts: { $gte: sevenDaysAgo }
        }
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } },
          hasTempHigh: { $cond: [{ $in: ['TEMP_HIGH', '$alerts'] }, 1, 0] },
          hasTempLow: { $cond: [{ $in: ['TEMP_LOW', '$alerts'] }, 1, 0] },
          hasHumHigh: { $cond: [{ $in: ['HUM_HIGH', '$alerts'] }, 1, 0] },
          hasHumLow: { $cond: [{ $in: ['HUM_LOW', '$alerts'] }, 1, 0] }
        }
      },
      {
        $group: {
          _id: '$date',
          TEMP_HIGH: { $sum: '$hasTempHigh' },
          TEMP_LOW: { $sum: '$hasTempLow' },
          HUM_HIGH: { $sum: '$hasHumHigh' },
          HUM_LOW: { $sum: '$hasHumLow' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedAlerts = alertsTrend.map(item => ({
      date: item._id,
      TEMP_HIGH: item.TEMP_HIGH,
      TEMP_LOW: item.TEMP_LOW,
      HUM_HIGH: item.HUM_HIGH,
      HUM_LOW: item.HUM_LOW,
      total: item.TEMP_HIGH + item.TEMP_LOW + item.HUM_HIGH + item.HUM_LOW
    }));

    return res.json({
      success: true,
      data: {
        today,
        trend: formattedTrend,
        alerts: formattedAlerts
      }
    });
  } catch (error) {
    console.error('Error saat mengambil data analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

module.exports = router;
