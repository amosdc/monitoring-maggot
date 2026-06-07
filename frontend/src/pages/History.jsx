import React, { useState, useEffect } from 'react';
import api from '../services/api';
import HistoryTable from '../components/HistoryTable';

const History = () => {
  const [readings, setReadings] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Limit per halaman
  const LIMIT = 20;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = `/history?page=${page}&limit=${LIMIT}`;
      if (startDate) url += `&start=${startDate}`;
      if (endDate) url += `&end=${endDate}`;

      const response = await api.get(url);
      if (response.data.success) {
        setReadings(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setTotalRecords(response.data.pagination.total);
      } else {
        setError('Gagal memuat data riwayat.');
      }
    } catch (err) {
      console.error('Error saat mengambil riwayat:', err);
      setError('Terjadi kesalahan koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Ambil data setiap kali halaman aktif atau filter tanggal berubah
  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setPage(1); // Reset ke halaman pertama saat filter diterapkan
    fetchHistory();
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    // Timeout untuk memastikan state ter-reset sebelum fetch berjalan
    setTimeout(() => {
      fetchHistory();
    }, 50);
  };

  const handleExportCSV = () => {
    if (readings.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    try {
      // 1. Definisikan header CSV
      const headers = ['Waktu', 'Tanggal', 'Suhu (C)', 'Kelembapan (%)', 'LED Status', 'Alerts'];
      
      // 2. Map data sensor ke baris CSV
      const rows = readings.map(r => {
        const d = new Date(r.ts);
        const timeStr = d.toLocaleTimeString('id-ID');
        const dateStr = d.toLocaleDateString('id-ID');
        const ledStr = r.led ? 'NYALA' : 'MATI';
        const alertStr = r.alerts && r.alerts.length > 0 ? r.alerts.join(';') : 'NONE';
        
        return [
          `"${timeStr}"`,
          `"${dateStr}"`,
          r.temp.toFixed(1),
          r.hum.toFixed(1),
          `"${ledStr}"`,
          `"${alertStr}"`
        ];
      });

      // 3. Gabungkan header dan data
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      // 4. Buat file download blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `maggot_monitoring_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Ekspor gagal:', err);
      alert('Gagal mengekspor data ke CSV.');
    }
  };

  return (
    <div className="history-page">
      {/* Container Filter & Toolbar */}
      <div className="history-toolbar-card">
        <form onSubmit={handleApplyFilter} className="filter-form">
          <div className="filter-input-group">
            <div className="form-group">
              <label>Tanggal Mulai</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tanggal Selesai</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-action-buttons">
            <button type="submit" className="btn-filter-apply">🔍 Terapkan</button>
            <button type="button" className="btn-filter-reset" onClick={handleResetFilter}>🔄 Reset</button>
            <button type="button" className="btn-export-csv" onClick={handleExportCSV}>📥 Ekspor CSV</button>
          </div>
        </form>

        <div className="records-count">
          Total Log Ditemukan: <span className="mono-text font-bold">{totalRecords}</span> data
        </div>
      </div>

      {error && (
        <div className="dashboard-error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Tabel Log Riwayat */}
      {loading ? (
        <div className="table-loading-container">
          <div className="spinner"></div>
          <p>Mengambil berkas log...</p>
        </div>
      ) : (
        <HistoryTable readings={readings} />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="btn-page" 
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
          >
            ◀ Kembali
          </button>
          
          <span className="page-indicator">
            Halaman <span className="mono-text font-bold">{page}</span> dari <span className="mono-text">{totalPages}</span>
          </span>

          <button 
            className="btn-page" 
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages || loading}
          >
            Lanjut ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default History;
