const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function validateCoordinates(coords) {
          if (!Array.isArray(coords) || coords.length !== 2) return false;
          const [lng, lat] = coords;
          if (typeof lng !== 'number' || typeof lat !== 'number') return false;
          return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        },
        message: 'Coordinates must be [lng, lat] with valid ranges.',
      },
    },
  },
  { _id: false }
);

const RecyclingCenterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  address: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
  location: { type: locationSchema, required: true },
  acceptedWasteTypes: {
    type: [String],
    required: true,
    validate: {
      validator: function validateWasteTypes(values) {
        if (!Array.isArray(values) || values.length < 1 || values.length > 20) return false;
        return values.every((v) => typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 40);
      },
      message: 'acceptedWasteTypes must have 1-20 items, each 2-40 chars.',
    },
  },
  operatingHours: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
  maxCapacityKg: { type: Number, required: true, min: 1, max: 1000000 },
  currentLoadKg: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function validateCurrentLoad(value) {
        return typeof this.maxCapacityKg === 'number' ? value <= this.maxCapacityKg : true;
      },
      message: 'currentLoadKg cannot exceed maxCapacityKg.',
    },
  },
});

RecyclingCenterSchema.index({ name: 1, address: 1 }, { unique: true });
RecyclingCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RecyclingCenter', RecyclingCenterSchema);
