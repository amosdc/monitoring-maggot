const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const authMiddleware = require('../middleware/auth');

// GET /api/latest - Ambil 1 data sensor terbaru (Butuh Login)
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const latestReading = await SensorReading.findOne().sort({ ts: -1 });
    if (!latestReading) {
      return res.status(404).json({
        success: false,
        message: 'Belum ada data sensor tersimpan.'
      });
    }
    return res.json({
      success: true,
      data: latestReading
    });
  } catch (error) {
    console.error('Error saat mengambil data terbaru:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

// GET /api/history - Ambil data riwayat sensor ter-paginasi (Butuh Login)
// Query params: ?start=YYYY-MM-DD&end=YYYY-MM-DD&page=1&limit=20
router.get('/history', authMiddleware, async (req, res) => {
  try {
    let { start, end, page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const skip = (page - 1) * limit;

    // Filter tanggal
    const query = {};
    if (start || end) {
      query.ts = {};
      if (start) {
        // Set ke awal hari (00:00:00) di timezone lokal
        const startDate = new Date(start + 'T00:00:00');
        query.ts.$gte = startDate;
      }
      if (end) {
        // Set ke akhir hari (23:59:59.999) di timezone lokal
        const endDate = new Date(end + 'T23:59:59.999');
        query.ts.$lte = endDate;
      }
    }

    // Ambil data dengan sort terbaru dulu
    const readings = await SensorReading.find(query)
      .sort({ ts: -1 })
      .skip(skip)
      .limit(limit);

    // Hitung total data untuk pagination info
    const total = await SensorReading.countDocuments(query);

    return res.json({
      success: true,
      data: readings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error saat mengambil riwayat sensor:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

module.exports = router;
