import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const response = await api.get('/analytics');
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Gagal memuat data analitik.');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Koneksi ke server terputus.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);

    // Auto-refresh data analitik setiap 15 detik
    const intervalId = setInterval(() => {
      fetchAnalytics(false);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="page-loading-state">
        <div className="double-spinner"></div>
        <p>Menghitung data agregasi & visualisasi tren...</p>
      </div>
    );
  }

  const today = stats?.today || {
    minTemp: 0, maxTemp: 0, avgTemp: 0,
    minHum: 0, maxHum: 0, avgHum: 0
  };

  const trendData = stats?.trend || [];
  const alertData = stats?.alerts || [];

  return (
    <div className="analytics-page">
      {error && (
        <div className="dashboard-error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Grid Kartu Statistik Hari Ini */}
      <h3 className="section-title">Telemetry Statistics (Hari Ini)</h3>
      <div className="analytics-stats-grid">
        {/* Kolom Suhu */}
        <div className="stat-group-card temp-theme">
          <h4>Suhu Kandang</h4>
          <div className="sub-stats-grid">
            <div className="sub-card">
              <span className="sub-label">Min</span>
              <span className="sub-value mono-text">{today.minTemp ? today.minTemp.toFixed(1) : '0'}°C</span>
            </div>
            <div className="sub-card">
              <span className="sub-label">Max</span>
              <span className="sub-value mono-text">{today.maxTemp ? today.maxTemp.toFixed(1) : '0'}°C</span>
            </div>
            <div className="sub-card highlight-avg">
              <span className="sub-label">Average</span>
              <span className="sub-value mono-text">{today.avgTemp ? today.avgTemp.toFixed(1) : '0'}°C</span>
            </div>
          </div>
        </div>

        {/* Kolom Kelembapan */}
        <div className="stat-group-card hum-theme">
          <h4>Kelembapan Kandang</h4>
          <div className="sub-stats-grid">
            <div className="sub-card">
              <span className="sub-label">Min</span>
              <span className="sub-value mono-text">{today.minHum ? today.minHum.toFixed(1) : '0'}%</span>
            </div>
            <div className="sub-card">
              <span className="sub-label">Max</span>
              <span className="sub-value mono-text">{today.maxHum ? today.maxHum.toFixed(1) : '0'}%</span>
            </div>
            <div className="sub-card highlight-avg">
              <span className="sub-label">Average</span>
              <span className="sub-value mono-text">{today.avgHum ? today.avgHum.toFixed(1) : '0'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Grafik Analitik */}
      <div className="analytics-charts-grid">
        {/* 1. Grafik Tren Rata-Rata Mingguan */}
        <div className="chart-large-card">
          <h3 className="chart-card-title">Tren Rata-Rata Harian (7 Hari Terakhir)</h3>
          <div className="chart-container-inner">
            {trendData.length === 0 ? (
              <p className="no-chart-data">Belum memiliki riwayat tren harian.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00d2ff" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00ff9d" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1628', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Share Tech Mono' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="avgTemp" 
                    name="Rata-rata Suhu (°C)" 
                    stroke="#00d2ff" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTemp)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgHum" 
                    name="Rata-rata Kelembapan (%)" 
                    stroke="#00ff9d" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorHum)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Grafik Frekuensi Alert Per Hari */}
        <div className="chart-large-card">
          <h3 className="chart-card-title">Frekuensi Alert Terpicu (7 Hari Terakhir)</h3>
          <div className="chart-container-inner">
            {alertData.length === 0 ? (
              <p className="no-chart-data">Belum memiliki riwayat alert harian.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={alertData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1628', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Share Tech Mono' }}
                  />
                  <Legend />
                  {/* Tumpuk alert bar agar ringkas */}
                  <Bar dataKey="TEMP_HIGH" name="Suhu Tinggi" fill="#ff4060" stackId="alertsStack" />
                  <Bar dataKey="TEMP_LOW" name="Suhu Rendah" fill="#4da6ff" stackId="alertsStack" />
                  <Bar dataKey="HUM_HIGH" name="Kelembapan Tinggi" fill="#ff8c42" stackId="alertsStack" />
                  <Bar dataKey="HUM_LOW" name="Kelembapan Rendah" fill="#ffd32a" stackId="alertsStack" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
