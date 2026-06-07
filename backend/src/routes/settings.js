const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// GET /api/settings - Ambil konfigurasi threshold + info device (Butuh Login)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let threshold = await Setting.findOne();
    
    // Jika data settings belum ada di DB, buat data default pertama kali
    if (!threshold) {
      threshold = await Setting.create({
        tempMin: 25,
        tempMax: 35,
        humMin: 50,
        humMax: 80
      });
    }

    // Info device ESP32 (static info / metadata yang relevan dengan spesifikasi)
    const device = {
      deviceId: 'ESP32-MF-001',
      ipAddress: '192.168.1.15', // Mock IP Wifi lokal ESP32
      firmware: 'v1.1.0-stable',
      sensorType: 'DHT11'
    };

    return res.json({
      success: true,
      threshold,
      device
    });
  } catch (error) {
    console.error('Error saat mengambil settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

// PUT /api/settings - Update threshold / ganti password (Butuh Login)
router.put('/', authMiddleware, async (req, res) => {
  const { tempMin, tempMax, humMin, humMax, currentPassword, newPassword } = req.body;

  try {
    // 1. Update Threshold Settings (jika ada data threshold yang dikirim)
    let updatedThreshold = null;
    if (tempMin !== undefined || tempMax !== undefined || humMin !== undefined || humMax !== undefined) {
      updatedThreshold = await Setting.findOneAndUpdate(
        {},
        {
          ...(tempMin !== undefined && { tempMin: parseFloat(tempMin) }),
          ...(tempMax !== undefined && { tempMax: parseFloat(tempMax) }),
          ...(humMin !== undefined && { humMin: parseFloat(humMin) }),
          ...(humMax !== undefined && { humMax: parseFloat(humMax) }),
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      );
    }

    // 2. Ganti Password User (jika ada data password baru yang dikirim)
    let passwordChanged = false;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password saat ini (current password) wajib diisi untuk keamanan.'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan.'
        });
      }

      // Validasi password lama
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Password saat ini salah.'
        });
      }

      // Hash password baru dan update
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      passwordChanged = true;
    }

    return res.json({
      success: true,
      message: 'Konfigurasi berhasil disimpan.',
      ...(updatedThreshold && { threshold: updatedThreshold }),
      passwordChanged
    });

  } catch (error) {
    console.error('Error saat menyimpan settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

module.exports = router;
