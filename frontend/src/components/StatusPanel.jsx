import React from 'react';

const StatusPanel = ({ temp, hum, settings }) => {
  const t = parseFloat(temp);
  const h = parseFloat(hum);

  // Jika data belum dimuat, tampilkan kondisi placeholder
  if (isNaN(t) || isNaN(h) || !settings) {
    return (
      <div className="status-panel-card">
        <h3 className="panel-title">Environmental Health Panel</h3>
        <p className="panel-loading">Mengevaluasi data...</p>
      </div>
    );
  }

  // Evaluasi kondisi lingkungan secara dinamis menggunakan settings dari MongoDB
  const isTempNormal = t >= settings.tempMin && t <= settings.tempMax;
  const isHumNormal = h >= settings.humMin && h <= settings.humMax;

  // 1. Kondisi Ideal (Keduanya normal)
  const isIdeal = isTempNormal && isHumNormal;

  // 2. Warning Suhu (Suhu di luar batas normal)
  const warningSuhu = !isTempNormal;

  // 3. Warning Kelembapan (Kelembapan di luar batas normal)
  const warningKelembapan = !isHumNormal;

  // 4. Risiko Jamur (Kelembapan di atas 80%)
  const risikoJamur = h > 80;

  // 5. Risiko Larva Stres (Suhu terlalu tinggi atau terlalu rendah)
  const risikoLarvaStres = t > settings.tempMax || t < settings.tempMin;

  // Struktur kondisi untuk di-looping
  const conditions = [
    {
      id: 'ideal',
      label: 'Kondisi Lingkungan Ideal',
      isActive: isIdeal,
      activeColor: '#00ff9d', // Hijau terang
      description: 'Suhu & kelembapan kandang berada pada rentang ideal untuk metabolisme maggot.',
      activeText: 'Sempurna',
      inactiveText: 'Menyimpang'
    },
    {
      id: 'warn-suhu',
      label: 'Warning Suhu',
      isActive: warningSuhu,
      activeColor: t > settings.tempMax ? '#ff4060' : '#4da6ff', // Merah jika panas, Biru jika dingin
      description: `Suhu saat ini (${t}°C) tidak normal. Batas ideal: ${settings.tempMin}-${settings.tempMax}°C.`,
      activeText: t > settings.tempMax ? 'Suhu Tinggi!' : 'Suhu Rendah!',
      inactiveText: 'Normal'
    },
    {
      id: 'warn-hum',
      label: 'Warning Kelembapan',
      isActive: warningKelembapan,
      activeColor: h > settings.humMax ? '#ff8c42' : '#ffd32a', // Orange jika basah, Kuning jika kering
      description: `Kelembapan saat ini (${h}%) di luar batas normal. Batas ideal: ${settings.humMin}-${settings.humMax}%.`,
      activeText: h > settings.humMax ? 'Terlalu Basah!' : 'Terlalu Kering!',
      inactiveText: 'Normal'
    },
    {
      id: 'jamur',
      label: 'Risiko Jamur',
      isActive: risikoJamur,
      activeColor: '#ff8c42', // Orange
      description: 'Kelembapan tinggi (>80%) memicu pertumbuhan jamur merugikan pada media pakan.',
      activeText: 'Tinggi',
      inactiveText: 'Rendah (Aman)'
    },
    {
      id: 'stres',
      label: 'Risiko Larva Stres',
      isActive: risikoLarvaStres,
      activeColor: '#ff4060', // Red
      description: `Suhu ekstrem dapat menghentikan nafsu makan larva atau menyebabkan kematian.`,
      activeText: 'Bahaya!',
      inactiveText: 'Aman'
    }
  ];

  return (
    <div className="status-panel-card">
      <h3 className="panel-title">Environmental Health Status</h3>
      
      <div className="status-grid">
        {conditions.map((cond) => {
          return (
            <div 
              key={cond.id} 
              className={`status-item ${cond.isActive ? 'active' : 'inactive'}`}
              style={cond.isActive ? { '--item-color': cond.activeColor } : {}}
            >
              <div className="item-header">
                <span className="item-label">{cond.label}</span>
                <span className="item-badge">
                  {cond.isActive ? cond.activeText : cond.inactiveText}
                </span>
              </div>
              <p className="item-desc">{cond.isActive ? cond.description : 'Kondisi terpantau aman dan terkontrol.'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusPanel;
