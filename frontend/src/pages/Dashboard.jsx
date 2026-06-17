import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import SensorCard from '../components/SensorCard';
import RealtimeChart from '../components/RealtimeChart';
import StatusPanel from '../components/StatusPanel';
import AlertToast from '../components/AlertToast';

const Dashboard = () => {
  const [latestData, setLatestData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [settings, setSettings] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInitialData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      // 1. Ambil thresholds
      const settingsRes = await api.get('/settings');
      if (settingsRes.data.success) {
        setSettings(settingsRes.data.threshold);
      }

      // 2. Ambil data terakhir untuk inisialisasi card
      const latestRes = await api.get('/latest');
      if (latestRes.data.success) {
        setLatestData(latestRes.data.data);
      }

      // 3. Ambil riwayat terbaru (20 data) untuk mengisi chart agar tidak kosong di awal
      const historyRes = await api.get('/history?limit=20');
      if (historyRes.data.success) {
        setChartData(historyRes.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
      setError('Gagal memuat data dari server.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch data awal & jalankan auto-refresh
  useEffect(() => {
    fetchInitialData(true);

    // Auto-refresh data setiap 10 detik
    const intervalId = setInterval(() => {
      fetchInitialData(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Hubungkan ke socket untuk data realtime
  const { isConnected } = useSocket((newData) => {
    // 1. Update card sensor utama
    setLatestData(newData);

    // 2. Update list chart (tambahkan di awal, buang ekor jika > 20)
    setChartData((prevData) => {
      const updated = [newData, ...prevData];
      if (updated.length > 20) {
        updated.pop();
      }
      return updated;
    });

    // 3. Cek jika ada alert baru untuk memicu alert toast
    if (newData.alerts && newData.alerts.length > 0) {
      newData.alerts.forEach((alertType) => {
        // Hindari duplikasi toast untuk jenis alert yang sama secara beruntun
        setToasts((prevToasts) => {
          const exists = prevToasts.some(t => t.type === alertType);
          if (exists) return prevToasts;

          return [
            { id: Date.now() + Math.random(), type: alertType },
            ...prevToasts
          ];
        });
      });
    }
  });

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="page-loading-state">
        <div className="double-spinner"></div>
        <p>Menghubungkan ke MongoDB & Sensor Stream...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Toast Notification Container */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <AlertToast
            key={toast.id}
            alertType={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {error && (
        <div className="dashboard-error-banner">
          <span>⚠️ {error}</span>
          <button className="btn-retry" onClick={() => window.location.reload()}>Muat Ulang</button>
        </div>
      )}

      {/* Grid Kartu Sensor Besar */}
      <div className="sensor-cards-grid">
        <SensorCard
          title="Temperatur Udara"
          value={latestData ? latestData.temp : NaN}
          unit="°C"
          minVal={settings ? settings.tempMin : 25}
          maxVal={settings ? settings.tempMax : 35}
          type="temp"
        />
        <SensorCard
          title="Kelembapan Udara"
          value={latestData ? latestData.hum : NaN}
          unit="%"
          minVal={settings ? settings.humMin : 50}
          maxVal={settings ? settings.humMax : 80}
          type="hum"
        />
      </div>

      {/* Grid Grafik Realtime Recharts */}
      <div className="charts-grid">
        <RealtimeChart
          data={chartData}
          type="temp"
          label="Tren Temperatur Realtime"
          color="#00d2ff" // Cyan
        />
        <RealtimeChart
          data={chartData}
          type="hum"
          label="Tren Kelembapan Realtime"
          color="#00ff9d" // Green
        />
      </div>

      {/* Panel Status Lingkungan Sekitar */}
      <div className="status-section">
        <StatusPanel
          temp={latestData ? latestData.temp : NaN}
          hum={latestData ? latestData.hum : NaN}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default Dashboard;
