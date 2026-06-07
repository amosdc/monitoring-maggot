const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  tempMin: {
    type: Number,
    required: true,
    default: 25
  },
  tempMax: {
    type: Number,
    required: true,
    default: 35
  },
  humMin: {
    type: Number,
    required: true,
    default: 50
  },
  humMax: {
    type: Number,
    required: true,
    default: 80
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'settings',
  versionKey: false
});

// Auto update the updatedAt timestamp on save
settingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Setting', settingSchema);
