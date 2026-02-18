const mongoose = require('mongoose');

const CenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  contactInfo: {
    phone: { type: String },
    email: { type: String }
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
CenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Center', CenterSchema);
