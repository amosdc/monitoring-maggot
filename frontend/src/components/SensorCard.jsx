import React from 'react';

const SensorCard = ({ title, value, unit, minVal, maxVal, type }) => {
  // Hitung status kondisi & warna aksen secara dinamis berdasarkan threshold
  const valNum = parseFloat(value);
  let statusText = 'Membaca...';
  let statusClass = 'status-normal';
  let accentColor = '#00d2ff'; // Cyan default

  const isTemp = type === 'temp';

  if (!isNaN(valNum)) {
    if (isTemp) {
      if (valNum > maxVal) {
        statusText = 'Terlalu Panas';
        statusClass = 'status-danger';
        accentColor = '#ff4060'; // Red
      } else if (valNum < minVal) {
        statusText = 'Terlalu Dingin';
        statusClass = 'status-warning-blue';
        accentColor = '#4da6ff'; // Blue
      } else {
        statusText = 'Optimal';
        statusClass = 'status-optimal';
        accentColor = '#00ff9d'; // Green
      }
    } else {
      // Kelembapan
      if (valNum > maxVal) {
        statusText = 'Terlalu Basah';
        statusClass = 'status-warning-orange';
        accentColor = '#ff8c42'; // Orange
      } else if (valNum < minVal) {
        statusText = 'Terlalu Kering';
        statusClass = 'status-warning-yellow';
        accentColor = '#ffd32a'; // Yellow
      } else {
        statusText = 'Optimal';
        statusClass = 'status-optimal';
        accentColor = '#00ff9d'; // Green
      }
    }
  }

  // Hitung persentase progress untuk visualisasi meter
  const calculatePercentage = () => {
    if (isNaN(valNum)) return 0;
    
    // Suhu berkisar dari 0 - 50 untuk meter
    // Kelembapan berkisar dari 0 - 100 untuk meter
    const maxRange = isTemp ? 50 : 100;
    const pct = (valNum / maxRange) * 100;
    return Math.min(Math.max(pct, 0), 100);
  };

  const percentage = calculatePercentage();

  return (
    <div className={`sensor-card ${statusClass}`} style={{ '--card-accent': accentColor }}>
      <div className="card-header">
        <span className="card-title">{title}</span>
        <span className={`status-badge ${statusClass}`}>{statusText}</span>
      </div>

      <div className="card-value-section">
        <div className="value-wrapper">
          <span className="sensor-value-number">{!isNaN(valNum) ? valNum.toFixed(1) : '--.-'}</span>
          <span className="sensor-unit">{unit}</span>
        </div>
      </div>

      <div className="sensor-meter-container">
        <div className="sensor-meter-bar">
          <div 
            className="sensor-meter-fill" 
            style={{ width: `${percentage}%`, backgroundColor: accentColor }}
          ></div>
        </div>
        <div className="meter-threshold-markers">
          <span className="marker-min" style={{ left: `${(minVal / (isTemp ? 50 : 100)) * 100}%` }}>
            ▼ Min ({minVal})
          </span>
          <span className="marker-max" style={{ left: `${(maxVal / (isTemp ? 50 : 100)) * 100}%` }}>
            ▲ Max ({maxVal})
          </span>
        </div>
      </div>

      <div className="threshold-info">
        Batas Normal: <span className="mono-text">{minVal}</span> s.d. <span className="mono-text">{maxVal}</span>{unit}
      </div>
    </div>
  );
};

export default SensorCard;
