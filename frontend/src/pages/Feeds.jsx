import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Feeds = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states untuk Tambah / Edit
  const [feedName, setFeedName] = useState('');
  const [weight, setWeight] = useState('');
  const [feedDate, setFeedDate] = useState('');
  const [notes, setNotes] = useState('');

  // Edit states
  const [editingId, setEditingId] = useState(null);

  const fetchFeeds = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const response = await api.get('/feeds');
      if (response.data.success) {
        setFeeds(response.data.data);
      } else {
        setError('Gagal memuat data pakan.');
      }
    } catch (err) {
      console.error('Error fetching feeds:', err);
      setError('Kesalahan koneksi ke server.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load data & jalankan auto-refresh setiap 10 detik
  useEffect(() => {
    fetchFeeds(true);

    const intervalId = setInterval(() => {
      fetchFeeds(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!feedName.trim() || !weight) {
      setError('Nama pakan dan berat wajib diisi.');
      return;
    }

    const payload = {
      feed_name: feedName,
      weight: parseFloat(weight),
      feed_date: feedDate ? new Date(feedDate) : new Date(),
      notes
    };

    try {
      if (editingId) {
        // Mode Edit (PUT)
        const res = await api.put(`/feeds/${editingId}`, payload);
        if (res.data.success) {
          setSuccessMessage('Log pakan berhasil diperbarui!');
          resetForm();
          fetchFeeds(false);
        }
      } else {
        // Mode Tambah Baru (POST)
        const res = await api.post('/feeds', payload);
        if (res.data.success) {
          setSuccessMessage('Log pakan berhasil ditambahkan!');
          resetForm();
          fetchFeeds(false);
        }
      }
    } catch (err) {
      console.error('Submit pakan gagal:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan data pakan.');
    }
  };

  const handleEditClick = (feed) => {
    setEditingId(feed._id);
    setFeedName(feed.feed_name);
    setWeight(feed.weight);
    // Format tanggal ke YYYY-MM-DD agar masuk ke form date
    const dateObj = new Date(feed.feed_date);
    const formattedDate = dateObj.toISOString().split('T')[0];
    setFeedDate(formattedDate);
    setNotes(feed.notes || '');
    setError('');
    setSuccessMessage('');
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data pakan ini?')) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      const res = await api.delete(`/feeds/${id}`);
      if (res.data.success) {
        setSuccessMessage('Log pakan berhasil dihapus.');
        fetchFeeds(false);
        if (editingId === id) {
          resetForm();
        }
      }
    } catch (err) {
      console.error('Delete pakan gagal:', err);
      setError('Gagal menghapus data pakan.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFeedName('');
    setWeight('');
    setFeedDate('');
    setNotes('');
  };

  // Hitung total berat pakan terdistribusi
  const totalWeight = feeds.reduce((sum, item) => sum + (item.weight || 0), 0);

  // Format tanggal tabel
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-loading-state">
        <div className="double-spinner"></div>
        <p>Memuat sistem pangan maggot...</p>
      </div>
    );
  }

  return (
    <div className="history-page"> {/* Menggunakan wrapper layout page yang ada */}
      
      {/* Kartu Statistik Total Pangan */}
      <div className="analytics-stats-grid">
        <div className="stat-group-card temp-theme">
          <h4>Total Pakan Terdistribusi</h4>
          <div className="sub-stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="sub-card highlight-avg">
              <span className="sub-label">Akumulasi Berat</span>
              <span className="sub-value mono-text">{totalWeight.toFixed(2)} kg</span>
            </div>
            <div className="sub-card">
              <span className="sub-label">Total Pemberian</span>
              <span className="sub-value mono-text">{feeds.length} Kali</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-grid-layout" style={{ marginTop: '20px' }}>
        
        {/* Kolom Kiri: Form Add / Edit */}
        <div className="settings-column">
          <div className="settings-glass-card">
            <h3 className="card-section-title">
              {editingId ? 'Edit Log Pakan' : 'Input Pakan Maggot'}
            </h3>
            <p className="card-section-subtitle">
              Catat berat sampah organik atau pakan buatan yang diberikan ke maggot.
            </p>

            {error && <div className="form-alert-banner error">{error}</div>}
            {successMessage && <div className="form-alert-banner success">{successMessage}</div>}

            <form onSubmit={handleFormSubmit} className="settings-form">
              <div className="form-group">
                <label>Jenis Pakan</label>
                <input
                  type="text"
                  placeholder="Contoh: Sampah Buah, Ampas Kelapa"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group-half">
                  <label>Berat Pakan (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 2.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-half">
                  <label>Tanggal Pemberian</label>
                  <input
                    type="date"
                    value={feedDate}
                    onChange={(e) => setFeedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Kondisi pakan atau detail box maggot"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-settings-save" style={{ flex: 2 }}>
                  {editingId ? 'PERBARUI DATA' : 'CATAT PAKAN'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn-filter-reset"
                    style={{ flex: 1, padding: '14px' }}
                    onClick={resetForm}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Tabel Log CRUD */}
        <div className="settings-column">
          <div className="settings-glass-card" style={{ padding: '20px' }}>
            <h3 className="card-section-title">Riwayat Pemberian Pakan</h3>
            <p className="card-section-subtitle">Daftar pencatatan pakan maggot terbaru.</p>

            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jenis Pakan</th>
                    <th>Berat</th>
                    <th>Catatan</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {feeds.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center no-data">
                        Belum ada pencatatan pangan maggot.
                      </td>
                    </tr>
                  ) : (
                    feeds.map((feed) => (
                      <tr key={feed._id}>
                        <td>{formatDate(feed.feed_date)}</td>
                        <td className="font-bold">{feed.feed_name}</td>
                        <td className="mono-text text-highlight font-bold">
                          {feed.weight.toFixed(2)} kg
                        </td>
                        <td>{feed.notes || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn-filter-apply"
                              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                              onClick={() => handleEditClick(feed)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-logout"
                              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--color-red)' }}
                              onClick={() => handleDeleteClick(feed._id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Feeds;
