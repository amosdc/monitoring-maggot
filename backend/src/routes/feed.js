const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
const authMiddleware = require('../middleware/auth');

// GET /api/feeds - Ambil semua log pakan (Butuh Login)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const feeds = await Feed.find().sort({ feed_date: -1 });
    return res.json({
      success: true,
      data: feeds
    });
  } catch (error) {
    console.error('Error saat mengambil data pakan:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

// POST /api/feeds - Tambah log pakan baru (Butuh Login)
router.post('/', authMiddleware, async (req, res) => {
  const { feed_name, weight, feed_date, notes } = req.body;

  if (!feed_name || weight === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Nama pakan dan berat wajib diisi.'
    });
  }

  try {
    const newFeed = await Feed.create({
      feed_name,
      weight: parseFloat(weight),
      feed_date: feed_date ? new Date(feed_date) : new Date(),
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Log pakan berhasil ditambahkan.',
      data: newFeed
    });
  } catch (error) {
    console.error('Error saat membuat data pakan:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

// PUT /api/feeds/:id - Update log pakan (Butuh Login)
router.put('/:id', authMiddleware, async (req, res) => {
  const { feed_name, weight, feed_date, notes } = req.body;

  try {
    const updatedFeed = await Feed.findByIdAndUpdate(
      req.params.id,
      {
        ...(feed_name && { feed_name }),
        ...(weight !== undefined && { weight: parseFloat(weight) }),
        ...(feed_date && { feed_date: new Date(feed_date) }),
        notes
      },
      { new: true } // kembalikan dokumen yang telah di-update
    );

    if (!updatedFeed) {
      return res.status(404).json({
        success: false,
        message: 'Data pakan tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      message: 'Log pakan berhasil diperbarui.',
      data: updatedFeed
    });
  } catch (error) {
    console.error('Error saat memperbarui data pakan:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

// DELETE /api/feeds/:id - Hapus log pakan (Butuh Login)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedFeed = await Feed.findByIdAndDelete(req.params.id);

    if (!deletedFeed) {
      return res.status(404).json({
        success: false,
        message: 'Data pakan tidak ditemukan.'
      });
    }

    return res.json({
      success: true,
      message: 'Log pakan berhasil dihapus.'
    });
  } catch (error) {
    console.error('Error saat menghapus data pakan:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

module.exports = router;
