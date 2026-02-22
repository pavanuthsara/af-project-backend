const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  }
});

module.exports = mongoose.model('Truck', TruckSchema);
