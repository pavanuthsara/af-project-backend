const mongoose = require('mongoose');

/**
 * WasteItem Schema
 * Represents a specific waste item that belongs to a category
 * (e.g., "Plastic Bottle" belongs to "Plastic" category)
 */
const WasteItemSchema = new mongoose.Schema({
  // Name of the waste item - indexed for fast search
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    index: true
  },
  // Optional description of the item
  description: {
    type: String,
    trim: true
  },
  // Reference to the WasteCategory this item belongs to
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteCategory',
    required: [true, 'Category is required'],
    index: true
  },
  // Instructions for proper disposal of this item
  disposalInstructions: {
    type: String,
    required: [true, 'Disposal instructions are required'],
    trim: true
  },
  // Indicates if this specific item can be recycled
  // (inherited from category but can be overridden)
  recyclable: {
    type: Boolean,
    default: false
  },
  // Indicates if this specific item is hazardous
  // (inherited from category but can be overridden)
  hazardous: {
    type: Boolean,
    default: false
  },
  // Indicates if this specific item can be composted
  // (inherited from category but can be overridden)
  compostable: {
    type: Boolean,
    default: false
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// ============================================
// INDEXES FOR SEARCH PERFORMANCE
// ============================================

// Text index for full-text search on name and description
WasteItemSchema.index({ name: 'text', description: 'text' });

// Compound index for filtering by multiple boolean flags
// Useful for queries like "find all recyclable and non-hazardous items"
WasteItemSchema.index({ recyclable: 1, hazardous: 1, compostable: 1 });

// Index on category for efficient population and filtering
WasteItemSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('WasteItem', WasteItemSchema);