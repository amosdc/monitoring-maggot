import React, { useEffect } from 'react';

const AlertToast = ({ alertType, onClose }) => {
  useEffect(() => {
    // Tutup otomatis toast setelah 5 detik
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getAlertDetails = (type) => {
    switch (type) {
      case 'TEMP_HIGH':
        return {
          title: 'Suhu Kritis: Terlalu Panas!',
          message: 'Suhu kandang melebihi batas maksimum. Segera aktifkan kipas/exhaust.',
          icon: '🔥',
          classType: 'toast-danger'
        };
      case 'TEMP_LOW':
        return {
          title: 'Suhu Kritis: Terlalu Dingin!',
          message: 'Suhu kandang di bawah batas minimum. Pertahankan kehangatan media.',
          icon: '❄️',
          classType: 'toast-info'
        };
      case 'HUM_HIGH':
        return {
          title: 'Kelembapan Tinggi (Risiko Jamur)',
          message: 'Udara terlalu basah. Media pakan becek dapat menimbulkan bau menyengat.',
          icon: '🌧️',
          classType: 'toast-warning-orange'
        };
      case 'HUM_LOW':
        return {
          title: 'Kelembapan Rendah (Kering)',
          message: 'Udara terlalu kering. Media pakan keras menghambat nafsu makan maggot.',
          icon: '☀️',
          classType: 'toast-warning-yellow'
        };
      default:
        return {
          title: 'Peringatan Sistem!',
          message: 'Parameter lingkungan menyimpang dari kondisi ideal.',
          icon: '⚠️',
          classType: 'toast-danger'
        };
    }
  };

  const details = getAlertDetails(alertType);

  return (
    <div className={`alert-toast-item ${details.classType}`}>
      <div className="toast-icon-side">{details.icon}</div>
      <div className="toast-text-side">
        <span className="toast-title">{details.title}</span>
        <span className="toast-message">{details.message}</span>
      </div>
      <button className="toast-close-btn" onClick={onClose}>&times;</button>
    </div>
  );
};

export default AlertToast;
