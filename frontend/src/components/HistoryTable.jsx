import React from 'react';

const HistoryTable = ({ readings }) => {
  // Format Tanggal dan Waktu
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    
    // Format YYYY-MM-DD
    const datePart = date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Format HH:mm:ss
    const timePart = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return { datePart, timePart };
  };

  const getKondisiTextAndClass = (reading) => {
    if (reading.alerts && reading.alerts.length > 0) {
      // Periksa jenis alert
      const hasTempAlert = reading.alerts.some(a => a.includes('TEMP'));
      const hasHumAlert = reading.alerts.some(a => a.includes('HUM'));
      
      if (hasTempAlert && hasHumAlert) {
        return { text: 'Peringatan Ganda', className: 'badge-danger-double' };
      } else if (hasTempAlert) {
        return { text: 'Anomali Suhu', className: 'badge-danger-temp' };
      } else {
        return { text: 'Anomali Kelembapan', className: 'badge-warning-hum' };
      }
    }
    return { text: 'Ideal (Optimal)', className: 'badge-success-ideal' };
  };

  return (
    <div className="table-responsive">
      <table className="history-table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Tanggal</th>
            <th>Suhu (°C)</th>
            <th>Kelembapan (%)</th>
            <th>Kondisi</th>
            <th>LED Status (Pin 5)</th>
            <th>Active Alerts</th>
          </tr>
        </thead>
        <tbody>
          {readings.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center no-data">
                Tidak ada data riwayat dalam rentang waktu ini.
              </td>
            </tr>
          ) : (
            readings.map((reading) => {
              const { datePart, timePart } = formatDateTime(reading.ts);
              const kondisi = getKondisiTextAndClass(reading);

              return (
                <tr key={reading._id || reading.ts}>
                  <td className="mono-text text-highlight">{timePart}</td>
                  <td className="mono-text">{datePart}</td>
                  <td className="mono-text font-bold">
                    {reading.temp ? reading.temp.toFixed(1) : '-'}°C
                  </td>
                  <td className="mono-text font-bold">
                    {reading.hum ? reading.hum.toFixed(1) : '-'}%
                  </td>
                  <td>
                    <span className={`table-badge ${kondisi.className}`}>
                      {kondisi.text}
                    </span>
                  </td>
                  <td>
                    <span className={`led-dot-badge ${reading.led ? 'led-on' : 'led-off'}`}>
                      {reading.led ? '🔴 NYALA' : '⚫ MATI'}
                    </span>
                  </td>
                  <td>
                    <div className="alert-tags-container">
                      {reading.alerts && reading.alerts.length > 0 ? (
                        reading.alerts.map((alert, idx) => (
                          <span key={idx} className={`alert-tag tag-${alert.toLowerCase()}`}>
                            {alert}
                          </span>
                        ))
                      ) : (
                        <span className="alert-tag tag-none">NONE</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
