const mongoose = require('mongoose');

const WasteItemSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteCategory',
    required: [true, 'Category is required'],
    index: true
  },
  
  recyclable: {
    type: Boolean,
    default: false
  },
  
  hazardous: {
    type: Boolean,
    default: false
  },
  
  compostable: {
    type: Boolean,
    default: false
  }
}, {
  
  timestamps: true
});


WasteItemSchema.index({ name: 'text', description: 'text' });

WasteItemSchema.index({ recyclable: 1, hazardous: 1, compostable: 1 });

// Index on category for efficient population and filtering
WasteItemSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('WasteItem', WasteItemSchema);
