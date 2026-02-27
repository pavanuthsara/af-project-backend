class DisposalActivity {
  constructor(id, userId, wasteId, quantity, weight, unit, timestamp = new Date(), disposalGuideline = null, co2Saved = null, co2Source = null, disposalMethod = null) {
    this.id = id;
    this.userId = userId;
    this.wasteId = wasteId;
    this.quantity = quantity;
    this.weight = weight;
    this.unit = unit;
    this.timestamp = timestamp;
    this.disposalGuideline = disposalGuideline;
    this.co2Saved = co2Saved;
    this.co2Source = co2Source;
    this.disposalMethod = disposalMethod;

    this.validate();
  }

  validate() {
    const validUnits = ['kg', 'g', 'lbs', 'oz'];

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    if (!this.wasteId) {
      throw new Error('Waste ID is required');
    }

    if (typeof this.quantity !== 'number' || this.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (typeof this.weight !== 'number' || this.weight <= 0) {
      throw new Error('Weight must be a positive number');
    }

    if (!this.unit || !validUnits.includes(this.unit)) {
      throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
    }
  }

  // Convert weight to kg for consistency in aggregations
  getWeightInKg() {
    const conversionRates = {
      kg: 1,
      g: 0.001,
      lbs: 0.453592,
      oz: 0.0283495
    };
    return this.weight * conversionRates[this.unit];
  }

  // Factory method for creating new disposal activities
  static create(userId, wasteId, quantity, weight, unit, disposalGuideline = null, co2Saved = null, co2Source = null, disposalMethod = null) {
    return new DisposalActivity(null, userId, wasteId, quantity, weight, unit, new Date(), disposalGuideline, co2Saved, co2Source, disposalMethod);
  }
}

module.exports = DisposalActivity;