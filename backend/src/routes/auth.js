const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username dan password wajib diisi.' 
    });
  }

  try {
    // Cari user di database
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah.' 
      });
    }

    // Verifikasi password dengan bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah.' 
      });
    }

    // Buat JWT token (berlaku 24 jam)
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret_key_maggot_2025',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error saat login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Karena JWT bersifat stateless, logout di sisi backend cukup mengembalikan sukses.
  // Frontend yang akan menghapus token dari localStorage.
  return res.json({ 
    success: true, 
    message: 'Logout berhasil. Token dinonaktifkan di sisi client.' 
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User tidak ditemukan.' 
      });
    }

    return res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error saat mengambil data user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
});

module.exports = router;
