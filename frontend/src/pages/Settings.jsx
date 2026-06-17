import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
  // Threshold Settings State
  const [tempMin, setTempMin] = useState(25);
  const [tempMax, setTempMax] = useState(35);
  const [humMin, setHumMin] = useState(50);
  const [humMax, setHumMax] = useState(80);

  // Device Info State
  const [deviceInfo, setDeviceInfo] = useState({
    deviceId: '-',
    ipAddress: '-',
    firmware: '-',
    sensorType: '-'
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status State
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const fetchSettings = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get('/settings');
      if (response.data.success) {
        const { threshold, device } = response.data;
        // Hanya update input jika user sedang tidak fokus mengetik di input manapun
        if (document.activeElement && document.activeElement.tagName !== 'INPUT') {
          setTempMin(threshold.tempMin);
          setTempMax(threshold.tempMax);
          setHumMin(threshold.humMin);
          setHumMax(threshold.humMax);
        }
        setDeviceInfo(device);
      }
    } catch (error) {
      console.error('Gagal mengambil settings:', error);
      if (showLoading) {
        setSettingsMessage({ text: 'Gagal memuat konfigurasi dari database.', type: 'error' });
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load Settings & Device info
  useEffect(() => {
    fetchSettings(true);

    // Auto-refresh settings & info device setiap 30 detik
    const intervalId = setInterval(() => {
      fetchSettings(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Simpan Threshold Alert
  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    setSettingsMessage({ text: '', type: '' });

    // Validasi input
    if (parseFloat(tempMin) >= parseFloat(tempMax)) {
      setSettingsMessage({ text: 'Batas suhu minimum harus lebih rendah dari batas maksimum.', type: 'error' });
      return;
    }
    if (parseFloat(humMin) >= parseFloat(humMax)) {
      setSettingsMessage({ text: 'Batas kelembapan minimum harus lebih rendah dari batas maksimum.', type: 'error' });
      return;
    }

    try {
      setSavingSettings(true);
      const response = await api.put('/settings', {
        tempMin,
        tempMax,
        humMin,
        humMax
      });

      if (response.data.success) {
        setSettingsMessage({ text: 'Batas threshold sukses diperbarui!', type: 'success' });
      } else {
        setSettingsMessage({ text: 'Gagal memperbarui threshold.', type: 'error' });
      }
    } catch (err) {
      console.error('Error saving threshold:', err);
      setSettingsMessage({ text: 'Kesalahan jaringan saat menyimpan.', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Simpan Ganti Password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    // Validasi input
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ text: 'Semua kolom password wajib diisi.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password baru minimal 6 karakter.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Konfirmasi password baru tidak cocok.', type: 'error' });
      return;
    }

    try {
      setSavingPassword(true);
      const response = await api.put('/settings', {
        currentPassword,
        newPassword
      });

      if (response.data.success && response.data.passwordChanged) {
        setPasswordMessage({ text: 'Password berhasil diperbarui!', type: 'success' });
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ text: response.data.message || 'Gagal mengubah password.', type: 'error' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      const msg = err.response?.data?.message || 'Password saat ini salah atau terjadi error jaringan.';
      setPasswordMessage({ text: msg, type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading-state">
        <div className="double-spinner"></div>
        <p>Memuat konfigurasi keamanan & threshold...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-grid-layout">
        
        {/* Kolom Kiri: Threshold & Info Device */}
        <div className="settings-column">
          {/* Form Batas Threshold */}
          <div className="settings-glass-card">
            <h3 className="card-section-title">🛡️ Threshold Batas Alert</h3>
            <p className="card-section-subtitle">Tentukan batas suhu dan kelembapan agar memicu alarm pada Dashboard dan LED kandang.</p>

            {settingsMessage.text && (
              <div className={`form-alert-banner ${settingsMessage.type === 'success' ? 'success' : 'error'}`}>
                {settingsMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveThreshold} className="settings-form">
              <div className="form-row">
                <div className="form-group-half">
                  <label>Suhu Minimum (°C)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={tempMin} 
                    onChange={(e) => setTempMin(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-half">
                  <label>Suhu Maksimum (°C)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={tempMax} 
                    onChange={(e) => setTempMax(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-half">
                  <label>Kelembapan Minimum (%)</label>
                  <input 
                    type="number" 
                    value={humMin} 
                    onChange={(e) => setHumMin(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-half">
                  <label>Kelembapan Maksimum (%)</label>
                  <input 
                    type="number" 
                    value={humMax} 
                    onChange={(e) => setHumMax(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-settings-save" 
                disabled={savingSettings}
              >
                {savingSettings ? 'Menyimpan...' : 'SIMPAN AMBANG BATAS'}
              </button>
            </form>
          </div>

          {/* Info Device ESP32 */}
          <div className="settings-glass-card device-info-card">
            <h3 className="card-section-title">📟 Informasi Hardware (ESP32 Client)</h3>
            <div className="device-metadata-grid">
              <div className="metadata-row">
                <span className="meta-label">Device ID</span>
                <span className="meta-value mono-text">{deviceInfo.deviceId}</span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">IP Address</span>
                <span className="meta-value mono-text">{deviceInfo.ipAddress}</span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Firmware</span>
                <span className="meta-value badge-firmware">{deviceInfo.firmware}</span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Sensor Terhubung</span>
                <span className="meta-value mono-text">{deviceInfo.sensorType} (Pin 4)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Keamanan & Akun */}
        <div className="settings-column">
          {/* Form Ganti Password */}
          <div className="settings-glass-card">
            <h3 className="card-section-title">🔑 Ganti Password Akun</h3>
            <p className="card-section-subtitle">Perbarui sandi login admin untuk menjaga privasi kendang budidaya.</p>

            {passwordMessage.text && (
              <div className={`form-alert-banner ${passwordMessage.type === 'success' ? 'success' : 'error'}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="settings-form">
              <div className="form-group">
                <label>Password Saat Ini</label>
                <input 
                  type="password" 
                  placeholder="Masukkan password lama" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password Baru (Min. 6 Karakter)</label>
                <input 
                  type="password" 
                  placeholder="Masukkan password baru" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  placeholder="Masukkan ulang password baru" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-settings-save btn-security" 
                disabled={savingPassword}
              >
                {savingPassword ? 'Memperbarui...' : 'PERBARUI PASSWORD'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
