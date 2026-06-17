const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  feed_name: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  feed_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  ts: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'maggot_feeds',
  versionKey: false
});

module.exports = mongoose.model('Feed', feedSchema);
