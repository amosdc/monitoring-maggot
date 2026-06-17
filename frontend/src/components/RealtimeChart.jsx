import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataObj = payload[0].payload;
    const timeStr = dataObj.ts ? new Date(dataObj.ts).toLocaleTimeString() : '';
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-time">{timeStr}</p>
        <p className="tooltip-value">
          <span className="dot" style={{ backgroundColor: payload[0].color }}></span>
          {payload[0].name}: <span className="val-text">{payload[0].value.toFixed(1)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const RealtimeChart = ({ data, type, label, color }) => {
  // Ambil dataKey dan domain YAxis yang sesuai
  const isTemp = type === 'temp';
  const dataKey = isTemp ? 'temp' : 'hum';
  const yDomain = isTemp ? [15, 45] : [30, 100];

  // Balikkan data agar yang terlama muncul pertama di grafik (kiri ke kanan)
  const chartData = [...data].reverse();

  // Format label X-Axis ke jam:menit:detik
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    try {
      const date = new Date(tickItem);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title" style={{ borderLeftColor: color }}>{label}</h3>
        <span className="live-badge">● LIVE</span>
      </div>

      <div className="chart-body">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(15, 23, 42, 0.06)" 
            />

            <XAxis 
              dataKey="ts" 
              tickFormatter={formatXAxis} 
              stroke="rgba(15, 23, 42, 0.15)"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Share Tech Mono' }}
              dy={10}
            />

            <YAxis 
              domain={yDomain} 
              stroke="rgba(15, 23, 42, 0.15)"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Share Tech Mono' }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey={dataKey}
              name={label}
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#grad-${dataKey})`}
              isAnimationActive={false} // Matikan animasi agar update realtime berjalan smooth
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RealtimeChart;
