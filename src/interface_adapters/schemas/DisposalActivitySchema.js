const mongoose = require('mongoose');

const DisposalActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    wasteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WasteItem',
      required: [true, 'Waste ID is required'],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ['kg', 'g', 'lbs', 'oz'],
        message: '{VALUE} is not a valid unit'
      },
      default: 'kg'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    disposalGuideline: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for efficient queries
DisposalActivitySchema.index({ userId: 1, timestamp: -1 });
DisposalActivitySchema.index({ wasteId: 1, timestamp: -1 });
DisposalActivitySchema.index({ userId: 1, wasteId: 1 });

// Virtual for weight in kg (for display purposes)
DisposalActivitySchema.virtual('weightInKg').get(function() {
  const conversionRates = {
    kg: 1,
    g: 0.001,
    lbs: 0.453592,
    oz: 0.0283495
  };
  return this.weight * conversionRates[this.unit];
});

module.exports = mongoose.model('DisposalActivity', DisposalActivitySchema);