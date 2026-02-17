const mongoose = require('mongoose');

/**
 * WasteCategory Schema
 * Represents a category for classifying waste items
 * (e.g., Plastic, Paper, Organic, Hazardous)
 */
const WasteCategorySchema = new mongoose.Schema({
  // Name of the waste category - must be unique and is indexed for fast lookups
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    index: true
  },
  // Description explaining what this category includes
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true
  },
  // Indicates if items in this category can be recycled
  recyclable: {
    type: Boolean,
    default: false
  },
  // Indicates if items in this category are hazardous (require special handling)
  hazardous: {
    type: Boolean,
    default: false
  },
  // Indicates if items in this category can be composted
  compostable: {
    type: Boolean,
    default: false
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Create text index for search functionality on name and description
WasteCategorySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('WasteCategory', WasteCategorySchema);