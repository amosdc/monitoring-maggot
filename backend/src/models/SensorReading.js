const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    trim: true
  },
  temp: {
    type: Number,
    required: true
  },
  hum: {
    type: Number,
    required: true
  },
  led: {
    type: Boolean,
    default: false
  },
  alerts: {
    type: [String],
    default: []
  },
  ts: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'sensor_readings',
  versionKey: false
});

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
